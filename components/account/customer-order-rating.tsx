"use client";

import React, { useState, useEffect } from "react";
import { Heart, CheckCircle2, Loader2, Sparkles, Edit3 } from "lucide-react";
import type { OrderReview } from "@/types/database.types";

interface CustomerOrderRatingProps {
  orderId: string;
  status: string;
  initialReview: OrderReview | null;
  customerName: string;
  customerCity?: string;
  customerState?: string;
  productName?: string;
}

export function CustomerOrderRating({
  orderId,
  status,
  initialReview,
  customerName,
  customerCity = "India",
  customerState = "",
  productName = "6XTN Streetwear",
}: CustomerOrderRatingProps) {
  const [review, setReview] = useState<OrderReview | null>(initialReview);
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState<number>(initialReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(initialReview?.comment || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedJustNow, setSubmittedJustNow] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("rate") === "true") {
        if (initialReview) {
          setIsEditing(true);
        }
        setTimeout(() => {
          const el = document.getElementById("rate-order-section") || document.getElementById("order-rating-section");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 150);
      }
    }
  }, [initialReview]);

  // Ratings only apply to delivered orders
  if (status !== "delivered") return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit rating.");
      }

      setReview(data.review);
      setIsEditing(false);
      setSubmittedJustNow(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving rating.");
    } finally {
      setLoading(false);
    }
  }

  // If review exists and not in editing mode, show the submitted review
  if (review && !isEditing) {
    return (
      <div id="order-rating-section" className="mt-8 border border-white/10 bg-[#0c0c0c] p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Heart
                  key={s}
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    s <= review.rating
                      ? "fill-[#ff6d75] text-[#ff6d75]"
                      : "text-zinc-600 fill-zinc-800/40"
                  }`}
                />
              ))}
            </span>
            <span className="text-white font-bold text-sm tracking-widest uppercase ml-1">
              {review.rating} / 5 Hearts
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified Rating
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
        </div>

        {submittedJustNow && (
          <div className="mb-4 text-xs text-emerald-400 font-mono tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Thank you! Your rating is live on the community showcase.
          </div>
        )}

        {review.comment ? (
          <p className="text-white/80 text-sm leading-relaxed italic mb-4 font-sans">
            "{review.comment}"
          </p>
        ) : (
          <p className="text-white/40 text-xs italic mb-4">No written comment provided.</p>
        )}

        <div className="text-[11px] uppercase tracking-widest text-white/40 flex flex-wrap items-center gap-3 font-mono">
          <span>By {review.customer_name}</span>
          <span>•</span>
          <span>
            {review.customer_city}
            {review.customer_state ? `, ${review.customer_state}` : ""}
          </span>
          {review.product_name && (
            <>
              <span>•</span>
              <span className="text-white/60">{review.product_name}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // Active Rating Form
  const activeRating = hoverRating || rating;

  return (
    <div id="rate-order-section" className="mt-8 border border-white/20 bg-[#0e0e0e] p-6 sm:p-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-xl sm:text-2xl uppercase tracking-wider text-white flex items-center gap-2">
          <span>Rate Your Drop</span>
          <span className="text-[#ff6d75] text-lg">♥♥♥♥♥</span>
        </h3>
        {isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-xs text-white/40 hover:text-white uppercase tracking-widest"
          >
            Cancel
          </button>
        )}
      </div>

      <p className="text-white/50 text-xs sm:text-sm mb-6 leading-relaxed max-w-xl">
        How does your piece fit and feel? Your feedback shapes our next collection drops and helps fellow streetwear enthusiasts.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Interactive Heart Picker */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/60 font-semibold mb-2">
            Your Rating (1 to 5 Hearts)
          </label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((heartValue) => (
              <button
                key={heartValue}
                type="button"
                onClick={() => setRating(heartValue)}
                onMouseEnter={() => setHoverRating(heartValue)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                aria-label={`Rate ${heartValue} hearts`}
              >
                <Heart
                  className={`w-7 h-7 sm:w-8 sm:h-8 transition-all ${
                    heartValue <= activeRating
                      ? "fill-[#ff6d75] text-[#ff6d75] drop-shadow-[0_0_10px_rgba(255,109,117,0.55)]"
                      : "text-zinc-600 fill-zinc-800/40 hover:text-[#ff6d75]/50"
                  }`}
                />
              </button>
            ))}
            <span className="text-xs uppercase tracking-widest text-white/70 ml-2 font-mono">
              {activeRating === 5 && "Loved it — 5/5"}
              {activeRating === 4 && "Great Piece — 4/5"}
              {activeRating === 3 && "Good / Average — 3/5"}
              {activeRating === 2 && "Needs Improvement — 2/5"}
              {activeRating === 1 && "Disappointed — 1/5"}
            </span>
          </div>
        </div>

        {/* Blank Text Feedback (No preset tags) */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/60 font-semibold mb-2">
            Customer Feedback
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Write your review here... Tell us about the fabric weight, neck ribbing, fit, or packaging."
            className="w-full bg-black border border-white/15 focus:border-[#ff6d75] text-white text-sm p-3.5 outline-none transition-colors placeholder:text-white/30 resize-none font-sans rounded-none"
          />
        </div>

        {/* Display meta preview */}
        <div className="p-3 bg-white/[0.02] border border-white/10 text-[11px] text-white/40 flex flex-wrap items-center justify-between gap-2 font-mono">
          <span>Posting as: <strong className="text-white/80">{customerName}</strong></span>
          <span>Location: <strong className="text-white/80">{customerCity}{customerState ? `, ${customerState}` : ""}</strong></span>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-500/30 p-2.5">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="bg-white hover:bg-white/90 text-black px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-white/10"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEditing ? "Update Feedback" : "Submit Rating & Review"}
          </button>
        </div>
      </form>
    </div>
  );
}
