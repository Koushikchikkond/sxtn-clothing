"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart.store";

const SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 99;

export function CartDrawer() {
  const items       = useCartStore((s) => s.items);
  const isOpen      = useCartStore((s) => s.isOpen);
  const closeCart   = useCartStore((s) => s.closeCart);
  const removeItem  = useCartStore((s) => s.removeItem);
  const updateQty   = useCartStore((s) => s.updateQty);
  const subtotal    = useCartStore((s) => s.subtotal());

  const shippingFee = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total       = subtotal + shippingFee;
  const remaining   = SHIPPING_THRESHOLD - subtotal;

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ─────────────────────────────────────── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeCart}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* ── Drawer Panel ─────────────────────────────────── */}
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="fixed right-0 top-0 bottom-0 z-[80] w-[85%] max-w-md bg-black border-l border-white/10 flex flex-col"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl uppercase tracking-widest text-white">
                  Cart
                </h2>
                {items.length > 0 && (
                  <span className="text-xs text-white/40 uppercase tracking-widest">
                    ({items.reduce((s, i) => s + i.quantity, 0)} items)
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Free shipping progress bar */}
            {items.length > 0 && shippingFee > 0 && (
              <div className="px-6 pt-4 pb-2">
                <div className="h-px bg-white/10 w-full relative overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-white"
                    initial={false}
                    animate={{ width: `${Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100)}%` }}
                    transition={{ type: "spring", stiffness: 200, damping: 30 }}
                  />
                </div>
                <p className="text-white/30 text-xs mt-2 tracking-wide">
                  Add{" "}
                  <span className="text-white">₹{remaining.toLocaleString("en-IN")}</span>{" "}
                  more for free shipping
                </p>
              </div>
            )}
            {items.length > 0 && shippingFee === 0 && (
              <div className="px-6 pt-4 pb-2">
                <div className="h-px bg-white w-full" />
                <p className="text-green-400 text-xs mt-2 tracking-wide">
                  ✓ You get free shipping!
                </p>
              </div>
            )}

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-16">
                  <ShoppingBag className="h-14 w-14 text-white/10" />
                  <p className="font-display text-2xl uppercase tracking-widest text-white/60">
                    Your cart is empty
                  </p>
                  <p className="text-white/30 text-sm">Add some pieces to get started.</p>
                  <button
                    onClick={closeCart}
                    className="mt-4 inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-colors"
                  >
                    Shop Now <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={item.variantId}
                      layout
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex gap-4 border-b border-white/10 pb-5"
                    >
                      {/* Thumbnail */}
                      <Link
                        href={`/products/${item.productSlug}`}
                        onClick={closeCart}
                        className="shrink-0"
                      >
                        <div className="relative w-20 h-24 bg-zinc-900 overflow-hidden">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover hover:scale-105 transition-transform duration-500"
                              sizes="80px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-white/20" />
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <Link
                            href={`/products/${item.productSlug}`}
                            onClick={closeCart}
                            className="font-display uppercase tracking-tight text-base font-bold text-white hover:text-white/70 transition-colors line-clamp-2"
                          >
                            {item.name}
                          </Link>
                          <p className="text-white/40 text-xs mt-1 uppercase tracking-wider font-medium">
                            {item.size}{item.color ? ` · ${item.color}` : ""}
                          </p>
                          <p className="font-display text-base font-bold text-white mt-1">
                            ₹{item.price.toLocaleString("en-IN")}
                          </p>
                        </div>

                        {/* Qty controls */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-white/20">
                            <button
                              onClick={() => updateQty(item.variantId, item.quantity - 1)}
                              className="h-7 w-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                              aria-label="Decrease"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="h-7 w-8 flex items-center justify-center text-xs font-bold text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.variantId, item.quantity + 1)}
                              className="h-7 w-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                              aria-label="Increase"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-display font-bold text-base text-white">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </span>
                            <button
                              onClick={() => removeItem(item.variantId)}
                              className="p-1 text-white/20 hover:text-red-400 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer — Order summary + CTA */}
            {items.length > 0 && (
              <div className="border-t border-white/10 px-6 py-5 space-y-4 bg-black">
                <div className="space-y-2 text-sm sm:text-base">
                  <div className="flex justify-between text-white/40">
                    <span>Subtotal</span>
                    <span className="font-display font-bold text-white">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-white/40">
                    <span>Shipping</span>
                    <span>
                      {shippingFee === 0 ? (
                        <span className="text-green-400 font-medium">Free</span>
                      ) : (
                        `₹${shippingFee}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-white font-bold pt-2 border-t border-white/10 text-lg sm:text-xl font-display">
                    <span>Total</span>
                    <span>₹{total.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex items-center justify-center gap-2 w-full bg-white text-black h-14 font-display font-bold uppercase tracking-widest text-base hover:bg-white/90 active:scale-[0.98] transition-all"
                >
                  Checkout <ArrowRight className="h-4 w-4" />
                </Link>

                <button
                  onClick={closeCart}
                  className="w-full text-center text-xs text-white/30 hover:text-white/60 uppercase tracking-widest transition-colors py-1"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
