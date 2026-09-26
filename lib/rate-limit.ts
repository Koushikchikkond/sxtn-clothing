import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/^["']|["']$/g, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim().replace(/^["']|["']$/g, "");
  if (!url || !token) return null;
  try {
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

// Fallback limiter that always allows requests if Redis is unavailable or unconfigured
const fallbackLimiter = {
  limit: async (_id: string) => ({
    success: true,
    limit: 100,
    remaining: 100,
    reset: Date.now() + 1000,
    pending: Promise.resolve(),
  }),
};

function createLimiter(requests: number, window: `${number} s`, prefix: string) {
  const redis = getRedis();
  if (!redis) return fallbackLimiter;
  try {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      analytics: false,
      prefix,
    });
  } catch {
    return fallbackLimiter;
  }
}

/**
 * General API endpoints (product listing, cart reads, etc.)
 * 30 requests per 10 seconds per identifier.
 */
export const apiRateLimit = createLimiter(30, "10 s", "ratelimit:api");

/**
 * Auth endpoints: login, signup, OTP, password reset.
 * 5 requests per 60 seconds per identifier.
 */
export const authRateLimit = createLimiter(5, "60 s", "ratelimit:auth");

/**
 * Checkout / order placement endpoints.
 * 10 requests per 60 seconds per identifier.
 */
export const checkoutRateLimit = createLimiter(10, "60 s", "ratelimit:checkout");
