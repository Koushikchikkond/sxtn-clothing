"use client";

import React from "react";
import { CoverflowCarousel, CoverflowSlide } from "@/components/ui/coverflow-carousel";
import type { CommunityGalleryConfig } from "@/lib/community-gallery";
import { Instagram } from "lucide-react";

interface CommunityGallerySectionProps {
  config: CommunityGalleryConfig;
}

const FALLBACK_STREETWEAR_SLIDES: CoverflowSlide[] = [
  {
    src: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=640&h=640&fit=crop&q=80&auto=format",
    alt: "Customer wearing oversized streetwear drop",
    title: "Oversized Silhouette",
    subtitle: "Heavyweight 280 GSM",
  },
  {
    src: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=640&h=640&fit=crop&q=80&auto=format",
    alt: "Boxy fit street style drop",
    title: "Boxy Fit Tee",
    subtitle: "Raw Cut & Sew",
  },
  {
    src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=640&h=640&fit=crop&q=80&auto=format",
    alt: "Minimal streetwear look",
    title: "Shadow Black Drop",
    subtitle: "Limited Collection",
  },
  {
    src: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=640&h=640&fit=crop&q=80&auto=format",
    alt: "Streetwear community feature",
    title: "Fleece Hood Drop",
    subtitle: "French Terry Lining",
  },
  {
    src: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=640&h=640&fit=crop&q=80&auto=format",
    alt: "6XTN Urban aesthetic",
    title: "Pure Monochrome",
    subtitle: "Edition Drop",
  },
];

export function CommunityGallerySection({ config }: CommunityGallerySectionProps) {
  const rawItems = config?.items || [];
  let userSlides: CoverflowSlide[] = rawItems
    .filter((it) => Boolean(it.image_url))
    .map((it) => ({
      src: it.image_url,
      alt: it.customer_name ? `${it.customer_name} wearing ${it.tshirt_name || "6XTN"}` : "6XTN Customer Drop",
      title: it.customer_name || "6XTN COMMUNITY",
      subtitle: it.tshirt_name || "Streetwear Drop",
      meta: it.caption ? [{ label: "Note", value: it.caption }] : undefined,
    }));

  const activeSlides = userSlides.length > 0 ? userSlides : FALLBACK_STREETWEAR_SLIDES;

  // Pad slides if fewer than 5 so the 3D coverflow ring wraps gracefully
  let paddedSlides = [...activeSlides];
  while (paddedSlides.length < 5 && paddedSlides.length > 0) {
    paddedSlides = [...paddedSlides, ...activeSlides];
  }

  return (
    <section className="relative w-full bg-black py-20 md:py-28 overflow-hidden border-t border-white/10">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[320px] bg-white/[0.03] blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center mb-8 md:mb-12">
        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-white">
          {config?.title || "WORN BY YOU"}
        </h2>

        <p className="mt-3 text-sm md:text-base text-white/60 max-w-xl mx-auto font-sans leading-relaxed">
          {config?.subtitle || "Real drops on real people. Tag @6xtn.in on Instagram to get featured."}
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-white/40 font-mono">
          <span>← Swipe or drag cards →</span>
        </div>
      </div>

      {/* Coverflow 3D Card Slide Animation */}
      <div className="relative w-full overflow-hidden flex flex-col items-center justify-center">
        <CoverflowCarousel
          slides={paddedSlides}
          rotate={42}
          depth={0.65}
          perspective={3}
          falloff={0.55}
          fade={0.12}
          cardWidth="clamp(200px, 28vw, 320px)"
          gap={0.06}
          loop={true}
          showCaption={true}
          showPagination={true}
          showNavigation={true}
        />
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

export default CommunityGallerySection;
