"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Ban, CheckCircle2, Loader2, Truck } from "lucide-react";

interface CustomerOrderActionsProps {
  orderId: string;
  status: string;
  notes?: string | null;
  total: number;
}

const CUSTOMER_CANCEL_REASONS = [
  "Ordered by mistake / accidental checkout",
  "Need to change size, color, or variant",
  "Need to modify delivery address or phone number",
  "Delivery timeframe longer than needed",
  "Changed mind / personal reasons",
  "Other reason",
];

export function CustomerOrderActions({
  orderId,
  status,
  notes,
  total,
}: CustomerOrderActionsProps) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reason, setReason] = useState(CUSTOMER_CANCEL_REASONS[0]);
  const [customNote, setCustomNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isCancellable = status === "pending" || status === "paid";
  const isCancelled = status === "cancelled";

  // Parse tracking info if present in notes
  const isShipped = status === "shipped" || status === "delivered";
  const hasTracking = notes && (notes.includes("Tracking:") || notes.includes("Courier:"));

  async function handleConfirmCancel() {
    setLoading(true);
    setError(null);

    try {
      const finalReason = reason === "Other reason" && customNote.trim() ? customNote.trim() : reason;
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: finalReason,
          notes: customNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel order.");
      }

      setSuccess("Your order has been cancelled. A confirmation email has been sent.");
      setShowCancelModal(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error cancelling order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 my-6">
      {/* Cancelled Banner */}
      {isCancelled && (
        <div className="border border-red-500/30 bg-red-950/20 p-5 rounded-none">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-widest font-bold text-red-400">
                Order Cancelled
              </p>
              {notes && (
                <p className="text-sm text-white/90">
                  <span className="text-white/50 text-xs">Reason: </span>
                  {notes.replace(/^Cancelled( by Customer| by Admin)?:?\s*/i, "")}
                </p>
              )}
              <p className="text-xs text-white/50 leading-relaxed pt-1">
                If payment was captured, your refund of{" "}
                <strong className="text-white">₹{total.toLocaleString("en-IN")}</strong> will be
                automatically credited to your original payment method in 5–7 business days. For
                support, write to{" "}
                <a href="mailto:support@6xtn.in" className="text-white underline hover:text-white/80">
                  support@6xtn.in
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shipped / Tracking Banner */}
      {isShipped && hasTracking && (
        <div className="border border-sky-500/30 bg-sky-950/20 p-5 rounded-none">
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest font-bold text-sky-400">
                Shipment & Tracking Details
              </p>
              <p className="text-sm text-white/90 font-mono pt-1">{notes}</p>
              <p className="text-[11px] text-white/50">
                Courier updates are dispatched to your email from{" "}
                <span className="font-mono text-white/70">shipping@6xtn.in</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Action Button */}
      {isCancellable && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="text-xs uppercase tracking-widest px-4 py-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-colors flex items-center gap-1.5"
          >
            <Ban className="w-3.5 h-3.5" />
            Cancel Order
          </button>
        </div>
      )}

      {success && (
        <div className="p-3 border border-green-500/30 bg-green-950/20 text-green-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-white/15 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Ban className="w-4 h-4 text-red-400" />
              <h3 className="font-display text-lg uppercase tracking-wider text-white">
                Cancel Order #{orderId.slice(0, 8).toUpperCase()}
              </h3>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Please choose a reason for cancelling. This will update your order status in our system
              and a cancellation confirmation will be sent to your email from{" "}
              <code className="text-white bg-white/10 px-1 py-0.5">support@6xtn.in</code>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5 font-bold">
                  Cancellation Reason *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-black border border-white/20 p-2.5 text-xs text-white focus:outline-none focus:border-white/50"
                >
                  {CUSTOMER_CANCEL_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {reason === "Other reason" && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5 font-bold">
                    Additional Details
                  </label>
                  <textarea
                    rows={2}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Briefly tell us why you are cancelling..."
                    className="w-full bg-black border border-white/20 p-2.5 text-xs text-white focus:outline-none focus:border-white/50"
                  />
                </div>
              )}
            </div>

            {error && <p className="text-xs text-red-400 pt-1">{error}</p>}

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs uppercase tracking-widest text-white/50 hover:text-white border border-white/10 transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs uppercase tracking-widest font-bold bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
