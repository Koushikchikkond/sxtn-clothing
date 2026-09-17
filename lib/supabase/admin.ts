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

export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() must only be called server-side. " +
        "It uses the service role key which must never reach the browser."
    );
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
