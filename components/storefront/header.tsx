"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ShoppingBag, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/stores/cart.store";

const NAV_LINKS = [
  { href: "/collections/all", label: "Shop All" },
  { href: "/collections/t-shirts", label: "T-Shirts" },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cartCount = useCartStore((s) => s.itemCount());

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 250);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <>
      {/* ── Desktop Header ───────────────────────────────────── */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center shrink-0">
              <Image
                src="/brand-logo.svg"
                alt="SXTN"
                width={100}
                height={40}
                priority
                className="h-10 w-auto"
              />
            </Link>

            <nav className="flex items-center gap-10" aria-label="Main navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium tracking-[0.1em] uppercase text-white/80 hover:text-white",
                    "transition-colors duration-150",
                    "relative after:absolute after:-bottom-2 after:left-0 after:h-px after:w-0",
                    "after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-6 text-white">
              <button aria-label="Search" className="hover:opacity-70 transition-opacity">
                <Search className="h-5 w-5" />
              </button>
              <Link
                href="/cart"
                aria-label={`Cart — ${mounted ? cartCount : 0} items`}
                className="relative hover:opacity-70 transition-opacity"
              >
                <ShoppingBag className="h-5 w-5" />
                {mounted && cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-black text-[10px] font-bold"
                  >
                    {cartCount > 9 ? "9+" : String(cartCount)}
                  </motion.span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Top Bar ───────────────────────────────────────
           IMPORTANT: height is ONLY what is needed for the logo.
           NO full-width invisible overlay. pointer-events on the
           element itself so nothing is accidentally blocked.       */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 pt-4 pb-8 bg-gradient-to-b from-black/70 to-transparent" style={{ pointerEvents: "none" }}>
        <Link href="/" style={{ pointerEvents: "auto" }}>
          <Image
            src="/brand-logo.svg"
            alt="SXTN"
            width={80}
            height={32}
            priority
            className="h-8 w-auto"
          />
        </Link>
        <Link href="/cart" style={{ pointerEvents: "auto" }} className="relative">
          <ShoppingBag className="h-6 w-6 text-white" />
          {mounted && cartCount > 0 && (
            <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-black text-[10px] font-bold">
              {cartCount > 9 ? "9+" : String(cartCount)}
            </span>
          )}
        </Link>
      </div>

      {/* ── Mobile Bottom Nav Pill ───────────────────────────────
           Slides away while scrolling so it never blocks content. */}
      <div
        className={cn(
          "md:hidden fixed bottom-6 left-4 right-4 z-50",
          "flex items-center gap-3",
          "transition-transform duration-300 ease-in-out",
          isScrolling ? "translate-y-28" : "translate-y-0"
        )}
      >
        {/* Menu trigger */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open menu"
          className="flex-shrink-0 h-14 w-14 rounded-full bg-white flex items-center justify-center shadow-lg"
        >
          <div className="w-6 h-6 flex flex-wrap gap-[2px]">
            <div className="w-[11px] h-[11px] bg-black rounded-tl-md rounded-br-sm" />
            <div className="w-[11px] h-[11px] bg-black rounded-tr-md rounded-bl-sm" />
            <div className="w-[11px] h-[11px] bg-black rounded-bl-md rounded-tr-sm" />
            <div className="w-[11px] h-[11px] bg-black rounded-br-md rounded-tl-sm" />
          </div>
        </button>

        {/* Icon pill */}
        <nav
          className="flex-1 h-14 bg-black/80 border border-white/20 rounded-full flex items-center justify-around px-2"
          aria-label="Mobile navigation"
        >
          <Link href="/collections/all" className="p-3 text-white/80">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </Link>
          <Link href="/account" className="p-3 text-white/80">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
          <Link href="/cart" className="p-3 text-white/80 relative">
            <ShoppingBag className="h-[22px] w-[22px]" />
            {mounted && cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-black text-[10px] font-bold">
                {cartCount > 9 ? "9+" : String(cartCount)}
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* ── Mobile Fullscreen Menu ───────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[60] bg-black text-white flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <span className="font-display text-2xl tracking-widest">MENU</span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 bg-white/10 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 flex flex-col justify-center px-8 gap-8">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-display text-4xl uppercase tracking-widest"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
