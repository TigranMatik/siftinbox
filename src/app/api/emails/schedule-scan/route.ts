import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { connectionId, scheduledFor } = body;

    if (!connectionId || !scheduledFor) {
      return NextResponse.json(
        { error: "Missing connectionId or scheduledFor" },
        { status: 400 }
      );
    }

    // Verify the connection belongs to the user
    const { data: connection } = await supabase
      .from("email_connections")
      .select("id")
      .eq("id", connectionId)
      .eq("user_id", user.id)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Cancel any existing pending scheduled scans for this connection
    await supabase
      .from("scheduled_scans")
      .update({ status: "failed" })
      .eq("connection_id", connectionId)
      .eq("status", "pending");

    // Create new scheduled scan
    const { data: scheduledScan, error } = await supabase
      .from("scheduled_scans")
      .insert({
        user_id: user.id,
        connection_id: connectionId,
        scheduled_for: scheduledFor,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error scheduling scan:", error);
      return NextResponse.json(
        { error: "Failed to schedule scan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scheduledScan,
    });
  } catch (error) {
    console.error("Schedule scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
