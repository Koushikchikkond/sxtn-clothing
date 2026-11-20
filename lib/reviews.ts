/**
 * lib/reviews.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Customer Reviews & Star Ratings Data Access
 * Fetches only authentic, user-submitted reviews from the order_reviews table.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface ReviewItem {
  id: string;
  order_id?: string;
  customer_name: string;
  customer_city: string;
  customer_state: string;
  rating: number; // 1-5
  comment: string;
  product_name: string;
  created_at?: string;
  verified?: boolean;
}

/**
 * Fetch approved real customer reviews from Supabase order_reviews table.
 * Strictly returns only authentic user-submitted reviews.
 */
export async function getReviews(client?: any): Promise<ReviewItem[]> {
  try {
    const supabase = client || createAdminClient();
    const { data, error } = await (supabase as any)
      .from("order_reviews")
      .select("id, order_id, customer_name, customer_city, customer_state, rating, comment, product_name, created_at")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((r) => ({
        id: String(r.id),
        order_id: r.order_id ? String(r.order_id) : undefined,
        customer_name: String(r.customer_name || "Verified Customer"),
        customer_city: String(r.customer_city || "India"),
        customer_state: String(r.customer_state || ""),
        rating: Math.max(1, Math.min(5, Number(r.rating) || 5)),
        comment: String(r.comment || ""),
        product_name: String(r.product_name || "6XTN Streetwear"),
        created_at: r.created_at ? String(r.created_at) : undefined,
        verified: true,
      }));
    }
  } catch (err) {
    console.warn("[getReviews] DB fetch notice:", err);
  }

  return [];
}
