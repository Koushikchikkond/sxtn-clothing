/**
 * Cart Flight Animation
 *
 * Uses the 21st.dev createArcMixer quadratic Bezier trajectory engine
 * to fly a product tile along a parabolic arc directly into the shopping bag icon,
 * followed by a spring velocity impact on the cart button and a ripple ping ring.
 */

import { animate } from "motion/react";
import { createArcMixer } from "@/components/ui/motion-add-to-basket";

export function getVisibleCartElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;

  const selectors = [
    "#desktop-cart-btn",
    "#mobile-cart-btn",
    "#bottom-cart-btn",
    "[data-cart-icon='true']",
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el instanceof HTMLElement) {
      const rect = el.getBoundingClientRect();
      // Ensure the button is visible and on screen
      if (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.top >= -20 &&
        rect.bottom <= window.innerHeight + 20
      ) {
        return el;
      }
    }
  }

  return null;
}

export interface FlyToCartOptions {
  startElement?: HTMLElement | null;
  imageUrl?: string;
  onImpact?: () => void;
  onComplete?: () => void;
}

export async function flyProductToBasket({
  startElement,
  imageUrl,
  onImpact,
  onComplete,
}: FlyToCartOptions): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    onImpact?.();
    onComplete?.();
    return;
  }

  const targetEl = getVisibleCartElement();

  // Determine starting rectangle
  let fromRect: { left: number; top: number; width: number; height: number };
  if (startElement && startElement instanceof HTMLElement) {
    const r = startElement.getBoundingClientRect();
    fromRect = { left: r.left, top: r.top, width: r.width, height: r.height };
  } else {
    // Default to center of screen
    fromRect = {
      left: window.innerWidth / 2 - 50,
      top: window.innerHeight / 2 - 60,
      width: 100,
      height: 120,
    };
  }

  // Determine target destination rectangle
  let toRect: { left: number; top: number; width: number; height: number };
  if (targetEl) {
    const r = targetEl.getBoundingClientRect();
    toRect = { left: r.left, top: r.top, width: r.width, height: r.height };
  } else {
    // Top-right fallback
    toRect = {
      left: window.innerWidth - 56,
      top: 24,
      width: 36,
      height: 36,
    };
  }

  const startCenter = {
    x: fromRect.left + fromRect.width / 2,
    y: fromRect.top + fromRect.height / 2,
  };
  const targetCenter = {
    x: toRect.left + toRect.width / 2,
    y: toRect.top + toRect.height / 2,
  };

  const dx = targetCenter.x - startCenter.x;
  const dy = targetCenter.y - startCenter.y;

  // Build flying thumbnail node
  const flyerWidth = 84;
  const flyerHeight = 104;
  const flyer = document.createElement("div");
  flyer.className = "fly-to-cart-particle";
  flyer.style.position = "fixed";
  flyer.style.width = `${flyerWidth}px`;
  flyer.style.height = `${flyerHeight}px`;
  flyer.style.left = `${startCenter.x - flyerWidth / 2}px`;
  flyer.style.top = `${startCenter.y - flyerHeight / 2}px`;
  flyer.style.backgroundColor = "#18181b";
  flyer.style.borderRadius = "12px";
  flyer.style.border = "1.5px solid rgba(255, 255, 255, 0.45)";
  flyer.style.boxShadow =
    "0 18px 45px rgba(0, 0, 0, 0.8), 0 0 16px rgba(255, 255, 255, 0.25)";
  flyer.style.overflow = "hidden";
  flyer.style.pointerEvents = "none";
  flyer.style.zIndex = "99999";
  flyer.style.willChange = "transform, opacity";

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "Adding to bag";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    flyer.appendChild(img);
  } else {
    const span = document.createElement("span");
    span.innerText = "👕";
    span.style.fontSize = "2.8rem";
    span.style.display = "flex";
    span.style.alignItems = "center";
    span.style.justifyContent = "center";
    span.style.height = "100%";
    flyer.appendChild(span);
  }

  document.body.appendChild(flyer);

  // Trajectory using 21st.dev arc mixer
  const mix = createArcMixer({
    strength: 0.55,
    peak: 0.18,
    rotate: 0.85,
  });
  const path = mix({ x: 0, y: 0 }, { x: dx, y: dy });

  // Animate flight
  await animate(0, 1, {
    duration: 0.48,
    ease: [0.74, 0.18, 0.93, 0.69],
    onUpdate: (progress) => {
      const point = path(progress);
      const scale = 1 + (0.24 - 1) * progress; // scales down to 24% size as it lands in bag
      const opacity = progress < 0.92 ? 1 : 1 - (progress - 0.92) / 0.08;

      flyer.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) scale(${scale}) rotate(${
        point.rotate || 0
      }deg)`;
      flyer.style.opacity = String(opacity);
    },
  });

  flyer.remove();

  // Impact: trigger callback (updates cart item count / state)
  onImpact?.();

  // Impact: spring bounce on the target cart button + ripple ping ring
  if (targetEl) {
    try {
      targetEl.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.35) rotate(-6deg)" },
          { transform: "scale(0.92) rotate(4deg)" },
          { transform: "scale(1.08)" },
          { transform: "scale(1)" },
        ],
        { duration: 420, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" }
      );

      // Ripple ping
      const ping = document.createElement("div");
      ping.style.position = "absolute";
      ping.style.inset = "-6px";
      ping.style.borderRadius = "50%";
      ping.style.border = "2px solid #ffffff";
      ping.style.pointerEvents = "none";
      ping.style.zIndex = "100";
      targetEl.style.position = "relative";
      targetEl.appendChild(ping);

      ping.animate(
        [
          { transform: "scale(0.8)", opacity: 0.9 },
          { transform: "scale(2.2)", opacity: 0 },
        ],
        { duration: 480, easing: "ease-out" }
      ).onfinish = () => {
        ping.remove();
      };
    } catch {
      // Graceful fallback if Web Animations API unavailable
    }
  }

  onComplete?.();
}
