"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/stores/cart.store";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";

const SHIPPING_THRESHOLD = 999; // Free shipping above INR 999
const SHIPPING_FEE = 99;

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());

  const shippingFee = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <ShoppingBag className="h-16 w-16 text-white/10 mb-6" />
        <h1 className="font-display text-4xl uppercase tracking-widest mb-4">Your Cart is Empty</h1>
        <p className="text-white/40 text-sm mb-10">Add some pieces to get started.</p>
        <Link
          href="/collections/all"
          className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 font-display uppercase tracking-widest text-sm hover:bg-white/90 transition-colors"
        >
          Shop All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-widest mb-12">
        Your Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* ── Cart Items ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="flex gap-4 border-b border-white/10 pb-6"
            >
              {/* Thumbnail */}
              <Link href={`/products/${item.productSlug}`} className="shrink-0">
                <div className="relative w-24 h-28 sm:w-28 sm:h-36 bg-sxtn-gray-900">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
                      NO IMG
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="font-display font-bold uppercase tracking-tight text-base sm:text-lg text-white hover:text-white/70 transition-colors"
                  >
                    {item.name}
                  </Link>
                  <p className="text-white/40 text-xs mt-1 uppercase tracking-widest font-medium">
                    Size: {item.size}
                    {item.color && ` · ${item.color}`}
                  </p>
                  <p className="font-display font-bold text-base sm:text-lg text-white mt-2">
                    INR {item.price.toLocaleString("en-IN")}
                  </p>
                </div>

                {/* Qty + Delete */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border border-white/20">
                    <button
                      onClick={() => updateQty(item.variantId, item.quantity - 1)}
                      className="h-8 w-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="h-8 w-10 flex items-center justify-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.variantId, item.quantity + 1)}
                      className="h-8 w-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="p-2 text-white/30 hover:text-red-400 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Line Total */}
              <div className="shrink-0 text-right">
                <p className="font-display tracking-widest text-sm">
                  INR {(item.price * item.quantity).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Order Summary ────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="border border-white/10 p-6 sticky top-28">
            <h2 className="font-display text-xl uppercase tracking-widest mb-6">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between text-white/60">
                <span>Subtotal</span>
                <span>INR {subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Shipping</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-green-400">Free</span>
                  ) : (
                    `INR ${shippingFee}`
                  )}
                </span>
              </div>
              {shippingFee > 0 && (
                <p className="text-white/30 text-xs">
                  Add INR {(SHIPPING_THRESHOLD - subtotal).toLocaleString("en-IN")} more for free shipping
                </p>
              )}
              <div className="border-t border-white/10 pt-3 flex justify-between font-medium">
                <span>Total</span>
                <span>INR {total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="flex items-center justify-center gap-2 w-full bg-white text-black h-14 font-display uppercase tracking-widest hover:bg-white/90 transition-colors"
            >
              Checkout <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/collections/all"
              className="block text-center mt-4 text-xs text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
