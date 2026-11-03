import type { Metadata } from "next";
import { Mail, Clock, MapPin, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the 6XTN team for order support, inquiries, and collaborations.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-36 pb-32 px-6 sm:px-10 lg:px-16 max-w-4xl mx-auto">
      <div className="space-y-16">
        {/* Header */}
        <div className="border-b border-white/10 pb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">
            Assistance & Inquiries
          </p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl uppercase tracking-wider font-bold">
            Contact 6XTN
          </h1>
          <p className="text-sm sm:text-base text-white/60 mt-4 max-w-xl leading-relaxed">
            Have questions about your order, tracking, sizing, or custom drops? We are here to assist.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Support */}
          <div className="border border-white/10 bg-zinc-950 p-8 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 mb-6">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <h2 className="font-display text-lg uppercase tracking-wider font-bold text-white mb-2">
                Customer Support
              </h2>
              <p className="text-xs text-white/50 leading-relaxed mb-6">
                For order status, delivery questions, address changes, or returns. Include your 8-digit Order ID for expedited service.
              </p>
            </div>
            <a
              href="mailto:6xtn.in@gmail.com"
              className="inline-flex items-center gap-2 text-sm font-display uppercase tracking-widest text-white hover:text-white/70 transition-colors border-b border-white/30 hover:border-white pb-1 w-fit"
            >
              6xtn.in@gmail.com →
            </a>
          </div>

          {/* Business Hours */}
          <div className="border border-white/10 bg-zinc-950 p-8 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 mb-6">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h2 className="font-display text-lg uppercase tracking-wider font-bold text-white mb-2">
                Support Hours
              </h2>
              <p className="text-xs text-white/50 leading-relaxed mb-6">
                Our operations team reviews and processes inquiries Monday through Saturday.
              </p>
            </div>
            <p className="text-sm font-display uppercase tracking-widest text-white">
              Mon – Sat: 12:00 PM – 6:00 PM IST
            </p>
          </div>

          {/* Brand & Collaborations */}
          <div className="border border-white/10 bg-zinc-950 p-8 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 mb-6">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <h2 className="font-display text-lg uppercase tracking-wider font-bold text-white mb-2">
                Press & Collabs
              </h2>
              <p className="text-xs text-white/50 leading-relaxed mb-6">
                For styling, press kits, creative partnerships, and wholesale inquiries.
              </p>
            </div>
            <a
              href="mailto:6xtn.in@gmail.com?subject=Brand%20Collaboration%20Inquiry"
              className="inline-flex items-center gap-2 text-sm font-display uppercase tracking-widest text-white hover:text-white/70 transition-colors border-b border-white/30 hover:border-white pb-1 w-fit"
            >
              Partner with Us →
            </a>
          </div>

          {/* Location */}
          <div className="border border-white/10 bg-zinc-950 p-8 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 mb-6">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <h2 className="font-display text-lg uppercase tracking-wider font-bold text-white mb-2">
                Origin
              </h2>
              <p className="text-xs text-white/50 leading-relaxed mb-6">
                Designed, cut, sewn, and fulfilled domestically across India.
              </p>
            </div>
            <p className="text-sm font-display uppercase tracking-widest text-white">
              Bengaluru, Karnataka, India 🇮🇳
            </p>
          </div>
        </div>

        {/* Response Commitment */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs uppercase tracking-widest text-white/40">
          <span>Average response time: Within 24–48 hours</span>
          <span>Official Email: 6xtn.in@gmail.com</span>
        </div>
      </div>
    </div>
  );
}

