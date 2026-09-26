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
export async function getHeroBanner(): Promise<HeroBannerConfig> {
  // 1. Supabase site_settings (source of truth)
  try {
    const supabase = createAdminClient();
    // Using any-cast to avoid PostgREST query-builder schema-matching issues with custom tables
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
    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      const redis = Redis.fromEnv();
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
  config: Omit<HeroBannerConfig, "updated_at">
): Promise<{ success: boolean; error?: string }> {
  const payload: HeroBannerConfig = {
    ...config,
    updated_at: new Date().toISOString(),
  };
  let savedAnywhere = false;

  // 1. Supabase upsert
  try {
    const supabase = createAdminClient();
    const { error } = await (supabase as any).from("site_settings").upsert(
      {
        key: "hero_banner",
        value: payload,
        updated_at: payload.updated_at,
      },
      { onConflict: "key" }
    );
    if (!error) savedAnywhere = true;
  } catch {
    // Ignore — maybe table missing
  }

  // 2. Redis cache
  try {
    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      const redis = Redis.fromEnv();
      await redis.set("sxtn:hero_banner", payload);
      savedAnywhere = true;
    }
  } catch {
    // Ignore
  }

  return savedAnywhere
    ? { success: true }
    : {
        success: false,
        error:
          "Could not save — ensure the site_settings table exists in Supabase.",
      };
}
