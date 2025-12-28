import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Lazy initialization to avoid build-time errors
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Using 'any' return type to avoid strict TypeScript inference issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): any {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      // Return a mock client that shows helpful error
      console.warn("Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
      const mockError = { error: new Error("Supabase not configured - check .env.local") };
      return {
        auth: {
          signInWithOAuth: () => Promise.resolve(mockError),
          signInWithPassword: () => Promise.resolve(mockError),
          signUp: () => Promise.resolve(mockError),
          signOut: () => Promise.resolve({ error: null }),
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        },
        from: () => ({
          select: () => ({ data: null, error: mockError.error }),
          insert: () => ({ data: null, error: mockError.error }),
          update: () => ({ data: null, error: mockError.error }),
          delete: () => ({ data: null, error: mockError.error }),
        }),
      };
    }

    client = createBrowserClient<Database>(url, key);
  }
  return client;
}
