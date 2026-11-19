import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Orders — 6XTN Admin" };

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending:   { bg: "#fffbeb", text: "#92400e", border: "#f59e0b" },
  paid:      { bg: "#eff6ff", text: "#1e40af", border: "#3b82f6" },
  confirmed: { bg: "#f5f3ff", text: "#5b21b6", border: "#8b5cf6" },
  shipped:   { bg: "#ecfeff", text: "#155e75", border: "#06b6d4" },
  delivered: { bg: "#f0fdf4", text: "#14532d", border: "#16a34a" },
  cancelled: { bg: "#fef2f2", text: "#991b1b", border: "#ef4444" },
};

export default async function AdminOrdersPage(props: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const searchParams = await props.searchParams;
  const isLogsView = searchParams?.view === "logs";
  const supabase = await createClient();

  const { data: allOrders } = await supabase
    .from("orders")
    .select("id, status, total, subtotal, shipping_fee, created_at, user_id, guest_email, shipping_address")
    .order("created_at", { ascending: false });

  const orderList = (allOrders as any[]) || [];
  const paidOrders = orderList.filter((o) => o.status !== "pending");
  const pendingLogs = orderList.filter((o) => o.status === "pending");

  const orders = isLogsView ? pendingLogs : paidOrders;

  const { data: allReturns } = await (supabase.from("order_returns") as any)
    .select("id, order_id, type, status");

  const returnsByOrderId = ((allReturns as any[]) || []).reduce((acc: Record<string, any>, item: any) => {
    if (!acc[item.order_id] || item.status === "requested") {
      acc[item.order_id] = item;
    }
    return acc;
  }, {});

  const pendingReturnCount = ((allReturns as any[]) || []).filter(
    (r) => r.status === "requested"
  ).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", color: "#000", margin: 0 }}>
            {isLogsView ? `Order Logs (${pendingLogs.length})` : `Orders (${paidOrders.length})`}
          </h1>
          <p style={{ fontSize: "0.78rem", color: "#666", marginTop: "4px", marginBottom: 0 }}>
            {isLogsView
              ? "Pre-saved checkout sessions awaiting payment or abandoned checkouts."
              : "Confirmed and paid orders ready for fulfillment and tracking."}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <Link
            href="/admin/orders"
            style={{
              fontSize: "0.74rem",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "7px 14px",
              textDecoration: "none",
              backgroundColor: !isLogsView ? "#000" : "#fff",
              color: !isLogsView ? "#fff" : "#444",
              border: "1px solid #000",
              borderRadius: "4px",
              transition: "all 0.15s",
            }}
          >
            Paid Orders ({paidOrders.length})
          </Link>

          <Link
            href="/admin/orders?view=logs"
            style={{
              fontSize: "0.74rem",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "7px 14px",
              textDecoration: "none",
              backgroundColor: isLogsView ? "#000" : "#fff",
              color: isLogsView ? "#fff" : "#666",
              border: isLogsView ? "1px solid #000" : "1px solid #ccc",
              borderRadius: "4px",
              transition: "all 0.15s",
            }}
          >
            📋 Order Logs ({pendingLogs.length})
          </Link>

          {pendingReturnCount > 0 && (
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "6px 12px",
                backgroundColor: "#fef3c7",
                color: "#92400e",
                border: "1px solid #f59e0b",
                borderRadius: "4px",
              }}
            >
              ⚠️ {pendingReturnCount} Pending Return{pendingReturnCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fff", border: "1px solid #e5e5e5" }}>
          <p style={{ color: "#999", fontSize: "0.9rem" }}>
            {isLogsView ? "No pending order logs." : "No paid orders yet."}
          </p>
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
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                          {order.status}
                        </span>
                        {returnsByOrderId[order.id] && (
                          <span
                            style={{
                              fontSize: "0.58rem",
                              fontWeight: 800,
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                              padding: "2px 6px",
                              backgroundColor: returnsByOrderId[order.id].type === "exchange" ? "#fef3c7" : "#ede9fe",
                              color: returnsByOrderId[order.id].type === "exchange" ? "#92400e" : "#5b21b6",
                              border: `1px solid ${returnsByOrderId[order.id].type === "exchange" ? "#f59e0b" : "#8b5cf6"}`,
                            }}
                          >
                            {returnsByOrderId[order.id].type}: {returnsByOrderId[order.id].status.replace("_", " ")}
                          </span>
                        )}
                      </div>
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
