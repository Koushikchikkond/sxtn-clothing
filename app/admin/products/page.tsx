import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Products — SXTN Admin" };

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*, product_images(url, position)")
    .order("created_at", { ascending: false });

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", color: "#000" }}>
          All Products ({products?.length ?? 0})
        </h1>
        <Link
          href="/admin/products/new"
          style={{ background: "#000", color: "#fff", textDecoration: "none", padding: "10px 20px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}
        >
          + Add Product
        </Link>
      </div>

      {/* Products Table */}
      {!products || products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fff", border: "1px solid #e5e5e5" }}>
          <p style={{ color: "#999", fontSize: "0.9rem" }}>No products yet.</p>
          <Link href="/admin/products/new" style={{ display: "inline-block", marginTop: "1rem", background: "#000", color: "#fff", textDecoration: "none", padding: "10px 20px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Create Your First Product
          </Link>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                {["Image", "Name", "Price", "Status", "Created", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#000" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(products as any[]).map((product) => {
                const cover = [...(product.product_images || [])].sort((a: any, b: any) => a.position - b.position)[0];
                return (
                  <tr key={product.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    {/* Thumbnail */}
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ width: "48px", height: "60px", background: "#f5f5f5", borderRadius: "4px", overflow: "hidden", position: "relative", flexShrink: 0 }}>
                        {cover ? (
                          <Image src={cover.url} alt={product.name} fill style={{ objectFit: "cover" }} sizes="48px" />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "#aaa" }}>NO IMG</div>
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td style={{ padding: "10px 16px" }}>
                      <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#000", marginBottom: "2px" }}>{product.name}</p>
                      <p style={{ fontSize: "0.72rem", color: "#888", fontFamily: "monospace" }}>/{product.slug}</p>
                    </td>

                    {/* Price */}
                    <td style={{ padding: "10px 16px", fontSize: "0.85rem", fontWeight: 700, color: "#000" }}>
                      ₹{product.price?.toLocaleString("en-IN")}
                      {product.compare_at_price && (
                        <span style={{ marginLeft: "6px", fontSize: "0.72rem", color: "#999", textDecoration: "line-through" }}>
                          ₹{product.compare_at_price.toLocaleString("en-IN")}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        padding: "3px 8px",
                        border: `1px solid ${product.is_active ? "#16a34a" : "#dc2626"}`,
                        color: product.is_active ? "#16a34a" : "#dc2626",
                      }}>
                        {product.is_active ? "Active" : "Draft"}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "10px 16px", fontSize: "0.78rem", color: "#666" }}>
                      {new Date(product.created_at).toLocaleDateString("en-IN")}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "10px 16px" }}>
                      <Link
                        href={`/admin/products/${product.id}`}
                        style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#000", textDecoration: "none", border: "1px solid #000", padding: "4px 10px" }}
                      >
                        Edit
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
