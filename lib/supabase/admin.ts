/**
 * SUPABASE ADMIN CLIENT — SERVICE ROLE
 *
 * ⚠️  WARNING: This client bypasses Row Level Security (RLS).
 * ⚠️  NEVER import this file into any client component or any file
 *     that could be bundled and shipped to the browser.
 * ⚠️  Only use inside:
 *     - Server Actions that require admin-level DB access
 *     - Route Handlers (e.g. /api/webhooks/razorpay)
 *     - Admin-only Server Actions (admin panel mutations)
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

function clean(val: string | undefined): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "");
}

export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() must only be called server-side. " +
        "It uses the service role key which must never reach the browser."
    );
  }

  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const serviceKey = clean(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return createClient<Database>(
    url,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
