import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ActionStatus, Database } from "@/types/database";

type ActionItemUpdate = Database["public"]["Tables"]["action_items"]["Update"];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ActionStatus | null;

    let query = supabase
      .from("action_items")
      .select("*")
      .eq("user_id", user.id)
      .order("priority", { ascending: true })
      .order("deadline", { ascending: true, nullsFirst: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: actions, error } = await query;

    if (error) throw error;

    return NextResponse.json({ actions });
  } catch (error) {
    console.error("Error fetching actions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body as { id: string } & ActionItemUpdate;

    if (!id) {
      return NextResponse.json({ error: "Missing action ID" }, { status: 400 });
    }

    const { data: action, error } = await supabase
      .from("action_items")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ action });
  } catch (error) {
    console.error("Error updating action:", error);
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing action ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from("action_items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting action:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
