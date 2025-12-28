import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GmailClient } from "@/lib/email/gmail";
import { filterEmail } from "@/lib/email/parser";
import { extractActionsFromEmail, generateDailySummary } from "@/lib/ai/extractor";
import { format } from "date-fns";
import type { EmailConnection } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const connectionId = body.connectionId;

    // Get email connections
    let connectionQuery = supabase
      .from("email_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (connectionId) {
      connectionQuery = connectionQuery.eq("id", connectionId);
    }

    const { data: connections } = await connectionQuery;

    if (!connections || connections.length === 0) {
      return NextResponse.json({ error: "No email connections found" }, { status: 400 });
    }

    interface ExtractedAction {
      title: string;
      description: string;
      deadline: Date | null;
      deadlineSource: "explicit" | "inferred" | "none";
      priority: "high" | "medium" | "low";
    }
    const allActions: { action: ExtractedAction; emailId: string }[] = [];

    for (const connection of connections) {
      // Create Gmail client with token refresh callback
      const gmail = new GmailClient(
        {
          accessToken: connection.access_token,
          refreshToken: connection.refresh_token,
        },
        async (newTokens) => {
          // Update tokens in database when refreshed
          await supabase
            .from("email_connections")
            .update({
              access_token: newTokens.accessToken,
              refresh_token: newTokens.refreshToken,
            })
            .eq("id", connection.id);
        }
      );

      // Get last sync time or default to 24 hours ago
      const lastSync = connection.last_sync_at
        ? new Date(connection.last_sync_at)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Fetch new messages
      const messages = await gmail.listMessages({
        maxResults: 50,
        after: lastSync,
        labelIds: ["INBOX"],
      });

      for (const message of messages) {
        // Check if already processed
        const { data: existing } = await supabase
          .from("emails_processed")
          .select("id")
          .eq("connection_id", connection.id)
          .eq("external_id", message.id)
          .single();

        if (existing) continue;

        // Filter out noise
        const filterResult = filterEmail(message);

        // Store processed email
        const { data: emailRecord } = await supabase
          .from("emails_processed")
          .insert({
            user_id: user.id,
            connection_id: connection.id,
            external_id: message.id,
            subject: message.subject,
            sender: `${message.fromName} <${message.fromEmail}>`,
            received_at: message.date.toISOString(),
            is_actionable: !filterResult.isNoise && filterResult.isLikelyActionable,
            raw_content: message.body.slice(0, 5000),
          })
          .select()
          .single();

        if (!emailRecord) continue;

        // If not noise and possibly actionable, extract actions with AI
        if (!filterResult.isNoise && filterResult.isLikelyActionable) {
          const extraction = await extractActionsFromEmail(message);

          if (extraction.isActionable && extraction.actions.length > 0) {
            for (const action of extraction.actions) {
              await supabase.from("action_items").insert({
                user_id: user.id,
                email_id: emailRecord.id,
                title: action.title,
                description: action.description,
                sender_name: message.fromName,
                sender_email: message.fromEmail,
                deadline: action.deadline?.toISOString() || null,
                deadline_source: action.deadlineSource,
                priority: action.priority,
                status: "pending",
              });

              allActions.push({ action, emailId: emailRecord.id });
            }

            // Update email as actionable
            await supabase
              .from("emails_processed")
              .update({ is_actionable: true })
              .eq("id", emailRecord.id);
          }
        }
      }

      // Update last sync time
      await supabase
        .from("email_connections")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", connection.id);
    }

    // Generate daily briefing if we have new actions
    if (allActions.length > 0) {
      const today = format(new Date(), "yyyy-MM-dd");
      const actions = allActions.map((a) => a.action);

      // Check if briefing already exists for today
      const { data: existingBriefing } = await supabase
        .from("daily_briefings")
        .select("id, action_count")
        .eq("user_id", user.id)
        .eq("briefing_date", today)
        .single();

      const summary = await generateDailySummary(
        actions,
        user.email?.split("@")[0] || "there"
      );

      if (existingBriefing) {
        await supabase
          .from("daily_briefings")
          .update({
            summary,
            action_count: existingBriefing.action_count + actions.length,
          })
          .eq("id", existingBriefing.id);
      } else {
        await supabase.from("daily_briefings").insert({
          user_id: user.id,
          briefing_date: today,
          summary,
          action_count: actions.length,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: allActions.length,
      message: `Processed ${allActions.length} action item(s)`,
    });
  } catch (error) {
    console.error("Email scan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
