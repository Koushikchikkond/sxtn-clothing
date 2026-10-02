"use client";

import { useState } from "react";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Truck,
  Ban,
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  PackageCheck,
} from "lucide-react";
import Link from "next/link";

const SENDER_OPTIONS = [
  { id: "orders", label: "SXTN Orders", email: "orders@6xtn.in", role: "Order Confirmations & Receipts" },
  { id: "shipping", label: "SXTN Shipping", email: "shipping@6xtn.in", role: "Dispatch & Tracking" },
  { id: "support", label: "SXTN Support", email: "support@6xtn.in", role: "Cancellations & Refunds" },
  { id: "billing", label: "SXTN Billing", email: "billing@6xtn.in", role: "Invoices & Payments" },
  { id: "updates", label: "SXTN Updates", email: "updates@6xtn.in", role: "Drops & Notifications" },
  { id: "hello", label: "SXTN Concierge", email: "hello@6xtn.in", role: "General Inquiries" },
];

const TEMPLATE_PRESETS = [
  {
    id: "confirmation",
    title: "Order Confirmed & Paid",
    sender: "orders@6xtn.in",
    desc: "Sent when customer pays via Razorpay. Includes item details, sizes, colors, receipt, and address.",
    icon: ShoppingBag,
    color: "#a78bfa",
  },
  {
    id: "shipped",
    title: "Order Dispatched / Tracking",
    sender: "shipping@6xtn.in",
    desc: "Sent when order is shipped with Delhivery/Bluedart tracking number and tracking URL.",
    icon: Truck,
    color: "#38bdf8",
  },
  {
    id: "delivered",
    title: "Order Delivered",
    sender: "shipping@6xtn.in",
    desc: "Sent when package has been safely delivered to customer.",
    icon: PackageCheck,
    color: "#4ade80",
  },
  {
    id: "cancelled",
    title: "Order Cancelled with Reason",
    sender: "support@6xtn.in",
    desc: "Sent when order is cancelled. Clearly displays cancellation reason & refund schedule.",
    icon: Ban,
    color: "#ef4444",
  },
  {
    id: "failed",
    title: "Payment Incomplete / Failed",
    sender: "support@6xtn.in",
    desc: "Sent if transaction drops or is abandoned during payment gateway processing.",
    icon: CreditCard,
    color: "#fb923c",
  },
  {
    id: "ping",
    title: "Simple Connection Ping",
    sender: "orders@6xtn.in",
    desc: "Basic ping to verify API connectivity and server response.",
    icon: Mail,
    color: "#94a3b8",
  },
];

const CANCEL_REASONS = [
  "Customer requested cancellation before fulfillment",
  "Incorrect size/variant ordered by customer",
  "Item currently out of stock / limited batch sold out",
  "Delivery pincode not serviceable by courier",
  "Duplicate order detected / accidental double charge",
];

