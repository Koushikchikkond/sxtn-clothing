"use client";

import React from "react";
import { CircularGallery, GalleryItem } from "@/components/ui/circular-gallery";
import type { CommunityGalleryConfig } from "@/lib/community-gallery";
import { Sparkles, Instagram } from "lucide-react";

interface CommunityGallerySectionProps {
  config: CommunityGalleryConfig;
}

export function CommunityGallerySection({ config }: CommunityGallerySectionProps) {
  if (!config.items || config.items.length === 0) return null;

  const galleryItems: GalleryItem[] = config.items.map((it) => ({
    common: it.customer_name || "",
    binomial: it.tshirt_name || "",
    photo: {
      url: it.image_url,
      text: `${it.customer_name || ""} ${it.tshirt_name || ""}`.trim() || "Customer wearing 6XTN",
      pos: "center",
      by: it.caption || "",
    },
  }));

  return (
    <section className="relative w-full bg-black py-20 md:py-28 overflow-hidden border-t border-white/10">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-white/[0.03] blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center mb-12 md:mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/5 text-[11px] uppercase tracking-widest text-white/80 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-white/70" />
          <span>{config.hashtag || "#6XTN COMMUNITY"}</span>
        </div>

        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-white">
          {config.title || "WORN BY YOU"}
        </h2>

        <p className="mt-3 text-sm md:text-base text-white/60 max-w-xl mx-auto font-sans">
          {config.subtitle || "Real drops on real people. Tag @6xtn.in on Instagram to get featured."}
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-white/40 font-mono">
          <span>← Drag or scroll to rotate →</span>
        </div>
      </div>

      {/* 3D Circular Animated Stage */}
      <div className="relative w-full h-[420px] sm:h-[480px] md:h-[540px] flex items-center justify-center overflow-visible">
        <CircularGallery items={galleryItems} autoRotateSpeed={0.03} />
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 text-center">
        <a
          href="https://instagram.com/6xtn.in"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/70 hover:text-white transition-colors border border-white/20 hover:border-white px-5 py-2.5 rounded-full"
        >
          <Instagram className="w-4 h-4" />
          <span>Follow @6xtn.in</span>
        </a>
      </div>
    </section>
  );
}
