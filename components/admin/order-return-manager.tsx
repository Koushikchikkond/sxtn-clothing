"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Truck,
  Clock,
  Loader2,
  Package,
  Save,
} from "lucide-react";
import type { OrderReturn } from "@/types/database.types";

interface OrderReturnManagerProps {
  orderId: string;
  initialReturns: OrderReturn[];
}

const STATUS_BADGE_STYLE: Record<
  OrderReturn["status"],
  { bg: string; text: string; border: string; label: string }
> = {
  requested: { bg: "#fef3c7", text: "#92400e", border: "#f59e0b", label: "Requested" },
  approved:  { bg: "#ede9fe", text: "#5b21b6", border: "#8b5cf6", label: "Approved (Pickup Pending)" },
  picked_up: { bg: "#e0f2fe", text: "#0369a1", border: "#0284c7", label: "Picked Up (In Transit)" },
  completed: { bg: "#d1fae5", text: "#065f46", border: "#10b981", label: "Completed" },
  rejected:  { bg: "#fee2e2", text: "#991b1b", border: "#ef4444", label: "Rejected" },
};

export function OrderReturnManager({ orderId, initialReturns }: OrderReturnManagerProps) {
  const router = useRouter();
  const [returns, setReturns] = useState<OrderReturn[]>(initialReturns);
  const [activeReturnId, setActiveReturnId] = useState<string>(initialReturns[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const activeReturn = returns.find((r) => r.id === activeReturnId) || returns[0];

  // Form states for the currently selected return
  const [status, setStatus] = useState<OrderReturn["status"]>(activeReturn?.status || "requested");
  const [returnAwb, setReturnAwb] = useState<string>(activeReturn?.return_awb || "");
  const [returnCourier, setReturnCourier] = useState<string>(activeReturn?.return_courier || "Shiprocket Reverse");
  const [adminNotes, setAdminNotes] = useState<string>(activeReturn?.admin_notes || "");

  if (!activeReturn) return null;

  async function handleUpdateStatus(newStatus?: OrderReturn["status"]) {
    setLoading(true);
    setMessage(null);

    const targetStatus = newStatus || status;

    try {
      const res = await fetch(`/api/admin/returns/${activeReturn.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          returnAwb: returnAwb.trim() || undefined,
          returnCourier: returnCourier.trim() || undefined,
          adminNotes: adminNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update return request.");
      }

      setStatus(targetStatus);
      setReturns((prev) =>
        prev.map((r) => (r.id === activeReturn.id ? { ...r, ...data.returnRequest } : r))
      );
      setMessage({ text: `Request marked as ${targetStatus}.`, type: "success" });
      router.refresh();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Error updating return status",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const badge = STATUS_BADGE_STYLE[activeReturn.status] || STATUS_BADGE_STYLE.requested;

  return (
    <div
      style={{
        background: "#fff",
        border: "2px solid #000",
        borderRadius: "4px",
        marginBottom: "1.5rem",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#000",
          color: "#fff",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {activeReturn.type === "exchange" ? (
            <ArrowLeftRight style={{ width: "16px", height: "16px", color: "#facc15" }} />
          ) : (
            <RotateCcw style={{ width: "16px", height: "16px", color: "#60a5fa" }} />
          )}
          <span style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Customer {activeReturn.type === "exchange" ? "Exchange (Size Swap)" : "Return (Refund)"} Request
          </span>
        </div>

        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "3px 10px",
            backgroundColor: badge.bg,
            color: badge.text,
            border: `1px solid ${badge.border}`,
          }}
        >
          {badge.label}
        </span>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Request Overview Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px",
            background: "#f9f9f9",
            border: "1px solid #e5e5e5",
            padding: "14px",
            marginBottom: "16px",
          }}
        >
          <div>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#888", textTransform: "uppercase", display: "block", letterSpacing: "0.08em" }}>
              Product / Item
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#000" }}>
              {activeReturn.product_name}
            </span>
          </div>

          <div>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#888", textTransform: "uppercase", display: "block", letterSpacing: "0.08em" }}>
              Original Size
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "monospace", color: "#000" }}>
              {activeReturn.original_size || "—"}
            </span>
          </div>

          {activeReturn.type === "exchange" && (
            <div>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#888", textTransform: "uppercase", display: "block", letterSpacing: "0.08em" }}>
                Replacement Size Requested
              </span>
              <span
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 900,
                  fontFamily: "monospace",
                  color: "#d97706",
                  background: "#fef3c7",
                  padding: "2px 8px",
                  borderRadius: "2px",
                }}
              >
                {activeReturn.requested_size || "—"}
              </span>
            </div>
          )}

          <div>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#888", textTransform: "uppercase", display: "block", letterSpacing: "0.08em" }}>
              Customer Reason
            </span>
            <span style={{ fontSize: "0.82rem", color: "#222", fontWeight: 600 }}>
              {activeReturn.reason}
            </span>
          </div>

          <div>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#888", textTransform: "uppercase", display: "block", letterSpacing: "0.08em" }}>
              Requested On
            </span>
            <span style={{ fontSize: "0.8rem", color: "#555" }}>
              {new Date(activeReturn.created_at).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {activeReturn.customer_notes && (
          <div
            style={{
              padding: "10px 14px",
              background: "#fff",
              border: "1px solid #e5e5e5",
              marginBottom: "16px",
              fontSize: "0.8rem",
              color: "#444",
            }}
          >
            <strong style={{ color: "#000", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
              Customer Remarks:
            </strong>
            {activeReturn.customer_notes}
          </div>
        )}

        {/* Quick Action Buttons */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              fontSize: "0.7rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#000",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Action / Status Transition:
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleUpdateStatus("approved")}
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "8px 14px",
                background: "#7c3aed",
                color: "#fff",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              ✓ Approve Request
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleUpdateStatus("picked_up")}
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "8px 14px",
                background: "#0284c7",
                color: "#fff",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              🚚 Mark Picked Up
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleUpdateStatus("completed")}
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "8px 14px",
                background: "#059669",
                color: "#fff",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              🎉 Mark Completed
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleUpdateStatus("rejected")}
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "8px 14px",
                background: "#dc2626",
                color: "#fff",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              ✕ Reject Request
            </button>
          </div>
        </div>

        {/* Reverse Logistics & Admin Notes Fields */}
        <div
          style={{
            borderTop: "1px solid #eee",
            paddingTop: "14px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "#666", display: "block", marginBottom: "4px" }}>
              Reverse Courier Name
            </label>
            <input
              type="text"
              value={returnCourier}
              onChange={(e) => setReturnCourier(e.target.value)}
              placeholder="e.g. Shiprocket, Delhivery, Bluedart"
              style={{
                width: "100%",
                padding: "7px 10px",
                border: "1px solid #ccc",
                fontSize: "0.8rem",
                borderRadius: "3px",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "#666", display: "block", marginBottom: "4px" }}>
              Reverse Pickup AWB Number
            </label>
            <input
              type="text"
              value={returnAwb}
              onChange={(e) => setReturnAwb(e.target.value)}
              placeholder="e.g. 14209384723"
              style={{
                width: "100%",
                padding: "7px 10px",
                border: "1px solid #ccc",
                fontSize: "0.8rem",
                fontFamily: "monospace",
                borderRadius: "3px",
              }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "#666", display: "block", marginBottom: "4px" }}>
              Admin Notes / Instructions (Visible to Customer)
            </label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Request approved. Reverse pickup scheduled for tomorrow. Please keep packet ready with brand tags intact."
              style={{
                width: "100%",
                padding: "7px 10px",
                border: "1px solid #ccc",
                fontSize: "0.8rem",
                borderRadius: "3px",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px", gap: "10px", alignItems: "center" }}>
          {message && (
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: message.type === "success" ? "#059669" : "#dc2626",
              }}
            >
              {message.text}
            </span>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => handleUpdateStatus()}
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "7px 16px",
              background: "#000",
              color: "#fff",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {loading ? <Loader2 style={{ width: "12px", height: "12px", animation: "spin 1s linear infinite" }} /> : <Save style={{ width: "12px", height: "12px" }} />}
            Save Tracking & Notes
          </button>
        </div>
      </div>
    </div>
  );
}

