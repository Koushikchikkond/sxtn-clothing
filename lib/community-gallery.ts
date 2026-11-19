/**
 * Community Gallery helpers — reads/writes customer photo showcase.
 * Stored in Supabase site_settings + cached in Upstash Redis.
 *
 * SERVER-ONLY: imported in server components / API routes.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { Redis } from "@upstash/redis";

export interface CommunityGalleryItem {
  id: string;
  image_url: string;
  customer_name: string;
  tshirt_name: string;
  caption?: string;
  created_at?: string;
}

export interface CommunityGalleryConfig {
  title: string;
  subtitle: string;
  hashtag: string;
  items: CommunityGalleryItem[];
  updated_at?: string;
}

export const DEFAULT_COMMUNITY_GALLERY: CommunityGalleryConfig = {
  title: "WORN BY YOU",
  subtitle: "Tag @6xtn.in on Instagram to be featured on our official showcase",
  hashtag: "#6XTN #STREETWEAR",
  items: [],
};

function parseConfig(raw: unknown): CommunityGalleryConfig | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;

  let items: CommunityGalleryItem[] = [];
  if (Array.isArray(obj.items)) {
    items = obj.items
      .filter((it) => it && typeof it === "object")
      .map((it, idx) => {
        const item = it as Record<string, unknown>;
        return {
          id: typeof item.id === "string" && item.id ? item.id : String(idx + 1),
          image_url: typeof item.image_url === "string" ? item.image_url.trim() : "",
          customer_name: typeof item.customer_name === "string" ? item.customer_name.trim() : "",
          tshirt_name: typeof item.tshirt_name === "string" ? item.tshirt_name.trim() : "",
          caption: typeof item.caption === "string" ? item.caption.trim() : undefined,
          created_at: typeof item.created_at === "string" ? item.created_at : undefined,
        };
      })
      .filter((it) => Boolean(it.image_url));
  }

  return {
    title: typeof obj.title === "string" && obj.title.trim() ? obj.title.trim() : DEFAULT_COMMUNITY_GALLERY.title,
    subtitle: typeof obj.subtitle === "string" ? obj.subtitle : DEFAULT_COMMUNITY_GALLERY.subtitle,
    hashtag: typeof obj.hashtag === "string" ? obj.hashtag : DEFAULT_COMMUNITY_GALLERY.hashtag,
    items,
    updated_at: typeof obj.updated_at === "string" ? obj.updated_at : undefined,
  };
}

export async function getCommunityGallery(client?: any): Promise<CommunityGalleryConfig> {
  // 1. Supabase site_settings (source of truth)
  try {
    const supabase = client || createAdminClient();
    const { data, error } = await (supabase as any)
      .from("site_settings")
      .select("value")
      .eq("key", "community_gallery")
      .maybeSingle();

    if (!error && data && data.value) {
      const parsed = parseConfig(data.value);
      if (parsed) return parsed;
    }
  } catch {
    // Fall through
  }

  // 2. Upstash Redis cache (fast-path)
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/^["']|["']$/g, "");
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim().replace(/^["']|["']$/g, "");
    if (url && token) {
      const redis = new Redis({ url, token });
      const cached = await redis.get<unknown>("sxtn:community_gallery");
      const parsed = parseConfig(cached);
      if (parsed) return parsed;
    }
  } catch {
    // Fall through
  }

  // 3. Fallback
  return DEFAULT_COMMUNITY_GALLERY;
}

export async function saveCommunityGallery(
  config: Omit<CommunityGalleryConfig, "updated_at">,
  client?: any
): Promise<{ success: boolean; error?: string }> {
  const payload: CommunityGalleryConfig = {
    ...config,
    updated_at: new Date().toISOString(),
  };

  let dbSaved = false;
  let dbError = "";

  try {
    const supabase = client || createAdminClient();
    const { error } = await (supabase as any).from("site_settings").upsert(
      {
        key: "community_gallery",
        value: payload,
        updated_at: payload.updated_at,
      },
      { onConflict: "key" }
    );

    if (error) {
      dbError = error.message || JSON.stringify(error);
      console.error("[saveCommunityGallery] Supabase upsert error:", dbError);
    } else {
      dbSaved = true;
    }
  } catch (err: unknown) {
    dbError = err instanceof Error ? err.message : String(err);
    console.error("[saveCommunityGallery] Supabase exception:", dbError);
  }

  let redisSaved = false;
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/^["']|["']$/g, "");
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim().replace(/^["']|["']$/g, "");
    if (url && token) {
      const redis = new Redis({ url, token });
      await redis.set("sxtn:community_gallery", payload);
      redisSaved = true;
    }
  } catch (redisErr) {
    console.warn("[saveCommunityGallery] Redis write warning:", redisErr);
  }

  if (dbSaved || redisSaved) {
    return { success: true };
  }

  return {
    success: false,
    error: dbError ? `Database error: ${dbError}` : "Could not save community gallery.",
  };
}
