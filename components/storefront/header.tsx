"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ShoppingBag, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/stores/cart.store";
import { createClient } from "@/lib/supabase/client";
import { CurvedNavbar, CurvedMenuTrigger, iCategoryItem } from "@/components/ui/curved-menu";



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
  const [collections, setCollections] = useState<iCategoryItem[]>([
    { name: "Tees", slug: "tees" },
    { name: "Hoodies", slug: "hoodie" },
  ]);
  const [isScrolling, setIsScrolling] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cartCount = useCartStore((s) => s.itemCount());
  const openCart = useCartStore((s) => s.openCart);
  const supabase = createClient();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, slug")
      .order("name")
      .then(({ data }) => {
        const catList = (data as any[]) || [];
        if (catList.length > 0) {
          const list: iCategoryItem[] = [];

          const teesCat = catList.find(
            (c: any) =>
              c.slug === "tees" ||
              c.slug === "t-shirts" ||
              (c.name && String(c.name).toLowerCase().includes("tee"))
          );
          list.push({
            name: "Tees",
            slug: teesCat?.slug ? String(teesCat.slug) : "tees",
          });

          const hoodieCat = catList.find(
            (c: any) =>
              c.slug === "hoodie" ||
              c.slug === "hoodies" ||
              (c.name && String(c.name).toLowerCase().includes("hoodie"))
          );
          list.push({
            name: "Hoodies",
            slug: hoodieCat?.slug ? String(hoodieCat.slug) : "hoodie",
          });

          catList.forEach((c: any) => {
            const isTee =
              c.slug === "tees" ||
              c.slug === "t-shirts" ||
              (c.name && String(c.name).toLowerCase().includes("tee"));
            const isHoodie =
              c.slug === "hoodie" ||
              c.slug === "hoodies" ||
              (c.name && String(c.name).toLowerCase().includes("hoodie"));
            if (!isTee && !isHoodie && c.slug) {
              list.push({ name: String(c.name || c.slug), slug: String(c.slug) });
            }
          });

          setCollections(list);
        }
      });
  }, [supabase]);

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
      {/* ── Animated Curved Menu (Black Themed, Left Side) ──────── */}
      <CurvedNavbar
        isActive={menuOpen}
        setIsActive={setMenuOpen}
        collections={collections}
      />

      {/* ── Desktop Header ─────────────────────────────────────── */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-[60] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20 relative">

            {/* Left: Animated Menu trigger */}
            <div className="flex items-center">
              <CurvedMenuTrigger
                isActive={menuOpen}
                onClick={() => setMenuOpen((prev) => !prev)}
              />
            </div>

            {/* Center: Logo */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <Link href="/" className="flex items-center">
                <Image
                  src="/brand-logo.svg"
                  alt="6XTN"
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
                id="desktop-cart-btn"
                data-cart-icon="true"
                onClick={openCart}
                aria-label={`Bag — ${mounted ? cartCount : 0} items`}
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
      {/* Menu trigger (top-left) + Logo (center) + Cart (top-right) */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-[60] flex justify-between items-center px-4 pt-4 pb-8 bg-gradient-to-b from-black/70 to-transparent"
        style={{ pointerEvents: "none" }}
      >
        {/* Left: Animated Menu trigger */}
        <div className="flex items-center">
          <CurvedMenuTrigger
            isActive={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          />
        </div>

        {/* Center: Brand logo */}
        <Link href="/" style={{ pointerEvents: "auto" }} className="absolute left-1/2 -translate-x-1/2 top-4">
          <Image
            src="/brand-logo.svg"
            alt="6XTN"
            width={70}
            height={28}
            priority
            className="h-7 w-auto"
          />
        </Link>

        {/* Right: Bag */}
        <button
          id="mobile-cart-btn"
          data-cart-icon="true"
          onClick={openCart}
          style={{ pointerEvents: "auto" }}
          className="relative"
          aria-label={`Bag — ${mounted ? cartCount : 0} items`}
        >
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
          "md:hidden fixed bottom-6 left-4 right-4 z-40",
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

          {/* Bag */}
          <button
            id="bottom-cart-btn"
            data-cart-icon="true"
            onClick={openCart}
            aria-label={`Bag — ${mounted ? cartCount : 0} items`}
            className="p-3 text-white/80 hover:text-white transition-colors relative"
          >
            <ShoppingBag className="h-[22px] w-[22px]" />
            {mounted && cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-black text-[10px] font-bold">
                {cartCount > 9 ? "9+" : String(cartCount)}
              </span>
            )}
          </button>
        </nav>
      </div>
    </>
  );
}
