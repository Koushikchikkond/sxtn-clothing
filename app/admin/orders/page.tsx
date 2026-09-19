import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Orders — SXTN Admin" };

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending:   { bg: "#fffbeb", text: "#92400e", border: "#f59e0b" },
  paid:      { bg: "#eff6ff", text: "#1e40af", border: "#3b82f6" },
  confirmed: { bg: "#f5f3ff", text: "#5b21b6", border: "#8b5cf6" },
  shipped:   { bg: "#ecfeff", text: "#155e75", border: "#06b6d4" },
  delivered: { bg: "#f0fdf4", text: "#14532d", border: "#16a34a" },
  cancelled: { bg: "#fef2f2", text: "#991b1b", border: "#ef4444" },
};

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total, subtotal, shipping_fee, created_at, user_id, guest_email, shipping_address")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", color: "#000" }}>
          Orders ({orders?.length ?? 0})
        </h1>
      </div>

      {!orders || orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fff", border: "1px solid #e5e5e5" }}>
          <p style={{ color: "#999", fontSize: "0.9rem" }}>No orders yet.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                {["Order ID", "Customer", "Date", "Status", "Total", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#000" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(orders as any[]).map((order) => {
                const colors = STATUS_COLORS[order.status] ?? { bg: "#f9f9f9", text: "#000", border: "#ccc" };
                const address = order.shipping_address as any;
                const customerLabel = order.guest_email
                  ? order.guest_email
                  : address?.full_name
                  ? address.full_name
                  : order.user_id
                  ? `User #${order.user_id.slice(0, 6)}`
                  : "Guest";

                return (
                  <tr key={order.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700, color: "#000" }}>
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#555", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {customerLabel}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "0.78rem", color: "#666" }}>
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "#000" }}>
                      ₹{order.total?.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#000", textDecoration: "none", border: "1px solid #000", padding: "4px 10px" }}
                      >
                        View
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
