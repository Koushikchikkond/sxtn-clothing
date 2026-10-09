"use client";

import React, { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { useWishlistStore } from "@/lib/stores/wishlist.store";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  productName?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function WishlistButton({
  productId,
  productName,
  className,
  size = "md",
}: WishlistButtonProps) {
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(productId));
  const toggle = useWishlistStore((s) => s.toggle);
  const syncWithAccount = useWishlistStore((s) => s.syncWithAccount);

  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    syncWithAccount();
  }, [syncWithAccount]);

  const active = mounted && isInWishlist;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    const { added, isGuest } = await toggle(productId);

    if (added) {
      if (isGuest) {
        setToastMsg("Saved to Wishlist • Sign in to sync");
      } else {
        setToastMsg("Saved to Wishlist");
      }
    } else {
      setToastMsg("Removed from Wishlist");
    }

    setTimeout(() => {
      setToastMsg(null);
    }, 2400);
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-9 w-9 sm:h-10 sm:w-10",
    lg: "h-11 w-11 sm:h-12 sm:w-12",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-4.5 w-4.5 sm:h-5 sm:w-5",
    lg: "h-5 w-5 sm:h-6 sm:w-6",
  };

  return (
    <div
      className={cn("relative z-20 inline-flex items-center justify-center", className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label={active ? "Remove from Wishlist" : "Save to Wishlist"}
        aria-pressed={active}
        title={active ? "Saved to Wishlist" : "Save to Wishlist"}
        className={cn(
          "rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer touch-manipulation",
          "bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/15",
          "shadow-lg active:scale-90",
          sizeClasses[size],
          animating && "scale-110",
          active && "border-white/30 bg-black/70"
        )}
      >
        <Bookmark
          className={cn(
            "transition-all duration-200 stroke-[1.8]",
            iconSizes[size],
            active
              ? "fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              : "text-white/80 hover:text-white"
          )}
        />
      </button>

      {/* Floating mini-toast notification */}
      {toastMsg && (
        <div
          className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap bg-zinc-950/95 text-white border border-white/20 text-[11px] font-medium tracking-wide uppercase px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 z-50"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
