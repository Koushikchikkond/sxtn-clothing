"use client";

import { useState } from "react";
import Script from "next/script";
import { CheckCircle2, AlertTriangle, ShieldCheck, CreditCard, Loader2 } from "lucide-react";

export default function RazorpayTestPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{
    orderId: string;
    paymentId: string;
    signature: string;
  } | null>(null);

  async function handleTestPayment() {
    setLoading(true);
    setStatus(null);
    setError(null);
    setPaymentDetails(null);

    try {
      // 1. Create order on backend (amount in paise: 100 paise = ₹1.00)
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 100, // 100 paise = ₹1.00
          currency: "INR",
          receipt: `test_receipt_${Date.now()}`,
          notes: {
            purpose: "SXTN Razorpay Integration Test",
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create test order");
      }

      const orderData = await res.json();
      const orderId = orderData.order_id || orderData.orderId;
      const keyId =
        orderData.key_id ||
        orderData.keyId ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      // 2. Open Razorpay Standard Checkout Modal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderId,
        name: "SXTN Clothing",
        description: "Test Payment (₹1.00)",
        prefill: {
          name: "Test Customer",
          email: "test@sxtn.in",
          contact: "9999999999",
        },
        theme: {
          color: "#000000",
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          setStatus("Verifying HMAC-SHA256 signature on backend...");

          // 3. Verify payment signature on backend
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json().catch(() => ({}));

          if (verifyRes.ok && verifyData.success) {
            setStatus("Success! Payment signature verified by server.");
            setPaymentDetails({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
          } else {
            setError(
              verifyData.error ||
                "Signature verification failed on backend. Do NOT mark as paid."
            );
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            if (!paymentDetails) {
              setStatus("Checkout modal dismissed by user.");
            }
          },
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzp.on("payment.failed", (failRes: any) => {
        console.error("Razorpay failure:", failRes);
        setError(failRes?.error?.description || "Payment failed");
        setLoading(false);
      });

      rzp.open();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred");
      setLoading(false);
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="min-h-screen bg-black text-white pt-24 pb-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="border border-white/10 p-6 sm:p-8 rounded-lg bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
            <CreditCard className="w-8 h-8 text-white" />
            <div>
              <h1 className="font-display text-2xl uppercase tracking-wider">
                Razorpay Checkout Verification
              </h1>
              <p className="text-white/50 text-xs mt-1">
                Standard Web Checkout (Test Mode Integration)
              </p>
            </div>
          </div>

          {/* Security Status Box */}
          <div className="mb-6 p-4 border border-emerald-500/20 bg-emerald-500/5 rounded">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span>Anti-Tampering & Credential Protection Active</span>
            </div>
            <ul className="text-xs text-white/60 space-y-1 list-disc list-inside">
              <li>
                <strong>KEY_SECRET</strong> is isolated on the server & never
                sent to client browser.
              </li>
              <li>
                Orders are verified cryptographically via{" "}
                <code>HMAC-SHA256</code> on the backend.
              </li>
              <li>
                Developer Mode price tampering is prevented by backend database
                recalculation.
              </li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="space-y-4">
            <button
              onClick={handleTestPayment}
              disabled={loading}
              className="w-full bg-white text-black py-4 font-display uppercase tracking-widest text-sm hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-2 rounded transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Pay INR 1.00 (Test Standard Checkout)"
              )}
            </button>
            <p className="text-xs text-center text-white/40">
              Uses Razorpay Test Mode. You can use standard Razorpay test card
              numbers or UPI simulation.
            </p>
          </div>

          {/* Status / Results */}
          {status && (
            <div className="mt-6 p-4 border border-white/20 bg-white/5 text-sm flex items-center gap-3 rounded">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{status}</span>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center gap-3 rounded">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {paymentDetails && (
            <div className="mt-6 p-4 border border-white/10 bg-white/[0.04] rounded space-y-2 text-xs font-mono">
              <div className="text-white/40 uppercase tracking-wider text-[10px]">
                Verified Transaction Details:
              </div>
              <div>
                <span className="text-white/50">Order ID:</span>{" "}
                <span className="text-white">{paymentDetails.orderId}</span>
              </div>
              <div>
                <span className="text-white/50">Payment ID:</span>{" "}
                <span className="text-white">{paymentDetails.paymentId}</span>
              </div>
              <div className="truncate">
                <span className="text-white/50">Signature:</span>{" "}
                <span className="text-emerald-400">
                  {paymentDetails.signature}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
