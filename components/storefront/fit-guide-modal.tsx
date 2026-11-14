"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Info, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Cloudflare R2 Public URL with local fallback
const R2_IMAGE_URL = "https://pub-424a99ce2b4c4f80be87dfa7907a0911.r2.dev/site/fit-guide-boxy-vs-regular.webp";
const LOCAL_FALLBACK_URL = "/images/fit-guide.webp";

interface FitGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  mode?: "confirm" | "view";
  selectedSize?: string | null;
}

export function FitGuideModal({
  isOpen,
  onClose,
  onConfirm,
  mode = "confirm",
  selectedSize,
}: FitGuideModalProps) {
  const [imgSrc, setImgSrc] = useState(R2_IMAGE_URL);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmMode = mode === "confirm" && typeof onConfirm === "function";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fit-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md bg-[#111111] border border-white/15 rounded-sm p-5 sm:p-6 text-white shadow-2xl overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Title and Close 'X' Button */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-white/80" />
            <h3
              id="fit-guide-title"
              className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-white"
            >
              Fit Note: Boxy vs Regular
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close fit guide"
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-sm transition-colors touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reference Image from Cloudflare R2 */}
        <div className="relative w-full aspect-[2/1] bg-white rounded-sm overflow-hidden mb-4 border border-white/10">
          <Image
            src={imgSrc}
            alt="Regular Fit vs Boxy Fit Silhouette Guide"
            fill
            sizes="(max-width: 640px) 90vw, 420px"
            className="object-contain"
            priority
            onError={() => {
              if (imgSrc !== LOCAL_FALLBACK_URL) {
                setImgSrc(LOCAL_FALLBACK_URL);
              }
            }}
          />
        </div>

        {/* Fit Explanation Notice */}
        <div className="space-y-2 mb-5 text-xs sm:text-sm text-sxtn-gray-200 leading-relaxed font-normal">
          <p>
            Our t-shirts are designed with a signature{" "}
            <strong className="text-white font-semibold">Boxy Fit</strong> — cut with
            dropped shoulders, a wider chest, and a relaxed streetwear drape.
          </p>
          <p className="text-white/60 text-[11px] sm:text-xs">
            💡 <strong className="text-white/90">Sizing tip:</strong> If you prefer a traditional fitted/standard silhouette, we recommend choosing one size smaller.
            {selectedSize && (
              <span className="block mt-1 text-white font-mono text-xs">
                Selected size: <span className="underline font-bold text-white">{selectedSize}</span>
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons: Understood */}
        <div className="flex items-center gap-3">
          {isConfirmMode ? (
            <button
              type="button"
              onClick={() => {
                onConfirm?.();
                onClose();
              }}
              style={{ WebkitTapHighlightColor: "transparent" }}
              className="flex-1 h-12 flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90 font-display font-bold text-xs sm:text-sm tracking-widest uppercase transition-colors rounded-sm"
            >
              <Check className="w-4 h-4" />
              Understood &amp; Add to Bag
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              style={{ WebkitTapHighlightColor: "transparent" }}
              className="flex-1 h-12 flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90 font-display font-bold text-xs sm:text-sm tracking-widest uppercase transition-colors rounded-sm"
            >
              <Check className="w-4 h-4" />
              Understood
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="h-12 px-4 border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-display font-bold text-xs sm:text-sm tracking-wider uppercase transition-colors rounded-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
