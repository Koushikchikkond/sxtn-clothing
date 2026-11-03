import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions governing purchases and usage on 6XTN.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-36 pb-32 px-6 sm:px-10 lg:px-16 max-w-4xl mx-auto">
      <div className="space-y-12">
        {/* Header */}
        <div className="border-b border-white/10 pb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">
            Legal & Terms
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-wider font-bold">
            Terms of Service
          </h1>
          <p className="text-xs text-white/40 mt-3 uppercase tracking-widest">
            Last updated: November 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-sm sm:text-base text-white/80 leading-relaxed font-light">
          <section className="space-y-3">
            <h2 className="font-display text-lg uppercase tracking-wider text-white font-bold">
              1. Overview
            </h2>
            <p>
              This website is operated by 6XTN. Throughout the site, the terms &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; refer to 6XTN. By visiting our site and/or purchasing from us, you engage in our &ldquo;Service&rdquo; and agree to be bound by the following terms and conditions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg uppercase tracking-wider text-white font-bold">
              2. Products & Pricing
            </h2>
            <p>
              Prices for our products are subject to change without notice. All prices are listed in Indian Rupees (INR) and are inclusive of applicable goods and services tax (GST). We reserve the right at any time to modify or discontinue any drop or product without prior notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg uppercase tracking-wider text-white font-bold">
              3. Order Acceptance & Fulfillment
            </h2>
            <p>
              We reserve the right to refuse or cancel any order for any reason, including limitations on quantities available for purchase, inaccuracies in product or pricing information, or problems identified by our fraud and risk avoidance department. Orders are fulfilled domestically across India using licensed courier networks via Shiprocket.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg uppercase tracking-wider text-white font-bold">
              4. Contact Information
            </h2>
            <p>
              Questions regarding these Terms of Service should be sent to us at:
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

