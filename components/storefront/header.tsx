"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ShoppingBag, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/stores/cart.store";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/collections/all", label: "Shop All" },
  { href: "/collections/t-shirts", label: "T-Shirts" },
  { href: "/account", label: "Account" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
];

// ── Full-Screen Slide Menu (shared mobile + desktop) ───────────
function FullScreenMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [loggedIn, setLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    onClose();
    window.location.href = "/";
  };

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[80] bg-black text-white flex flex-col"
        >
          {/* Header row */}
          <div className="flex justify-between items-center px-6 pt-8 pb-6 border-b border-white/10">
            <Link href="/" onClick={onClose}>
              <Image
                src="/brand-logo.svg"
                alt="SXTN"
                width={80}
                height={32}
                className="h-8 w-auto invert"
              />
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="h-10 w-10 flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 flex flex-col justify-center px-8 gap-6" aria-label="Full screen navigation">
            {NAV_LINKS.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="font-display text-5xl md:text-6xl uppercase tracking-widest text-white hover:text-white/60 transition-colors duration-200 block"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Footer auth actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="px-8 pb-10 pt-6 border-t border-white/10 flex items-center gap-4"
          >
            {loggedIn ? (
              <button
                onClick={handleSignOut}
                className="text-sm font-medium tracking-widest uppercase text-white/50 hover:text-red-400 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="px-6 py-3 bg-white text-black text-sm font-bold tracking-widest uppercase hover:bg-white/90 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={onClose}
                  className="text-sm font-medium tracking-widest uppercase text-white/50 hover:text-white transition-colors"
                >
                  Create Account
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Desktop Profile Dropdown ───────────────────────────────────
function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setLoggedIn(true);
        setEmail(data.user.email ?? "");
      }
    });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setOpen(false);
    window.location.href = "/";
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label="Account"
        className="hover:opacity-70 transition-opacity text-white"
        style={{ display: "flex", alignItems: "center" }}
      >
        <User className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "absolute",
              top: "calc(100% + 14px)",
              right: 0,
              width: "220px",
              background: "#111",
              border: "1px solid rgba(255,255,255,0.12)",
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            {loggedIn ? (
              <>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2px" }}>Signed in as</p>
                  <p style={{ fontSize: "0.78rem", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</p>
                </div>
                {[
                  { href: "/account", label: "Profile" },
                  { href: "/account/orders", label: "My Orders" },
                  { href: "/account/addresses", label: "Addresses" },
                  { href: "/account/wishlist", label: "Wishlist" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    style={{ display: "block", padding: "11px 16px", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.15s, color 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.75)"; }}
                  >
                    {label}
                  </Link>
                ))}
                <button
                  onClick={handleSignOut}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 16px", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ef4444", background: "transparent", border: "none", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} style={{ display: "block", padding: "12px 16px", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", background: "#fff", textAlign: "center", color: "#000" }}>
                  Sign In
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)} style={{ display: "block", padding: "11px 16px", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", textDecoration: "none", textAlign: "center" }}>
                  Create Account
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Header ────────────────────────────────────────────────
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cartCount = useCartStore((s) => s.itemCount());
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => { setIsScrolling(false); }, 250);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => { window.removeEventListener("scroll", handleScroll); clearTimeout(scrollTimeout); };
  }, []);

  return (
    <>
      {/* ── Desktop Header ─────────────────────────────────────── */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20 relative">

            {/* Left: Menu button */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex items-center gap-2 text-white hover:opacity-70 transition-opacity"
            >
              {/* Hamburger lines */}
              <div className="flex flex-col gap-[5px]">
                <span className="block w-6 h-[1.5px] bg-white" />
                <span className="block w-4 h-[1.5px] bg-white" />
                <span className="block w-6 h-[1.5px] bg-white" />
              </div>
              <span className="text-xs font-medium tracking-[0.2em] uppercase ml-1">Menu</span>
            </button>

            {/* Center: Logo */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <Link href="/" className="flex items-center">
                <Image
                  src="/brand-logo.svg"
                  alt="SXTN"
                  width={100}
                  height={40}
                  priority
                  className="h-10 w-auto"
                />
              </Link>
            </div>

            {/* Right: Account + Cart */}
            <div className="flex items-center gap-6 text-white ml-auto">
              <ProfileDropdown />
              <button
                onClick={openCart}
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
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Top Bar ─────────────────────────────────────── */}
      {/* Menu button (top-left) + Logo (center) + Cart (top-right) */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 pt-4 pb-8 bg-gradient-to-b from-black/70 to-transparent"
        style={{ pointerEvents: "none" }}
      >
        {/* Left: Hamburger menu trigger */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          style={{ pointerEvents: "auto" }}
          className="flex flex-col gap-[5px] p-2"
        >
          <span className="block w-6 h-[1.5px] bg-white" />
          <span className="block w-4 h-[1.5px] bg-white" />
          <span className="block w-6 h-[1.5px] bg-white" />
        </button>

        {/* Center: Brand logo */}
        <Link href="/" style={{ pointerEvents: "auto" }} className="absolute left-1/2 -translate-x-1/2 top-4">
          <Image
            src="/brand-logo.svg"
            alt="SXTN"
            width={70}
            height={28}
            priority
            className="h-7 w-auto"
          />
        </Link>

        {/* Right: Cart */}
        <button onClick={openCart} style={{ pointerEvents: "auto" }} className="relative">
          <ShoppingBag className="h-6 w-6 text-white" />
          {mounted && cartCount > 0 && (
            <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-black text-[10px] font-bold">
              {cartCount > 9 ? "9+" : String(cartCount)}
            </span>
          )}
        </button>
      </div>

      {/* ── Mobile Bottom Capsule Nav (NO menu button, glass effect) ── */}
      <div
        className={cn(
          "md:hidden fixed bottom-6 left-4 right-4 z-50",
          "flex items-center gap-3",
          "transition-transform duration-300 ease-in-out",
          isScrolling ? "translate-y-28" : "translate-y-0"
        )}
      >
        {/* Decorative circle with star logo — no menu trigger */}
        <div
          className="flex-shrink-0 h-14 w-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg"
          aria-hidden="true"
        >
          <Image
            src="/open-menu-logo.jpeg"
            alt=""
            width={56}
            height={56}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Glass capsule pill */}
        <nav
          className="flex-1 h-14 rounded-full flex items-center justify-around px-4"
          style={{
            background: "rgba(30, 30, 30, 0.55)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
          aria-label="Mobile navigation"
        >
          {/* Explore / Shop All */}
          <Link href="/collections/all" className="p-3 text-white/80 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </Link>

          {/* Account */}
          <Link href="/account" className="p-3 text-white/80 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>

          {/* Cart */}
          <button onClick={openCart} className="p-3 text-white/80 hover:text-white transition-colors relative">
            <ShoppingBag className="h-[22px] w-[22px]" />
            {mounted && cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-black text-[10px] font-bold">
                {cartCount > 9 ? "9+" : String(cartCount)}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* ── Full-Screen Slide Menu (mobile + desktop) ──────────── */}
      <FullScreenMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
