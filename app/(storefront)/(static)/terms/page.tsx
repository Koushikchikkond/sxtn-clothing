import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Services",
  description: "Terms and conditions governing purchases and usage on 6XTN.",
};

const SECTIONS = [
  {
    title: "PRODUCTS AND DESCRIPTION",
    paragraphs: [
      "We make every effort to display our products, colours, designs, sizes, and descriptions accurately.",
      "Product colours may appear slightly different depending on your screen settings and device.",
      "Product images are for representation purposes. Minor differences in printing, texture, colour, or finishing may occur.",
      "Please review the product description and size chart carefully before placing an order.",
      "We reserve the right to update product descriptions, designs, prices, and availability.",
    ],
  },
  {
    title: "ORDERS",
    paragraphs: [
      "Orders can be placed through our official website.",
      "An order is considered accepted once we confirm it.",
      "We reserve the right to cancel an order in cases of stock unavailability, pricing errors, suspected fraudulent activity, or other legitimate reasons.",
      "If an order is cancelled after payment, the amount paid will be refunded to the original payment method.",
      "Customers are responsible for providing accurate shipping information, contact details, and delivery addresses.",
    ],
  },
  {
    title: "PRICING AND PAYMENT",
    paragraphs: [
      "All prices displayed on our website are in Indian Rupees (INR).",
      "Applicable taxes and shipping charges will be displayed during checkout.",
      "Payments must be completed using the payment methods available on our website.",
      "We do not store your complete payment card details.",
      "If a pricing error occurs, we reserve the right to cancel the affected order and issue a refund where payment has already been made.",
    ],
  },
  {
    title: "SHIPPING AND DELIVERY",
    paragraphs: [
      "Orders will be shipped to the address provided during checkout.",
      "Estimated delivery timelines are displayed during checkout or communicated through order updates.",
      "Delivery timelines are estimates and may vary due to courier delays, weather conditions, operational issues, or other circumstances beyond our control.",
      "Customers are responsible for ensuring that their delivery address and contact number are correct.",
      "If a shipment is returned due to an incorrect address, unavailable recipient, or repeated delivery failure, additional shipping charges may apply for reshipping.",
      "Please contact us if your order has not arrived within the estimated delivery period.",
    ],
  },
  {
    title: "RETURNS AND EXCHANGES",
    paragraphs: [
      "Return and exchange requests must follow our separate Return & Exchange Policy.",
      "Products must meet the eligibility requirements specified in that policy.",
      "Customers must contact us within the applicable return or exchange period.",
      "Products that have been worn, washed, damaged, altered, or used may not be eligible for return or exchange, except where required by applicable law or where the product is defective.",
      "Refunds, exchanges, and replacements will be processed after the returned product has been received and inspected.",
      "Certain products may be excluded from returns or exchanges where clearly disclosed before purchase and permitted by applicable law.",
    ],
  },
  {
    title: "CHANGES TO THESE TERMS",
    paragraphs: [
      "We may update these Terms & Conditions from time to time.",
      "Any revised terms will be published on our website with an updated revision date.",
      "Your continued use of our website after changes are published constitutes acceptance of the revised terms, to the extent permitted by applicable law.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-36 pb-32 px-6 sm:px-10 lg:px-16 max-w-4xl mx-auto">
      <div className="space-y-12">
        {/* Header */}
        <div className="border-b border-white/10 pb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">
            LEGAL & AGREEMENT
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-wider font-bold">
            TERMS OF SERVICE
          </h1>
          <p className="text-xs text-white/40 mt-3 uppercase tracking-widest">
            LAST UPDATED: NOVEMBER 2026
          </p>
        </div>

        {/* Structured Sections */}
        <div className="space-y-12 text-sm sm:text-base text-white/80 leading-relaxed font-light">
          {SECTIONS.map((sec, idx) => (
            <section key={sec.title} className="space-y-4">
              <h2 className="font-display text-base sm:text-lg uppercase tracking-wider text-white font-bold flex items-center gap-2">
                <span className="text-white/40 text-xs font-mono">{String(idx + 1).padStart(2, "0")}.</span>
                {sec.title}
              </h2>
              <div className="space-y-3 pl-0 sm:pl-6 border-l border-white/10">
                {sec.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className="text-white/80 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contact Footer */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs uppercase tracking-widest text-white/40">
          <span>FOR ANY QUERIES: <a href="mailto:6xtn.in@gmail.com" className="text-white underline hover:text-white/70">6XTN.IN@GMAIL.COM</a></span>
          <span>MADE IN INDIA 🇮🇳</span>
        </div>
      </div>
    </div>
  );
}
