"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Address } from "@/types/database.types";
import { Plus, Trash2, MapPin, Mail, CheckCircle2, Edit2 } from "lucide-react";
import { INDIAN_STATES, getCitiesForState } from "@/lib/data/india-locations";
import {
  parseAddressMeta,
  encodeAddressMeta,
  normalizePhoneDigits,
  validatePhonePair,
} from "@/lib/address";

export default function AddressesPage() {
  const supabase = createClient();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [customCityMode, setCustomCityMode] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    secondary_phone: "",
    line1: "",
    line2: "",
    tag: "Home",
    city: "",
    state: "",
    pincode: "",
    is_default: false,
  });

  const availableCities = form.state ? getCitiesForState(form.state) : [];

  const load = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserEmail(user.email || "");

    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });

    setAddresses((data as Address[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleStateChange = (selectedState: string) => {
    setForm((f) => ({
      ...f,
      state: selectedState,
      city: "", // reset city when state changes
    }));
    setCustomCityMode(false);
  };

  const handleCitySelectChange = (val: string) => {
    if (val === "__other__") {
      setCustomCityMode(true);
      setForm((f) => ({ ...f, city: "" }));
    } else {
      setCustomCityMode(false);
      setForm((f) => ({ ...f, city: val }));
    }
  };

  const resetForm = () => {
    setForm({
      full_name: "",
      phone: "",
      secondary_phone: "",
      line1: "",
      line2: "",
      tag: "Home",
      city: "",
      state: "",
      pincode: "",
      is_default: false,
    });
    setEditingId(null);
    setShowForm(false);
    setCustomCityMode(false);
    setFormError(null);
  };

  const handleEdit = (addr: Address) => {
    const { tag, secondaryPhone, cleanLine2 } = parseAddressMeta(addr.line2);
    const cities = addr.state ? getCitiesForState(addr.state) : [];
    const isCustomCity = addr.city && !cities.includes(addr.city);

    setEditingId(addr.id);
    setForm({
      full_name: addr.full_name || "",
      phone: addr.phone || "",
      secondary_phone: secondaryPhone,
      line1: addr.line1 || "",
      line2: cleanLine2,
      tag: tag || "Home",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      is_default: addr.is_default || false,
    });
    setCustomCityMode(Boolean(isCustomCity));
    setFormError(null);
    setShowForm(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const phoneErr = validatePhonePair(form.phone, form.secondary_phone);
    if (phoneErr) {
      setFormError(phoneErr);
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const payload = {
      full_name: form.full_name.trim(),
      phone: normalizePhoneDigits(form.phone),
      line1: form.line1.trim(),
      line2: encodeAddressMeta(form.tag, form.line2, form.secondary_phone),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      is_default: form.is_default || (editingId ? form.is_default : addresses.length === 0),
    };

    if (payload.is_default) {
      await (supabase.from("addresses") as any)
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    if (editingId) {
      await (supabase.from("addresses") as any)
        .update(payload)
        .eq("id", editingId);
    } else {
      await (supabase.from("addresses") as any).insert({
        ...payload,
        user_id: user.id,
      });
    }

    await load();
    resetForm();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this address?")) return;
    await supabase.from("addresses").delete().eq("id", id);
    if (editingId === id) resetForm();
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDefault = async (id: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase.from("addresses") as any).update({ is_default: false }).eq("user_id", user.id);
    await (supabase.from("addresses") as any).update({ is_default: true }).eq("id", id);
    await load();
  };

  const inputClass =
    "w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors";
  const selectClass =
    "w-full bg-[#121212] border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-white/40 transition-colors appearance-none cursor-pointer";
  const labelClass = "block text-xs uppercase tracking-widest text-white/40 mb-2";

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <Link
            href="/account"
            className="text-xs uppercase tracking-widest text-white/30 hover:text-white transition-colors"
          >
            ← Account
          </Link>
          <h1 className="font-display text-5xl sm:text-6xl uppercase tracking-tight text-white mt-2">
            Addresses
          </h1>
          {userEmail && (
            <div className="flex items-center gap-2 mt-3 text-xs uppercase tracking-widest text-white/40">
              <Mail className="w-3.5 h-3.5 text-white/50" />
              <span>Linked Account: {userEmail}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
          className="flex items-center gap-2 px-5 py-2.5 border border-white/20 text-white text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          {showForm ? "Cancel" : "Add New"}
        </button>
      </div>

      {/* Add / Edit Address Form */}
      {showForm && (
        <form
          ref={formRef}
          onSubmit={handleSave}
          className="mb-8 border border-white/20 p-6 space-y-5 bg-white/[0.02]"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="font-display text-xl uppercase tracking-tight text-white flex items-center gap-2">
              {editingId ? <Edit2 className="w-4 h-4 text-white/70" /> : <Plus className="w-4 h-4 text-white/70" />}
              <span>{editingId ? "Update Delivery Address" : "Add New Delivery Address"}</span>
            </h2>
            <span className="text-[11px] uppercase tracking-widest text-white/40">
              {editingId ? "Editing saved address" : "Saved to your profile"}
            </span>
          </div>

          {/* Address Tag Selector */}
          <div>
            <label className={labelClass}>Address Tag / Type *</label>
            <div className="flex flex-wrap items-center gap-2">
              {["Home", "Office", "Other"].map((tagOption) => (
                <button
                  key={tagOption}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tag: tagOption }))}
                  className={`px-4 py-2 text-xs uppercase tracking-widest font-bold border transition-colors ${
                    form.tag === tagOption
                      ? "bg-white text-black border-white"
                      : "border-white/20 text-white/70 hover:border-white/50 bg-white/5"
                  }`}
                >
                  {tagOption}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Full Name *</label>
              <input
                required
                className={inputClass}
                placeholder="Full recipient name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Primary Phone *</label>
              <input
                required
                type="tel"
                pattern="[0-9]{10}"
                maxLength={10}
                className={inputClass}
                placeholder="10-digit primary mobile number"
                value={form.phone}
                onChange={(e) => {
                  setFormError(null);
                  setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }));
                }}
              />
            </div>
            <div>
              <label className={labelClass}>Secondary / Alternative Phone</label>
              <input
                type="tel"
                pattern="[0-9]{10}"
                maxLength={10}
                className={inputClass}
                placeholder="10-digit alternate number (optional)"
                value={form.secondary_phone}
                onChange={(e) => {
                  setFormError(null);
                  setForm((f) => ({ ...f, secondary_phone: e.target.value.replace(/\D/g, "").slice(0, 10) }));
                }}
              />
            </div>
          </div>

          {((form.phone && form.secondary_phone && normalizePhoneDigits(form.phone) === normalizePhoneDigits(form.secondary_phone)) || formError) && (
            <p className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 px-3 py-2">
              {form.phone && form.secondary_phone && normalizePhoneDigits(form.phone) === normalizePhoneDigits(form.secondary_phone)
                ? "Primary and secondary phone numbers cannot be the same."
                : formError}
            </p>
          )}

          <div>
            <label className={labelClass}>Address Line 1 (Flat, House, Building, Street) *</label>
            <input
              required
              className={inputClass}
              placeholder="e.g. 402, Skyline Towers, 12th Main Road"
              value={form.line1}
              onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
            />
          </div>

          <div>
            <label className={labelClass}>Address Line 2 (Area, Landmark) - Optional</label>
            <input
              className={inputClass}
              placeholder="e.g. Near Metro Station, Indiranagar"
              value={form.line2}
              onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* State Dropdown */}
            <div>
              <label className={labelClass}>State / UT *</label>
              <select
                required
                className={selectClass}
                value={form.state}
                onChange={(e) => handleStateChange(e.target.value)}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            {/* City Dropdown */}
            <div>
              <label className={labelClass}>City *</label>
              {!customCityMode ? (
                <select
                  required
                  disabled={!form.state}
                  className={`${selectClass} ${!form.state ? "opacity-40 cursor-not-allowed" : ""}`}
                  value={form.city}
                  onChange={(e) => handleCitySelectChange(e.target.value)}
                >
                  <option value="">
                    {!form.state ? "Select State First" : "Select City"}
                  </option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                  {form.state && (
                    <option value="__other__">+ Other (Enter Manually)</option>
                  )}
                </select>
              ) : (
                <div className="space-y-2">
                  <input
                    required
                    autoFocus
                    className={inputClass}
                    placeholder="Enter your city name"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCityMode(false);
                      setForm((f) => ({ ...f, city: "" }));
                    }}
                    className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white underline"
                  >
                    ← Back to city list
                  </button>
                </div>
              )}
            </div>

            {/* PIN Code */}
            <div>
              <label className={labelClass}>PIN Code *</label>
              <input
                required
                pattern="[0-9]{6}"
                maxLength={6}
                className={inputClass}
                placeholder="6-digit PIN"
                value={form.pincode}
                onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
              />
            </div>
          </div>

          {/* Set as default checkbox */}
          <div className="pt-1">
            <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs uppercase tracking-widest text-white/80 hover:text-white select-none">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
                className="w-4 h-4 accent-white rounded-none cursor-pointer"
              />
              <span>Set as default delivery address</span>
            </label>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/90 disabled:opacity-50 transition-all"
            >
              {saving ? "Saving…" : editingId ? "Update Address" : "Save Address"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 border border-white/20 text-white text-xs uppercase tracking-widest hover:border-white/40 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Address List */}
      {loading ? (
        <div className="py-20 text-center text-white/30 text-sm">Loading saved addresses…</div>
      ) : addresses.length === 0 ? (
        <div className="py-20 text-center border border-white/10">
          <MapPin className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No saved addresses found.</p>
          <p className="text-white/20 text-xs mt-1">
            Add an address above or during checkout to save it to your account.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => {
            const { tag, secondaryPhone, cleanLine2 } = parseAddressMeta(addr.line2);

            return (
              <div
                key={addr.id}
                className={`border p-5 relative transition-all ${
                  addr.is_default
                    ? "border-white bg-white/[0.03]"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 border border-white/20 bg-white/5 text-white/80">
                    {tag}
                  </span>
                  {addr.is_default && (
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-black bg-white px-2 py-0.5">
                      <CheckCircle2 className="w-3 h-3 text-black" />
                      Default
                    </span>
                  )}
                </div>

                <p className="text-white font-medium text-base">{addr.full_name}</p>
                <p className="text-white/60 text-sm mt-1 leading-relaxed">
                  {addr.line1}
                  {cleanLine2 ? `, ${cleanLine2}` : ""}
                  <br />
                  {addr.city}, {addr.state} — {addr.pincode}
                </p>
                <div className="text-white/40 text-xs mt-3 space-y-1">
                  <p className="flex items-center gap-2">
                    <span>Primary:</span>
                    <span className="text-white/70 font-mono">{addr.phone}</span>
                  </p>
                  {secondaryPhone && (
                    <p className="flex items-center gap-2">
                      <span>Secondary:</span>
                      <span className="text-white/70 font-mono">{secondaryPhone}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10 flex-wrap">
                  <button
                    onClick={() => handleEdit(addr)}
                    className="text-xs uppercase tracking-widest text-white/70 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>

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
                    className="ml-auto text-xs uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
