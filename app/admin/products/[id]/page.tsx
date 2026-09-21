import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Edit Product — SXTN Admin" };

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*), categories(id, name)")
    .eq("id", id)
    .single();

  if (!product) {
    notFound();
  }

  return (
    <div style={{ maxWidth: "860px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <Link
              href="/admin/products"
              style={{
                color: "#666",
                fontSize: "0.8rem",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              ← Products
            </Link>
            <span style={{ color: "#ccc" }}>/</span>
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "2px 8px",
                border: `1px solid ${(product as any).is_active ? "#16a34a" : "#dc2626"}`,
                color: (product as any).is_active ? "#16a34a" : "#dc2626",
                borderRadius: "2px",
              }}
            >
              {(product as any).is_active ? "Active" : "Draft"}
            </span>
          </div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: "#000",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Edit: {(product as any).name}
          </h1>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <Link
            href={`/products/${(product as any).slug}`}
            target="_blank"
            style={{
              padding: "10px 16px",
              border: "1px solid #999",
              color: "#333",
              textDecoration: "none",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            View in Store ↗
          </Link>
          <Link
            href="/admin/products"
            style={{
              padding: "10px 16px",
              border: "2px solid #000",
              color: "#000",
              textDecoration: "none",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Full interactive product form */}
      <ProductForm initialProduct={product} />
    </div>
  );
}
