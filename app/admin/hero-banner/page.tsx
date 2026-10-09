"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HeroBannerSlide } from "@/lib/hero-banner";

interface HeroBannerData {
  desktop_url: string;
  mobile_url: string;
  alt_text?: string;
  slides?: HeroBannerSlide[];
  updated_at?: string;
}

export default function AdminHeroBannerPage() {
  const [slides, setSlides] = useState<HeroBannerSlide[]>([
    {
      id: "1",
      desktop_url: "",
      mobile_url: "",
      alt_text: "6XTN Streetwear Hero 1",
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingState, setUploadingState] = useState<{
    slideId: string;
    type: "desktop" | "mobile";
  } | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Live preview simulator index
  const [previewIdx, setPreviewIdx] = useState(0);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  // Load current banner config on mount
  useEffect(() => {
    async function loadBanner() {
      try {
        const res = await fetch("/api/admin/hero-banner");
        if (res.ok) {
          const data = await res.json();
          if (data.banner) {
            const b = data.banner as HeroBannerData;
            if (b.slides && b.slides.length > 0) {
              setSlides(b.slides);
            } else if (b.desktop_url || b.mobile_url) {
              setSlides([
                {
                  id: "1",
                  desktop_url: b.desktop_url || b.mobile_url,
                  mobile_url: b.mobile_url || b.desktop_url,
                  alt_text: b.alt_text || "6XTN Hero 1",
                },
              ]);
            }
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

  // Simulator auto-rotation
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setPreviewIdx((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Client-side image optimization (resizes large camera/RAW images to avoid Vercel 4.5MB payload limit)
  const optimizeImageForUpload = async (file: File, maxDimension: number): Promise<File> => {
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
    slideId: string,
    type: "desktop" | "mobile"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isDesktop = type === "desktop";

    setUploadingState({ slideId, type });
    setFeedback(null);

    try {
      const readyFile = await optimizeImageForUpload(file, isDesktop ? 2560 : 1920);

      const formData = new FormData();
      formData.append("file", readyFile);
      formData.append("productSlug", "hero-banner");

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

      setSlides((prev) =>
        prev.map((s) => {
          if (s.id !== slideId) return s;
          return {
            ...s,
            [isDesktop ? "desktop_url" : "mobile_url"]: uploadedUrl,
          };
        })
      );

      setFeedback({
        type: "success",
        msg: `${isDesktop ? "Desktop" : "Mobile"} image uploaded! Click "Save Changes" below to apply.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload image";
      setFeedback({ type: "error", msg: message });
    } finally {
      setUploadingState(null);
      e.target.value = "";
    }
  };

  // Slide CRUD actions
  const addSlide = () => {
    const newId = String(Date.now());
    setSlides((prev) => [
      ...prev,
      {
        id: newId,
        desktop_url: "",
        mobile_url: "",
        alt_text: `6XTN Hero ${prev.length + 1}`,
      },
    ]);
  };

  const removeSlide = (id: string) => {
    if (slides.length <= 1) {
      setFeedback({
        type: "error",
        msg: "You must keep at least 1 hero banner slide.",
      });
      return;
    }
    setSlides((prev) => prev.filter((s) => s.id !== id));
  };

  const moveSlide = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    setSlides((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const updateSlideField = (
    id: string,
    field: "desktop_url" | "mobile_url" | "alt_text",
    value: string
  ) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Save changes to database and cache
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check that every slide has at least one image
    const invalidSlide = slides.find((s) => !s.desktop_url && !s.mobile_url);
    if (invalidSlide) {
      setFeedback({
        type: "error",
        msg: "Please upload or provide image URLs for each slide before saving.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        slides: slides.map((s, idx) => ({
          id: s.id || String(idx + 1),
          desktop_url: s.desktop_url || s.mobile_url,
          mobile_url: s.mobile_url || s.desktop_url,
          alt_text: s.alt_text || `6XTN Hero ${idx + 1}`,
        })),
        desktop_url: slides[0]?.desktop_url || slides[0]?.mobile_url,
        mobile_url: slides[0]?.mobile_url || slides[0]?.desktop_url,
        alt_text: slides[0]?.alt_text || "6XTN Hero",
      };

      const res = await fetch("/api/admin/hero-banner", {
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
        msg: `✓ Hero banner loop updated with ${slides.length} slide${
          slides.length > 1 ? "s" : ""
        }! Live on homepage.`,
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

  const currentPreviewSlide = slides[previewIdx] || slides[0];

  return (
    <div style={{ maxWidth: "1050px", margin: "0 auto", paddingBottom: "5rem" }}>
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
            Front Page Hero Carousel
          </h1>
          <p style={{ color: "#666", marginTop: "6px", fontSize: "0.88rem" }}>
            Manage multiple hero images that automatically loop and cycle one by one on the homepage for Desktop & Mobile.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            onClick={addSlide}
            style={{
              padding: "10px 18px",
              background: "#000",
              color: "#fff",
              border: "none",
              fontSize: "0.8rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ＋ Add Another Slide
          </button>

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

      {/* ── Live Carousel Simulator / Previewer ───────────────── */}
      <div
        style={{
          background: "#09090b",
          border: "2px solid #000",
          color: "#fff",
          padding: "1.5rem",
          marginBottom: "2.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <span style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a1a1aa" }}>
              Live Loop Simulator
            </span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: "1.1rem", fontWeight: 800, textTransform: "uppercase" }}>
              Homepage Hero Preview ({slides.length} Slide{slides.length > 1 ? "s" : ""})
            </h3>
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setPreviewMode("desktop")}
              style={{
                padding: "6px 12px",
                background: previewMode === "desktop" ? "#fff" : "#27272a",
                color: previewMode === "desktop" ? "#000" : "#fff",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              🖥️ Desktop View
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("mobile")}
              style={{
                padding: "6px 12px",
                background: previewMode === "mobile" ? "#fff" : "#27272a",
                color: previewMode === "mobile" ? "#000" : "#fff",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              📱 Mobile View
            </button>
          </div>
        </div>

        {/* Simulator Frame */}
        <div
          style={{
            position: "relative",
            width: previewMode === "desktop" ? "100%" : "220px",
            aspectRatio: previewMode === "desktop" ? "16/7" : "9/16",
            maxHeight: previewMode === "desktop" ? "360px" : "390px",
            margin: "0 auto",
            background: "#18181b",
            borderRadius: previewMode === "mobile" ? "16px" : "4px",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #3f3f46",
          }}
        >
          {currentPreviewSlide &&
          (previewMode === "desktop"
            ? currentPreviewSlide.desktop_url || currentPreviewSlide.mobile_url
            : currentPreviewSlide.mobile_url || currentPreviewSlide.desktop_url) ? (
            <Image
              src={
                previewMode === "desktop"
                  ? currentPreviewSlide.desktop_url || currentPreviewSlide.mobile_url
                  : currentPreviewSlide.mobile_url || currentPreviewSlide.desktop_url
              }
              alt="Preview"
              fill
              style={{ objectFit: "cover", opacity: 0.8 }}
              sizes="600px"
            />
          ) : (
            <span style={{ color: "#71717a", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>
              No image in Slide #{previewIdx + 1}
            </span>
          )}

          {/* Vignette */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent, rgba(0,0,0,0.8))",
              pointerEvents: "none",
            }}
          />

          {/* Slide dots in simulator */}
          {slides.length > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                display: "flex",
                gap: "6px",
                zIndex: 10,
              }}
            >
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPreviewIdx(idx)}
                  style={{
                    width: idx === previewIdx ? "20px" : "8px",
                    height: "6px",
                    borderRadius: "999px",
                    background: idx === previewIdx ? "#fff" : "rgba(255,255,255,0.4)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: "10px", textAlign: "center", fontSize: "0.75rem", color: "#a1a1aa" }}>
          Showing Slide {previewIdx + 1} of {slides.length} • Changes every 4s automatically in loop
        </div>
      </div>

      {/* ── Slide Editor Forms ─────────────────────────────────── */}
      <form onSubmit={handleSave}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", marginBottom: "3rem" }}>
          {slides.map((slide, index) => {
            const isUploadingDesktop =
              uploadingState?.slideId === slide.id && uploadingState?.type === "desktop";
            const isUploadingMobile =
              uploadingState?.slideId === slide.id && uploadingState?.type === "mobile";

            return (
              <div
                key={slide.id}
                style={{
                  background: "#fff",
                  border: "2px solid #000",
                  padding: "1.75rem",
                  position: "relative",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                }}
              >
                {/* Slide Card Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.25rem",
                    paddingBottom: "1rem",
                    borderBottom: "1px solid #eee",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        background: "#000",
                        color: "#fff",
                        padding: "4px 10px",
                        fontSize: "0.8rem",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Slide #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={slide.alt_text || ""}
                      onChange={(e) => updateSlideField(slide.id, "alt_text", e.target.value)}
                      placeholder={`Slide ${index + 1} Label / Alt Text`}
                      style={{
                        border: "1px solid #ddd",
                        padding: "4px 8px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        width: "240px",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveSlide(index, "up")}
                      style={{
                        padding: "6px 10px",
                        border: "1px solid #ccc",
                        background: index === 0 ? "#f4f4f5" : "#fff",
                        color: index === 0 ? "#a1a1aa" : "#000",
                        cursor: index === 0 ? "not-allowed" : "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      ▲ Move Up
                    </button>
                    <button
                      type="button"
                      disabled={index === slides.length - 1}
                      onClick={() => moveSlide(index, "down")}
                      style={{
                        padding: "6px 10px",
                        border: "1px solid #ccc",
                        background: index === slides.length - 1 ? "#f4f4f5" : "#fff",
                        color: index === slides.length - 1 ? "#a1a1aa" : "#000",
                        cursor: index === slides.length - 1 ? "not-allowed" : "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      ▼ Move Down
                    </button>

                    {slides.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSlide(slide.id)}
                        style={{
                          padding: "6px 12px",
                          border: "1px solid #dc2626",
                          background: "#fef2f2",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                        }}
                      >
                        ✕ Delete Slide
                      </button>
                    )}
                  </div>
                </div>

                {/* Two Column Desktop + Mobile Uploads */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "2rem",
                  }}
                >
                  {/* Desktop Banner Column */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase" }}>
                        🖥️ Desktop Photo (16:9)
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "#666" }}>1920 × 1080 px</span>
                    </div>

                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "16/9",
                        background: "#18181b",
                        border: "1px solid #e5e5e5",
                        overflow: "hidden",
                        marginBottom: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {slide.desktop_url ? (
                        <Image
                          src={slide.desktop_url}
                          alt="Desktop"
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="400px"
                        />
                      ) : (
                        <span style={{ color: "#71717a", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase" }}>
                          No Desktop Image
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <label
                        style={{
                          flex: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "9px 12px",
                          background: "#000",
                          color: "#fff",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          cursor: isUploadingDesktop ? "not-allowed" : "pointer",
                          textAlign: "center",
                        }}
                      >
                        {isUploadingDesktop ? "Uploading…" : "Upload Desktop Photo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          disabled={isUploadingDesktop}
                          onChange={(e) => handleFileUpload(e, slide.id, "desktop")}
                          style={{ display: "none" }}
                        />
                      </label>

                      {slide.desktop_url && (
                        <button
                          type="button"
                          onClick={() => updateSlideField(slide.id, "desktop_url", "")}
                          style={{
                            padding: "9px 12px",
                            border: "1px solid #dc2626",
                            background: "transparent",
                            color: "#dc2626",
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      value={slide.desktop_url}
                      onChange={(e) => updateSlideField(slide.id, "desktop_url", e.target.value)}
                      placeholder="Or paste direct image URL (https://...)"
                      style={{
                        width: "100%",
                        border: "1px solid #ccc",
                        padding: "7px 10px",
                        fontSize: "0.8rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Mobile Banner Column */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase" }}>
                        📱 Mobile Photo (9:16)
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "#666" }}>1080 × 1920 px</span>
                    </div>

                    <div
                      style={{
                        position: "relative",
                        width: "140px",
                        height: "248px",
                        margin: "0 auto 10px auto",
                        background: "#18181b",
                        border: "2px solid #27272a",
                        borderRadius: "12px",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {slide.mobile_url ? (
                        <Image
                          src={slide.mobile_url}
                          alt="Mobile"
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="150px"
                        />
                      ) : (
                        <span style={{ color: "#71717a", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", textAlign: "center", padding: "6px" }}>
                          No Mobile Image
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <label
                        style={{
                          flex: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "9px 12px",
                          background: "#000",
                          color: "#fff",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          cursor: isUploadingMobile ? "not-allowed" : "pointer",
                          textAlign: "center",
                        }}
                      >
                        {isUploadingMobile ? "Uploading…" : "Upload Mobile Photo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          disabled={isUploadingMobile}
                          onChange={(e) => handleFileUpload(e, slide.id, "mobile")}
                          style={{ display: "none" }}
                        />
                      </label>

                      {slide.mobile_url && (
                        <button
                          type="button"
                          onClick={() => updateSlideField(slide.id, "mobile_url", "")}
                          style={{
                            padding: "9px 12px",
                            border: "1px solid #dc2626",
                            background: "transparent",
                            color: "#dc2626",
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      value={slide.mobile_url}
                      onChange={(e) => updateSlideField(slide.id, "mobile_url", e.target.value)}
                      placeholder="Or paste direct image URL (https://...)"
                      style={{
                        width: "100%",
                        border: "1px solid #ccc",
                        padding: "7px 10px",
                        fontSize: "0.8rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Slide Bottom Action */}
          <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={addSlide}
              style={{
                padding: "14px 28px",
                background: "#f4f4f5",
                color: "#000",
                border: "2px dashed #a1a1aa",
                fontSize: "0.85rem",
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              ＋ Add Slide #{slides.length + 1} To Loop
            </button>
          </div>
        </div>

        {/* ── Sticky Action Bar ───────────────────────────────── */}
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
              Publish {slides.length} Slide{slides.length > 1 ? "s" : ""} to Live Homepage?
            </span>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#666" }}>
              Changes will update the live hero loop across desktop and mobile devices immediately.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving || uploadingState !== null}
            style={{
              padding: "14px 34px",
              background: "#000",
              color: "#fff",
              border: "none",
              fontSize: "0.88rem",
              fontWeight: 900,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "SAVING CAROUSEL…" : "SAVE CHANGES"}
          </button>
        </div>
      </form>
    </div>
  );
}
