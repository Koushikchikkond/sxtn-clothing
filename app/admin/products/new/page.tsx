import React from "react";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: "#000",
              margin: 0,
              lineHeight: 1,
            }}
          >
            Add New Product
          </h1>
          <p style={{ color: "#555", marginTop: "8px", fontSize: "0.9rem" }}>
            Upload images and fill out product details below.
          </p>
        </div>
        <Link
          href="/admin/products"
          style={{
            padding: "10px 18px",
            border: "2px solid #000",
            color: "#000",
            textDecoration: "none",
            fontSize: "0.8rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          ← Back to Products
        </Link>
      </div>

      <ProductForm />
    </div>
  );
}
