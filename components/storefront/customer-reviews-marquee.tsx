"use client";

import React from "react";
import { Heart, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import type { ReviewItem } from "@/lib/reviews";

interface CustomerReviewsMarqueeProps {
  reviews: ReviewItem[];
}

export function CustomerReviewsMarquee({ reviews }: CustomerReviewsMarqueeProps) {
  if (!reviews || reviews.length === 0) return null;

  // Calculate live average rating from real reviews
  const avgRating = (
    reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
  ).toFixed(1);

  // Pad the items list so there are enough cards to span the viewport seamlessly
  let baseList = [...reviews];
  while (baseList.length < 6 && baseList.length > 0) {
    baseList = [...baseList, ...reviews];
  }
  const displayReviews = [...baseList, ...baseList];

  return (
    <section className="relative w-full bg-black py-20 md:py-28 overflow-hidden border-t border-white/10">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center mb-12 md:mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/15 text-[11px] font-mono uppercase tracking-[0.2em] text-white/70 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#ff6d75]" />
          <span>Verified Customer Reviews</span>
        </div>

        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-white">
          RATED BY OUR COMMUNITY
        </h2>

        {/* Global Rating summary badge */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest text-[#ff6d75]">
          <span className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Heart key={s} className="w-4 h-4 fill-[#ff6d75] text-[#ff6d75]" />
            ))}
          </span>
          <span className="text-white font-bold ml-1">{avgRating} / 5</span>
          <span className="text-white/40">
            · ({reviews.length} {reviews.length === 1 ? "verified review" : "verified reviews"})
          </span>
        </div>
      </div>

      {/* Left to Right Infinite Marquee Container */}
      <div className="relative w-full overflow-hidden group">
        {/* Soft edge blur masks */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-black via-black/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-black via-black/80 to-transparent z-10 pointer-events-none" />

        {/* Track moving slowly from left to right */}
        <div
          className="flex w-max gap-5 group-hover:[animation-play-state:paused]"
          style={{
            animation: "reviews-marquee-ltr 50s linear infinite",
          }}
        >
          {displayReviews.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="w-[310px] sm:w-[350px] md:w-[380px] shrink-0 bg-[#0c0c0c] border border-white/10 hover:border-white/30 transition-all duration-300 p-6 flex flex-col justify-between group/card relative"
            >
              {/* Card Top: Hearts & Verified Badge */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-[#ff6d75]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Heart
                        key={i}
                        className={`w-4 h-4 ${
                          i < item.rating
                            ? "fill-[#ff6d75] text-[#ff6d75]"
                            : "text-zinc-600 fill-zinc-800/40"
                        }`}
                      />
                    ))}
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Buyer
                  </span>
                </div>

                {/* Review Text */}
                <p className="text-white/80 text-sm leading-relaxed font-sans line-clamp-4">
                  "{item.comment}"
                </p>
              </div>

              {/* Card Bottom: Customer & Location from Address */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white tracking-wide">
                    {item.customer_name}
                  </span>
                  {item.product_name && (
                    <span className="text-[11px] text-white/40 truncate max-w-[150px] font-mono">
                      {item.product_name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-white/50 font-mono">
                  <MapPin className="w-3 h-3 text-white/40 shrink-0" />
                  <span>
                    {item.customer_city}
                    {item.customer_state ? `, ${item.customer_state}` : ""}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global CSS keyframe animation for Left-to-Right Marquee */}
      <style jsx global>{`
        @keyframes reviews-marquee-ltr {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }
      `}</style>
    </section>
  );
}
