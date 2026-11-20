"use client";

import React, { useState } from "react";
import { Star, CheckCircle2, Loader2, Sparkles, Edit3 } from "lucide-react";
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

const PRESET_TAGS = [
  "Perfect Boxy Fit",
  "Heavyweight 280 GSM",
  "Luxury Quality",
  "Fast Delivery",
  "Insane Silhouette",
];

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

  function handleTagClick(tag: string) {
    if (!comment) {
      setComment(tag);
    } else if (!comment.includes(tag)) {
      setComment(`${comment}. ${tag}`);
    }
  }

  // If review exists and not in editing mode, show the submitted review
  if (review && !isEditing) {
    return (
      <div className="mt-8 border border-white/10 bg-[#0c0c0c] p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    s <= review.rating ? "fill-amber-400 text-amber-400" : "text-white/20"
                  }`}
                />
              ))}
            </span>
            <span className="text-white font-bold text-sm tracking-widest uppercase ml-1">
              {review.rating} / 5 Stars
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
          <span className="text-amber-400 text-lg">★★★★★</span>
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
        How does your piece fit and feel? Your rating helps fellow streetwear enthusiasts and shapes our next collection drops.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Interactive Star Picker */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/60 font-semibold mb-2">
            Your Rating (1 to 5 Stars)
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((starValue) => (
              <button
                key={starValue}
                type="button"
                onClick={() => setRating(starValue)}
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                aria-label={`Rate ${starValue} stars`}
              >
                <Star
                  className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                    starValue <= activeRating
                      ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                      : "text-white/20 hover:text-white/40"
                  }`}
                />
              </button>
            ))}
            <span className="text-xs uppercase tracking-widest text-white/70 ml-2 font-mono">
              {activeRating === 5 && "Outstanding — 5/5"}
              {activeRating === 4 && "Great Piece — 4/5"}
              {activeRating === 3 && "Good / Average — 3/5"}
              {activeRating === 2 && "Needs Improvement — 2/5"}
              {activeRating === 1 && "Disappointed — 1/5"}
            </span>
          </div>
        </div>

        {/* Quick Tag Suggestions */}
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-white/40 mb-2">
            Quick Feedback Tags:
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 hover:border-white/30 rounded-full transition-all"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Text Feedback */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/60 font-semibold mb-2">
            Detailed Review (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Tell us about the fabric weight, neck ribbing, fit, or packaging..."
            className="w-full bg-black border border-white/15 focus:border-white text-white text-sm p-3.5 outline-none transition-colors placeholder:text-white/30 resize-none font-sans"
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
            className="bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white/90 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Submitting Rating...
              </>
            ) : (
              "Submit Rating & Review →"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
