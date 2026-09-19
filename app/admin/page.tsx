import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [{ count: productCount }, { count: orderCount }] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("orders").select("*", { count: "exact", head: true }),
  ]);

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, status, total, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const cards = [
    { label: "Active Products", value: productCount ?? 0, href: "/admin/products", color: "#000" },
    { label: "Total Orders", value: orderCount ?? 0, href: "/admin/orders", color: "#1a1a1a" },
  ];

  const statusColor: Record<string, string> = {
    pending: "#f59e0b", paid: "#3b82f6", confirmed: "#8b5cf6",
    shipped: "#06b6d4", delivered: "#10b981", cancelled: "#ef4444",
  };

  return (
    <div style={{ maxWidth: "960px" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "2rem", color: "#000" }}>
        Dashboard
      </h1>

      <style>{`
        .admin-stat-card:hover { opacity: 0.82; }
        .admin-add-card:hover { border-color: #000 !important; color: #000 !important; }
      `}</style>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        {cards.map(({ label, value, href, color }) => (
          <Link key={label} href={href} style={{ textDecoration: "none" }}>
            <div
              className="admin-stat-card"
              style={{ background: color, color: "#fff", padding: "1.5rem", borderRadius: "4px", transition: "opacity 0.2s" }}
            >
              <p style={{ fontSize: "2.5rem", fontWeight: 900, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}>{value}</p>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7, marginTop: "4px" }}>{label}</p>
            </div>
          </Link>
        ))}

        <Link href="/admin/products/new" style={{ textDecoration: "none" }}>
          <div
            className="admin-add-card"
            style={{ border: "2px dashed #ccc", padding: "1.5rem", borderRadius: "4px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", color: "#888", minHeight: "100px", transition: "border-color 0.2s, color 0.2s" }}
          >
            <span style={{ fontSize: "1.8rem", fontWeight: 300 }}>+</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Add Product</span>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #e5e5e5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#000" }}>Recent Orders</h2>
          <Link href="/admin/orders" style={{ fontSize: "0.7rem", color: "#666", letterSpacing: "0.08em", textTransform: "uppercase" }}>View All →</Link>
        </div>
        {!recentOrders || recentOrders.length === 0 ? (
          <p style={{ padding: "2rem 1.5rem", color: "#aaa", fontSize: "0.85rem", textAlign: "center" }}>No orders yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e5e5" }}>
                {["Order ID", "Date", "Status", "Total"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentOrders as any[]).map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "12px 16px", fontSize: "0.8rem", fontFamily: "monospace", color: "#000" }}>#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#666" }}>{new Date(order.created_at).toLocaleDateString("en-IN")}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: statusColor[order.status] ?? "#000", border: `1px solid ${statusColor[order.status] ?? "#000"}`, padding: "2px 8px" }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "#000" }}>₹{order.total?.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
