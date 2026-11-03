"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, CheckCircle2, Clock, Mail, ExternalLink, Loader2 } from "lucide-react";

export interface DemandItem {
  id: string;
  product_id: string;
  variant_id?: string | null;
  size?: string | null;
  email: string;
  status: "pending" | "notified";
  created_at: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    product_images?: Array<{ url: string; position: number }>;
  } | null;
}

interface DemandsManagerProps {
  initialDemands: DemandItem[];
}

export function DemandsManager({ initialDemands }: DemandsManagerProps) {
  const [demands, setDemands] = useState<DemandItem[]>(initialDemands);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleUpdateStatus(id: string, newStatus: "pending" | "notified") {
    setLoadingId(id);
    try {
      const res = await fetch("/api/demands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setDemands((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
        );
      }
    } catch (err) {
      console.error("Failed to update demand status:", err);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this customer demand request?")) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/demands?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDemands((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete demand:", err);
    } finally {
      setLoadingId(null);
    }
  }

  const pendingCount = demands.filter((d) => d.status === "pending").length;
  const uniqueProducts = new Set(demands.map((d) => d.product_id)).size;
  const uniqueEmails = new Set(demands.map((d) => d.email)).size;

  return (
    <div>
      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", padding: "1.25rem", borderRadius: "4px" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", margin: "0 0 6px" }}>
            Total Demands
          </p>
          <p style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, color: "#000" }}>
            {demands.length}
          </p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e5e5", padding: "1.25rem", borderRadius: "4px" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", margin: "0 0 6px" }}>
            Pending Restock
          </p>
          <p style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, color: "#d97706" }}>
            {pendingCount}
          </p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e5e5", padding: "1.25rem", borderRadius: "4px" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", margin: "0 0 6px" }}>
            Items Demanded
          </p>
          <p style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, color: "#000" }}>
            {uniqueProducts}
          </p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e5e5", padding: "1.25rem", borderRadius: "4px" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", margin: "0 0 6px" }}>
            Unique Customers
          </p>
          <p style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, color: "#000" }}>
            {uniqueEmails}
          </p>
        </div>
      </div>

      {/* Demands Table */}
      {demands.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px" }}>
          <Clock style={{ width: "36px", height: "36px", color: "#ccc", margin: "0 auto 12px" }} />
          <p style={{ color: "#666", fontSize: "0.9rem", margin: 0 }}>
            No customer demands yet. When out-of-stock items receive &ldquo;Notify Me&rdquo; requests, they will show up here.
          </p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "750px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                {["Product", "Size", "Customer Email", "Requested On", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#000",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {demands.map((demand) => {
                const cover = demand.product?.product_images?.[0];
                const isPending = demand.status === "pending";
                const isLoading = loadingId === demand.id;

                return (
                  <tr key={demand.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    {/* Product */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "42px",
                            height: "52px",
                            background: "#f5f5f5",
                            borderRadius: "3px",
                            overflow: "hidden",
                            position: "relative",
                            flexShrink: 0,
                          }}
                        >
                          {cover?.url ? (
                            <Image src={cover.url} alt={demand.product?.name || "Product"} fill style={{ objectFit: "cover" }} sizes="42px" />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", color: "#aaa" }}>
                              NO IMG
                            </div>
                          )}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", color: "#000" }}>
                            {demand.product?.name || "Unknown Product"}
                          </p>
                          {demand.product?.id && (
                            <Link
                              href={`/admin/products/${demand.product.id}`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                fontSize: "0.7rem",
                                color: "#0284c7",
                                textDecoration: "none",
                                marginTop: "3px",
                              }}
                            >
                              Restock item <ExternalLink style={{ width: "10px", height: "10px" }} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Size */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          background: "#f3f4f6",
                          border: "1px solid #e5e7eb",
                          padding: "2px 8px",
                          borderRadius: "3px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#111",
                        }}
                      >
                        {demand.size || "Any Size"}
                      </span>
                    </td>

                    {/* Email */}
                    <td style={{ padding: "12px 16px" }}>
                      <a
                        href={`mailto:${demand.email}?subject=6XTN - ${demand.product?.name || "Item"} is back in stock!`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "#000",
                          textDecoration: "none",
                          fontSize: "0.8rem",
                          fontWeight: 500,
                        }}
                      >
                        <Mail style={{ width: "12px", height: "12px", color: "#888" }} />
                        {demand.email}
                      </a>
                    </td>

                    {/* Requested On */}
                    <td style={{ padding: "12px 16px", fontSize: "0.78rem", color: "#666" }}>
                      {new Date(demand.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: "3px",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          background: isPending ? "#fef3c7" : "#d1fae5",
                          color: isPending ? "#b45309" : "#065f46",
                        }}
                      >
                        {demand.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isPending ? (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleUpdateStatus(demand.id, "notified")}
                            title="Mark as notified"
                            style={{
                              border: "1px solid #e5e7eb",
                              background: "#fff",
                              color: "#059669",
                              padding: "4px 8px",
                              borderRadius: "3px",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <CheckCircle2 style={{ width: "12px", height: "12px" }} />
                            Notified
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleUpdateStatus(demand.id, "pending")}
                            title="Revert to pending"
                            style={{
                              border: "1px solid #e5e7eb",
                              background: "#fff",
                              color: "#666",
                              padding: "4px 8px",
                              borderRadius: "3px",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Revert
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleDelete(demand.id)}
                          title="Delete demand"
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "4px",
                          }}
                        >
                          <Trash2 style={{ width: "14px", height: "14px" }} />
                        </button>
                      </div>
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

