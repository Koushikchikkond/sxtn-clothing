"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminCollectionsPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName]   = useState("");
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("id, name, slug, created_at").order("name");
    setCategories((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error: err } = await supabase.from("categories").insert({ name: name.trim(), slug } as any);
    if (err) { setError(err.message); } else { setSuccess(true); setName(""); setTimeout(() => setSuccess(false), 2000); load(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this collection? Products in it won't be deleted, just unlinked.")) return;
    setDeletingId(id);
    await supabase.from("categories").delete().eq("id", id);
    setDeletingId(null);
    load();
  };

  const inputStyle: React.CSSProperties = { border: "2px solid #000", padding: "10px 12px", fontSize: "0.9rem", outline: "none", background: "#fff", color: "#000", flex: 1 };

  return (
    <div style={{ maxWidth: "680px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", color: "#000", marginBottom: "1.5rem" }}>
        Collections
      </h1>

      {/* Create form */}
      <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#000", marginBottom: "1rem" }}>
          Create New Collection
        </h2>
        {error && <p style={{ background: "#fff0f0", border: "1px solid #cc0000", color: "#cc0000", padding: "8px 12px", fontSize: "0.8rem", marginBottom: "12px" }}>{error}</p>}
        {success && <p style={{ background: "#f0fff4", border: "1px solid #16a34a", color: "#16a34a", padding: "8px 12px", fontSize: "0.8rem", marginBottom: "12px" }}>✓ Collection created!</p>}
        <form onSubmit={handleCreate} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer Drop 2025"
            required
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={saving}
            style={{ background: saving ? "#555" : "#000", color: "#fff", border: "none", padding: "10px 20px", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
          >
            {saving ? "Creating…" : "+ Create"}
          </button>
        </form>
      </div>

      {/* Collections list */}
      <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e5e5" }}>
          <h2 style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#000" }}>
            All Collections ({categories.length})
          </h2>
        </div>
        {loading ? (
          <p style={{ padding: "2rem", color: "#aaa", textAlign: "center", fontSize: "0.85rem" }}>Loading…</p>
        ) : categories.length === 0 ? (
          <p style={{ padding: "2rem", color: "#aaa", textAlign: "center", fontSize: "0.85rem" }}>No collections yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                {["Name", "Slug", "Created", ""].map((h, i) => (
                  <th key={i} style={{ padding: "10px 16px", textAlign: "left", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: "0.85rem", color: "#000" }}>{cat.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: "0.78rem", color: "#888", fontFamily: "monospace" }}>/{cat.slug}</td>
                  <td style={{ padding: "12px 16px", fontSize: "0.75rem", color: "#666" }}>{new Date(cat.created_at).toLocaleDateString("en-IN")}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id}
                      style={{ background: "none", border: "1px solid #dc2626", color: "#dc2626", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", cursor: "pointer" }}
                    >
                      {deletingId === cat.id ? "…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
