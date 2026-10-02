"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, CheckCircle2, Truck, PackageCheck, Ban, Check, AlertTriangle } from "lucide-react";

interface OrderStatusManagerProps {
  orderId: string;
  initialStatus: string;
  customerEmail?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#f59e0b", bg: "#fef3c7" },
  paid: { label: "Paid", color: "#3b82f6", bg: "#dbeafe" },
  confirmed: { label: "Confirmed", color: "#8b5cf6", bg: "#ede9fe" },
  shipped: { label: "Shipped", color: "#0284c7", bg: "#e0f2fe" },
  delivered: { label: "Delivered", color: "#10b981", bg: "#d1fae5" },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "#fee2e2" },
};

const CANCEL_REASONS = [
  "Customer requested cancellation",
  "Incorrect size or variant selected by customer",
  "Item out of stock / inventory adjustment",
  "Delivery address unreachable or invalid",
  "Payment verification issue or duplicate order",
  "Customer changed mind / personal reasons",
  "Other (custom reason)",
];

export function OrderStatusManager({
  orderId,
  initialStatus,
  customerEmail,
}: OrderStatusManagerProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Dispatch / Shipping Modal
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [courierName, setCourierName] = useState("Delhivery");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  // Cancel Modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [autoRefund, setAutoRefund] = useState(true);

  async function handleUpdateStatus(
    newStatus: string,
    meta?: {
      courierName?: string;
      trackingNumber?: string;
      trackingUrl?: string;
      reason?: string;
      notes?: string;
      autoRefund?: boolean;
    }
  ) {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          courierName: meta?.courierName,
          trackingNumber: meta?.trackingNumber,
          trackingUrl: meta?.trackingUrl,
          reason: meta?.reason,
          notes: meta?.notes,
          autoRefund: meta?.autoRefund,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status.");
      }

      setStatus(newStatus);
      setShowShippingModal(false);
      setShowCancelModal(false);

      const emailNote = data.emailSent
        ? `Status updated to ${newStatus.toUpperCase()}! Notification email sent to ${customerEmail || "customer"} via Resend.`
        : `Status updated to ${newStatus.toUpperCase()} in database.`;

      setMessage({ text: emailNote, type: "success" });
      router.refresh();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Error updating status",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const currentCfg = STATUS_CONFIG[status] || { label: status, color: "#666", bg: "#f3f4f6" };

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", padding: "1rem", marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
        <div>
          <h3 style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#000", margin: 0 }}>
            Order Fulfillment & Notification Automation
          </h3>
          <p style={{ fontSize: "0.75rem", color: "#666", margin: "4px 0 0 0" }}>
            Customer Email: <strong style={{ color: "#000" }}>{customerEmail || "No email on record"}</strong>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: currentCfg.color, background: currentCfg.bg, padding: "4px 10px", borderRadius: "3px" }}>
            Current: {currentCfg.label}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        {status !== "confirmed" && status !== "shipped" && status !== "delivered" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => handleUpdateStatus("confirmed")}
            style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "6px 12px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer" }}
          >
            <Check className="w-3 h-3" />
            Confirm Order
          </button>
        )}

        {status !== "shipped" && status !== "delivered" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowShippingModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "6px 12px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer" }}
          >
            <Truck className="w-3 h-3" />
            Dispatch / Ship
          </button>
        )}

        {status !== "delivered" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => handleUpdateStatus("delivered")}
            style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "6px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer" }}
          >
            <PackageCheck className="w-3 h-3" />
            Mark Delivered
          </button>
        )}

        {status !== "cancelled" && status !== "delivered" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowCancelModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "6px 12px", background: "#fff", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "3px", cursor: "pointer", marginLeft: "auto" }}
          >
            <Ban className="w-3 h-3" />
            Cancel Order
          </button>
        )}
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#666", marginTop: "10px" }}>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Updating Supabase database and sending customer notification email via Resend…
        </div>
      )}

      {message && (
        <div
          style={{
            marginTop: "10px",
            padding: "8px 12px",
            borderRadius: "3px",
            fontSize: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
            color: message.type === "success" ? "#166534" : "#991b1b",
            border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
          }}
        >
          {message.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ── Dispatch Details Modal ───────────────────────── */}
      {showShippingModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div style={{ background: "#fff", borderRadius: "6px", maxWidth: "440px", width: "100%", padding: "20px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <h4 style={{ fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", margin: "0 0 8px 0", color: "#000" }}>
              Dispatch / Out for Delivery
            </h4>
            <p style={{ fontSize: "0.75rem", color: "#666", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Enter tracking info to record in Supabase and send an automated <strong>&quot;Out for Delivery&quot;</strong> email to <strong>{customerEmail || "the customer"}</strong> from <code>shipping@6xtn.in</code>.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "4px" }}>
                  Courier Service Name
                </label>
                <input
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Delhivery, Bluedart, DTDC"
                  style={{ width: "100%", padding: "8px 10px", fontSize: "0.85rem", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "4px" }}>
                  Tracking / AWB Number
                </label>
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 14238741829"
                  style={{ width: "100%", padding: "8px 10px", fontSize: "0.85rem", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "4px" }}>
                  Tracking Link URL (Optional)
                </label>
                <input
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://track.courier.com/..."
                  style={{ width: "100%", padding: "8px 10px", fontSize: "0.85rem", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setShowShippingModal(false)}
                style={{ padding: "8px 14px", fontSize: "0.75rem", border: "1px solid #ccc", background: "#fff", color: "#555", borderRadius: "4px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleUpdateStatus("shipped", {
                    courierName: courierName.trim(),
                    trackingNumber: trackingNumber.trim(),
                    trackingUrl: trackingUrl.trim(),
                  })
                }
                style={{ padding: "8px 16px", fontSize: "0.75rem", fontWeight: 700, background: "#0284c7", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                {loading ? "Sending..." : "Dispatch & Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Order Modal with Reasons ───────────────── */}
      {showCancelModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div style={{ background: "#fff", borderRadius: "6px", maxWidth: "460px", width: "100%", padding: "20px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <AlertTriangle style={{ width: "18px", height: "18px", color: "#ef4444" }} />
              <h4 style={{ fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", margin: 0, color: "#ef4444" }}>
                Cancel Order
              </h4>
            </div>

            <p style={{ fontSize: "0.75rem", color: "#666", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Select a reason for cancellation. This will be permanently saved to Supabase and included in the cancellation notification email sent to <strong>{customerEmail || "the customer"}</strong> from <code>support@6xtn.in</code>.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "4px" }}>
                  Cancellation Reason *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", fontSize: "0.85rem", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }}
                >
                  {CANCEL_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {cancelReason === "Other (custom reason)" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "4px" }}>
                    Custom Reason / Notes *
                  </label>
                  <textarea
                    rows={3}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter details about why this order was cancelled..."
                    style={{ width: "100%", padding: "8px 10px", fontSize: "0.85rem", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }}
                  />
                </div>
              )}

              {status === "paid" && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "10px", borderRadius: "4px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.78rem", color: "#991b1b", fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={autoRefund}
                      onChange={(e) => setAutoRefund(e.target.checked)}
                      style={{ cursor: "pointer" }}
                    />
                    <span>Process automatic refund via Razorpay API</span>
                  </label>
                  <p style={{ margin: "4px 0 0 22px", fontSize: "0.7rem", color: "#b91c1c", lineHeight: 1.4 }}>
                    Razorpay will immediately refund the customer&apos;s source account and record the refund ID in the database.
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                style={{ padding: "8px 14px", fontSize: "0.75rem", border: "1px solid #ccc", background: "#fff", color: "#555", borderRadius: "4px", cursor: "pointer" }}
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  const finalReason =
                    cancelReason === "Other (custom reason)"
                      ? customReason.trim() || "Administrative cancellation"
                      : cancelReason;
                  handleUpdateStatus("cancelled", {
                    reason: finalReason,
                    notes: finalReason,
                    autoRefund: status === "paid" ? autoRefund : false,
                  });
                }}
                style={{ padding: "8px 16px", fontSize: "0.75rem", fontWeight: 700, background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                {loading ? "Cancelling..." : "Confirm Cancellation & Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
