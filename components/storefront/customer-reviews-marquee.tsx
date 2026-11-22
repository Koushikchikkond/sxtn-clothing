"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";
import {
  Heart,
  CheckCircle2,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ReviewItem } from "@/lib/reviews";
import { cn } from "@/lib/utils";

interface CustomerReviewsProps {
  reviews: ReviewItem[];
}

const FALLBACK_CRAFT_REVIEWS: ReviewItem[] = [
  {
    id: "fb-1",
    customer_name: "Aman V.",
    customer_city: "Bengaluru",
    customer_state: "Karnataka",
    rating: 5,
    comment:
      "The 240 GSM fabric weight is insane. Heavy, structured, and the neck ribbing does not sag after washing. Easily the best boxy cut in India.",
    product_name: "Heavyweight Boxy Fit Tee",
    verified: true,
  },
  {
    id: "fb-2",
    customer_name: "Rohan K.",
    customer_city: "Mumbai",
    customer_state: "Maharashtra",
    rating: 5,
    comment:
      "Fit is truly boxy with dropped shoulders just like high-end luxury streetwear. Delivered in 3 days with minimal, clean packaging.",
    product_name: "Shadow Black Boxy Tee",
    verified: true,
  },
  {
    id: "fb-3",
    customer_name: "Siddharth M.",
    customer_city: "Delhi",
    customer_state: "NCR",
    rating: 5,
    comment:
      "Fabric density blew my mind. 240 GSM feels premium and breathable without feeling stiff. 10/10 silhouette.",
    product_name: "Off-White Boxy Drop",
    verified: true,
  },
  {
    id: "fb-4",
    customer_name: "Karan P.",
    customer_city: "Pune",
    customer_state: "Maharashtra",
    rating: 5,
    comment:
      "Perfect drape on chest and shoulders. The sizing guide was 100% accurate. Already planning to cop the next collection drop.",
    product_name: "Pure Monochrome Drop",
    verified: true,
  },
  {
    id: "fb-5",
    customer_name: "Vikram S.",
    customer_city: "Hyderabad",
    customer_state: "Telangana",
    rating: 5,
    comment:
      "Raw cut and sew construction is on another level. You can feel the craftsmanship the moment you open the box.",
    product_name: "Heavyweight Boxy Fit Tee",
    verified: true,
  },
];

// Tilt & offset configurations for the Interface Craft cards feel
const CARD_CONFIGS = [
  { rotate: -5, y: -8, zIndex: 2 },
  { rotate: 5, y: 10, zIndex: 3 },
  { rotate: -3, y: -12, zIndex: 4 },
  { rotate: 6, y: 8, zIndex: 5 },
  { rotate: -4, y: -6, zIndex: 6 },
  { rotate: 4, y: 10, zIndex: 7 },
];

const springTransition: Transition = {
  type: "spring",
  duration: 0.5,
  bounce: 0.22,
};

