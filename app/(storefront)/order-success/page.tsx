import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full border border-green-500/30 flex items-center justify-center mb-8">
        <CheckCircle className="h-10 w-10 text-green-400" />
      </div>

      <h1 className="font-display text-5xl sm:text-6xl uppercase tracking-widest mb-4">
        Order Placed!
      </h1>
      <p className="text-white/50 text-sm max-w-xs leading-relaxed mb-10">
        Thank you for shopping with SXTN. Your order has been confirmed and will
        be shipped within 2–3 business days.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/account/orders"
          className="flex items-center gap-2 bg-white text-black px-8 py-3 font-display uppercase tracking-widest text-sm hover:bg-white/90 transition-colors"
        >
          View Orders <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/collections/all"
          className="flex items-center gap-2 border border-white/20 text-white px-8 py-3 font-display uppercase tracking-widest text-sm hover:bg-white/5 transition-colors"
        >
          Keep Shopping
        </Link>
      </div>
    </div>
  );
}
