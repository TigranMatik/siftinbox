import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

// Use service role to update email_connections
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // This is the user ID
    const error = searchParams.get("error");

    if (error) {
      console.error("Gmail OAuth error:", error);
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=oauth_denied", request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=missing_params", request.url)
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/gmail/callback`
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=no_access_token", request.url)
      );
    }

    // Get user's email from Gmail API
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: "me" });
    const email = profile.data.emailAddress;

    if (!email) {
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=no_email", request.url)
      );
    }

    // Check if connection already exists
    const { data: existing } = await supabase
      .from("email_connections")
      .select("id")
      .eq("user_id", state)
      .eq("email_address", email)
      .single();

    if (existing) {
      // Update existing connection
      await supabase
        .from("email_connections")
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || "",
          is_active: true,
        })
        .eq("id", existing.id);
    } else {
      // Create new connection
      await supabase.from("email_connections").insert({
        user_id: state,
        provider: "gmail",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || "",
        email_address: email,
        is_active: true,
      });
    }

    return NextResponse.redirect(
      new URL("/dashboard/integrations?success=gmail_connected", request.url)
    );
  } catch (error) {
    console.error("Gmail callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=callback_failed", request.url)
    );
  }
}
