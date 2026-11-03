"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/stores/cart.store";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, AlertTriangle } from "lucide-react";

const SHIPPING_FEE = 99;

interface ItemValidation {
  status: "available" | "out_of_stock" | "removed";
  message: string | null;
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());

  const [validationMap, setValidationMap] = useState<Record<string, ItemValidation>>({});

  useEffect(() => {
    if (items.length === 0) return;
    let isCancelled = false;

    fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ variantId: i.variantId, productId: i.productId })),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data?.items) {
          const map: Record<string, ItemValidation> = {};
          data.items.forEach((item: any) => {
            map[item.variantId] = { status: item.status, message: item.message };
          });
          setValidationMap(map);
        }
      })
      .catch((err) => console.error("[CartPage] Validation error:", err));

    return () => {
      isCancelled = true;
    };
  }, [items]);

  const hasUnavailableItems = items.some(
    (item) => validationMap[item.variantId] && validationMap[item.variantId].status !== "available"
  );

  const handleRemoveUnavailable = () => {
    items.forEach((item) => {
      if (validationMap[item.variantId] && validationMap[item.variantId].status !== "available") {
        removeItem(item.variantId);
      }
    });
  };

  const shippingFee = SHIPPING_FEE;
  const total = subtotal + shippingFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <ShoppingBag className="h-16 w-16 text-white/10 mb-6" />
        <h1 className="font-display text-4xl uppercase tracking-widest mb-4">Your Bag is Empty</h1>
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
        Your Bag
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* ── Cart Items ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => {
            const validation = validationMap[item.variantId];
            const isOutOfStock = validation?.status === "out_of_stock";
            const isRemoved = validation?.status === "removed";
            const isUnavailable = isOutOfStock || isRemoved;

            return (
              <div
                key={item.variantId}
                className={`flex gap-4 border-b border-white/10 pb-6 ${
                  isUnavailable ? "opacity-75 bg-red-950/10 p-3 rounded" : ""
                }`}
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

                    {/* Status Badges */}
                    {isRemoved && (
                      <div className="mt-1">
                        <span className="inline-block bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                          Removed from catalog
                        </span>
                      </div>
                    )}

                    {isOutOfStock && (
                      <div className="mt-1">
                        <span className="inline-block bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                          Out of stock
                        </span>
                      </div>
                    )}

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
                    {!isUnavailable ? (
                      <div className="flex flex-col">
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
                            disabled={item.stock > 0 && item.quantity >= item.stock}
                            className="h-8 w-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        {item.stock > 0 && item.quantity >= item.stock && (
                          <span className="text-amber-400 text-[10px] mt-1">Max stock reached</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-white/40 italic">Unavailable</span>
                    )}

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
            );
          })}
        </div>

        {/* ── Order Summary ────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="border border-white/10 p-6 sticky top-28 space-y-4">
            <h2 className="font-display text-xl uppercase tracking-widest">
              Order Summary
            </h2>

            {/* Unavailable warning banner */}
            {hasUnavailableItems && (
              <div className="bg-red-950/60 border border-red-500/40 p-3 rounded flex flex-col gap-2">
                <div className="flex items-center gap-2 text-red-300 text-xs font-medium">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>Items in your bag are out of stock or removed.</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveUnavailable}
                  className="text-left text-xs uppercase tracking-wider font-bold text-white underline hover:text-white/80"
                >
                  Remove unavailable items →
                </button>
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Subtotal</span>
                <span>INR {subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Shipping</span>
                <span className="font-display font-medium text-white">INR {shippingFee}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between font-medium">
                <span>Total</span>
                <span>INR {total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {hasUnavailableItems ? (
              <button
                disabled
                className="flex items-center justify-center gap-2 w-full bg-white/20 text-white/40 h-14 font-display uppercase tracking-widest text-xs cursor-not-allowed border border-white/10"
              >
                Remove unavailable items to checkout
              </button>
            ) : (
              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full bg-white text-black h-14 font-display uppercase tracking-widest hover:bg-white/90 transition-colors"
              >
                Checkout <ArrowRight className="h-4 w-4" />
              </Link>
            )}

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