export default function TestEmailPage() {
  const [email, setEmail] = useState("");
  const [senderType, setSenderType] = useState("orders");
  const [templateType, setTemplateType] = useState("confirmation");
  const [cancellationReason, setCancellationReason] = useState(CANCEL_REASONS[0]);
  const [courierName, setCourierName] = useState("Delhivery");
  const [trackingNumber, setTrackingNumber] = useState("DEL99482103");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    from?: string;
    emailId?: string;
    subject?: string;
  } | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email.trim(),
          senderType,
          templateType,
          cancellationReason,
          courierName,
          trackingNumber,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Network request failed",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="border border-white/10 p-6 sm:p-8 bg-[#0a0a0a]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#a78bfa]">
                Resend Infrastructure & Automation
              </span>
              <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-wider text-white mt-1">
                Email Dispatcher & Multi-Sender Studio
              </h1>
              <p className="text-xs text-white/50 mt-1">
                Domain <strong>6xtn.in</strong> is active. Test any email scenario and sender ID directly to your inbox.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 text-xs text-green-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Domain Verified (6xtn.in)</span>
            </div>
          </div>

          {/* Departmental Sender Badges */}
          <div className="space-y-2 mb-8">
            <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">
              Configured Departmental Senders
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SENDER_OPTIONS.map((snd) => (
                <div
                  key={snd.id}
                  onClick={() => setSenderType(snd.id)}
                  className={`p-3 border text-left cursor-pointer transition-all ${
                    senderType === snd.id
                      ? "border-white bg-white/10"
                      : "border-white/10 bg-white/5 hover:border-white/30"
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-white">{snd.label}</p>
                  <p className="text-[11px] font-mono text-[#a78bfa]">{snd.email}</p>
                  <p className="text-[10px] text-white/40 mt-1">{snd.role}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-6">
            {/* Recipient */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/70 mb-2 font-bold">
                Recipient Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="w-full bg-white/5 border border-white/15 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/50 transition-colors"
                />
                <Mail className="w-4 h-4 text-white/30 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/70 mb-3 font-bold">
                Select Email Scenario / Template
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEMPLATE_PRESETS.map((tmpl) => {
                  const Icon = tmpl.icon;
                  const isSelected = templateType === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => {
                        setTemplateType(tmpl.id);
                        if (tmpl.id === "confirmation") setSenderType("orders");
                        else if (tmpl.id === "shipped" || tmpl.id === "delivered") setSenderType("shipping");
                        else if (tmpl.id === "cancelled" || tmpl.id === "failed") setSenderType("support");
                      }}
                      className={`p-4 border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "border-white bg-white/10 ring-1 ring-white/20"
                          : "border-white/10 bg-white/5 hover:border-white/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className="w-4 h-4" style={{ color: tmpl.color }} />
                        <span className="text-xs font-bold uppercase tracking-wider text-white">
                          {tmpl.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed mb-2">{tmpl.desc}</p>
                      <span className="text-[10px] font-mono uppercase tracking-wide text-white/40 bg-black/40 px-2 py-0.5 border border-white/5">
                        Sender: {tmpl.sender}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Options for Specific Scenarios */}
            {templateType === "cancelled" && (
              <div className="p-4 border border-red-500/20 bg-red-950/20 space-y-3">
                <label className="block text-xs uppercase tracking-widest text-red-300 font-bold">
                  Cancellation Reason (Included in Email & Saved to Supabase)
                </label>
                <select
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full bg-black border border-white/20 p-2.5 text-xs text-white focus:outline-none"
                >
                  {CANCEL_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {templateType === "shipped" && (
              <div className="p-4 border border-sky-500/20 bg-sky-950/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-sky-300 font-bold mb-1">
                    Courier Partner
                  </label>
                  <input
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="w-full bg-black border border-white/20 p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-sky-300 font-bold mb-1">
                    AWB / Tracking Number
                  </label>
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full bg-black border border-white/20 p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-white text-black font-bold uppercase tracking-widest text-xs h-12 flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching Email via Resend…</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send {TEMPLATE_PRESETS.find((t) => t.id === templateType)?.title}</span>
                </>
              )}
            </button>
          </form>

          {/* Results Feedback */}
          {result && (
            <div
              className={`mt-6 p-4 border text-xs leading-relaxed ${
                result.success
                  ? "bg-green-500/10 border-green-500/30 text-green-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {result.success ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-bold">
                    {result.success ? "Email Delivered via Resend API!" : "Failed to Send Email"}
                  </p>
                  <p>{result.message || result.error}</p>
                  {result.from && (
                    <p className="text-[11px] text-white/70">
                      Dispatched From: <span className="font-mono text-white">{result.from}</span>
                    </p>
                  )}
                  {result.emailId && (
                    <p className="font-mono text-[10px] text-green-400/80">
                      Resend ID: {result.emailId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
            <Link href="/" className="hover:text-white transition-colors">
              ← Storefront
            </Link>
            <Link href="/admin/orders" className="hover:text-white transition-colors">
              Admin Order Manager →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
