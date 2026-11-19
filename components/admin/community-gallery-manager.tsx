"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CircularGallery, GalleryItem } from "@/components/ui/circular-gallery";
import type { CommunityGalleryItem, CommunityGalleryConfig } from "@/lib/community-gallery";
import { DEFAULT_COMMUNITY_GALLERY } from "@/lib/community-gallery";

export function CommunityGalleryManager() {
  const [items, setItems] = useState<CommunityGalleryItem[]>([]);
  const [title, setTitle] = useState(DEFAULT_COMMUNITY_GALLERY.title);
  const [subtitle, setSubtitle] = useState(DEFAULT_COMMUNITY_GALLERY.subtitle);
  const [hashtag, setHashtag] = useState(DEFAULT_COMMUNITY_GALLERY.hashtag);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Load current gallery from API on mount
  useEffect(() => {
    async function loadGallery() {
      try {
        const res = await fetch("/api/admin/community-gallery");
        if (res.ok) {
          const data = await res.json();
          if (data.gallery) {
            const g = data.gallery as CommunityGalleryConfig;
            if (g.title) setTitle(g.title);
            if (g.subtitle) setSubtitle(g.subtitle);
            if (g.hashtag) setHashtag(g.hashtag);
            if (g.items && g.items.length > 0) {
              setItems(g.items);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load community gallery", err);
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, []);

  // Client-side image optimization
  const optimizeImageForUpload = async (file: File, maxDimension: number): Promise<File> => {
    if (file.size <= 1.5 * 1024 * 1024 && file.type === "image/webp") return file;

    return new Promise((resolve) => {
      const img = document.createElement("img");
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const safeName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const optimized = new File([blob], safeName, { type: "image/webp" });
            resolve(optimized);
          },
          "image/webp",
          0.88
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    });
  };

  // Upload handler for Cloudflare R2
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingId(itemId);
    setFeedback(null);

    try {
      const readyFile = await optimizeImageForUpload(file, 1600);

      const formData = new FormData();
      formData.append("file", readyFile);
      formData.append("productSlug", "community-gallery");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const rawText = await res.text();
      let data: { url?: string; error?: string } | null = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        // Not JSON
      }

      if (!res.ok) {
        let errorMsg = `Upload failed (${res.status})`;
        if (data && data.error) {
          errorMsg = data.error;
        } else if (rawText) {
          errorMsg = rawText.slice(0, 300);
        }
        throw new Error(errorMsg);
      }

      if (!data || !data.url) {
        throw new Error("Server did not return a valid image URL.");
      }

      const uploadedUrl = data.url;

      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, image_url: uploadedUrl } : it))
      );

      setFeedback({
        type: "success",
        msg: "✓ Customer photo uploaded to Cloudflare R2! Click 'Save Changes' below to publish.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload image";
      setFeedback({ type: "error", msg: message });
    } finally {
      setUploadingId(null);
      e.target.value = "";
    }
  };

  const addItem = () => {
    const newId = String(Date.now());
    setItems((prev) => [
      ...prev,
      {
        id: newId,
        image_url: "",
        customer_name: "",
        tshirt_name: "",
        caption: "",
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    setItems((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const updateItemField = (
    id: string,
    field: "image_url" | "customer_name" | "tshirt_name" | "caption",
    value: string
  ) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length > 0) {
      const invalid = items.find((it) => !it.image_url.trim());
      if (invalid) {
        setFeedback({
          type: "error",
          msg: "Please upload or provide an image URL for every customer photo before saving.",
        });
        return;
      }
    }

    setSaving(true);
    setFeedback(null);

    try {
      const payload: Omit<CommunityGalleryConfig, "updated_at"> = {
        title: title.trim() || "WORN BY YOU",
        subtitle: subtitle.trim(),
        hashtag: hashtag.trim() || "#6XTN #STREETWEAR",
        items: items.map((it, idx) => ({
          id: it.id || String(idx + 1),
          image_url: it.image_url.trim(),
          customer_name: it.customer_name.trim(),
          tshirt_name: it.tshirt_name.trim(),
          caption: it.caption?.trim() || undefined,
        })),
      };

      const res = await fetch("/api/admin/community-gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      let data: { error?: string } | null = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        // Not JSON
      }

      if (!res.ok) {
        let errorMsg = `Save failed (${res.status})`;
        if (data && data.error) {
          errorMsg = data.error;
        } else if (rawText) {
          errorMsg = rawText.slice(0, 300);
        }
        throw new Error(errorMsg);
      }

      setFeedback({
        type: "success",
        msg:
          items.length > 0
            ? `✓ Customer Community Gallery updated with ${items.length} photo${
                items.length > 1 ? "s" : ""
              }! Live on homepage.`
            : "✓ Customer Community Gallery saved. (Currently empty — showcase is hidden on homepage until you add photos).",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error saving community gallery";
      setFeedback({ type: "error", msg: message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#666" }}>
        Loading community gallery settings…
      </div>
    );
  }

  // Gallery items for live preview
  const previewGalleryItems: GalleryItem[] = items
    .filter((it) => Boolean(it.image_url))
    .map((it) => ({
      common: it.customer_name || "Customer",
      binomial: it.tshirt_name || "6XTN TEE",
      photo: {
        url: it.image_url,
        text: `${it.customer_name} wearing ${it.tshirt_name}`,
        pos: "center",
        by: it.caption || "#6XTN",
      },
    }));

  return (
    <div>
      {/* ── Storage Architecture Banner ───────────────────────── */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          padding: "1rem 1.25rem",
          marginBottom: "1.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1rem" }}>☁️</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Cloudflare R2 Storage Connected
            </span>
            <span style={{ fontSize: "0.7rem", padding: "2px 8px", background: "#dcfce7", color: "#166534", borderRadius: "100px", fontWeight: 700 }}>
              Active
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.76rem", color: "#64748b" }}>
            Direct R2 Uploads store photos in <code style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: "3px" }}>products/community-gallery/</code> with instant worldwide CDN caching.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={addItem}
            style={{
              padding: "8px 16px",
              background: "#000",
              color: "#fff",
              border: "none",
              fontSize: "0.76rem",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              borderRadius: "4px",
            }}
          >
            ＋ Add Customer Photo
          </button>
        </div>
      </div>

      {/* ── Feedback Message ───────────────────────────────────── */}
      {feedback && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "1.5rem",
            border: `2px solid ${feedback.type === "success" ? "#16a34a" : "#dc2626"}`,
            background: feedback.type === "success" ? "#f0fdf4" : "#fef2f2",
            color: feedback.type === "success" ? "#15803d" : "#b91c1c",
            fontSize: "0.85rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: "4px",
          }}
        >
          <span>{feedback.msg}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Section Settings Card ──────────────────────────────── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e5e5",
          padding: "1.25rem",
          borderRadius: "6px",
          marginBottom: "2rem",
        }}
      >
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Showcase Section Header Settings
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px", color: "#333" }}>
              Section Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="WORN BY YOU"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px", color: "#333" }}>
              Hashtag / Badge
            </label>
            <input
              type="text"
              value={hashtag}
              onChange={(e) => setHashtag(e.target.value)}
              placeholder="#6XTN #STREETWEAR"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px", color: "#333" }}>
              Subtitle / Description
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Tag @6xtn.in on Instagram to be featured on our official showcase"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "0.85rem",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Live 3D Circular Animation Simulator ───────────────── */}
      <div
        style={{
          background: "#09090b",
          border: "2px solid #000",
          color: "#fff",
          padding: "1.5rem",
          marginBottom: "2.5rem",
          borderRadius: "8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <span style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a1a1aa" }}>
              3D Circular Motion Simulator
            </span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: "1.1rem", fontWeight: 800, textTransform: "uppercase" }}>
              Homepage Customer Gallery Preview ({previewGalleryItems.length} Photo{previewGalleryItems.length !== 1 ? "s" : ""})
            </h3>
          </div>
          <span style={{ fontSize: "0.72rem", color: "#888", fontStyle: "italic" }}>
            Drag with mouse or scroll to spin
          </span>
        </div>

        <div
          style={{
            height: "380px",
            background: "#000",
            border: "1px solid #27272a",
            borderRadius: "6px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {previewGalleryItems.length > 0 ? (
            <CircularGallery items={previewGalleryItems} radius={320} autoRotateSpeed={0.04} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#666", fontSize: "0.85rem" }}>
              No images uploaded yet. Add photos below.
            </div>
          )}
        </div>
      </div>

      {/* ── Photo Cards List ───────────────────────────────────── */}
      <form onSubmit={handleSave}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
            Customer Photos ({items.length})
          </h2>
          <span style={{ fontSize: "0.78rem", color: "#666" }}>
            Recommended: 4 to 8 photos for a complete 360° cylinder
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2.5rem" }}>
          {items.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3.5rem 1.5rem",
                background: "#fff",
                border: "2px dashed #e2e8f0",
                borderRadius: "8px",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📸</div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, textTransform: "uppercase", margin: "0 0 6px 0", color: "#0f172a" }}>
                No Customer Photos Added Yet
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", maxWidth: "420px", margin: "0 auto 1.5rem auto" }}>
                Default photos have been cleared. Click below to add your first customer photo and upload it directly to Cloudflare R2!
              </p>
              <button
                type="button"
                onClick={addItem}
                style={{
                  padding: "10px 22px",
                  background: "#000",
                  color: "#fff",
                  border: "none",
                  fontSize: "0.8rem",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderRadius: "4px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                ＋ Add Your First Customer Photo
              </button>
            </div>
          ) : (
            items.map((item, index) => {
            const isUploading = uploadingId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "6px",
                  padding: "1.25rem",
                  display: "grid",
                  gridTemplateColumns: "180px 1fr",
                  gap: "1.5rem",
                  alignItems: "start",
                }}
              >
                {/* Photo Thumbnail / Uploader */}
                <div>
                  <div
                    style={{
                      width: "100%",
                      height: "230px",
                      background: "#18181b",
                      borderRadius: "6px",
                      overflow: "hidden",
                      position: "relative",
                      border: "1px solid #e5e5e5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.customer_name}
                        fill
                        unoptimized
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ textAlign: "center", padding: "1rem", color: "#a1a1aa", fontSize: "0.75rem" }}>
                        <div style={{ fontSize: "1.8rem", marginBottom: "4px" }}>📷</div>
                        No Photo
                      </div>
                    )}

                    {isUploading && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(0,0,0,0.75)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            border: "3px solid #fff",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                            marginBottom: "8px",
                          }}
                        />
                        Uploading to R2…
                      </div>
                    )}
                  </div>

                  {/* Cloudflare R2 Upload Button */}
                  <label
                    style={{
                      display: "block",
                      marginTop: "8px",
                      padding: "8px 10px",
                      background: "#000",
                      color: "#fff",
                      textAlign: "center",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      cursor: isUploading ? "not-allowed" : "pointer",
                      borderRadius: "4px",
                    }}
                  >
                    {isUploading ? "Uploading…" : "☁ Upload to R2"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={(e) => handleFileUpload(e, item.id)}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>

                {/* Photo Details & Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", color: "#000" }}>
                      Photo #{index + 1}
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => moveItem(index, "up")}
                        disabled={index === 0}
                        style={{
                          padding: "4px 8px",
                          fontSize: "0.7rem",
                          border: "1px solid #ccc",
                          background: "#fff",
                          cursor: index === 0 ? "not-allowed" : "pointer",
                          opacity: index === 0 ? 0.3 : 1,
                          borderRadius: "3px",
                        }}
                        title="Move Up"
                      >
                        ↑ Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(index, "down")}
                        disabled={index === items.length - 1}
                        style={{
                          padding: "4px 8px",
                          fontSize: "0.7rem",
                          border: "1px solid #ccc",
                          background: "#fff",
                          cursor: index === items.length - 1 ? "not-allowed" : "pointer",
                          opacity: index === items.length - 1 ? 0.3 : 1,
                          borderRadius: "3px",
                        }}
                        title="Move Down"
                      >
                        ↓ Down
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "0.7rem",
                          border: "1px solid #ef4444",
                          background: "#fff",
                          color: "#ef4444",
                          cursor: "pointer",
                          borderRadius: "3px",
                          fontWeight: 700,
                        }}
                        title="Delete Photo"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "3px", color: "#555" }}>
                      Image URL (Direct link or R2 uploaded link)
                    </label>
                    <input
                      type="url"
                      value={item.image_url}
                      onChange={(e) => updateItemField(item.id, "image_url", e.target.value)}
                      placeholder="https://pub-424a99ce2b4c4f80be87dfa7907a0911.r2.dev/..."
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "0.82rem",
                        fontFamily: "monospace",
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "3px", color: "#555" }}>
                        Customer Name / Handle
                      </label>
                      <input
                        type="text"
                        value={item.customer_name}
                        onChange={(e) => updateItemField(item.id, "customer_name", e.target.value)}
                        placeholder="@username or Customer Name"
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "3px", color: "#555" }}>
                        T-Shirt Worn
                      </label>
                      <input
                        type="text"
                        value={item.tshirt_name}
                        onChange={(e) => updateItemField(item.id, "tshirt_name", e.target.value)}
                        placeholder="e.g. OFFWHITE BOXY FIT TEE"
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "3px", color: "#555" }}>
                      Location / Caption / Badge
                    </label>
                    <input
                      type="text"
                      value={item.caption || ""}
                      onChange={(e) => updateItemField(item.id, "caption", e.target.value)}
                      placeholder="e.g. Bengaluru • Size L"
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "0.82rem",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>

        {/* ── Bottom Save & Actions Bar ────────────────────────── */}
        <div
          style={{
            position: "sticky",
            bottom: "1rem",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(8px)",
            border: "2px solid #000",
            borderRadius: "6px",
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
            zIndex: 30,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: "0.9rem", textTransform: "uppercase" }}>
              Ready to publish {items.length} customer photo{items.length !== 1 ? "s" : ""}?
            </div>
            <div style={{ fontSize: "0.75rem", color: "#666" }}>
              Changes will immediately reflect in the homepage 3D rotating showcase.
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              onClick={addItem}
              style={{
                padding: "10px 16px",
                border: "1px solid #000",
                background: "#fff",
                color: "#000",
                fontSize: "0.8rem",
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: "4px",
              }}
            >
              ＋ Add Photo
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 24px",
                background: saving ? "#666" : "#000",
                color: "#fff",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: saving ? "not-allowed" : "pointer",
                borderRadius: "4px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              {saving ? "Saving Changes…" : "Save Gallery Changes ✓"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
