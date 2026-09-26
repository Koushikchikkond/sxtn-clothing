import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiRateLimit, authRateLimit, checkoutRateLimit } from "@/lib/rate-limit";

function getIdentifier(req: NextRequest): string {
  const userId = req.cookies.get("sb-user-id")?.value;
  if (userId) return `user:${userId}`;

  const ip =
    (req as any).ip ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1";

  return `ip:${ip}`;
}

function pickLimiter(pathname: string) {
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/signup") ||
    pathname.startsWith("/api/otp") ||
    pathname.startsWith("/api/reset-password")
  ) {
    return authRateLimit;
  }

  if (
    pathname.startsWith("/api/checkout") ||
    pathname.startsWith("/api/order") ||
    pathname.startsWith("/api/payment")
  ) {
    return checkoutRateLimit;
  }

  return apiRateLimit;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never block admin APIs, image uploads, or webhooks
  if (
    pathname.startsWith("/api/upload") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/webhooks")
  ) {
    return NextResponse.next();
  }

  try {
    const identifier = getIdentifier(req);
    const limiter = pickLimiter(pathname);

    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests. Please slow down and try again shortly.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.max(
              0,
              Math.ceil((reset - Date.now()) / 1000)
            ).toString(),
          },
        }
      );
    }

    const res = NextResponse.next();
    res.headers.set("X-RateLimit-Limit", limit.toString());
    res.headers.set("X-RateLimit-Remaining", remaining.toString());
    res.headers.set("X-RateLimit-Reset", reset.toString());
    return res;
  } catch (err) {
    // Fail-open: Never bring down APIs if rate limiter encounters a network or Edge runtime error
    console.error("[middleware] Rate limit check skipped:", err);
    return NextResponse.next();
  }
}

// Only run this middleware on API routes
export const config = {
  matcher: ["/api/:path*"],
};
