"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";

export type CraftCard = {
  id?: string;
  title: string;
  subtitle?: string;
  description: string;
  skeleton?: React.ReactNode;
  className?: string;
  config?: {
    y?: number;
    x?: number;
    rotate?: number;
    zIndex?: number;
  };
};

export type SpringConfig = {
  type: "spring";
  bounce?: number;
  visualDuration?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
};

export interface InterfaceCraftCardsProps {
  cards: CraftCard[];
  spring?: SpringConfig;
  activeScale?: number;
  cardSpacing?: number;
  className?: string;
}

const defaultSpring: SpringConfig = {
  type: "spring",
  visualDuration: 0.6,
  bounce: 0.25,
};

export const InterfaceCraftCards = ({
  cards,
  spring = defaultSpring,
  activeScale = 1.15,
  cardSpacing = 180,
  className,
}: InterfaceCraftCardsProps) => {
  const [active, setActive] = useState<CraftCard | null>(null);
  const [spacing, setSpacing] = useState(cardSpacing);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setActive(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () =>
      setSpacing(mq.matches ? cardSpacing : Math.round(cardSpacing * 0.39));
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [cardSpacing]);

  const middle = (cards.length - 1) / 2;

  const isAnyCardActive = () => Boolean(active?.title);
  const isCurrentActive = (card: CraftCard) => active?.title === card.title;

  return (
    <div className={cn("relative flex h-full w-full items-center justify-center overflow-hidden", className)}>
      <motion.div
        ref={ref}
        onClick={() => setActive(null)}
        className="relative mx-auto flex h-120 w-full max-w-5xl items-center justify-center [--height:300px] [--width:220px] lg:[--height:400px] lg:[--width:300px]"
      >
        {cards.map((card, index) => {
          const offsetX = (index - middle) * spacing;
          const config = card.config || {
            y: index % 2 === 0 ? -20 : 20,
            rotate: (index % 3 - 1) * 8,
            zIndex: index + 2,
          };

          return (
            <motion.div key={card.id || card.title}>
              <motion.button
                type="button"
                initial={{
                  x: 0,
                  scale: 0,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(isCurrentActive(card) ? null : card);
                }}
                animate={{
                  y: isCurrentActive(card)
                    ? 0
                    : isAnyCardActive()
                      ? 400
                      : (config.y ?? 0),
                  x: isCurrentActive(card)
                    ? 0
                    : isAnyCardActive()
                      ? offsetX * 0.4
                      : offsetX,
                  rotate: isCurrentActive(card)
                    ? 0
                    : isAnyCardActive()
                      ? 0.2 * (config.rotate ?? 0)
                      : (config.rotate ?? 0),
                  scale: isCurrentActive(card)
                    ? activeScale
                    : isAnyCardActive()
                      ? 0.7
                      : 1,
                }}
                whileHover={{
                  scale: isCurrentActive(card)
                    ? activeScale
                    : isAnyCardActive()
                      ? 0.7
                      : 1.05,
                }}
                transition={spring}
                style={{
                  width: `var(--width)`,
                  height: `var(--height)`,
                  marginLeft: `calc(var(--width) / -2)`,
                  marginTop: `calc(var(--height) / -2)`,
                  zIndex: isCurrentActive(card) ? 50 : config.zIndex,
                }}
                className={cn(
                  "absolute top-1/2 left-1/2 flex cursor-pointer flex-col items-start justify-between overflow-hidden rounded-2xl p-3 md:p-5 text-left border border-white/10",
                  card.className || "bg-neutral-900 text-white",
                )}
              >
                {card.skeleton}
                <div className="mt-4 w-full">
                  <motion.h2
                    layoutId={(card.id || card.title) + "-title"}
                    className="font-display uppercase tracking-wider text-base md:text-xl font-bold"
                  >
                    {card.title}
                  </motion.h2>
                  {card.subtitle && (
                    <p className="text-xs text-white/50 font-mono mt-0.5">
                      {card.subtitle}
                    </p>
                  )}
                  <AnimatePresence mode="popLayout">
                    {isCurrentActive(card) && (
                      <motion.p
                        layoutId={(card.id || card.title) + "-desc"}
                        initial={{ opacity: 0, x: 20, y: 20, height: 0 }}
                        animate={{ opacity: 1, x: 0, y: 0, height: "auto" }}
                        exit={{ opacity: 0, x: 20, y: 20, height: 0 }}
                        transition={spring}
                        className="mt-3 text-left text-xs sm:text-sm text-white/80 leading-relaxed font-sans"
                      >
                        {card.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default InterfaceCraftCards;
