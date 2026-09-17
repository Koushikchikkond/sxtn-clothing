"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, ArrowLeft, Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail]   = useState("");
  const [error, setError]   = useState<string | null>(null);
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mb-6">
          <Mail className="h-7 w-7 text-white/60" />
        </div>
        <h1 className="font-display text-4xl uppercase tracking-widest mb-4">Check your inbox</h1>
        <p className="text-white/50 text-sm max-w-xs leading-relaxed">
          We&apos;ve sent a password reset link to{" "}
          <strong className="text-white">{email}</strong>.
          The link expires in 1 hour.
        </p>
        <Link
          href="/login"
          className="mt-10 flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Sign In
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link href="/" className="mb-12">
        <Image src="/brand-logo.svg" alt="SXTN" width={80} height={32} className="h-10 w-auto" />
      </Link>

      <div className="w-full max-w-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors mb-8"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Sign In
        </Link>

        <h1 className="font-display text-5xl uppercase tracking-widest mb-2">Reset Password</h1>
        <p className="text-white/50 text-sm mb-10 leading-relaxed">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs uppercase tracking-widest text-white/50 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/40 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center py-2 px-3 bg-red-400/10 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white text-black font-medium text-sm uppercase tracking-widest py-3.5 rounded-full hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>Send Reset Link <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
