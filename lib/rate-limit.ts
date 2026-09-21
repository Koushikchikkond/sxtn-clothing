import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env automatically
const redis = Redis.fromEnv();

/**
 * General API endpoints (product listing, cart reads, etc.)
 * 30 requests per 10 seconds per identifier.
 */
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "10 s"),
  analytics: true,
  prefix: "ratelimit:api",
});

/**
 * Auth endpoints: login, signup, OTP, password reset.
 * Tighter limit to slow down brute-force / spam attempts.
 * 5 requests per 60 seconds per identifier.
 */
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "ratelimit:auth",
});

/**
 * Checkout / order placement endpoints.
 * 10 requests per 60 seconds per identifier.
 */
export const checkoutRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "ratelimit:checkout",
});
