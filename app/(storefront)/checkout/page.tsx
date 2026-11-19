"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { useCartStore } from "@/lib/stores/cart.store";
import { createClient } from "@/lib/supabase/client";
import type { Address } from "@/types/database.types";
import {
  Loader2,
  MapPin,
  Plus,
  CheckCircle2,
  Mail,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { INDIAN_STATES, getCitiesForState } from "@/lib/data/india-locations";
import { calculateOrderPricing } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { isValidEmailFormat, suggestEmailCorrection } from "@/lib/email-validator";

interface AddressForm {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  addressId?: string | null;
  saveAddress?: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = createClient();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clearCart);

  // Authoritative dynamic pricing: ₹9 packaging charge & free delivery above ₹2,000
  const {
    shippingFee,
    packagingFee,
    total,
    isFreeShipping,
    amountNeededForFreeShipping,
  } = calculateOrderPricing(subtotal);

  // Authentication & saved addresses state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(true);

  const [form, setForm] = useState<AddressForm>({
    fullName: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    addressId: null,
    saveAddress: true,
  });

  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Available cities for the selected state
  const availableCities = form.state ? getCitiesForState(form.state) : [];

  // Check auth and load saved addresses on mount
  useEffect(() => {
    async function initUserAndAddresses() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setIsLoggedIn(true);
          const userEmail = user.email || "";

          // Fetch user's saved addresses
          const { data: addresses } = await supabase
            .from("addresses")
            .select("*")
            .eq("user_id", user.id)
            .order("is_default", { ascending: false });

          const addressList = (addresses as Address[]) || [];
          setSavedAddresses(addressList);

          if (addressList.length > 0) {
            // Pick default address or first address
            const defaultAddr = addressList.find((a) => a.is_default) || addressList[0];
            setSelectedAddressId(defaultAddr.id);
            setForm({
              fullName: defaultAddr.full_name,
              email: userEmail,
              phone: defaultAddr.phone,
              line1: defaultAddr.line1,
              line2: defaultAddr.line2 || "",
              city: defaultAddr.city,
              state: defaultAddr.state,
              pincode: defaultAddr.pincode,
              addressId: defaultAddr.id,
              saveAddress: false,
            });
          } else {
            // No saved addresses yet, prefill user's email
            setForm((prev) => ({
              ...prev,
              email: userEmail,
              addressId: null,
              saveAddress: true,
            }));
            setSelectedAddressId("new");
          }
        } else {
          setIsLoggedIn(false);
          setSelectedAddressId("new");
        }
      } catch (err) {
        console.error("Error loading user addresses:", err);
      } finally {
        setLoadingAddresses(false);
      }
    }

    initUserAndAddresses();
  }, [supabase]);

  // Redirect if cart empty (in useEffect so it only runs on the client)
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items.length, router]);

  if (items.length === 0) {
    return null;
  }

  function handleSelectSavedAddress(addr: Address) {
    setSelectedAddressId(addr.id);
    setIsCustomCity(false);
    setForm((prev) => ({
      ...prev,
      fullName: addr.full_name,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 || "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      addressId: addr.id,
      saveAddress: false,
    }));
  }

  function handleAddNewAddressClick() {
    setSelectedAddressId("new");
    setIsCustomCity(false);
    setForm((prev) => ({
      ...prev,
      fullName: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      addressId: null,
      saveAddress: true,
    }));
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      setEmailError(null);
      const suggestion = suggestEmailCorrection(value);
      setEmailSuggestion(suggestion);
    }
  }

  async function handleEmailBlur() {
    const email = form.email.trim();
    if (!email) {
      setEmailError(null);
      setEmailSuggestion(null);
      return;
    }

    // 1. Instant client-side syntax check
    if (!isValidEmailFormat(email)) {
      setEmailError("Please enter a valid email address (e.g. name@gmail.com)");
      return;
    }

    // 2. Client-side typo suggestion
    const suggestion = suggestEmailCorrection(email);
    if (suggestion) {
      setEmailSuggestion(suggestion);
    }

    // 3. Background server-side validation (MX lookup for unknown / custom domains)
    try {
      const res = await fetch("/api/checkout/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data) {
        if (!data.valid && data.reason) {
          setEmailError(data.reason);
        } else {
          setEmailError(null);
        }
        if (data.suggestion) {
          setEmailSuggestion(data.suggestion);
        }
      }
    } catch (err) {
      console.warn("Background email validation skipped:", err);
    }
  }

  function applyEmailSuggestion(corrected: string) {
    setForm((prev) => ({ ...prev, email: corrected }));
    setEmailSuggestion(null);
    setEmailError(null);
  }

  function handleStateChange(selectedState: string) {
    setForm((prev) => ({
      ...prev,
      state: selectedState,
      city: "",
    }));
    setIsCustomCity(false);
  }

  function handleCitySelectChange(val: string) {
    if (val === "__other__") {
      setIsCustomCity(true);
      setForm((prev) => ({ ...prev, city: "" }));
    } else {
      setIsCustomCity(false);
      setForm((prev) => ({ ...prev, city: val }));
    }
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Basic client-side validation
      const emailTrimmed = form.email.trim();
      if (!emailTrimmed || !isValidEmailFormat(emailTrimmed)) {
        const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
        emailInput?.focus();
        emailInput?.scrollIntoView({ behavior: "smooth", block: "center" });
        throw new Error("Please enter a valid email address (e.g. name@gmail.com).");
      }

      if (emailSuggestion) {
        const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
        emailInput?.focus();
        emailInput?.scrollIntoView({ behavior: "smooth", block: "center" });
        throw new Error(`Did you mean "${emailSuggestion}"? Please tap "Fix Email" above or correct your spelling.`);
      }

      if (emailError) {
        const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
        emailInput?.focus();
        emailInput?.scrollIntoView({ behavior: "smooth", block: "center" });
        throw new Error(emailError);
      }
      if (!form.fullName.trim()) {
        throw new Error("Please enter your full name.");
      }
      if (!form.phone || form.phone.length < 10) {
        throw new Error("Please enter a valid 10-digit mobile number.");
      }
      if (!form.line1.trim()) {
        throw new Error("Please enter address line 1.");
      }
      if (!form.state) {
        throw new Error("Please select a state.");
      }
      if (!form.city) {
        throw new Error("Please select or enter your city.");
      }
      if (!form.pincode || form.pincode.length !== 6) {
        throw new Error("Please enter a valid 6-digit PIN code.");
      }

      // If user is logged in and entered a new address with save option enabled:
      let linkedAddressId = form.addressId;
      if (isLoggedIn && selectedAddressId === "new" && saveAddressToAccount) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const { data: newAddr } = await supabase
              .from("addresses")
              .insert({
                user_id: user.id,
                full_name: form.fullName.trim(),
                phone: form.phone.trim(),
                line1: form.line1.trim(),
                line2: form.line2.trim() || null,
                city: form.city.trim(),
                state: form.state.trim(),
                pincode: form.pincode.trim(),
                is_default: savedAddresses.length === 0,
              } as any)
              .select("id")
              .maybeSingle();

            if (newAddr && (newAddr as any).id) {
              linkedAddressId = (newAddr as any).id;
            }
          }
        } catch (saveErr) {
          console.warn("Could not save address to account:", saveErr);
        }
      }

      const orderAddressPayload = {
        fullName: form.fullName.trim(),
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        line1: form.line1.trim(),
        line2: form.line2.trim() || null,
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        addressId: linkedAddressId || null,
        saveAddress: saveAddressToAccount,
      };

      // 1. Create Razorpay order on server
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            variantId: i.variantId,
            productId: i.productId,
            name: i.name,
            size: i.size,
            color: i.color,
            price: i.price,
            quantity: i.quantity,
          })),
          subtotal,
          shippingFee,
          packagingFee,
          total,
          address: orderAddressPayload,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create order");
      }

      const orderData = await res.json();
      const activeOrderId = orderData.order_id || orderData.orderId;
      const activeKeyId =
        orderData.key_id ||
        orderData.keyId ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      // 2. Load Razorpay script and open checkout modal
      if (!(window as Window & { Razorpay?: unknown }).Razorpay) {
        await loadRazorpayScript();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({
        key: activeKeyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        order_id: activeOrderId,
        name: "6XTN",
        description: `Order — ${items.length} item${items.length > 1 ? "s" : ""}`,
        prefill: {
          name: form.fullName,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#000000", backdrop_color: "#000000" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // Retry verify-payment up to 3 times — mobile Safari drops fetch on UPI app return
          const verifyPayload = JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            items: items.map((i) => ({
              variantId: i.variantId,
              name: i.name,
              size: i.size,
              color: i.color,
              price: i.price,
              quantity: i.quantity,
            })),
            address: orderAddressPayload,
          });

          let verifyRes: Response | null = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              verifyRes = await fetch("/api/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: verifyPayload,
              });
              break; // success — stop retrying
            } catch (fetchErr) {
              console.warn(`[verify-payment] Attempt ${attempt}/3 failed:`, fetchErr);
              if (attempt < 3) await new Promise((r) => setTimeout(r, 1200 * attempt));
            }
          }

          if (!verifyRes) {
            // All 3 attempts failed — payment is captured by Razorpay; webhook will recover the order
            setError(
              "Your payment was received but we could not confirm it due to a network issue. " +
              "Your order will appear in a few minutes. If not, contact support with payment ID: " +
              response.razorpay_payment_id
            );
            setLoading(false);
            return;
          }

          const verifyData = await verifyRes.json().catch(() => ({}));

          if (verifyRes.ok && verifyData.success) {
            clearCart();
            router.push("/order-success");
          } else {
            setError(
              verifyData.error ||
                "Payment signature verification failed. Please contact support."
            );
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      // Handle payment failure event
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzp.on("payment.failed", (failedRes: any) => {
        console.warn("Razorpay payment failed / cancelled:", failedRes);
        setError(
          failedRes?.error?.description ||
            "Payment was cancelled or failed. Please try again or use another payment method."
        );
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/40 transition-colors";
  const selectClass =
    "w-full bg-[#121212] border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-white/40 transition-colors appearance-none cursor-pointer";
  const labelClass = "block text-xs uppercase tracking-widest text-white/40 mb-2";

  return (
    <>
      {/* Razorpay standard checkout script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="min-h-screen pt-28 pb-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-white/10">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-white/40">
              6XTN Official Store
            </span>
            <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-widest text-white mt-1">
              Checkout
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs uppercase tracking-widest text-white/40">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>SSL Encrypted Checkout</span>
          </div>
        </div>

        {/* Guest vs Logged in Status Banner */}
        {!isLoggedIn && (
          <div className="mb-8 p-4 bg-white/[0.03] border border-white/10 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-white/60" />
              <p className="text-xs text-white/70">
                Checking out as Guest. Have an account?
              </p>
            </div>
            <Link
              href="/login?redirect=/checkout"
              className="text-xs uppercase tracking-widest text-white font-bold underline hover:text-white/80 transition-colors flex items-center gap-1"
            >
              Sign In to use saved addresses <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <form onSubmit={handlePayment}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* ── Delivery Address Section ─────────────────────────── */}
            <div className="lg:col-span-2 space-y-8">
              {/* Saved Addresses Selector (for logged-in users with saved addresses) */}
              {isLoggedIn && savedAddresses.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg uppercase tracking-widest text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-white/60" />
                      Saved Delivery Addresses
                    </h2>
                    <button
                      type="button"
                      onClick={handleAddNewAddressClick}
                      className={`text-xs uppercase tracking-widest px-3 py-1.5 border transition-all flex items-center gap-1.5 ${
                        selectedAddressId === "new"
                          ? "border-white bg-white text-black font-bold"
                          : "border-white/20 text-white/60 hover:border-white/40 hover:text-white"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add New Address
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`p-4 border cursor-pointer relative transition-all ${
                            isSelected
                              ? "border-white bg-white/[0.06] shadow-sm"
                              : "border-white/10 hover:border-white/30 bg-white/[0.01]"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-bold text-white uppercase tracking-wider">
                              {addr.full_name}
                            </span>
                            {addr.is_default && (
                              <span className="text-[9px] uppercase tracking-widest font-bold text-black bg-white px-1.5 py-0.5">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-white/60 text-xs leading-relaxed">
                            {addr.line1}
                            {addr.line2 ? `, ${addr.line2}` : ""}
                            <br />
                            {addr.city}, {addr.state} — {addr.pincode}
                          </p>
                          <p className="text-white/40 text-[11px] mt-2 font-mono">
                            {addr.phone}
                          </p>

                          {isSelected && (
                            <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-white font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              Delivering to this address
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Delivery Details Form */}
              <div className="space-y-5 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl uppercase tracking-widest text-white/90">
                    {selectedAddressId === "new"
                      ? "Delivery Details"
                      : "Recipient & Contact Details"}
                  </h2>
                  {selectedAddressId !== "new" && (
                    <span className="text-xs text-white/40">
                      Using selected address above
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email Section (Mail) */}
                  <div className="sm:col-span-2">
                    <label className={labelClass}>
                      Email Address *{" "}
                      <span className="text-white/20 normal-case">
                        (Order confirmation & tracking updates will be sent here)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        onBlur={handleEmailBlur}
                        className={cn(
                          inputClass,
                          (emailError || emailSuggestion) && "border-amber-500/60 focus:border-amber-400"
                        )}
                        placeholder="your.email@example.com"
                      />
                      <Mail className="w-4 h-4 text-white/30 absolute right-3 top-3.5 pointer-events-none" />
                    </div>

                    {/* Instant Typo Suggestion Chip */}
                    {emailSuggestion && (
                      <div className="mt-2.5 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded flex items-center justify-between gap-2 text-xs text-amber-200">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="truncate">
                            Did you mean <strong className="text-white underline">{emailSuggestion}</strong>?
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyEmailSuggestion(emailSuggestion)}
                          className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold uppercase tracking-wider text-[10px] rounded transition-colors shrink-0 cursor-pointer"
                        >
                          Fix Email
                        </button>
                      </div>
                    )}

                    {/* Invalid Format / MX Record Error */}
                    {emailError && !emailSuggestion && (
                      <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5 leading-snug">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                        <span>{emailError}</span>
                      </p>
                    )}
                  </div>

                  {/* Full Name */}
                  <div className="sm:col-span-1">
                    <label className={labelClass}>Full Name *</label>
                    <input
                      name="fullName"
                      required
                      value={form.fullName}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Recipient full name"
                    />
                  </div>

                  {/* Phone */}
                  <div className="sm:col-span-1">
                    <label className={labelClass}>Phone Number *</label>
                    <input
                      name="phone"
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={form.phone}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="10-digit mobile number"
                    />
                  </div>

                  {/* Address Line 1 */}
                  <div className="sm:col-span-2">
                    <label className={labelClass}>
                      Address Line 1 *{" "}
                      <span className="text-white/20 normal-case">
                        (Flat, House No., Building, Street)
                      </span>
                    </label>
                    <input
                      name="line1"
                      required
                      value={form.line1}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="e.g. Flat 402, Lotus Residency, 12th Cross Road"
                    />
                  </div>

                  {/* Address Line 2 */}
                  <div className="sm:col-span-2">
                    <label className={labelClass}>
                      Address Line 2{" "}
                      <span className="text-white/20 normal-case">
                        (Area, Colony, Landmark — Optional)
                      </span>
                    </label>
                    <input
                      name="line2"
                      value={form.line2}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="e.g. Near HDFC Bank, Koramangala"
                    />
                  </div>

                  {/* State Dropdown */}
                  <div>
                    <label className={labelClass}>State / UT *</label>
                    <select
                      name="state"
                      required
                      value={form.state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className={selectClass}
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
                    {!isCustomCity ? (
                      <select
                        name="city"
                        required
                        disabled={!form.state}
                        value={form.city}
                        onChange={(e) => handleCitySelectChange(e.target.value)}
                        className={`${selectClass} ${
                          !form.state ? "opacity-40 cursor-not-allowed" : ""
                        }`}
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
                          name="city"
                          required
                          autoFocus
                          value={form.city}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="Enter your city name"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCity(false);
                            setForm((prev) => ({ ...prev, city: "" }));
                          }}
                          className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white underline"
                        >
                          ← Back to city dropdown
                        </button>
                      </div>
                    )}
                  </div>

                  {/* PIN Code */}
                  <div className="sm:col-span-2 sm:max-w-[50%]">
                    <label className={labelClass}>PIN Code *</label>
                    <input
                      name="pincode"
                      required
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={form.pincode}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="6-digit postal code (e.g. 560034)"
                    />
                  </div>

                  {/* Save to account checkbox (for logged-in users adding new address) */}
                  {isLoggedIn && selectedAddressId === "new" && (
                    <div className="sm:col-span-2 pt-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={saveAddressToAccount}
                          onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
                        />
                        <span className="text-xs text-white/70 group-hover:text-white transition-colors">
                          Save this address to my 6XTN account for future orders
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Order Summary ────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="border border-white/10 p-6 sticky top-28 bg-white/[0.02]">
                <h2 className="font-display text-xl uppercase tracking-widest mb-6 text-white">
                  Order Summary
                </h2>

                {/* Items */}
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={item.variantId}
                      className="flex justify-between text-sm text-white/70"
                    >
                      <span className="flex-1 mr-2 flex items-center min-w-0">
                        <span className="truncate">{item.name} × {item.quantity}</span>
                        <span className="ml-1.5 text-white/50 text-xs shrink-0 font-medium">
                          ({item.size})
                        </span>
                      </span>
                      <span className="font-medium text-white shrink-0">
                        INR {(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Free Delivery incentive banner */}
                {isFreeShipping ? (
                  <div className="mb-4 p-2.5 bg-green-950/40 border border-green-500/30 text-green-400 text-xs flex items-center justify-between">
                    <span>✓ FREE Delivery Unlocked!</span>
                    <span className="font-mono font-bold">SAVE ₹99</span>
                  </div>
                ) : (
                  <div className="mb-4 p-2.5 bg-white/5 border border-white/10 text-white/70 text-xs flex items-center justify-between">
                    <span>
                      Add <strong className="text-white">INR {amountNeededForFreeShipping.toLocaleString("en-IN")}</strong> more for <strong className="text-white">FREE Delivery</strong>
                    </span>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">(Above ₹2,000)</span>
                  </div>
                )}

                <div className="space-y-2 text-sm border-t border-white/10 pt-4 mb-6">
                  <div className="flex justify-between text-white/60">
                    <span>Subtotal</span>
                    <span>INR {subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Delivery</span>
                    <span className={cn("font-display font-medium", isFreeShipping ? "text-green-400 font-bold" : "text-white")}>
                      {isFreeShipping ? "FREE" : `INR ${shippingFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Packaging Charge</span>
                    <span className="font-display font-medium text-white">INR {packagingFee}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-3 border-t border-white/10 text-white">
                    <span>Total Due</span>
                    <span>INR {total.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* ── Smart Pre-Payment Email Review Banner ── */}
                <div className="mb-4 p-3 bg-white/[0.03] border border-white/10 rounded">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Mail className="w-4 h-4 text-white/50 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-white/40">
                          Updates & receipt will be sent to
                        </p>
                        <p className="text-xs font-semibold text-white truncate">
                          {form.email.trim() ? (
                            form.email.trim()
                          ) : (
                            <span className="text-white/30 italic">No email entered yet</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {form.email.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
                          if (emailInput) {
                            emailInput.focus();
                            emailInput.scrollIntoView({ behavior: "smooth", block: "center" });
                          }
                        }}
                        className="text-[11px] font-medium text-white/60 hover:text-white underline underline-offset-2 shrink-0 cursor-pointer uppercase tracking-wider"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-xs text-center py-2.5 px-3 mb-4 bg-red-400/10 border border-red-400/20 leading-relaxed">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 w-full bg-white text-black h-14 font-display text-sm uppercase tracking-widest hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processing…</span>
                    </>
                  ) : (
                    `Pay INR ${total.toLocaleString("en-IN")}`
                  )}
                </button>

                <div className="mt-4 pt-4 border-t border-white/10 space-y-1.5 text-center">
                  <p className="text-[11px] uppercase tracking-widest text-white/40 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-white/50" />
                    Secured by Razorpay
                  </p>
                  <p className="text-[10px] text-white/30">
                    Supports UPI, Credit/Debit Cards, NetBanking, Wallets
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}
