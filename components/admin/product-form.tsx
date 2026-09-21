"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "./image-upload";
import { createClient } from "@/lib/supabase/client";

// ── Bullet Editor ─────────────────────────────────────────────
function BulletEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setDraft("");
  };

  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {items.length > 0 && (
        <ul style={{ listStyle: "disc", paddingLeft: "20px", marginBottom: "10px", color: "#000" }}>
          {items.map((item, i) => (
            <li
              key={i}
              style={{
                fontSize: "0.9rem",
                marginBottom: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f5f5f5",
                padding: "4px 8px",
                border: "1px solid #e5e5e5",
              }}
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#cc0000",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  marginLeft: "8px",
                  lineHeight: 1,
                }}
                aria-label="Remove item"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="button"
          onClick={add}
          style={{
            padding: "10px 16px",
            background: "#000",
            color: "#fff",
            border: "2px solid #000",
            fontWeight: 700,
            fontSize: "0.8rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          + Add
        </button>
      </div>
      <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "5px" }}>
        Press Enter or click + Add to add each bullet point.
      </p>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "2px solid #000",
  padding: "10px 12px",
  outline: "none",
  background: "#fff",
  color: "#000",
  fontSize: "0.95rem",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: "6px",
  color: "#000",
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  borderBottom: "2px solid #000",
  paddingBottom: "8px",
  marginBottom: "16px",
  color: "#000",
};

interface VariantItem {
  id?: string;
  size: string;
  stock: number;
}

interface ProductFormProps {
  initialProduct?: any;
}

// ── Main Form ──────────────────────────────────────────────────
export function ProductForm({ initialProduct }: ProductFormProps = {}) {
  const router = useRouter();
  const supabase = createClient();
  const db = supabase as any;
  const isEditMode = !!initialProduct;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Basic fields
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [slug, setSlug] = useState(initialProduct?.slug ?? "");
  const [description, setDescription] = useState(initialProduct?.description ?? "");
  const [price, setPrice] = useState(
    initialProduct?.price != null ? String(initialProduct.price) : ""
  );
  const [compareAtPrice, setCompareAtPrice] = useState(
    initialProduct?.compare_at_price != null ? String(initialProduct.compare_at_price) : ""
  );
  const [isActive, setIsActive] = useState(initialProduct?.is_active ?? true);

  // Images
  const initialImages = initialProduct?.product_images
    ? [...initialProduct.product_images]
        .sort((a: any, b: any) => a.position - b.position)
        .map((img: any) => img.url)
    : [];
  const [images, setImages] = useState<string[]>(initialImages);

  // Variants / Sizes
  const defaultVariants: VariantItem[] = initialProduct?.product_variants?.length
    ? initialProduct.product_variants.map((v: any) => ({
        id: v.id,
        size: v.size,
        stock: v.stock ?? 100,
      }))
    : [
        { size: "S", stock: 100 },
        { size: "M", stock: 100 },
        { size: "L", stock: 100 },
        { size: "XL", stock: 100 },
      ];
  const [variantsList, setVariantsList] = useState<VariantItem[]>(defaultVariants);
  const [newSizeName, setNewSizeName] = useState("");
  const [newSizeStock, setNewSizeStock] = useState("100");

  // Bullet points
  const [features, setFeatures] = useState<string[]>(initialProduct?.features ?? []);
  const [washCare, setWashCare] = useState<string[]>(initialProduct?.wash_care ?? []);

  // Category
  const [categoryId, setCategoryId] = useState<string>(initialProduct?.category_id ?? "");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [createNewCategory, setCreateNewCategory] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Load categories
  useEffect(() => {
    db.from("categories")
      .select("id, name")
      .order("name")
      .then(({ data }: any) => {
        setCategories((data as any[]) ?? []);
      });
  }, []);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!isEditMode) {
      setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  };

  const addVariant = () => {
    const trimmed = newSizeName.trim().toUpperCase();
    if (!trimmed) return;
    if (variantsList.some((v) => v.size === trimmed)) {
      alert("This size is already in the list.");
      return;
    }
    setVariantsList([
      ...variantsList,
      { size: trimmed, stock: parseInt(newSizeStock, 10) || 0 },
    ]);
    setNewSizeName("");
    setNewSizeStock("100");
  };

  const updateVariantStock = (index: number, stock: number) => {
    const updated = [...variantsList];
    updated[index].stock = Math.max(0, stock);
    setVariantsList(updated);
  };

  const removeVariant = (index: number) => {
    setVariantsList(variantsList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let resolvedCategoryId: string | null = categoryId || null;

      // 0. Create new category if needed
      if (createNewCategory && newCategoryName.trim()) {
        const newSlug = newCategoryName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        const { data: cat, error: catError } = await db
          .from("categories")
          .insert({ name: newCategoryName.trim(), slug: newSlug } as any)
          .select("id")
          .single();
        if (catError) throw catError;
        resolvedCategoryId = (cat as any).id;
      }

      const productPayload = {
        name,
        slug,
        description,
        price: parseFloat(price),
        compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
        category_id: resolvedCategoryId,
        is_active: isActive,
        features: features.length > 0 ? features : null,
        wash_care: washCare.length > 0 ? washCare : null,
        updated_at: new Date().toISOString(),
      };

      let productId = initialProduct?.id;

      if (isEditMode) {
        // ── UPDATE MODE ──────────────────────────────────────
        const { error: updateError } = await db
          .from("products")
          .update(productPayload as any)
          .eq("id", productId);

        if (updateError) throw updateError;

        // Re-sync images: delete existing and re-insert
        await db.from("product_images").delete().eq("product_id", productId);
        if (images.length > 0) {
          await db.from("product_images").insert(
            images.map((url, idx) => ({ product_id: productId, url, position: idx })) as any
          );
        }

        // Re-sync variants: delete existing and re-insert
        await db.from("product_variants").delete().eq("product_id", productId);
        if (variantsList.length > 0) {
          await db.from("product_variants").insert(
            variantsList.map((v) => ({
              product_id: productId,
              size: v.size.trim().toUpperCase(),
              stock: Number(v.stock) || 0,
            })) as any
          );
        }
      } else {
        // ── CREATE MODE ──────────────────────────────────────
        const { data: productRaw, error: productError } = await db
          .from("products")
          .insert(productPayload as any)
          .select("id")
          .single();

        if (productError) throw productError;
        productId = (productRaw as any).id;

        // Save images
        if (images.length > 0) {
          await db.from("product_images").insert(
            images.map((url, idx) => ({ product_id: productId, url, position: idx })) as any
          );
        }

        // Save size variants
        if (variantsList.length > 0) {
          await db.from("product_variants").insert(
            variantsList.map((v) => ({
              product_id: productId,
              size: v.size.trim().toUpperCase(),
              stock: Number(v.stock) || 0,
            })) as any
          );
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!initialProduct?.id) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      // Delete child records first
      await db.from("product_images").delete().eq("product_id", initialProduct.id);
      await db.from("product_variants").delete().eq("product_id", initialProduct.id);
      const { error: deleteErr } = await db
        .from("products")
        .delete()
        .eq("id", initialProduct.id);

      if (deleteErr) throw deleteErr;

      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      alert("Failed to delete product: " + err.message);
      setIsDeleting(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem 2rem",
          border: "2px solid #000",
          background: "#f9f9f9",
          maxWidth: "860px",
        }}
      >
        <p style={{ fontSize: "1.5rem", fontWeight: 900, color: "#000" }}>
          ✓ {isEditMode ? "Product Updated!" : "Product Created!"}
        </p>
        <p style={{ color: "#555", marginTop: "8px" }}>Redirecting to products list…</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: "860px", display: "flex", flexDirection: "column", gap: "2.5rem" }}
    >
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fff0f0",
            border: "2px solid #cc0000",
            color: "#cc0000",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {/* ── Section 1: Basic Details ─────────────────────── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <h2 style={{ ...sectionHeadingStyle, flex: 1, margin: 0 }}>Basic Details</h2>

          {/* Active / Draft Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Visibility:
            </span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              style={{
                padding: "6px 14px",
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                border: `2px solid ${isActive ? "#16a34a" : "#dc2626"}`,
                background: isActive ? "#16a34a" : "#dc2626",
                color: "#fff",
                cursor: "pointer",
                borderRadius: "3px",
              }}
            >
              {isActive ? "● Active (Live in Store)" : "○ Draft (Hidden)"}
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          <div>
            <label style={labelStyle}>Product Name</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Oversized Heavyweight Tee"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Slug (URL)</label>
            <input
              required
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. oversized-heavyweight-tee"
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe the product, fit, and materials…"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          <div>
            <label style={labelStyle}>Price (₹)</label>
            <input
              required
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 1299"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Compare At Price (₹) — Optional</label>
            <input
              type="number"
              min="0"
              step="1"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              placeholder="e.g. 1799 (strikethrough)"
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      {/* ── Section 2: Collection ───────────────────────── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={sectionHeadingStyle}>Collection</h2>

        <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setCreateNewCategory(false)}
            style={{
              padding: "8px 16px",
              border: `2px solid ${!createNewCategory ? "#000" : "#ccc"}`,
              background: !createNewCategory ? "#000" : "#fff",
              color: !createNewCategory ? "#fff" : "#555",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Existing Collection
          </button>
          <button
            type="button"
            onClick={() => setCreateNewCategory(true)}
            style={{
              padding: "8px 16px",
              border: `2px solid ${createNewCategory ? "#000" : "#ccc"}`,
              background: createNewCategory ? "#000" : "#fff",
              color: createNewCategory ? "#fff" : "#555",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            + Create New
          </button>
        </div>

        {createNewCategory ? (
          <div>
            <label style={labelStyle}>New Collection Name</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Acid Wash Drop 2025"
              style={inputStyle}
            />
          </div>
        ) : (
          <div>
            <label style={labelStyle}>Select Collection</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{ ...inputStyle, appearance: "auto" }}
            >
              <option value="">— No collection —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* ── Section 3: Images ────────────────────────────── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={sectionHeadingStyle}>Product Images</h2>
        <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "-8px" }}>
          Upload photos. The first image will be used as the cover on the storefront.
        </p>
        <ImageUpload value={images} onChange={setImages} productSlug={slug || "product"} />
      </section>

      {/* ── Section 4: Sizes & Stock ─────────────────────── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={sectionHeadingStyle}>Sizes &amp; Inventory</h2>
        <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "-8px" }}>
          Manage available sizes and real-time stock counts. If stock is 0, customers will see it as &quot;Out of Stock&quot;.
        </p>

        {/* Existing variants table */}
        <div style={{ border: "2px solid #000", background: "#fff", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#000", color: "#fff" }}>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Size
                </th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Stock Available
                </th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", width: "80px" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {variantsList.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: "16px", textAlign: "center", color: "#888", fontSize: "0.85rem" }}>
                    No sizes added yet. Add at least one size below.
                  </td>
                </tr>
              ) : (
                variantsList.map((v, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 800, fontSize: "0.95rem" }}>
                      {v.size}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => updateVariantStock(idx, parseInt(e.target.value, 10) || 0)}
                        style={{
                          width: "110px",
                          padding: "6px 10px",
                          border: "1px solid #000",
                          fontSize: "0.9rem",
                          fontWeight: 700,
                        }}
                      />
                      {v.stock === 0 && (
                        <span style={{ marginLeft: "8px", fontSize: "0.7rem", color: "#dc2626", fontWeight: 700 }}>
                          Out of Stock
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        style={{
                          background: "#fff0f0",
                          border: "1px solid #cc0000",
                          color: "#cc0000",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          padding: "4px 8px",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Size row */}
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label style={labelStyle}>Add Size</label>
            <input
              type="text"
              value={newSizeName}
              onChange={(e) => setNewSizeName(e.target.value)}
              placeholder="e.g. 2XL, M, 32"
              style={{ ...inputStyle, width: "120px" }}
            />
          </div>
          <div>
            <label style={labelStyle}>Initial Stock</label>
            <input
              type="number"
              min="0"
              value={newSizeStock}
              onChange={(e) => setNewSizeStock(e.target.value)}
              style={{ ...inputStyle, width: "120px" }}
            />
          </div>
          <button
            type="button"
            onClick={addVariant}
            style={{
              padding: "11px 18px",
              background: "#000",
              color: "#fff",
              border: "2px solid #000",
              fontWeight: 700,
              fontSize: "0.8rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            + Add Size
          </button>
        </div>
      </section>

      {/* ── Section 5: Features ──────────────────────────── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={sectionHeadingStyle}>Features</h2>
        <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "-8px" }}>
          These bullet points appear under &quot;Features&quot; on the product page.
        </p>
        <BulletEditor
          label="Feature Points"
          items={features}
          onChange={setFeatures}
          placeholder="e.g. 240 GSM heavy combed cotton"
        />
      </section>

      {/* ── Section 6: Composition & Wash Care ─────────── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={sectionHeadingStyle}>Composition &amp; Wash Care</h2>
        <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "-8px" }}>
          These bullet points appear under &quot;Composition and wash care&quot; on the product page.
        </p>
        <BulletEditor
          label="Wash Care Points"
          items={washCare}
          onChange={setWashCare}
          placeholder="e.g. 100% Cotton, Machine wash cold inside out"
        />
      </section>

      {/* ── Submit & Actions ────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "2px solid #000", paddingTop: "24px" }}>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            background: isSubmitting ? "#555" : "#000",
            color: "#fff",
            border: "2px solid #000",
            padding: "16px",
            fontSize: "0.95rem",
            fontWeight: 800,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          {isSubmitting
            ? isEditMode
              ? "Saving Changes…"
              : "Creating Product…"
            : isEditMode
            ? "Save Changes"
            : "Create Product"}
        </button>

        {isEditMode && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #ddd" }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#cc0000", margin: 0 }}>Danger Zone</p>
              <p style={{ fontSize: "0.75rem", color: "#666", margin: "2px 0 0 0" }}>Permanently remove this product from the database.</p>
            </div>
            <button
              type="button"
              onClick={handleDeleteProduct}
              disabled={isDeleting}
              style={{
                background: "#fff",
                color: "#cc0000",
                border: "2px solid #cc0000",
                padding: "10px 18px",
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: isDeleting ? "not-allowed" : "pointer",
              }}
            >
              {isDeleting ? "Deleting…" : "Delete Product"}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
