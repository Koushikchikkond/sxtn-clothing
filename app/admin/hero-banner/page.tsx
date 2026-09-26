"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface HeroBannerData {
  desktop_url: string;
  mobile_url: string;
  alt_text?: string;
  updated_at?: string;
}

export default function AdminHeroBannerPage() {
  const [banner, setBanner] = useState<HeroBannerData>({
    desktop_url: "",
    mobile_url: "",
    alt_text: "SXTN Streetwear Hero",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Load current banner config on mount
  useEffect(() => {
    async function loadBanner() {
      try {
        const res = await fetch("/api/admin/hero-banner");
        if (res.ok) {
          const data = await res.json();
          if (data.banner) {
            setBanner(data.banner);
          }
        }
      } catch (err) {
        console.error("Failed to load hero banner", err);
      } finally {
        setLoading(false);
      }
    }
    loadBanner();
  }, []);

  // Client-side image optimization (resizes large camera/RAW images to avoid Vercel 4.5MB payload limit)
  const optimizeImageForUpload = async (file: File, maxDimension: number): Promise<File> => {
    // If file is already small (under 2MB), upload directly
    if (file.size <= 2 * 1024 * 1024) return file;

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
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "desktop" | "mobile"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isDesktop = type === "desktop";

    if (isDesktop) setUploadingDesktop(true);
    else setUploadingMobile(true);
    setFeedback(null);

    try {
      // 1. Optimize large files client-side before sending
      const readyFile = await optimizeImageForUpload(file, isDesktop ? 2560 : 1920);

      const formData = new FormData();
      formData.append("file", readyFile);
      formData.append("productSlug", "hero-banner");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errorMsg = `Upload failed (${res.status})`;
        try {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        } catch {
          const rawText = await res.text();
          if (rawText.includes("A server error has occurred") || rawText.includes("500") || rawText.includes("504")) {
            errorMsg =
              "Cloudflare R2 is not configured on the live server. Please add your Cloudflare R2 environment variables to Vercel Project Settings, or paste a direct image URL in the field below.";
          } else if (rawText) {
            errorMsg = rawText.slice(0, 200);
          }
        }
        throw new Error(errorMsg);
      }

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response. Please check your storage settings or paste a direct image URL.");
      }

      const uploadedUrl = data.url;

      setBanner((prev) => ({
        ...prev,
        [isDesktop ? "desktop_url" : "mobile_url"]: uploadedUrl,
      }));

      setFeedback({
        type: "success",
        msg: `${isDesktop ? "Desktop" : "Mobile"} image uploaded! Click "Save Changes" below to apply.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload image";
      setFeedback({ type: "error", msg: message });
    } finally {
      if (isDesktop) setUploadingDesktop(false);
      else setUploadingMobile(false);
      e.target.value = "";
    }
  };

  // Save changes to database and cache
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banner.desktop_url || !banner.mobile_url) {
      setFeedback({
        type: "error",
        msg: "Please upload or provide image URLs for both Desktop and Mobile views.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/hero-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(banner),
      });

      if (!res.ok) {
        let errorMsg = `Save failed (${res.status})`;
        try {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        } catch {
          const rawText = await res.text();
          if (rawText) errorMsg = rawText.slice(0, 200);
        }
        throw new Error(errorMsg);
      }

      setFeedback({
        type: "success",
        msg: "✓ Front page hero banner updated successfully! Live on homepage.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error saving changes";
      setFeedback({ type: "error", msg: message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#666" }}>
        Loading hero banner settings…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "1.75rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: "#000",
              margin: 0,
            }}
          >
            Front Page Banner
          </h1>
          <p style={{ color: "#666", marginTop: "6px", fontSize: "0.88rem" }}>
            Update the full-screen hero image on the homepage for Desktop & Mobile views.
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          style={{
            padding: "8px 16px",
            border: "2px solid #000",
            color: "#000",
            textDecoration: "none",
            fontSize: "0.78rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#fff",
          }}
        >
          View Live Site ↗
        </Link>
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

      {/* ── Aspect Ratio & Resolution Guide ────────────────────── */}
      <div
        style={{
          background: "#000",
          color: "#fff",
          padding: "1.25rem 1.5rem",
          marginBottom: "2rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{ fontSize: "1.1rem" }}>🖥️</span>
            <span style={{ fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Desktop / PC View Guide
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#ccc", lineHeight: "1.5" }}>
            • <strong>Ratio:</strong> 16:9 (Landscape Widescreen)<br />
            • <strong>Ideal Size:</strong> 1920 × 1080 px (or 2560 × 1440 px)<br />
            • Keep the model/focal point in the center or right.
          </p>
        </div>

        <div style={{ borderLeft: "1px solid #333", paddingLeft: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{ fontSize: "1.1rem" }}>📱</span>
            <span style={{ fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Mobile Phone View Guide
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#ccc", lineHeight: "1.5" }}>
            • <strong>Ratio:</strong> 9:16 (Full-screen Portrait)<br />
            • <strong>Ideal Size:</strong> 1080 × 1920 px (or 1125 × 2436 px)<br />
            • Keep the model/subject vertically centered.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", marginBottom: "2.5rem" }}>
          
          {/* ── 1. Desktop Banner Card ──────────────────────────── */}
          <div
            style={{
              background: "#fff",
              border: "2px solid #000",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                1. Desktop Banner
              </h2>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, background: "#000", color: "#fff", padding: "3px 8px", textTransform: "uppercase" }}>
                16:9 Ratio
              </span>
            </div>

            {/* Desktop Preview */}
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "16/9",
                background: "#18181b",
                border: "1px solid #e5e5e5",
                overflow: "hidden",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {banner.desktop_url ? (
                <Image
                  src={banner.desktop_url}
                  alt="Desktop Preview"
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="500px"
                />
              ) : (
                <span style={{ color: "#71717a", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>
                  No Desktop Image Selected
                </span>
              )}
            </div>

            {/* Desktop Upload Controls */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "1rem" }}>
              <label
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px 14px",
                  background: "#000",
                  color: "#fff",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: uploadingDesktop ? "not-allowed" : "pointer",
                  textAlign: "center",
                }}
              >
                {uploadingDesktop ? "Uploading…" : "Upload Desktop Photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  disabled={uploadingDesktop}
                  onChange={(e) => handleFileUpload(e, "desktop")}
                  style={{ display: "none" }}
                />
              </label>

              {banner.desktop_url && (
                <button
                  type="button"
                  onClick={() => setBanner((prev) => ({ ...prev, desktop_url: "" }))}
                  style={{
                    padding: "10px 14px",
                    border: "2px solid #dc2626",
                    background: "transparent",
                    color: "#dc2626",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Direct URL input */}
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", color: "#666", marginBottom: "4px" }}>
                Or Direct Image URL
              </label>
              <input
                type="url"
                value={banner.desktop_url}
                onChange={(e) => setBanner({ ...banner, desktop_url: e.target.value })}
                placeholder="https://..."
                style={{
                  width: "100%",
                  border: "1px solid #ccc",
                  padding: "8px 10px",
                  fontSize: "0.82rem",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* ── 2. Mobile Banner Card ───────────────────────────── */}
          <div
            style={{
              background: "#fff",
              border: "2px solid #000",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                2. Mobile Banner
              </h2>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, background: "#000", color: "#fff", padding: "3px 8px", textTransform: "uppercase" }}>
                9:16 Ratio
              </span>
            </div>

            {/* Mobile Preview (Phone-shaped frame) */}
            <div
              style={{
                position: "relative",
                width: "180px",
                height: "320px",
                margin: "0 auto 1rem auto",
                background: "#18181b",
                border: "2px solid #27272a",
                borderRadius: "16px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              }}
            >
              {banner.mobile_url ? (
                <Image
                  src={banner.mobile_url}
                  alt="Mobile Preview"
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="200px"
                />
              ) : (
                <span style={{ color: "#71717a", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, textAlign: "center", padding: "10px" }}>
                  No Mobile Image Selected
                </span>
              )}
            </div>

            {/* Mobile Upload Controls */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "1rem" }}>
              <label
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px 14px",
                  background: "#000",
                  color: "#fff",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: uploadingMobile ? "not-allowed" : "pointer",
                  textAlign: "center",
                }}
              >
                {uploadingMobile ? "Uploading…" : "Upload Mobile Photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  disabled={uploadingMobile}
                  onChange={(e) => handleFileUpload(e, "mobile")}
                  style={{ display: "none" }}
                />
              </label>

              {banner.mobile_url && (
                <button
                  type="button"
                  onClick={() => setBanner((prev) => ({ ...prev, mobile_url: "" }))}
                  style={{
                    padding: "10px 14px",
                    border: "2px solid #dc2626",
                    background: "transparent",
                    color: "#dc2626",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Direct URL input */}
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", color: "#666", marginBottom: "4px" }}>
                Or Direct Image URL
              </label>
              <input
                type="url"
                value={banner.mobile_url}
                onChange={(e) => setBanner({ ...banner, mobile_url: e.target.value })}
                placeholder="https://..."
                style={{
                  width: "100%",
                  border: "1px solid #ccc",
                  padding: "8px 10px",
                  fontSize: "0.82rem",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Submit Action Bar ───────────────────────────────── */}
        <div
          style={{
            position: "sticky",
            bottom: "1rem",
            background: "#fff",
            border: "2px solid #000",
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
            zIndex: 40,
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", color: "#000" }}>
              Ready to publish?
            </span>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#666" }}>
              Once saved, changes will be live across all devices immediately.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving || uploadingDesktop || uploadingMobile}
            style={{
              padding: "14px 32px",
              background: "#000",
              color: "#fff",
              border: "none",
              fontSize: "0.88rem",
              fontWeight: 900,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: saving ? "not-allowed" : "pointer",
              transition: "transform 0.1s",
            }}
          >
            {saving ? "SAVING BANNER…" : "SAVE CHANGES"}
          </button>
        </div>
      </form>
    </div>
  );
}
