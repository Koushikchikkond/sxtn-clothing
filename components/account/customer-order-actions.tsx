"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Loader2,
  Truck,
  ExternalLink,
  RotateCcw,
  ArrowLeftRight,
  Clock,
  XCircle,
} from "lucide-react";
import type { OrderItem, OrderReturn } from "@/types/database.types";

export interface OrderItemWithStock extends OrderItem {
  availableVariants?: Array<{ size: string; stock: number }>;
}

interface CustomerOrderActionsProps {
  orderId: string;
  status: string;
  notes?: string | null;
  total: number;
  awbNumber?: string | null;
  courierName?: string | null;
  trackingUrl?: string | null;
  items?: OrderItemWithStock[];
  existingReturns?: OrderReturn[];
}

const CUSTOMER_CANCEL_REASONS = [
  "Ordered by mistake / accidental checkout",
  "Need to change size, color, or variant",
  "Need to modify delivery address or phone number",
  "Delivery timeframe longer than needed",
  "Changed mind / personal reasons",
  "Other reason",
];

const RETURN_EXCHANGE_REASONS = [
  "Size too small / tight fit",
  "Size too large / loose fit",
  "Defective or damaged item received",
  "Quality or fabric not as expected",
  "Received wrong item or incorrect size",
  "Changed mind / style does not suit",
  "Other reason",
];

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export function CustomerOrderActions({
  orderId,
  status,
  notes,
  total,
  awbNumber,
  courierName,
  trackingUrl: initialTrackingUrl,
  items = [],
  existingReturns = [],
}: CustomerOrderActionsProps) {
  const router = useRouter();

  // Cancel order state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState(CUSTOMER_CANCEL_REASONS[0]);
  const [customNote, setCustomNote] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  // Return & Exchange state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnType, setReturnType] = useState<"exchange" | "return">("exchange");
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || "");
  const [requestedSize, setRequestedSize] = useState<string>("L");
  const [returnReason, setReturnReason] = useState(RETURN_EXCHANGE_REASONS[0]);
  const [returnNotes, setReturnNotes] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnSuccess, setReturnSuccess] = useState<string | null>(null);

  const CANONICAL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

  const selectedItem = useMemo(() => {
    return items.find((i) => i.id === selectedItemId) || items[0];
  }, [items, selectedItemId]);

  const itemSizes = useMemo(() => {
    if (!selectedItem) return [];

    const variants = selectedItem.availableVariants || [];
    if (variants.length > 0) {
      return variants
        .slice()
        .sort((a, b) => {
          const idxA = CANONICAL_SIZES.indexOf(a.size.toUpperCase());
          const idxB = CANONICAL_SIZES.indexOf(b.size.toUpperCase());
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          return a.size.localeCompare(b.size);
        })
        .map((v) => {
          const isCurrent = v.size.toUpperCase() === selectedItem.size?.toUpperCase();
          const isOutOfStock = v.stock <= 0;
          return {
            size: v.size,
            stock: v.stock,
            isCurrent,
            isOutOfStock,
            isSelectable: !isCurrent && !isOutOfStock,
          };
        });
    }

    // Fallback if variants not found
    return CANONICAL_SIZES.map((sz) => {
      const isCurrent = sz.toUpperCase() === selectedItem.size?.toUpperCase();
      return {
        size: sz,
        stock: 10,
        isCurrent,
        isOutOfStock: false,
        isSelectable: !isCurrent,
      };
    });
  }, [selectedItem]);

  const hasAnyInStockForExchange = useMemo(() => {
    return itemSizes.some((s) => s.isSelectable);
  }, [itemSizes]);

  // Keep requestedSize pointing to a valid in-stock size
  useEffect(() => {
    if (returnType === "exchange" && itemSizes.length > 0) {
      const currentValid = itemSizes.find((s) => s.size === requestedSize && s.isSelectable);
      if (!currentValid) {
        const firstAvailable = itemSizes.find((s) => s.isSelectable);
        if (firstAvailable) {
          setRequestedSize(firstAvailable.size);
        }
      }
    }
  }, [selectedItemId, returnType, itemSizes, requestedSize]);

  const isCancellable = status === "pending" || status === "paid";
  const isCancelled = status === "cancelled";
  const isDelivered = status === "delivered";

  // Check active return/exchange request
  const activeReturn =
    existingReturns.find((r) => ["requested", "approved", "picked_up"].includes(r.status)) ||
    existingReturns[0];

  const canRequestReturn =
    isDelivered && (!activeReturn || activeReturn.status === "rejected");

  // Parse tracking info if present in notes or direct fields
  const isShipped = status === "shipped" || status === "delivered" || status === "confirmed";
  const hasTracking =
    !!awbNumber ||
    !!initialTrackingUrl ||
    (notes && (notes.includes("Tracking:") || notes.includes("Courier:")));
  const trackingLink =
    initialTrackingUrl || (awbNumber ? `https://shiprocket.co/tracking/${awbNumber}` : null);

  async function handleConfirmCancel() {
    setCancelLoading(true);
    setCancelError(null);

    try {
      const finalReason =
        cancelReason === "Other reason" && customNote.trim() ? customNote.trim() : cancelReason;
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

      setCancelSuccess("Your order has been cancelled. A confirmation email has been sent.");
      setShowCancelModal(false);
      router.refresh();
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : "Error cancelling order");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleConfirmReturn() {
    setReturnLoading(true);
    setReturnError(null);

    try {
      if (returnType === "exchange") {
        if (!hasAnyInStockForExchange) {
          setReturnError("All other sizes are currently out of stock. Please select Return Item for a full refund.");
          setReturnLoading(false);
          return;
        }
        const targetVariant = itemSizes.find((s) => s.size === requestedSize);
        if (targetVariant && !targetVariant.isSelectable) {
          if (targetVariant.isCurrent) {
            setReturnError("Please choose a different size from your current size.");
            setReturnLoading(false);
            return;
          }
          if (targetVariant.isOutOfStock) {
            setReturnError(`Size ${requestedSize} is currently out of stock. Please select another size or request a return.`);
            setReturnLoading(false);
            return;
          }
        }
      }

      const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];

      const res = await fetch(`/api/orders/${orderId}/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: returnType,
          orderItemId: selectedItem?.id || null,
          productName: selectedItem?.product_name || "Apparel Item",
          originalSize: selectedItem?.size || null,
          requestedSize: returnType === "exchange" ? requestedSize : null,
          reason: returnReason,
          customerNotes: returnNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request.");
      }

      setReturnSuccess(
        `Your ${returnType} request has been submitted. Our team will review and contact you shortly.`
      );
      setShowReturnModal(false);
      router.refresh();
    } catch (err: unknown) {
      setReturnError(err instanceof Error ? err.message : "Error submitting request");
    } finally {
      setReturnLoading(false);
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
                <a href="mailto:6xtn.in@gmail.com" className="text-white underline hover:text-white/80">
                  6xtn.in@gmail.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Return or Exchange Request Banner */}
      {activeReturn && (
        <div
          className={`border p-5 rounded-none ${
            activeReturn.status === "completed"
              ? "border-emerald-500/30 bg-emerald-950/20"
              : activeReturn.status === "rejected"
              ? "border-red-500/30 bg-red-950/20"
              : activeReturn.status === "approved" || activeReturn.status === "picked_up"
              ? "border-sky-500/30 bg-sky-950/20"
              : "border-amber-500/30 bg-amber-950/20"
          }`}
        >
          <div className="flex items-start gap-3">
            {activeReturn.status === "completed" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : activeReturn.status === "rejected" ? (
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            ) : activeReturn.status === "approved" || activeReturn.status === "picked_up" ? (
              <Truck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}

            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p
                  className={`text-xs uppercase tracking-widest font-bold ${
                    activeReturn.status === "completed"
                      ? "text-emerald-400"
                      : activeReturn.status === "rejected"
                      ? "text-red-400"
                      : activeReturn.status === "approved" || activeReturn.status === "picked_up"
                      ? "text-sky-400"
                      : "text-amber-400"
                  }`}
                >
                  {activeReturn.type === "exchange"
                    ? "Size Exchange Request"
                    : "Return & Refund Request"}
                </p>

                <span
                  className="text-[10px] uppercase tracking-widest font-mono px-2.5 py-0.5 border"
                  style={{
                    color:
                      activeReturn.status === "completed"
                        ? "#10b981"
                        : activeReturn.status === "rejected"
                        ? "#ef4444"
                        : activeReturn.status === "approved" || activeReturn.status === "picked_up"
                        ? "#0284c7"
                        : "#f59e0b",
                    borderColor:
                      activeReturn.status === "completed"
                        ? "#10b98155"
                        : activeReturn.status === "rejected"
                        ? "#ef444455"
                        : activeReturn.status === "approved" || activeReturn.status === "picked_up"
                        ? "#0284c755"
                        : "#f59e0b55",
                  }}
                >
                  Status: {activeReturn.status.replace("_", " ")}
                </span>
              </div>

              <div className="text-sm text-white/90 space-y-1">
                <p>
                  <span className="text-white/50 text-xs">Item: </span>
                  <strong>{activeReturn.product_name}</strong>
                  {activeReturn.original_size && (
                    <span className="text-white/50 text-xs">
                      {" "}
                      (Size: {activeReturn.original_size})
                    </span>
                  )}
                </p>

                {activeReturn.type === "exchange" && activeReturn.requested_size && (
                  <p className="text-xs text-white/80">
                    <span className="text-white/50">Requested Replacement Size: </span>
                    <span className="font-mono font-bold text-amber-300">
                      {activeReturn.requested_size}
                    </span>
                  </p>
                )}

                <p className="text-xs text-white/80">
                  <span className="text-white/50">Reason: </span>
                  {activeReturn.reason}
                </p>

                {activeReturn.customer_notes && (
                  <p className="text-xs text-white/60">
                    <span className="text-white/40">Your note: </span>
                    {activeReturn.customer_notes}
                  </p>
                )}

                {activeReturn.admin_notes && (
                  <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/80">
                    <span className="text-white/40 uppercase tracking-widest text-[10px] block">
                      Admin Update:
                    </span>
                    {activeReturn.admin_notes}
                  </div>
                )}

                {activeReturn.return_awb && (
                  <div className="mt-2 pt-1.5 border-t border-white/10 text-xs text-white/90">
                    <span className="text-white/50">Reverse Courier: </span>
                    <strong>{activeReturn.return_courier || "Shiprocket Partner"}</strong> · AWB:{" "}
                    <span className="font-mono text-sky-300">{activeReturn.return_awb}</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-white/40 pt-1">
                Submitted on {new Date(activeReturn.created_at).toLocaleDateString("en-IN")}. If you
                have questions, reach us at{" "}
                <a href="mailto:6xtn.in@gmail.com" className="text-white/70 underline">
                  6xtn.in@gmail.com
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-widest font-bold text-sky-400">
                  Shipment & Tracking Details
                </p>
                {awbNumber ? (
                  <p className="text-sm text-white/90 pt-0.5">
                    Courier: <strong className="text-white">{courierName || "Shiprocket Partner"}</strong> &nbsp;·&nbsp;
                    AWB: <span className="font-mono text-sky-300 font-semibold">{awbNumber}</span>
                  </p>
                ) : (
                  <p className="text-sm text-white/90 font-mono pt-1">{notes}</p>
                )}
                <p className="text-[11px] text-white/50">
                  Courier tracking updates are also dispatched to your email from{" "}
                  <span className="font-mono text-white/70">shipping@6xtn.in</span>.
                </p>
              </div>
            </div>

            {trackingLink && (
              <a
                href={trackingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest font-bold px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-black transition-colors self-start sm:self-center shrink-0"
              >
                Track Shipment <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons: Cancel or Return/Exchange */}
      <div className="flex justify-end items-center gap-3">
        {canRequestReturn && (
          <button
            type="button"
            onClick={() => setShowReturnModal(true)}
            className="text-xs uppercase tracking-widest font-bold px-4 py-2 border border-white/30 text-white hover:bg-white hover:text-black transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Request Return / Exchange
          </button>
        )}

        {isCancellable && (
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="text-xs uppercase tracking-widest px-4 py-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-colors flex items-center gap-1.5"
          >
            <Ban className="w-3.5 h-3.5" />
            Cancel Order
          </button>
        )}
      </div>

      {cancelSuccess && (
        <div className="p-3 border border-green-500/30 bg-green-950/20 text-green-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{cancelSuccess}</span>
        </div>
      )}

      {returnSuccess && (
        <div className="p-3 border border-green-500/30 bg-green-950/20 text-green-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{returnSuccess}</span>
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
              <code className="text-white bg-white/10 px-1 py-0.5">6xtn.in@gmail.com</code>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5 font-bold">
                  Cancellation Reason *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-black border border-white/20 p-2.5 text-xs text-white focus:outline-none focus:border-white/50"
                >
                  {CUSTOMER_CANCEL_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {cancelReason === "Other reason" && (
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

            {cancelError && <p className="text-xs text-red-400 pt-1">{cancelError}</p>}

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
                disabled={cancelLoading}
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs uppercase tracking-widest font-bold bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {cancelLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return & Exchange Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-white/20 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <ArrowLeftRight className="w-4 h-4 text-white" />
              <h3 className="font-display text-lg uppercase tracking-wider text-white">
                Request Return or Exchange
              </h3>
            </div>

            {/* Type Switcher */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">
                Select Request Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReturnType("exchange")}
                  className={`p-3 border text-left transition-colors flex items-center gap-2.5 ${
                    returnType === "exchange"
                      ? "border-white bg-white text-black"
                      : "border-white/15 bg-black text-white hover:border-white/40"
                  }`}
                >
                  <ArrowLeftRight className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">Exchange Size</div>
                    <div
                      className={`text-[10px] ${
                        returnType === "exchange" ? "text-black/70" : "text-white/50"
                      }`}
                    >
                      Swap for another size
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReturnType("return")}
                  className={`p-3 border text-left transition-colors flex items-center gap-2.5 ${
                    returnType === "return"
                      ? "border-white bg-white text-black"
                      : "border-white/15 bg-black text-white hover:border-white/40"
                  }`}
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">Return Item</div>
                    <div
                      className={`text-[10px] ${
                        returnType === "return" ? "text-black/70" : "text-white/50"
                      }`}
                    >
                      Refund to payment source
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Item Selection */}
            {items.length > 0 && (
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5 font-bold">
                  Select Item to {returnType === "exchange" ? "Exchange" : "Return"} *
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-black border border-white/20 p-2.5 text-xs text-white focus:outline-none focus:border-white/50"
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.product_name} {item.size ? `(Size: ${item.size})` : ""}{" "}
                      {item.quantity > 1 ? `× ${item.quantity}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* If Exchange: Requested Replacement Size with Real-Time Stock Validation */}
            {returnType === "exchange" && (
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold">
                    Desired Replacement Size *
                  </label>
                  {selectedItem?.size && (
                    <span className="text-[10px] text-white/40">
                      Your current size: <strong className="text-white font-mono">{selectedItem.size}</strong>
                    </span>
                  )}
                </div>

                {!hasAnyInStockForExchange ? (
                  <div className="p-3 bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs rounded-none">
                    ⚠️ All other sizes for this item are currently out of stock. Please select <strong>Return Item</strong> above to receive a full refund.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {itemSizes.map(({ size, stock, isCurrent, isOutOfStock, isSelectable }) => (
                      <button
                        key={size}
                        type="button"
                        disabled={!isSelectable}
                        onClick={() => isSelectable && setRequestedSize(size)}
                        className={`py-2 px-1 text-xs font-mono border transition-all flex flex-col items-center justify-center ${
                          !isSelectable
                            ? "opacity-30 cursor-not-allowed bg-white/5 border-white/10 text-white/40"
                            : requestedSize === size
                            ? "bg-white text-black font-bold border-white shadow-md scale-[1.02]"
                            : "bg-black text-white border-white/20 hover:border-white/50"
                        }`}
                      >
                        <span className={`text-xs font-bold ${isOutOfStock ? "line-through text-white/30" : ""}`}>
                          {size}
                        </span>
                        <span className="text-[9px] mt-0.5 tracking-tight font-sans whitespace-nowrap">
                          {isCurrent ? "Current" : isOutOfStock ? "Out of stock" : stock <= 3 ? `${stock} left` : "In stock"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5 font-bold">
                Reason *
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full bg-black border border-white/20 p-2.5 text-xs text-white focus:outline-none focus:border-white/50"
              >
                {RETURN_EXCHANGE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Notes */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5 font-bold">
                Additional Comments / Fit Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Share any details about fit or condition..."
                className="w-full bg-black border border-white/20 p-2.5 text-xs text-white focus:outline-none focus:border-white/50"
              />
            </div>

            {/* Policy Note */}
            <div className="p-3 bg-white/5 border border-white/10 text-[11px] text-white/60 space-y-1">
              <p className="font-semibold text-white/80">Policy Reminder:</p>
              <p>
                Garments must be unworn, unwashed, and in original condition with brand tags intact.
                Once approved, a reverse courier pickup will be initiated at your shipping address.
              </p>
            </div>

            {returnError && <p className="text-xs text-red-400">{returnError}</p>}

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 text-xs uppercase tracking-widest text-white/50 hover:text-white border border-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={returnLoading || (returnType === "exchange" && !hasAnyInStockForExchange)}
                onClick={handleConfirmReturn}
                className="px-5 py-2 text-xs uppercase tracking-widest font-bold bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                {returnLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Submit {returnType === "exchange" ? "Exchange" : "Return"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
