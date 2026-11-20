"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);

    try {
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const nextParam = searchParams?.get("next") || searchParams?.get("redirectTo") || "/account";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error initiating Google login");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      {/* Back to Store */}
      <div className="w-full max-w-sm mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Store
        </Link>
      </div>

      {/* Logo */}
      <Link href="/" className="mb-8">
        <Image src="/brand-logo.svg" alt="6XTN" width={90} height={36} className="h-10 w-auto" />
      </Link>

      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-widest mb-3">
          Sign In
        </h1>
        <p className="text-white/50 text-xs sm:text-sm mb-8 tracking-wide leading-relaxed">
          Access your orders, saved addresses, size exchange requests, and wishlist with one click.
        </p>

        {/* Google OAuth Button */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-black py-3.5 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-white/90 disabled:opacity-60 transition-all shadow-lg hover:shadow-white/10"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-black" />
          ) : (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          {loading ? "Connecting to Google..." : "Continue with Google"}
        </button>

        {error && (
          <p className="mt-4 text-red-400 text-xs py-2.5 px-3 bg-red-400/10 border border-red-400/20 rounded-lg">
            {error}
          </p>
        )}

        {/* Value Proposition Note */}
        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-white/40 text-[11px]">
          <ShieldCheck className="h-3.5 w-3.5 text-white/60 shrink-0" />
          <span>Fast, secure, and password-free login</span>
        </div>

        {/* Legal Disclaimer */}
        <p className="mt-4 text-[10px] text-white/30 leading-relaxed">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-white/60">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-white/60">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
