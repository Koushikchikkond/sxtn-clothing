/**
 * Hero Banner helpers — reads/writes the homepage hero images.
 * Stored in Supabase site_settings + cached in Upstash Redis.
 *
 * SERVER-ONLY: imported only in server components / API routes.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { Redis } from "@upstash/redis";

// ── Types ─────────────────────────────────────────────────────────
export interface HeroBannerConfig {
  desktop_url: string;
  mobile_url: string;
  alt_text?: string;
  updated_at?: string;
}

export const DEFAULT_HERO_BANNER: HeroBannerConfig = {
  desktop_url:
    "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=3000&auto=format&fit=crop",
  mobile_url:
    "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=3000&auto=format&fit=crop",
  alt_text: "SXTN Hero",
};

// ── Safe JSON parser ───────────────────────────────────────────────
function parseConfig(raw: unknown): HeroBannerConfig | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.desktop_url !== "string" || typeof obj.mobile_url !== "string") return null;
  return {
    desktop_url: obj.desktop_url,
    mobile_url: obj.mobile_url,
    alt_text: typeof obj.alt_text === "string" ? obj.alt_text : undefined,
    updated_at: typeof obj.updated_at === "string" ? obj.updated_at : undefined,
  };
}

// ── Read ───────────────────────────────────────────────────────────
export async function getHeroBanner(client?: any): Promise<HeroBannerConfig> {
  // 1. Supabase site_settings (source of truth)
  try {
    const supabase = client || createAdminClient();
    const { data, error } = await (supabase as any)
      .from("site_settings")
      .select("value")
      .eq("key", "hero_banner")
      .maybeSingle();

    if (!error && data && data.value) {
      const parsed = parseConfig(data.value);
      if (parsed) return parsed;
    }
  } catch {
    // Table not yet created or unreachable — fall through
  }

  // 2. Upstash Redis cache (fast-path)
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/^["']|["']$/g, "");
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim().replace(/^["']|["']$/g, "");
    if (url && token) {
      const redis = new Redis({ url, token });
      const cached = await redis.get<unknown>("sxtn:hero_banner");
      const parsed = parseConfig(cached);
      if (parsed) return parsed;
    }
  } catch {
    // Redis unavailable — fall through
  }

  // 3. Hardcoded default
  return DEFAULT_HERO_BANNER;
}

// ── Write ──────────────────────────────────────────────────────────
export async function saveHeroBanner(
  config: Omit<HeroBannerConfig, "updated_at">,
  client?: any
): Promise<{ success: boolean; error?: string }> {
  const payload: HeroBannerConfig = {
    ...config,
    updated_at: new Date().toISOString(),
  };

  let dbSaved = false;
  let dbError = "";

  // 1. Supabase upsert (prefer authenticated admin client if passed)
  try {
    const supabase = client || createAdminClient();
    const { error } = await (supabase as any).from("site_settings").upsert(
      {
        key: "hero_banner",
        value: payload,
        updated_at: payload.updated_at,
      },
      { onConflict: "key" }
    );

    if (error) {
      dbError = error.message || JSON.stringify(error);
      console.error("[saveHeroBanner] Supabase upsert error:", dbError);
    } else {
      dbSaved = true;
    }
  } catch (err: unknown) {
    dbError = err instanceof Error ? err.message : String(err);
    console.error("[saveHeroBanner] Supabase exception:", dbError);
  }

  // 2. Redis cache write
  let redisSaved = false;
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/^["']|["']$/g, "");
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim().replace(/^["']|["']$/g, "");
    if (url && token) {
      const redis = new Redis({ url, token });
      await redis.set("sxtn:hero_banner", payload);
      redisSaved = true;
    }
  } catch (redisErr) {
    console.warn("[saveHeroBanner] Redis write warning:", redisErr);
  }

  if (dbSaved || redisSaved) {
    return { success: true };
  }

  return {
    success: false,
    error: dbError
      ? `Database error: ${dbError}`
      : "Could not save to database or cache. Please check Supabase permissions.",
  };
}
