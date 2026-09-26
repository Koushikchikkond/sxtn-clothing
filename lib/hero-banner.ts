import { createAdminClient } from "@/lib/supabase/admin";
import { Redis } from "@upstash/redis";
import type { Json } from "@/types/database.types";

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

/**
 * Fetch hero banner configuration.
 * Checks Supabase site_settings first, then Upstash Redis cache, then fallback.
 */
export async function getHeroBanner(): Promise<HeroBannerConfig> {
  // 1. Try Supabase
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "hero_banner")
      .maybeSingle();

    if (!error && data) {
      // data.value is typed as Json — cast to Record for safe property access
      const val = data.value as Record<string, string>;
      if (val && (val.desktop_url || val.mobile_url)) {
        return {
          desktop_url: val.desktop_url || DEFAULT_HERO_BANNER.desktop_url,
          mobile_url:
            val.mobile_url || val.desktop_url || DEFAULT_HERO_BANNER.mobile_url,
          alt_text: val.alt_text || DEFAULT_HERO_BANNER.alt_text,
          updated_at: val.updated_at,
        };
      }
    }
  } catch {
    // Supabase query failed or table not created yet — fall through
  }

  // 2. Try Upstash Redis cache
  try {
    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      const redis = Redis.fromEnv();
      const cached = await redis.get<HeroBannerConfig>("sxtn:hero_banner");
      if (cached && (cached.desktop_url || cached.mobile_url)) {
        return {
          desktop_url: cached.desktop_url || DEFAULT_HERO_BANNER.desktop_url,
          mobile_url:
            cached.mobile_url ||
            cached.desktop_url ||
            DEFAULT_HERO_BANNER.mobile_url,
          alt_text: cached.alt_text || DEFAULT_HERO_BANNER.alt_text,
          updated_at: cached.updated_at,
        };
      }
    }
  } catch {
    // Redis unavailable — fall through to default
  }

  return DEFAULT_HERO_BANNER;
}

/**
 * Save hero banner configuration to Supabase and Upstash Redis.
 */
export async function saveHeroBanner(
  config: Omit<HeroBannerConfig, "updated_at">
): Promise<{ success: boolean; error?: string }> {
  const payload: HeroBannerConfig = {
    ...config,
    updated_at: new Date().toISOString(),
  };

  let savedAnywhere = false;

  // 1. Save to Supabase site_settings
  try {
    const supabase = createAdminClient();
    // Cast payload to Json so Supabase-js typed client accepts it
    const jsonValue: Json = payload as unknown as Json;
    const { error } = await supabase.from("site_settings").upsert(
      {
        key: "hero_banner",
        value: jsonValue,
        updated_at: payload.updated_at,
      },
      { onConflict: "key" }
    );

    if (!error) {
      savedAnywhere = true;
    }
  } catch {
    // Ignore — table may not exist yet
  }

  // 2. Save to Upstash Redis
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
    // Ignore Redis errors
  }

  return savedAnywhere
    ? { success: true }
    : {
        success: false,
        error:
          "Could not save to Supabase or Redis. Check that the site_settings table exists.",
      };
}
