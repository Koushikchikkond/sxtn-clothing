import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how 6XTN collects, protects, and handles your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-36 pb-32 px-6 sm:px-10 lg:px-16 max-w-4xl mx-auto">
      <div className="space-y-12">
        {/* Header */}
        <div className="border-b border-white/10 pb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">
            Legal & Compliance
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-wider font-bold">
            Privacy Policy
          </h1>
          <p className="text-xs text-white/40 mt-3 uppercase tracking-widest">
            Last updated: November 2026
          </p>
        </div>

        {/* Policy Content */}
        <div className="space-y-10 text-sm sm:text-base text-white/80 leading-relaxed font-light">
          <section className="space-y-3">
            <h2 className="font-display text-lg uppercase tracking-wider text-white font-bold">
              1. Information We Collect
            </h2>
            <p>
              When you purchase or attempt to purchase an item through 6XTN, we collect personal information necessary to process your order: your name, billing address, shipping address, payment confirmation details, email address, and phone number.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg uppercase tracking-wider text-white font-bold">
              2. How We Use Your Information
            </h2>
            <p>
              We use order information to fulfill all purchases placed through the site (including processing your payment, arranging shipping via our logistics partner Shiprocket, and providing you with invoices and order confirmations). Additionally, we use this information to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/70 pl-2">
              <li>Communicate with you regarding order fulfillment and live courier tracking.</li>
              <li>Screen our orders for potential risk or fraudulent activity.</li>
              <li>Provide customer support when you reach out to our team.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg uppercase tracking-wider text-white font-bold">
              3. Payment Security
            </h2>
            <p>
              All online transactions are securely encrypted and processed through our RBI-authorized payment partner, <strong>Razorpay</strong>. 6XTN never stores or has access to your full credit/debit card numbers, CVVs, or net banking credentials on our servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg uppercase tracking-wider text-white font-bold">
              4. Logistics & Third-Party Sharing
            </h2>
            <p>
              To deliver your parcel, your shipping address, recipient name, and contact number are securely transmitted to <strong>Shiprocket</strong> and associated licensed courier partners (e.g., Delhivery, BlueDart, DTDC). We do not sell, rent, or lease customer data to third-party advertisers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg uppercase tracking-wider text-white font-bold">
              5. Your Rights & Data Inquiries
            </h2>
            <p>
              You have the right to access the personal information we hold about you and to ask that your personal information be corrected, updated, or deleted. If you would like to exercise this right, please contact us at:
            </p>
            <p className="pt-2">
              <a
                href="mailto:6xtn.in@gmail.com"
                className="font-display uppercase tracking-widest text-white border-b border-white hover:text-white/70 transition-colors pb-0.5"
              >
                6xtn.in@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

