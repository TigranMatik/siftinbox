import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GmailClient } from "@/lib/email/gmail";
import { filterEmail } from "@/lib/email/parser";
import { extractActionsFromEmail, generateDailySummary } from "@/lib/ai/extractor";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

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
    const now = new Date();

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, scan_time, timezone");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: "No profiles found", processed: 0 });
    }

    let processedCount = 0;
    const usersToScan: string[] = [];

    // Check which users should be scanned based on their local time
    for (const profile of profiles) {
      const userTimezone = profile.timezone || "America/Los_Angeles";
      const userLocalTime = formatInTimeZone(now, userTimezone, "HH:mm");
      const scanTime = profile.scan_time?.slice(0, 5) || "08:00";

      if (userLocalTime.slice(0, 2) === scanTime.slice(0, 2)) {
        usersToScan.push(profile.id);
      }
    }

    if (usersToScan.length === 0) {
      return NextResponse.json({ message: "No users scheduled for scan", processed: 0 });
    }

    // Get email connections for users to scan
    const { data: connections } = await supabase
      .from("email_connections")
      .select("*")
      .in("user_id", usersToScan)
      .eq("is_active", true);

    for (const connection of connections || []) {
      try {
        await processEmailScan(connection, connection.user_id);
        processedCount++;
      } catch (error) {
        console.error(`Error processing scan for user ${connection.user_id}:`, error);
      }
    }

    return NextResponse.json({ success: true, processed: processedCount });
  } catch (error) {
    console.error("Daily scan cron error:", error);
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

  const lastSync = connection.last_sync_at
    ? new Date(connection.last_sync_at)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);

  const messages = await gmail.listMessages({
    maxResults: 50,
    after: lastSync,
    labelIds: ["INBOX"],
  });

  const allActions: any[] = [];

  for (const message of messages) {
    const { data: existing } = await supabase
      .from("emails_processed")
      .select("id")
      .eq("connection_id", connection.id)
      .eq("external_id", message.id)
      .single();

    if (existing) continue;

    const filterResult = filterEmail(message);

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

        await supabase
          .from("emails_processed")
          .update({ is_actionable: true })
          .eq("id", emailRecord.id);
      }
    }
  }

  await supabase
    .from("email_connections")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("id", connection.id);

  if (allActions.length > 0) {
    const today = format(new Date(), "yyyy-MM-dd");
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const userName = userData?.user?.email?.split("@")[0] || "there";

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
        .update({ summary, action_count: existingBriefing.action_count + allActions.length })
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
