import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Order Detail — SXTN Admin" };

const STATUS_OPTIONS = ["pending", "paid", "confirmed", "shipped", "delivered", "cancelled"] as const;

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  if (!order) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <p style={{ color: "#999" }}>Order not found.</p>
        <Link href="/admin/orders" style={{ color: "#000", fontSize: "0.8rem" }}>← Back to Orders</Link>
      </div>
    );
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: "#f59e0b", paid: "#3b82f6", confirmed: "#8b5cf6",
    shipped: "#06b6d4", delivered: "#10b981", cancelled: "#ef4444",
  };

  const address = (order as any).shipping_address as any;

  return (
    <div style={{ maxWidth: "860px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Link href="/admin/orders" style={{ color: "#666", fontSize: "0.8rem", textDecoration: "none" }}>← Orders</Link>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", color: "#000" }}>
          Order #{(order as any).id.slice(0, 8).toUpperCase()}
        </h1>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: STATUS_COLORS[(order as any).status] ?? "#000", border: `1px solid ${STATUS_COLORS[(order as any).status] ?? "#000"}`, padding: "3px 10px" }}>
          {(order as any).status}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Shipping Address */}
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", padding: "1rem" }}>
          <h3 style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px", color: "#000" }}>Shipping To</h3>
          {address ? (
            <div style={{ fontSize: "0.85rem", color: "#333", lineHeight: 1.6 }}>
              <p style={{ fontWeight: 700 }}>{address.full_name ?? "—"}</p>
              <p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
              <p>{address.city}, {address.state} — {address.pincode}</p>
              {address.phone && <p>📞 {address.phone}</p>}
            </div>
          ) : <p style={{ color: "#999", fontSize: "0.85rem" }}>No address on file</p>}
        </div>

        {/* Order Summary */}
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", padding: "1rem" }}>
          <h3 style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px", color: "#000" }}>Summary</h3>
          <div style={{ fontSize: "0.85rem", color: "#333" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "#666" }}>Subtotal</span>
              <span>₹{(order as any).subtotal?.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "#666" }}>Shipping</span>
              <span>{(order as any).shipping_fee === 0 ? "Free" : `₹${(order as any).shipping_fee}`}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, borderTop: "1px solid #eee", paddingTop: "8px" }}>
              <span>Total</span>
              <span>₹{(order as any).total?.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div style={{ marginTop: "12px", fontSize: "0.72rem", color: "#888" }}>
            {(order as any).razorpay_payment_id && <p>Payment ID: {(order as any).razorpay_payment_id}</p>}
            <p>Placed: {new Date((order as any).created_at).toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", marginBottom: "1.5rem" }}>
        <div style={{ borderBottom: "1px solid #e5e5e5", padding: "12px 16px" }}>
          <h3 style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#000" }}>Items ({items?.length ?? 0})</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
              {["Product", "Size", "Qty", "Unit Price", "Line Total"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(items as any[] ?? []).map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                <td style={{ padding: "10px 16px", fontSize: "0.85rem", fontWeight: 600, color: "#000" }}>{item.product_name}</td>
                <td style={{ padding: "10px 16px", fontSize: "0.8rem", color: "#555" }}>{item.size ?? "—"}{item.color ? ` / ${item.color}` : ""}</td>
                <td style={{ padding: "10px 16px", fontSize: "0.8rem", color: "#555" }}>{item.quantity}</td>
                <td style={{ padding: "10px 16px", fontSize: "0.8rem", color: "#555" }}>₹{item.unit_price?.toLocaleString("en-IN")}</td>
                <td style={{ padding: "10px 16px", fontSize: "0.85rem", fontWeight: 700, color: "#000" }}>₹{(item.quantity * item.unit_price)?.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
