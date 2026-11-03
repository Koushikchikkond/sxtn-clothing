"use client";

import { useState } from "react";
import { Bell, Check, Loader2, X } from "lucide-react";

interface NotifyMeModalProps {
  productId: string;
  productName: string;
  variantId?: string | null;
  size?: string | null;
  availableSizes?: string[];
  triggerClassName?: string;
  buttonLabel?: string;
}

export function NotifyMeModal({
  productId,
  productName,
  variantId,
  size,
  availableSizes = [],
  triggerClassName,
  buttonLabel = "Notify Me",
}: NotifyMeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedSize, setSelectedSize] = useState<string>(size || (availableSizes[0] ?? ""));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/demands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId: variantId || null,
          size: selectedSize || null,
          email,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request.");
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setEmail("");
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={
          triggerClassName ||
          "inline-flex items-center gap-1.5 bg-white text-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-white/90 transition-colors"
        }
      >
        <Bell className="h-3.5 w-3.5" />
        {buttonLabel}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-md bg-zinc-950 border border-white/20 p-6 sm:p-8 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-white/50 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {success ? (
              <div className="py-8 text-center space-y-3">
                <div className="h-12 w-12 mx-auto rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl uppercase tracking-wider font-bold">
                  You&apos;re On The List!
                </h3>
                <p className="text-xs text-white/60">
                  We&apos;ll email you at <span className="text-white font-medium">{email}</span> as soon as this item is restocked.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-400 font-bold mb-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    Out of Stock Alert
                  </div>
                  <h3 className="font-display text-xl uppercase tracking-wider font-bold">
                    Notify Me When Available
                  </h3>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    Leave your email to get instantly notified when <strong className="text-white">{productName}</strong> is restocked.
                  </p>
                </div>

                {availableSizes.length > 0 && !size && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                      Select Size
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedSize(s)}
                          className={`px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider border transition-colors ${
                            selectedSize === s
                              ? "border-white bg-white text-black"
                              : "border-white/20 text-white/70 hover:border-white/50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1.5">
                    Your Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full bg-black border border-white/20 px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-xs bg-red-950/40 border border-red-500/30 p-2.5">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-white text-black font-display text-xs font-bold uppercase tracking-widest hover:bg-white/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Notify Me"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

