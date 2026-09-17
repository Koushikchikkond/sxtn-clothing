"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Address } from "@/types/database.types";
import { Plus, Trash2, MapPin } from "lucide-react";

export default function AddressesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "", phone: "", line1: "", line2: "",
    city: "", state: "", pincode: "",
  });

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });
    setAddresses((data as Address[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("addresses").insert({
      user_id: user.id,
      ...form,
      is_default: addresses.length === 0,
    } as any);
    await load();
    setShowForm(false);
    setForm({ full_name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" });
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDefault = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase.from("addresses") as any).update({ is_default: false }).eq("user_id", user.id);
    await (supabase.from("addresses") as any).update({ is_default: true }).eq("id", id);
    await load();
  };

  const inputClass = "w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors";
  const labelClass = "block text-xs uppercase tracking-widest text-white/40 mb-2";

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <Link href="/account" className="text-xs uppercase tracking-widest text-white/30 hover:text-white transition-colors">
            ← Account
          </Link>
          <h1 className="font-display text-5xl sm:text-6xl uppercase tracking-tight text-white mt-2">
            Addresses
          </h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-5 py-2.5 border border-white/20 text-white text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          {showForm ? "Cancel" : "Add New"}
        </button>
      </div>

      {/* Add Address Form */}
      {showForm && (
        <form onSubmit={handleSave} className="mb-8 border border-white/20 p-6 space-y-4">
          <h2 className="font-display text-xl uppercase tracking-tight text-white mb-2">New Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input required className={inputClass} placeholder="Your name" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input required className={inputClass} placeholder="10-digit number" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Address Line 1</label>
            <input required className={inputClass} placeholder="House/Flat, Street" value={form.line1} onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>Address Line 2 (Optional)</label>
            <input className={inputClass} placeholder="Area, Landmark" value={form.line2} onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>City</label>
              <input required className={inputClass} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input required className={inputClass} value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>PIN Code</label>
              <input required className={inputClass} value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="px-8 py-3 bg-white text-black text-sm font-bold uppercase tracking-widest hover:bg-white/90 disabled:opacity-50 transition-all">
            {saving ? "Saving…" : "Save Address"}
          </button>
        </form>
      )}

      {/* Address List */}
      {loading ? (
        <div className="py-20 text-center text-white/30 text-sm">Loading…</div>
      ) : addresses.length === 0 ? (
        <div className="py-20 text-center border border-white/10">
          <MapPin className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No saved addresses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`border p-5 relative ${addr.is_default ? "border-white" : "border-white/10"}`}
            >
              {addr.is_default && (
                <span className="absolute top-3 right-3 text-xs uppercase tracking-widest text-black bg-white px-2 py-0.5">
                  Default
                </span>
              )}
              <p className="text-white font-medium">{addr.full_name}</p>
              <p className="text-white/50 text-sm mt-1 leading-relaxed">
                {addr.line1}
                {addr.line2 ? `, ${addr.line2}` : ""}<br />
                {addr.city}, {addr.state} — {addr.pincode}
              </p>
              <p className="text-white/40 text-xs mt-2">{addr.phone}</p>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
                {!addr.is_default && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="ml-auto text-xs uppercase tracking-widest text-red-400/50 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
