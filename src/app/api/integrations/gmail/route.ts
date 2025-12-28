import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GmailClient } from "@/lib/email/gmail";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessToken, refreshToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json({ error: "Missing access token" }, { status: 400 });
    }

    // Get email address from Gmail
    const gmail = new GmailClient({ accessToken, refreshToken: refreshToken || "" });
    const profile = await gmail.getProfile();

    if (!profile) {
      return NextResponse.json({ error: "Failed to get Gmail profile" }, { status: 400 });
    }

    // Check if connection already exists
    const { data: existing } = await supabase
      .from("email_connections")
      .select("id")
      .eq("user_id", user.id)
      .eq("email_address", profile.email)
      .single();

    if (existing) {
      // Update existing connection
      await supabase
        .from("email_connections")
        .update({
          access_token: accessToken,
          refresh_token: refreshToken || "",
          is_active: true,
        })
        .eq("id", existing.id);
    } else {
      // Create new connection
      await supabase.from("email_connections").insert({
        user_id: user.id,
        provider: "gmail",
        access_token: accessToken,
        refresh_token: refreshToken || "",
        email_address: profile.email,
        is_active: true,
      });
    }

    return NextResponse.json({ success: true, email: profile.email });
  } catch (error) {
    console.error("Gmail integration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get("id");

    if (!connectionId) {
      return NextResponse.json({ error: "Missing connection ID" }, { status: 400 });
    }

    await supabase
      .from("email_connections")
      .delete()
      .eq("id", connectionId)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gmail disconnect error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
