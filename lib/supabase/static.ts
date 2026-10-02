import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Stateless Supabase client for static generation (ISR) and public queries.
 * Does not read or set cookies, allowing Next.js pages to be cached on the Edge CDN.
 */
export function createStaticClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
