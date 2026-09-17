"use client";

import React, { useState } from "react";
import Image from "next/image";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  productSlug?: string;
}

export function ImageUpload({ value, onChange, productSlug }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        if (productSlug) formData.append("productSlug", productSlug);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }
        const data = await res.json();
        newUrls.push(data.url);
      }
      onChange([...value, ...newUrls]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Drop Zone */}
      <label
        htmlFor="img-upload"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "180px",
          border: "2px dashed #000",
          background: isUploading ? "#f0f0f0" : "#fafafa",
          cursor: isUploading ? "not-allowed" : "pointer",
          transition: "background 0.2s",
          color: "#000",
        }}
        onMouseEnter={(e) => {
          if (!isUploading) (e.currentTarget.style.background = "#f0f0f0");
        }}
        onMouseLeave={(e) => {
          if (!isUploading) (e.currentTarget.style.background = "#fafafa");
        }}
      >
        <span style={{ fontSize: "2rem", marginBottom: "8px" }}>
          {isUploading ? "⏳" : "☁"}
        </span>
        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#000" }}>
          {isUploading ? "Uploading…" : "Click or drag to upload images"}
        </span>
        <span style={{ fontSize: "0.75rem", color: "#666", marginTop: "4px" }}>
          JPEG, PNG, WEBP — max 10 MB
        </span>
        <input
          id="img-upload"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={onUpload}
          disabled={isUploading}
          style={{ display: "none" }}
        />
      </label>

      {error && (
        <div
          style={{
            padding: "10px 14px",
            background: "#fff0f0",
            border: "2px solid #cc0000",
            color: "#cc0000",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          ✕ {error}
        </div>
      )}

      {/* Preview Grid */}
      {value.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "12px",
          }}
        >
          {value.map((url, i) => (
            <div
              key={url}
              style={{
                position: "relative",
                aspectRatio: "3/4",
                border: "2px solid #000",
                background: "#f0f0f0",
                overflow: "hidden",
              }}
            >
              <Image src={url} alt={`Image ${i + 1}`} fill style={{ objectFit: "cover" }} />
              {/* Position badge */}
              <span
                style={{
                  position: "absolute",
                  bottom: "6px",
                  left: "6px",
                  background: "#000",
                  color: "#fff",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  padding: "2px 7px",
                }}
              >
                {i + 1}
              </span>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeImage(i)}
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  background: "#fff",
                  border: "2px solid #000",
                  color: "#000",
                  width: "26px",
                  height: "26px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 900,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
