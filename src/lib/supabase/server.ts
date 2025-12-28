import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// Mock client for when Supabase is not configured
const mockClient = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  },
  from: () => ({
    select: () => ({ data: null, error: new Error("Supabase not configured"), single: () => ({ data: null, error: null }) }),
    insert: () => ({ data: null, error: new Error("Supabase not configured"), select: () => ({ single: () => ({ data: null }) }) }),
    update: () => ({ eq: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }) }),
    delete: () => ({ eq: () => ({ eq: () => ({ data: null, error: null }) }) }),
  }),
};

// Using 'any' return type to avoid strict TypeScript inference issues with Supabase v2
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createClient(): Promise<any> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return mockClient;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createServiceClient(): Promise<any> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return mockClient;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored for service role
          }
        },
      },
    }
  );
}
