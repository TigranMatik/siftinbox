import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GmailClient } from "@/lib/email/gmail";
import { filterEmail } from "@/lib/email/parser";
import { extractActionsFromEmail, generateDailySummary } from "@/lib/ai/extractor";
import { format } from "date-fns";

// Use service role for cron jobs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all pending scheduled scans that are due
    const now = new Date().toISOString();
    const { data: pendingScans, error: fetchError } = await supabase
      .from("scheduled_scans")
      .select(`
        *,
        email_connections (*)
      `)
      .eq("status", "pending")
      .lte("scheduled_for", now);

    if (fetchError) {
      console.error("Error fetching scheduled scans:", fetchError);
      return NextResponse.json({ error: "Failed to fetch scans" }, { status: 500 });
    }

    if (!pendingScans || pendingScans.length === 0) {
      return NextResponse.json({ message: "No pending scans", processed: 0 });
    }

    let processedCount = 0;

    for (const scan of pendingScans) {
      try {
        const connection = scan.email_connections;
        if (!connection || !connection.is_active) {
          // Mark as failed if connection is invalid
          await supabase
            .from("scheduled_scans")
            .update({ status: "failed" })
            .eq("id", scan.id);
          continue;
        }

        // Process the scan
        await processEmailScan(connection, scan.user_id);

        // Mark as completed
        await supabase
          .from("scheduled_scans")
          .update({ status: "completed" })
          .eq("id", scan.id);

        processedCount++;
      } catch (error) {
        console.error(`Error processing scan ${scan.id}:`, error);
        await supabase
          .from("scheduled_scans")
          .update({ status: "failed" })
          .eq("id", scan.id);
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      total: pendingScans.length,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function processEmailScan(connection: any, userId: string) {
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

  interface ExtractedAction {
    title: string;
    description: string;
    deadline: Date | null;
    deadlineSource: "explicit" | "inferred" | "none";
    priority: "high" | "medium" | "low";
  }
  const allActions: ExtractedAction[] = [];

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
        user_id: userId,
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
            user_id: userId,
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

          allActions.push(action);
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

  // Generate daily briefing if we have new actions
  if (allActions.length > 0) {
    const today = format(new Date(), "yyyy-MM-dd");

    // Get user email for summary
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const userName = userData?.user?.email?.split("@")[0] || "there";

    // Check if briefing already exists for today
    const { data: existingBriefing } = await supabase
      .from("daily_briefings")
      .select("id, action_count")
      .eq("user_id", userId)
      .eq("briefing_date", today)
      .single();

    const summary = await generateDailySummary(allActions, userName);

    if (existingBriefing) {
      await supabase
        .from("daily_briefings")
        .update({
          summary,
          action_count: existingBriefing.action_count + allActions.length,
        })
        .eq("id", existingBriefing.id);
    } else {
      await supabase.from("daily_briefings").insert({
        user_id: userId,
        briefing_date: today,
        summary,
        action_count: allActions.length,
      });
    }
  }
}
