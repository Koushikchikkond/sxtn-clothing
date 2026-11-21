import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Auto-claims all unlinked guest orders placed with the user's email.
 * Associates them with the authenticated user's ID.
 */
export async function claimUserOrdersByEmail(userId: string, email: string): Promise<number> {
  if (!userId || !email) return 0;
  const normalized = email.trim().toLowerCase();
  const adminDb = createAdminClient();

  try {
    const { data, error } = await (adminDb.from("orders") as any)
      .update({ user_id: userId })
      .ilike("guest_email", normalized)
      .is("user_id", null)
      .select("id");

    if (error) {
      console.warn("[claimUserOrdersByEmail] Notice:", error);
      return 0;
    }
    return Array.isArray(data) ? data.length : 0;
  } catch (err) {
    console.warn("[claimUserOrdersByEmail] Exception:", err);
    return 0;
  }
}
