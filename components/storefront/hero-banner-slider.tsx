"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import type { HeroBannerConfig, HeroBannerSlide } from "@/lib/hero-banner";

interface HeroBannerSliderProps {
  banner: HeroBannerConfig;
}

export function HeroBannerSlider({ banner }: HeroBannerSliderProps) {
  // Extract slides from banner; fallback to single slide if no slides array
  const slides: HeroBannerSlide[] =
    banner.slides && banner.slides.length > 0
      ? banner.slides
      : [
          {
            id: "1",
            desktop_url: banner.desktop_url,
            mobile_url: banner.mobile_url,
            alt_text: banner.alt_text,
          },
        ];

  const total = slides.length;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIdx((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goToSlide = (idx: number) => {
    setCurrentIdx(idx);
  };

  // Auto-advance loop timer
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // 5 seconds per slide

    return () => clearInterval(interval);
  }, [total, isPaused, nextSlide]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // min swipe distance in px

    if (diff > threshold) {
      // Swiped left -> next slide
      nextSlide();
    } else if (diff < -threshold) {
      // Swiped right -> prev slide
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section
      className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Hero Carousel"
    >
      {/* ── Slide Images ────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => {
          const isActive = index === currentIdx;
          const isNext = index === (currentIdx + 1) % total;
          const alt = slide.alt_text || banner.alt_text || `6XTN Hero ${index + 1}`;

          return (
            <div
              key={slide.id || index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
              aria-hidden={!isActive}
            >
              {/* Desktop Screen View (16:9 Landscape) */}
              <div className="hidden md:block absolute inset-0">
                <Image
                  src={slide.desktop_url || slide.mobile_url}
                  alt={alt}
                  fill
                  className="object-cover opacity-60"
                  priority={index === 0}
                  loading={index === 0 || isNext ? "eager" : "lazy"}
                  sizes="100vw"
                />
              </div>

              {/* Mobile Screen View (9:16 Portrait) */}
              <div className="block md:hidden absolute inset-0">
                <Image
                  src={slide.mobile_url || slide.desktop_url}
                  alt={alt}
                  fill
                  className="object-cover opacity-60"
                  priority={index === 0}
                  loading={index === 0 || isNext ? "eager" : "lazy"}
                  sizes="100vw"
                />
              </div>
            </div>
          );
        })}

        {/* Cinematic dark vignette / gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black pointer-events-none z-20" />
      </div>

      {/* ── Navigation Indicators (Shown when multiple slides exist) ── */}
      {total > 1 && (
        <div className="absolute bottom-10 left-0 right-0 z-30 flex items-center justify-center gap-2.5 px-4 pointer-events-auto">
          {slides.map((_, idx) => {
            const isActive = idx === currentIdx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1} of ${total}`}
                className={`group relative h-1.5 transition-all duration-300 rounded-full cursor-pointer touch-manipulation p-0 border-0 outline-none ${
                  isActive
                    ? "w-8 sm:w-10 bg-white"
                    : "w-2.5 sm:w-3 bg-white/30 hover:bg-white/60"
                }`}
              >
                <span className="sr-only">Slide {idx + 1}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
