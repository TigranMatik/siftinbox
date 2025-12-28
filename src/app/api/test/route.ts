import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      googleClientId: !!process.env.GOOGLE_CLIENT_ID,
      openaiKey: !!process.env.OPENAI_API_KEY,
    },
  };

  try {
    const supabase = await createClient();

    // Test auth
    const { data: authData, error: authError } = await supabase.auth.getUser();
    results.auth = {
      working: !authError,
      user: authData?.user?.email || null,
      error: authError?.message || null,
    };

    // Test database connection - try to query profiles table
    const { data: dbData, error: dbError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    results.database = {
      working: !dbError,
      error: dbError?.message || null,
    };

  } catch (error) {
    results.error = error instanceof Error ? error.message : "Unknown error";
  }

  return NextResponse.json(results, { status: 200 });
}
