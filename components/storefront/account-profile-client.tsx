"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Order } from "@/types/database.types";

interface Props {
  user: { email: string; id: string };
  profile: Profile | null;
  recentOrders: Pick<Order, "id" | "status" | "total" | "created_at">[];
}

const STATUS_COLOURS: Record<string, string> = {
  pending: "#f59e0b",
  paid: "#3b82f6",
  confirmed: "#8b5cf6",
  shipped: "#06b6d4",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

export function AccountProfileClient({ user, profile, recentOrders }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName, phone } as any);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { href: "/account", label: "Profile", active: true },
    { href: "/account/orders", label: "Orders" },
    { href: "/account/addresses", label: "Addresses" },
    { href: "/account/wishlist", label: "Wishlist" },
  ];

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto min-h-screen">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="font-display text-5xl sm:text-6xl uppercase tracking-tight text-white">
          My Account
        </h1>
        <p className="text-white/40 mt-2 text-sm tracking-wide">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <nav className="md:col-span-1">
          <ul className="space-y-1">
            {navItems.map(({ href, label, active }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`block px-4 py-3 text-sm uppercase tracking-widest font-medium border-l-2 transition-colors ${
                    active
                      ? "border-white text-white bg-white/5"
                      : "border-transparent text-white/40 hover:text-white hover:border-white/40"
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li className="pt-4">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="block w-full text-left px-4 py-3 text-sm uppercase tracking-widest font-medium border-l-2 border-transparent text-red-400/70 hover:text-red-400 hover:border-red-400/50 transition-colors"
              >
                {signingOut ? "Signing out…" : "Sign Out"}
              </button>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <div className="md:col-span-3 space-y-8">
          {/* Profile Form */}
          <section className="border border-white/10 p-6">
            <h2 className="font-display text-2xl uppercase tracking-tight text-white mb-6">
              Personal Details
            </h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-white/5 border border-white/5 px-4 py-3 text-white/30 text-sm cursor-not-allowed"
                />
                <p className="text-white/20 text-xs mt-1">Email cannot be changed.</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-white text-black text-sm font-bold uppercase tracking-widest hover:bg-white/90 disabled:opacity-50 transition-all"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                {saved && (
                  <span className="text-green-400 text-sm tracking-wide">✓ Saved!</span>
                )}
              </div>
            </form>
          </section>

          {/* Recent Orders */}
          <section className="border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl uppercase tracking-tight text-white">
                Recent Orders
              </h2>
              <Link
                href="/account/orders"
                className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors"
              >
                View All →
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-white/30 text-sm">No orders yet.</p>
                <Link
                  href="/collections/all"
                  className="mt-4 inline-block text-xs uppercase tracking-widest text-white/60 hover:text-white border-b border-white/20 hover:border-white pb-0.5 transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="flex items-center justify-between p-4 border border-white/10 hover:border-white/30 transition-colors group"
                    >
                      <div>
                        <p className="text-white text-sm font-medium font-mono">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-white/30 text-xs mt-0.5">
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className="text-xs uppercase tracking-widest px-2 py-1"
                          style={{
                            color: STATUS_COLOURS[order.status] ?? "#fff",
                            border: `1px solid ${STATUS_COLOURS[order.status] ?? "#fff"}`,
                            opacity: 0.8,
                          }}
                        >
                          {order.status}
                        </span>
                        <span className="text-white font-medium">
                          ₹{order.total.toLocaleString("en-IN")}
                        </span>
                        <span className="text-white/20 group-hover:text-white/60 transition-colors">→</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