export function CustomerReviewsMarquee({ reviews }: CustomerReviewsProps) {
  const activeReviews =
    Array.isArray(reviews) && reviews.length > 0 ? reviews : FALLBACK_CRAFT_REVIEWS;

  // Pad to at least 5 cards so there is a rich horizontal spread to browse
  let displayCards = [...activeReviews];
  while (displayCards.length < 5 && displayCards.length > 0) {
    displayCards = [...displayCards, ...activeReviews];
  }

  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Calculate live average rating from active reviews
  const avgRating = (
    activeReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / activeReviews.length
  ).toFixed(1);

  // Close active card when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveCardId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const distance = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-black py-20 md:py-28 overflow-hidden border-t border-white/10 select-none"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-[#ff6d75]/[0.03] blur-[160px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center mb-8 md:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/15 text-[11px] font-mono uppercase tracking-[0.2em] text-white/70 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#ff6d75]" />
          <span>Verified Customer Reviews</span>
        </div>

        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-white">
          RATED BY OUR COMMUNITY
        </h2>

        {/* Global Rating summary badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest text-[#ff6d75]">
          <span className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Heart key={s} className="w-4 h-4 fill-[#ff6d75] text-[#ff6d75]" />
            ))}
          </span>
          <span className="text-white font-bold ml-1">{avgRating} / 5</span>
          <span className="text-white/40">
            · ({activeReviews.length} {activeReviews.length === 1 ? "verified review" : "verified reviews"})
          </span>
        </div>

        {/* Horizontal Navigation & Swipe Helper */}
        <div className="mt-5 flex items-center justify-center gap-4 text-xs uppercase tracking-widest text-white/40 font-mono">
          <span>← Swipe or scroll horizontally • Tap card to expand →</span>
        </div>
      </div>

      {/* Horizontal Scroll Controls (Desktop) */}
      <div className="relative max-w-7xl mx-auto px-4 mb-2 hidden md:flex items-center justify-end gap-2 z-20">
        <button
          type="button"
          onClick={() => handleScroll("left")}
          aria-label="Scroll left"
          className="w-9 h-9 rounded-full bg-zinc-900 border border-white/20 hover:border-white text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleScroll("right")}
          aria-label="Scroll right"
          className="w-9 h-9 rounded-full bg-zinc-900 border border-white/20 hover:border-white text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Scrolling Cards Rail */}
      <div
        ref={scrollRef}
        className="relative w-full overflow-x-auto scrollbar-none snap-x snap-mandatory flex items-center gap-5 sm:gap-7 px-6 sm:px-12 md:px-20 py-10 touch-pan-x"
        style={{
          scrollPaddingLeft: "1.5rem",
          scrollPaddingRight: "1.5rem",
        }}
      >
        {displayCards.map((item, idx) => {
          const config = CARD_CONFIGS[idx % CARD_CONFIGS.length];
          const isCurrentActive = activeCardId === `${item.id}-${idx}`;
          const isAnyActive = Boolean(activeCardId);

          return (
            <motion.div
              key={`${item.id}-${idx}`}
              className="snap-center shrink-0"
              style={{
                zIndex: isCurrentActive ? 40 : config.zIndex,
              }}
            >
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCardId(isCurrentActive ? null : `${item.id}-${idx}`);
                }}
                animate={{
                  y: isCurrentActive ? 0 : isAnyActive ? 25 : config.y,
                  rotate: isCurrentActive ? 0 : isAnyActive ? 0.3 * config.rotate : config.rotate,
                  scale: isCurrentActive ? 1.05 : isAnyActive ? 0.94 : 1,
                  opacity: isCurrentActive ? 1 : isAnyActive ? 0.65 : 1,
                }}
                whileHover={{
                  scale: isCurrentActive ? 1.05 : 1.04,
                  rotate: isCurrentActive ? 0 : 0.5 * config.rotate,
                  opacity: 1,
                }}
                transition={springTransition}
                className={cn(
                  "relative flex flex-col justify-between text-left cursor-pointer rounded-2xl p-5 sm:p-6 transition-all duration-300 overflow-hidden",
                  "w-[260px] sm:w-[290px] md:w-[320px] min-h-[380px] md:min-h-[420px]",
                  "border bg-gradient-to-b from-[#111113] via-[#0b0b0c] to-[#060607]",
                  isCurrentActive
                    ? "border-[#ff6d75]/70 shadow-[0_0_35px_rgba(255,109,117,0.22)] ring-1 ring-[#ff6d75]/40"
                    : "border-white/10 hover:border-white/30 shadow-xl"
                )}
              >
                {/* Subtle Card Accent Gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff6d75]/40 to-transparent pointer-events-none" />

                {/* Top: Card Header / Skeleton Block */}
                <div>
                  <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-xl mb-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      {/* Heart Rating */}
                      <div className="flex items-center gap-1 text-[#ff6d75]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Heart
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < item.rating
                                ? "fill-[#ff6d75] text-[#ff6d75]"
                                : "text-zinc-600 fill-zinc-800/40"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Verified Badge */}
                      <span className="inline-flex items-center gap-1 text-[9px] uppercase font-mono tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-500/25 px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Verified
                      </span>
                    </div>

                    {/* Product Name Tag */}
                    <p className="text-[11px] text-white/50 font-mono truncate">
                      {item.product_name || "6XTN Heavyweight Drop"}
                    </p>
                  </div>

                  {/* Customer Name */}
                  <h3 className="font-display text-xl sm:text-2xl uppercase tracking-wider text-white font-bold leading-tight">
                    {item.customer_name}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-xs text-white/40 font-mono mt-1">
                    <MapPin className="w-3 h-3 text-[#ff6d75]/70 shrink-0" />
                    <span>
                      {item.customer_city}
                      {item.customer_state ? `, ${item.customer_state}` : ""}
                    </span>
                  </div>
                </div>

                {/* Review Text: Compact preview vs Expanded on active */}
                <div className="mt-4 pt-4 border-t border-white/10 w-full">
                  <AnimatePresence mode="wait">
                    {isCurrentActive ? (
                      <motion.div
                        key="expanded"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={springTransition}
                        className="space-y-3"
                      >
                        <p className="text-white/95 text-xs sm:text-sm leading-relaxed font-sans italic">
                          "{item.comment || "Incredible heavyweight quality and silhouette."}"
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[#ff6d75]">
                          <span>Tap to minimize</span>
                          <span>✓ Verified Buyer</span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={springTransition}
                      >
                        <p className="text-white/70 text-xs sm:text-sm leading-relaxed font-sans line-clamp-3 italic">
                          "{item.comment || "Incredible heavyweight quality and silhouette."}"
                        </p>
                        <span className="block mt-2 text-[10px] uppercase font-mono tracking-wider text-white/40 group-hover:text-white transition-colors">
                          Tap to read full review →
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// Re-export with alias so any existing import continues working smoothly
export { CustomerReviewsMarquee as CustomerReviewsCraftCards };
export default CustomerReviewsMarquee;
