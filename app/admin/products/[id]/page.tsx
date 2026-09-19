import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Edit Product — SXTN Admin" };

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*), categories(name)")
    .eq("id", id)
    .single();

  if (!product) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <p style={{ color: "#999" }}>Product not found.</p>
        <Link href="/admin/products" style={{ color: "#000" }}>← Back to Products</Link>
      </div>
    );
  }

  const p = product as any;
  const sortedImages = [...(p.product_images || [])].sort((a: any, b: any) => a.position - b.position);

  return (
    <div style={{ maxWidth: "860px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
        <Link href="/admin/products" style={{ color: "#666", fontSize: "0.8rem", textDecoration: "none" }}>← Products</Link>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", color: "#000" }}>
          {p.name}
        </h1>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", border: `1px solid ${p.is_active ? "#16a34a" : "#dc2626"}`, color: p.is_active ? "#16a34a" : "#dc2626" }}>
          {p.is_active ? "Active" : "Draft"}
        </span>
      </div>

      <div style={{ background: "#fff3cd", border: "1px solid #ffc107", padding: "12px 16px", marginBottom: "1.5rem", fontSize: "0.85rem", color: "#856404" }}>
        ⚠️ Full product editing is coming soon. Below is a read-only view of this product&apos;s current data.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Images */}
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", padding: "1rem" }}>
          <h3 style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px", color: "#000" }}>Images</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {sortedImages.length === 0 ? <p style={{ color: "#aaa", fontSize: "0.8rem" }}>No images</p> : sortedImages.map((img: any, i: number) => (
              <div key={img.id} style={{ position: "relative", width: "72px", height: "90px", borderRadius: "4px", overflow: "hidden", background: "#f5f5f5", border: i === 0 ? "2px solid #000" : "1px solid #ddd" }}>
                <Image src={img.url} alt={p.name} fill style={{ objectFit: "cover" }} sizes="72px" />
                {i === 0 && <span style={{ position: "absolute", bottom: "2px", left: "50%", transform: "translateX(-50%)", background: "#000", color: "#fff", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.06em", padding: "1px 4px", whiteSpace: "nowrap" }}>COVER</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", padding: "1rem" }}>
          <h3 style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px", color: "#000" }}>Details</h3>
          <div style={{ fontSize: "0.85rem", color: "#333", lineHeight: 2 }}>
            <p><span style={{ color: "#888", fontSize: "0.72rem" }}>PRICE: </span><strong>₹{p.price?.toLocaleString("en-IN")}</strong></p>
            {p.compare_at_price && <p><span style={{ color: "#888", fontSize: "0.72rem" }}>COMPARE AT: </span><span style={{ textDecoration: "line-through", color: "#aaa" }}>₹{p.compare_at_price?.toLocaleString("en-IN")}</span></p>}
            <p><span style={{ color: "#888", fontSize: "0.72rem" }}>SLUG: </span><code style={{ fontSize: "0.78rem" }}>/{p.slug}</code></p>
            {p.categories?.name && <p><span style={{ color: "#888", fontSize: "0.72rem" }}>COLLECTION: </span>{p.categories.name}</p>}
          </div>
        </div>
      </div>

      {/* Variants */}
      <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", marginBottom: "1rem", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e5e5" }}>
          <h3 style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#000" }}>Variants / Sizes</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
              {["Size", "Color", "SKU", "Stock"].map((h) => (
                <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(p.product_variants as any[]).map((v: any) => (
              <tr key={v.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                <td style={{ padding: "10px 16px", fontWeight: 700, fontSize: "0.85rem" }}>{v.size}</td>
                <td style={{ padding: "10px 16px", fontSize: "0.8rem", color: "#555" }}>{v.color ?? "—"}</td>
                <td style={{ padding: "10px 16px", fontSize: "0.75rem", color: "#888", fontFamily: "monospace" }}>{v.sku ?? "—"}</td>
                <td style={{ padding: "10px 16px", fontSize: "0.85rem", fontWeight: v.stock <= 5 ? 700 : 400, color: v.stock <= 5 ? "#dc2626" : "#000" }}>{v.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Features & Wash Care */}
      {(p.features?.length > 0 || p.wash_care?.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {p.features?.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", padding: "1rem" }}>
              <h3 style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px", color: "#000" }}>Features</h3>
              <ul style={{ paddingLeft: "16px", fontSize: "0.83rem", color: "#333", lineHeight: 1.8 }}>
                {p.features.map((f: string, i: number) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
          {p.wash_care?.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", padding: "1rem" }}>
              <h3 style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px", color: "#000" }}>Wash Care</h3>
              <ul style={{ paddingLeft: "16px", fontSize: "0.83rem", color: "#333", lineHeight: 1.8 }}>
                {p.wash_care.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
