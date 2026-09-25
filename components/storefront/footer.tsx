import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black text-white border-t border-white/10">

      {/* ── Desktop footer ────────────────────────────── */}
      <div className="hidden md:block max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-12 gap-8 items-start">

          {/* Logo column */}
          <div className="col-span-3 flex flex-col gap-6">
            <Link href="/">
              <Image
                src="/brand-logo.svg"
                alt="SXTN"
                width={120}
                height={48}
                className="h-12 w-auto invert"
              />
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-[220px]">
              Streetwear for the ones who move different. India-made, globally worn.
            </p>
          </div>

          {/* Spacer */}
          <div className="col-span-1" />

          {/* Quick Links */}
          <div className="col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-5">Shop</h4>
            <ul className="space-y-3">
              {[
                { href: "/collections/all", label: "Shop All" },
                { href: "/collections/t-shirts", label: "T-Shirts" },
                { href: "/account/wishlist", label: "Wishlist" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/70 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div className="col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-5">Info</h4>
            <ul className="space-y-3">
              {[
                { href: "/about", label: "About SXTN" },
                { href: "/contact", label: "Contact" },
                { href: "/faq", label: "FAQ" },
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms of Service" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/70 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-5">Support</h4>
            <ul className="space-y-3">
              <li className="text-sm text-white/70">Mon–Sat, 12PM–6PM</li>
              <li>
                <a href="tel:+918369950066" className="text-sm text-white/70 hover:text-white transition-colors">+91 836-995-0066</a>
              </li>
              <li>
                <a href="mailto:support@sxtn.in" className="text-sm text-white/70 hover:text-white transition-colors">support@sxtn.in</a>
              </li>
            </ul>
          </div>

          {/* Star logo big — right column */}
          <div className="col-span-2 flex items-start justify-end">
            <Image
              src="/open-menu-logo.jpeg"
              alt="SXTN Star"
              width={100}
              height={100}
              className="w-24 h-24 object-cover rounded-full opacity-80"
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-6 border-t border-white/10 flex items-center justify-between">
          <p className="text-xs text-white/30">© {year} SXTN. All rights reserved.</p>
          <p className="text-xs text-white/30">Made in India 🇮🇳</p>
        </div>
      </div>

      {/* ── Mobile footer ─────────────────────────────── */}
      <div className="md:hidden px-6 pt-12 pb-32">

        {/* Links grid */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-4">Shop</h4>
            <ul className="space-y-3">
              {[
                { href: "/collections/all", label: "Shop All" },
                { href: "/collections/t-shirts", label: "T-Shirts" },
                { href: "/account/wishlist", label: "Wishlist" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/70">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-4">Info</h4>
            <ul className="space-y-3">
              {[
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
                { href: "/faq", label: "FAQ" },
                { href: "/privacy", label: "Privacy" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/70">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Support row */}
        <div className="border-t border-white/10 pt-8 mb-10">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-3">Support</h4>
          <p className="text-sm text-white/60 mb-1">Mon–Sat, 12PM–6PM</p>
          <a href="tel:+918369950066" className="text-sm text-white/70 block">+91 836-995-0066</a>
        </div>

        {/* Star logo centered at bottom */}
        <div className="flex flex-col items-center gap-4 pt-4 border-t border-white/10">
          <Image
            src="/open-menu-logo.jpeg"
            alt="SXTN Star"
            width={64}
            height={64}
            className="w-16 h-16 object-cover rounded-full opacity-80"
          />
          <div className="text-center">
            <p className="text-xs text-white/30">© {year} SXTN. All rights reserved.</p>
            <p className="text-xs text-white/30 mt-1">Made in India 🇮🇳</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
