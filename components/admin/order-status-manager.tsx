"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, CheckCircle2, Truck, PackageCheck, Ban, Check } from "lucide-react";

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

export function OrderStatusManager({
  orderId,
  initialStatus,
  customerEmail,
}: OrderStatusManagerProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal / prompt for shipping info
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [courierName, setCourierName] = useState("Delhivery");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  async function handleUpdateStatus(
    newStatus: string,
    shippingMeta?: { courierName: string; trackingNumber: string; trackingUrl: string }
  ) {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          courierName: shippingMeta?.courierName,
          trackingNumber: shippingMeta?.trackingNumber,
          trackingUrl: shippingMeta?.trackingUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status.");
      }

      setStatus(newStatus);
      setShowShippingModal(false);

      const emailNote = data.emailSent
        ? `Status changed to ${newStatus.toUpperCase()} and notification email sent to ${customerEmail || "customer"}!`
        : `Status changed to ${newStatus.toUpperCase()}.`;

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
            Order Management & Customer Notification
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
            onClick={() => {
              if (confirm("Are you sure you want to cancel this order? An email notification will be sent to the customer.")) {
                handleUpdateStatus("cancelled");
              }
            }}
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
          Updating status and sending customer email via Resend…
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

      {/* Dispatch Details Modal */}
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
              Dispatch Order
            </h4>
            <p style={{ fontSize: "0.75rem", color: "#666", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Enter tracking info to send an automated <strong>&quot;Out for Delivery&quot;</strong> email with tracking details to <strong>{customerEmail || "the customer"}</strong>.
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
    </div>
  );
}
