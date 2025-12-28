import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GmailClient } from "@/lib/email/gmail";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connectionId = request.nextUrl.searchParams.get("connectionId");

    if (!connectionId) {
      return NextResponse.json({ error: "Missing connectionId" }, { status: 400 });
    }

    // Get the email connection
    const { data: connection } = await supabase
      .from("email_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    // Get unread email count from Gmail
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

    const count = await gmail.getUnreadCount(lastSync);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error getting email count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
