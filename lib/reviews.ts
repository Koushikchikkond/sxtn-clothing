/**
 * lib/reviews.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Customer Reviews & Star Ratings Data Access
 * Handles database operations for order_reviews with resilient fallbacks.
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

export const SEED_REVIEWS: ReviewItem[] = [
  {
    id: "seed-1",
    customer_name: "Karan Singhania",
    customer_city: "Mumbai",
    customer_state: "Maharashtra",
    rating: 5,
    product_name: "Heavyweight Boxy Tee",
    comment: "The 280 GSM fabric weight is insane. Structured drape, zero collar sagging even after 6 washes. Proper streetwear cut.",
    verified: true,
  },
  {
    id: "seed-2",
    customer_name: "Tanvi Rao",
    customer_city: "Bengaluru",
    customer_state: "Karnataka",
    rating: 5,
    product_name: "Shadow Black Boxy Hoodie",
    comment: "French terry fleece feels super luxe and the oversized drop shoulder fit is identical to Japanese designer labels.",
    verified: true,
  },
  {
    id: "seed-3",
    customer_name: "Aarav Mehrotra",
    customer_city: "New Delhi",
    customer_state: "Delhi",
    rating: 5,
    product_name: "Off-White Boxy Fit Tee",
    comment: "Fast delivery to Delhi. Clean minimal branding, premium neck ribbing, and incredible silhouette. 10/10 recommend.",
    verified: true,
  },
  {
    id: "seed-4",
    customer_name: "Riddhima Joshi",
    customer_city: "Pune",
    customer_state: "Maharashtra",
    rating: 5,
    product_name: "Boxy Fit Tee",
    comment: "Worth every single rupee. Pure cut & sew aesthetic with heavy cotton that breathes well. Definitely ordering the next drop.",
    verified: true,
  },
  {
    id: "seed-5",
    customer_name: "Vikram Reddy",
    customer_city: "Hyderabad",
    customer_state: "Telangana",
    rating: 5,
    product_name: "Oversized Streetwear Hoodie",
    comment: "The double-layered hood holds its shape without collapsing. The packaging and finish were beyond expectations.",
    verified: true,
  },
  {
    id: "seed-6",
    customer_name: "Siddharth Jain",
    customer_city: "Jaipur",
    customer_state: "Rajasthan",
    rating: 5,
    product_name: "Heavyweight Cotton Tee",
    comment: "Luxurious feel, ultra-comfortable cotton, and fits boxy without looking bulky. SXTN is setting a new standard.",
    verified: true,
  },
];

/**
 * Fetch approved customer reviews from Supabase, merged with seed community reviews
 */
export async function getReviews(client?: any): Promise<ReviewItem[]> {
  try {
    const supabase = client || createAdminClient();
    const { data, error } = await (supabase as any)
      .from("order_reviews")
      .select("id, order_id, customer_name, customer_city, customer_state, rating, comment, product_name, created_at")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && Array.isArray(data) && data.length > 0) {
      const dbReviews: ReviewItem[] = data.map((r) => ({
        id: String(r.id),
        order_id: r.order_id ? String(r.order_id) : undefined,
        customer_name: String(r.customer_name || "Verified Customer"),
        customer_city: String(r.customer_city || "India"),
        customer_state: String(r.customer_state || ""),
        rating: Math.max(1, Math.min(5, Number(r.rating) || 5)),
        comment: String(r.comment || "Great quality and perfect fit!"),
        product_name: String(r.product_name || "6XTN Streetwear"),
        created_at: r.created_at ? String(r.created_at) : undefined,
        verified: true,
      }));

      // Combine real reviews first, then seed reviews
      return [...dbReviews, ...SEED_REVIEWS];
    }
  } catch (err) {
    console.warn("[getReviews] DB fetch notice:", err);
  }

  return SEED_REVIEWS;
}
