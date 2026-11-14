"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 text-center">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <Image src="/brand-logo.svg" alt="6XTN" width={90} height={36} className="h-10 w-auto" />
      </Link>

      <div className="w-full max-w-sm">
        <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="h-7 w-7 text-white" />
        </div>

        <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-widest mb-3">
          No Password Needed
        </h1>
        <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-8">
          6XTN uses secure Google authentication. You never need to remember or reset a password.
        </p>

        <Link
          href="/login"
          className="w-full inline-flex items-center justify-center gap-2 bg-white text-black py-3.5 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-white/90 transition-all shadow-lg"
        >
          Sign In with Google
        </Link>

        <div className="mt-8 pt-6 border-t border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Store
          </Link>
        </div>
      </div>
    </main>
  );
}
