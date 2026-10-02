"use client";

import { useState } from "react";
import { Mail, CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react";
import Link from "next/link";

export default function TestEmailPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    help?: string;
    emailId?: string;
  } | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email.trim() }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Network request failed",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg border border-white/10 p-8 bg-[#0a0a0a] rounded-sm">
        <div className="text-center mb-8 pb-6 border-b border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            Diagnostics
          </span>
          <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-wider text-white mt-1">
            Resend Email Tester
          </h1>
          <p className="text-xs text-white/50 mt-2">
            Verify that your <code className="text-white bg-white/10 px-1 py-0.5 rounded">RESEND_API_KEY</code> is working properly.
          </p>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">
              Recipient Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your Resend signup email"
                className="w-full bg-white/5 border border-white/15 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/50 transition-colors"
              />
              <Mail className="w-4 h-4 text-white/30 absolute right-3 top-3.5 pointer-events-none" />
            </div>
            <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">
              💡 <strong>Important:</strong> If your custom domain isn&apos;t verified yet, enter the <strong>exact email address</strong> you used to sign up for Resend.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-white text-black font-bold uppercase tracking-widest text-xs h-12 flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Test Email…</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Test Email</span>
              </>
            )}
          </button>
        </form>

        {result && (
          <div
            className={`mt-6 p-4 border text-xs leading-relaxed ${
              result.success
                ? "bg-green-500/10 border-green-500/30 text-green-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold">
                  {result.success ? "Success!" : "Email Failed to Send"}
                </p>
                <p>{result.message || result.error}</p>
                {result.emailId && (
                  <p className="font-mono text-[10px] text-green-400/70 pt-1">
                    Message ID: {result.emailId}
                  </p>
                )}
                {result.help && (
                  <p className="text-white/60 text-[11px] pt-2 border-t border-white/10 mt-2">
                    {result.help}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 text-center flex items-center justify-between text-xs text-white/40">
          <Link href="/" className="hover:text-white transition-colors">
            ← Back to Store
          </Link>
          <Link href="/admin" className="hover:text-white transition-colors">
            Admin Panel →
          </Link>
        </div>
      </div>
    </div>
  );
}
