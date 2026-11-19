"use client";

import React, { useState, useEffect, useRef, HTMLAttributes } from "react";

// A simple utility for conditional class names
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

// Define the type for a single gallery item
export interface GalleryItem {
  common: string;
  binomial: string;
  photo: {
    url: string;
    text: string;
    pos?: string;
    by: string;
  };
}

// Define the props for the CircularGallery component
export interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  /** Controls how far the items are from the center. */
  radius?: number;
  /** Controls the speed of auto-rotation when not scrolling. */
  autoRotateSpeed?: number;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius: customRadius, autoRotateSpeed = 0.04, ...props }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [isInteracting, setIsInteracting] = useState(false);
    const [calculatedRadius, setCalculatedRadius] = useState(customRadius || 520);
    const [isMobile, setIsMobile] = useState(false);

    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const startRotationRef = useRef(0);

    // Responsive radius calculation
    useEffect(() => {
      const updateRadius = () => {
        const width = window.innerWidth;
        setIsMobile(width < 768);
        if (customRadius) {
          setCalculatedRadius(customRadius);
        } else {
          if (width < 480) {
            setCalculatedRadius(280);
          } else if (width < 768) {
            setCalculatedRadius(360);
          } else if (width < 1024) {
            setCalculatedRadius(460);
          } else {
            setCalculatedRadius(560);
          }
        }
      };

      updateRadius();
      window.addEventListener("resize", updateRadius);
      return () => window.removeEventListener("resize", updateRadius);
    }, [customRadius]);

    // Effect to handle scroll-based rotation
    useEffect(() => {
      const handleScroll = () => {
        setIsInteracting(true);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
        const scrollRotation = scrollProgress * 360 * 1.5;
        setRotation((prev) => (isDraggingRef.current ? prev : scrollRotation));

        scrollTimeoutRef.current = setTimeout(() => {
          setIsInteracting(false);
        }, 180);
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, []);

    // Effect for auto-rotation when not scrolling or dragging
    useEffect(() => {
      const autoRotate = () => {
        if (!isInteracting && !isDraggingRef.current) {
          setRotation((prev) => prev + autoRotateSpeed);
        }
        animationFrameRef.current = requestAnimationFrame(autoRotate);
      };

      animationFrameRef.current = requestAnimationFrame(autoRotate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isInteracting, autoRotateSpeed]);

    // Drag / Touch gestures for seamless interactive spinning
    const handleTouchStart = (e: React.TouchEvent) => {
      isDraggingRef.current = true;
      setIsInteracting(true);
      startXRef.current = e.touches[0].clientX;
      startRotationRef.current = rotation;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.touches[0].clientX - startXRef.current;
      setRotation(startRotationRef.current + deltaX * 0.4);
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      setTimeout(() => setIsInteracting(false), 200);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      isDraggingRef.current = true;
      setIsInteracting(true);
      startXRef.current = e.clientX;
      startRotationRef.current = rotation;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - startXRef.current;
      setRotation(startRotationRef.current + deltaX * 0.35);
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setTimeout(() => setIsInteracting(false), 200);
    };

    if (!items || items.length === 0) return null;

    const anglePerItem = 360 / items.length;
    const cardWidth = isMobile ? 220 : 280;
    const cardHeight = isMobile ? 310 : 390;

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Circular 3D Gallery"
        className={cn(
          "relative w-full h-full flex items-center justify-center select-none cursor-grab active:cursor-grabbing overflow-visible",
          className
        )}
        style={{ perspective: isMobile ? "1200px" : "2000px" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        {...props}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          {items.map((item, i) => {
            const itemAngle = i * anglePerItem;
            const totalRotation = rotation % 360;
            const relativeAngle = (itemAngle + totalRotation + 360) % 360;
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
            const opacity = Math.max(0.25, 1 - normalizedAngle / 180);

            return (
              <div
                key={`${item.photo.url}-${i}`}
                role="group"
                aria-label={item.common}
                className="absolute"
                style={{
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  transform: `rotateY(${itemAngle}deg) translateZ(${calculatedRadius}px)`,
                  left: "50%",
                  top: "50%",
                  marginLeft: `-${cardWidth / 2}px`,
                  marginTop: `-${cardHeight / 2}px`,
                  opacity: opacity,
                  transition: "opacity 0.25s linear",
                  backfaceVisibility: "hidden",
                }}
              >
                <div className="relative w-full h-full rounded-2xl shadow-2xl overflow-hidden group border border-white/15 bg-neutral-900/80 backdrop-blur-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.photo.url}
                    alt={item.photo.text}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                    style={{ objectPosition: item.photo.pos || "center" }}
                    loading="lazy"
                  />
                  {/* Gradient shadow for typography readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                  <div className="absolute bottom-0 left-0 w-full p-4 md:p-5 text-white pointer-events-none">
                    {item.photo.by ? (
                      <span className="inline-block text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 mb-1.5">
                        {item.photo.by}
                      </span>
                    ) : null}
                    {item.common ? (
                      <h3 className="text-base md:text-lg font-bold tracking-tight text-white leading-tight">
                        {item.common}
                      </h3>
                    ) : null}
                    {item.binomial ? (
                      <p className="text-xs md:text-sm uppercase tracking-wider text-white/80 font-mono mt-0.5 truncate">
                        {item.binomial}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

CircularGallery.displayName = "CircularGallery";

export { CircularGallery };
