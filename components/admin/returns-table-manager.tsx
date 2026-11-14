"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  RotateCcw,
  ArrowLeftRight,
  Search,
  ExternalLink,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
} from "lucide-react";
import type { OrderReturn } from "@/types/database.types";

export interface ReturnWithOrder extends OrderReturn {
  orders?: {
    id: string;
    guest_email: string | null;
    user_id: string | null;
    shipping_address: any;
    status: string;
    total: number;
  } | null;
}

interface ReturnsTableManagerProps {
  initialReturns: ReturnWithOrder[];
}

const STATUS_BADGE_STYLE: Record<
  OrderReturn["status"],
  { bg: string; text: string; border: string; label: string }
> = {
  requested: { bg: "#fef3c7", text: "#92400e", border: "#f59e0b", label: "Requested" },
  approved:  { bg: "#ede9fe", text: "#5b21b6", border: "#8b5cf6", label: "Approved" },
  picked_up: { bg: "#e0f2fe", text: "#0369a1", border: "#0284c7", label: "In Transit" },
  completed: { bg: "#d1fae5", text: "#065f46", border: "#10b981", label: "Completed" },
  rejected:  { bg: "#fee2e2", text: "#991b1b", border: "#ef4444", label: "Rejected" },
};

export function ReturnsTableManager({ initialReturns }: ReturnsTableManagerProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    return {
      all: initialReturns.length,
      requested: initialReturns.filter((r) => r.status === "requested").length,
      approved: initialReturns.filter((r) => r.status === "approved" || r.status === "picked_up").length,
      completed: initialReturns.filter((r) => r.status === "completed").length,
      rejected: initialReturns.filter((r) => r.status === "rejected").length,
      exchanges: initialReturns.filter((r) => r.type === "exchange").length,
      returns: initialReturns.filter((r) => r.type === "return").length,
    };
  }, [initialReturns]);

  const filtered = useMemo(() => {
    return initialReturns.filter((item) => {
      if (filterStatus === "pending" && item.status !== "requested") return false;
      if (filterStatus === "in_progress" && !["approved", "picked_up"].includes(item.status)) return false;
      if (filterStatus !== "all" && filterStatus !== "pending" && filterStatus !== "in_progress" && item.status !== filterStatus) {
        return false;
      }
      if (filterType !== "all" && item.type !== filterType) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const orderIdMatch = item.order_id.toLowerCase().includes(query);
        const productMatch = item.product_name.toLowerCase().includes(query);
        const reasonMatch = item.reason.toLowerCase().includes(query);
        const customerMatch =
          item.orders?.guest_email?.toLowerCase().includes(query) ||
          item.orders?.shipping_address?.full_name?.toLowerCase().includes(query);

        if (!orderIdMatch && !productMatch && !reasonMatch && !customerMatch) {
          return false;
        }
      }

      return true;
    });
  }, [initialReturns, filterStatus, filterType, search]);

  return (
    <div>
      {/* Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", padding: "1rem", borderRadius: "4px" }}>
          <p style={{ margin: "0 0 6px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#888", letterSpacing: "0.08em" }}>
            Total Requests
          </p>
          <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, color: "#000" }}>
            {counts.all}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#666" }}>
            {counts.exchanges} Exchanges · {counts.returns} Returns
          </p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #f59e0b", padding: "1rem", borderRadius: "4px" }}>
          <p style={{ margin: "0 0 6px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#d97706", letterSpacing: "0.08em" }}>
            Pending Review
          </p>
          <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, color: "#d97706" }}>
            {counts.requested}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#92400e" }}>
            Awaiting admin action
          </p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #8b5cf6", padding: "1rem", borderRadius: "4px" }}>
          <p style={{ margin: "0 0 6px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#7c3aed", letterSpacing: "0.08em" }}>
            Approved / In Transit
          </p>
          <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, color: "#7c3aed" }}>
            {counts.approved}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#5b21b6" }}>
            Reverse pickup underway
          </p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #10b981", padding: "1rem", borderRadius: "4px" }}>
          <p style={{ margin: "0 0 6px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#059669", letterSpacing: "0.08em" }}>
            Completed
          </p>
          <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, color: "#059669" }}>
            {counts.completed}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#065f46" }}>
            Processed & resolved
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e5e5",
          padding: "1rem",
          borderRadius: "4px",
          marginBottom: "1rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        {/* Status Tabs */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: `All (${counts.all})` },
            { id: "pending", label: `Pending (${counts.requested})` },
            { id: "in_progress", label: `In Transit (${counts.approved})` },
            { id: "completed", label: `Completed (${counts.completed})` },
            { id: "rejected", label: `Rejected (${counts.rejected})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "6px 12px",
                border: filterStatus === tab.id ? "1px solid #000" : "1px solid #e5e5e5",
                background: filterStatus === tab.id ? "#000" : "#fff",
                color: filterStatus === tab.id ? "#fff" : "#555",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type Filter & Search */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: "6px 10px",
              fontSize: "0.75rem",
              fontWeight: 600,
              border: "1px solid #ccc",
              borderRadius: "3px",
              background: "#fff",
            }}
          >
            <option value="all">All Types</option>
            <option value="exchange">Exchanges Only</option>
            <option value="return">Returns Only</option>
          </select>

          <div style={{ position: "relative", minWidth: "220px" }}>
            <Search
              style={{
                position: "absolute",
                left: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "14px",
                height: "14px",
                color: "#888",
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order, item, email..."
              style={{
                width: "100%",
                padding: "6px 10px 6px 28px",
                fontSize: "0.75rem",
                border: "1px solid #ccc",
                borderRadius: "3px",
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: "4px",
          }}
        >
          <Package style={{ width: "36px", height: "36px", color: "#bbb", margin: "0 auto 12px" }} />
          <p style={{ color: "#000", fontWeight: 700, fontSize: "0.95rem", margin: "0 0 4px" }}>
            No Return or Exchange Requests Found
          </p>
          <p style={{ color: "#888", fontSize: "0.8rem", margin: 0 }}>
            {search || filterStatus !== "all" || filterType !== "all"
              ? "Try adjusting your search query or filter selection."
              : "When customers request a return or size exchange on delivered orders, they will appear here."}
          </p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "850px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                {["Type", "Order #", "Customer", "Item & Size", "Reason / Notes", "Status", "Date", "Action"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 14px",
                        textAlign: "left",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#000",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const badge = STATUS_BADGE_STYLE[item.status] || STATUS_BADGE_STYLE.requested;
                const customer =
                  item.orders?.guest_email ||
                  item.orders?.shipping_address?.full_name ||
                  (item.user_id ? `User #${item.user_id.slice(0, 6)}` : "Customer");

                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    {/* Type */}
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          padding: "3px 8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          backgroundColor: item.type === "exchange" ? "#fef3c7" : "#ede9fe",
                          color: item.type === "exchange" ? "#92400e" : "#5b21b6",
                          border: `1px solid ${item.type === "exchange" ? "#f59e0b" : "#8b5cf6"}`,
                        }}
                      >
                        {item.type === "exchange" ? (
                          <ArrowLeftRight style={{ width: "10px", height: "10px" }} />
                        ) : (
                          <RotateCcw style={{ width: "10px", height: "10px" }} />
                        )}
                        {item.type}
                      </span>
                    </td>

                    {/* Order # */}
                    <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700 }}>
                      <Link
                        href={`/admin/orders/${item.order_id}`}
                        style={{ color: "#000", textDecoration: "underline" }}
                      >
                        #{item.order_id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>

                    {/* Customer */}
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: "0.78rem",
                        color: "#555",
                        maxWidth: "140px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {customer}
                    </td>

                    {/* Item & Size */}
                    <td style={{ padding: "12px 14px", fontSize: "0.8rem" }}>
                      <div style={{ fontWeight: 600, color: "#000" }}>{item.product_name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#666", marginTop: "2px" }}>
                        Original: <strong style={{ color: "#000" }}>{item.original_size || "—"}</strong>
                        {item.type === "exchange" && item.requested_size && (
                          <span>
                            {" "}
                            ➔ Desired:{" "}
                            <strong style={{ color: "#d97706", background: "#fef3c7", padding: "1px 4px" }}>
                              {item.requested_size}
                            </strong>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Reason & Notes */}
                    <td style={{ padding: "12px 14px", fontSize: "0.78rem", maxWidth: "200px" }}>
                      <div style={{ color: "#333", fontWeight: 500 }}>{item.reason}</div>
                      {item.customer_notes && (
                        <div style={{ fontSize: "0.7rem", color: "#777", marginTop: "2px", fontStyle: "italic" }}>
                          &ldquo;{item.customer_notes}&rdquo;
                        </div>
                      )}
                      {item.return_awb && (
                        <div style={{ fontSize: "0.68rem", color: "#0284c7", marginTop: "3px", fontFamily: "monospace" }}>
                          AWB: {item.return_awb} ({item.return_courier || "Courier"})
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          padding: "3px 8px",
                          backgroundColor: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "12px 14px", fontSize: "0.75rem", color: "#666", whiteSpace: "nowrap" }}>
                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>

                    {/* Action */}
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <Link
                        href={`/admin/orders/${item.order_id}`}
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#000",
                          textDecoration: "none",
                          border: "1px solid #000",
                          padding: "4px 10px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        Manage <ExternalLink style={{ width: "11px", height: "11px" }} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

