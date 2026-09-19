"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "./image-upload";
import { createClient } from "@/lib/supabase/client";

// ── Small reusable bullet-point editor ────────────────────────
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
    if (e.key === "Enter") { e.preventDefault(); add(); }
  };

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <ul style={{ listStyle: "disc", paddingLeft: "20px", marginBottom: "10px", color: "#000" }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: "0.9rem", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{item}</span>
            <button type="button" onClick={() => remove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cc0000", fontWeight: 700, fontSize: "1rem", marginLeft: "8px" }}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button type="button" onClick={add} style={{ padding: "10px 16px", background: "#000", color: "#fff", border: "2px solid #000", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
          + Add
        </button>
      </div>
      <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "5px" }}>Press Enter or click + Add to add each bullet point.</p>
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

// ── Main form ─────────────────────────────────────────────────
export function ProductForm() {
  const router  = useRouter();
  const supabase = createClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Basic fields
  const [name, setName]               = useState("");
  const [slug, setSlug]               = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice]             = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [images, setImages]           = useState<string[]>([]);
  const [sizes, setSizes]             = useState("S, M, L, XL");

  // New fields
  const [features, setFeatures]     = useState<string[]>([]);
  const [washCare, setWashCare]     = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [createNewCategory, setCreateNewCategory] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Load existing categories on mount
  useEffect(() => {
    supabase.from("categories").select("id, name").order("name").then(({ data }) => {
      setCategories((data as any[]) ?? []);
    });
  }, []);

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let resolvedCategoryId: string | null = categoryId || null;

      // 0. Create new category if needed
      if (createNewCategory && newCategoryName.trim()) {
        const newSlug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const { data: cat, error: catError } = await supabase
          .from("categories")
          .insert({ name: newCategoryName.trim(), slug: newSlug } as any)
          .select("id")
          .single();
        if (catError) throw catError;
        resolvedCategoryId = (cat as any).id;
      }

      // 1. Create product
      const { data: productRaw, error: productError } = await supabase
        .from("products")
        .insert({
          name,
          slug,
          description,
          price: parseFloat(price),
          compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
          category_id: resolvedCategoryId,
          is_active: true,
          features: features.length > 0 ? features : null,
          wash_care: washCare.length > 0 ? washCare : null,
        } as any)
        .select()
        .single();

      const product = productRaw as unknown as { id: string };
      if (productError) throw productError;

      // 2. Save images
      if (images.length > 0) {
        await supabase.from("product_images").insert(
          images.map((url, idx) => ({ product_id: product.id, url, position: idx })) as any
        );
      }

      // 3. Save size variants
      const sizeList = sizes.split(",").map((s) => s.trim()).filter(Boolean);
      if (sizeList.length > 0) {
        await supabase.from("product_variants").insert(
          sizeList.map((size) => ({ product_id: product.id, size, stock: 100 })) as any
        );
      }

      setSuccess(true);
      setTimeout(() => router.push("/admin/products"), 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem", border: "2px solid #000", background: "#f9f9f9" }}>
        <p style={{ fontSize: "1.5rem", fontWeight: 900, color: "#000" }}>✓ Product Created!</p>
        <p style={{ color: "#555", marginTop: "8px" }}>Redirecting to products list…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "860px", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {error && (
        <div style={{ padding: "12px 16px", background: "#fff0f0", border: "2px solid #cc0000", color: "#cc0000", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* ── Section 1: Basic Details ─────────────────────── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={sectionHeadingStyle}>Basic Details</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Product Name</label>
            <input required type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Oversized Tee" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Slug (URL)</label>
            <input required type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. oversized-tee" style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Description</label>
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the product…" style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Price (₹)</label>
            <input required type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 1299" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Compare At Price (₹) — Optional</label>
            <input type="number" min="0" step="1" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} placeholder="e.g. 1799 (strikethrough)" style={inputStyle} />
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
              transition: "all 0.15s",
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
              transition: "all 0.15s",
            }}
          >
            + Create New
          </button>
        </div>

        {createNewCategory ? (
          <div>
            <label style={labelStyle}>New Collection Name</label>
            <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g. Summer Drop 2025" style={inputStyle} />
          </div>
        ) : (
          <div>
            <label style={labelStyle}>Select Collection</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
              <option value="">— No collection —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* ── Section 3: Images ────────────────────────────── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={sectionHeadingStyle}>Product Images</h2>
        <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "-8px" }}>Upload photos to Cloudflare R2. First image will be the cover.</p>
        <ImageUpload value={images} onChange={setImages} productSlug={slug || "draft"} />
      </section>

      {/* ── Section 4: Sizes ─────────────────────────────── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={sectionHeadingStyle}>Sizes / Variants</h2>
        <div>
          <label style={labelStyle}>Sizes (comma separated)</label>
          <input type="text" value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="e.g. S, M, L, XL, XXL" style={inputStyle} />
          <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "6px" }}>Each size will be created as a variant with 100 units default stock.</p>
        </div>
      </section>

      {/* ── Section 5: Features ──────────────────────────── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={sectionHeadingStyle}>Features</h2>
        <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "-8px" }}>These bullet points will appear under "Features" on the product page (e.g. Round-neck, Oversized fit, 240 GSM).</p>
        <BulletEditor
          label="Feature Points"
          items={features}
          onChange={setFeatures}
          placeholder="e.g. Round-neck t-shirt"
        />
      </section>

      {/* ── Section 6: Composition & Wash Care ─────────── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={sectionHeadingStyle}>Composition &amp; Wash Care</h2>
        <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "-8px" }}>These bullet points appear under "Composition and wash care" on the product page (e.g. 100% Cotton, Machine wash cold).</p>
        <BulletEditor
          label="Wash Care Points"
          items={washCare}
          onChange={setWashCare}
          placeholder="e.g. 100% Cotton"
        />
      </section>

      {/* ── Submit ──────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          background: isSubmitting ? "#555" : "#000",
          color: "#fff",
          border: "2px solid #000",
          padding: "16px",
          fontSize: "0.9rem",
          fontWeight: 800,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          transition: "background 0.2s, color 0.2s",
        }}
        onMouseEnter={(e) => { if (!isSubmitting) { (e.target as HTMLButtonElement).style.background = "#fff"; (e.target as HTMLButtonElement).style.color = "#000"; } }}
        onMouseLeave={(e) => { if (!isSubmitting) { (e.target as HTMLButtonElement).style.background = "#000"; (e.target as HTMLButtonElement).style.color = "#fff"; } }}
      >
        {isSubmitting ? "Creating Product…" : "Create Product"}
      </button>
    </form>
  );
}
