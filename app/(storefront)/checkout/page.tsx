"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/stores/cart.store";
import { Loader2 } from "lucide-react";

interface AddressForm {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

const SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 99;

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clearCart);

  const shippingFee = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  const [form, setForm] = useState<AddressForm>({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if cart empty — must be in useEffect to avoid ReferenceError on server
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items.length, router]);

  // Don't render checkout form while cart is empty
  if (items.length === 0) return null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Create Razorpay order on server
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            variantId: i.variantId,
            productId: i.productId,
            name: i.name,
            size: i.size,
            color: i.color,
            price: i.price,
            quantity: i.quantity,
          })),
          subtotal,
          shippingFee,
          total,
          address: form,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create order");
      }

      const { orderId, amount, currency, keyId } = await res.json();

      // 2. Load Razorpay script and open checkout
      if (!(window as Window & { Razorpay?: unknown }).Razorpay) {
        await loadRazorpayScript();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: "SXTN",
        description: `Order — ${items.length} item${items.length > 1 ? "s" : ""}`,
        prefill: {
          name: form.fullName,
          contact: form.phone,
        },
        theme: { color: "#ffffff", backdrop_color: "#000000" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // 3. Verify payment on server
          const verifyRes = await fetch("/api/checkout/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items: items.map((i) => ({
                variantId: i.variantId,
                name: i.name,
                size: i.size,
                color: i.color,
                price: i.price,
                quantity: i.quantity,
              })),
              subtotal,
              shippingFee,
              total,
              address: form,
            }),
          });

          if (verifyRes.ok) {
            clearCart();
            router.push("/order-success");
          } else {
            setError("Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      {/* Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div className="min-h-screen pt-28 pb-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-widest mb-12">
          Checkout
        </h1>

        <form onSubmit={handlePayment}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* ── Delivery Address ─────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">
              <h2 className="font-display text-xl uppercase tracking-widest text-white/60 mb-6">
                Delivery Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                    Full Name *
                  </label>
                  <input
                    name="fullName"
                    required
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                    Phone *
                  </label>
                  <input
                    name="phone"
                    required
                    pattern="[0-9]{10}"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    name="line1"
                    required
                    value={form.line1}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="Flat / House No., Street"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                    Address Line 2
                  </label>
                  <input
                    name="line2"
                    value={form.line2}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="Landmark, Area (optional)"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                    City *
                  </label>
                  <input
                    name="city"
                    required
                    value={form.city}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="Mumbai"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                    State *
                  </label>
                  <input
                    name="state"
                    required
                    value={form.state}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="Maharashtra"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                    Pincode *
                  </label>
                  <input
                    name="pincode"
                    required
                    pattern="[0-9]{6}"
                    value={form.pincode}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="400001"
                  />
                </div>
              </div>
            </div>

            {/* ── Order Summary ────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="border border-white/10 p-6 sticky top-28">
                <h2 className="font-display text-xl uppercase tracking-widest mb-6">
                  Order Summary
                </h2>

                {/* Items */}
                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex justify-between text-sm text-white/60">
                      <span className="flex-1 mr-2 truncate">
                        {item.name} × {item.quantity}
                        <span className="ml-1 text-white/30 text-xs">({item.size})</span>
                      </span>
                      <span>INR {(item.price * item.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm border-t border-white/10 pt-4 mb-6">
                  <div className="flex justify-between text-white/60">
                    <span>Subtotal</span>
                    <span>INR {subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Shipping</span>
                    <span>{shippingFee === 0 ? <span className="text-green-400">Free</span> : `INR ${shippingFee}`}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t border-white/10">
                    <span>Total</span>
                    <span>INR {total.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-xs text-center py-2 mb-4 bg-red-400/10">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 w-full bg-white text-black h-14 font-display uppercase tracking-widest hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    `Pay INR ${total.toLocaleString("en-IN")}`
                  )}
                </button>

                <p className="text-center text-white/20 text-xs mt-4">
                  Secured by Razorpay
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}
