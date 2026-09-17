import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = {
  Shop: [
    { href: "/collections/all", label: "Shop All" },
    { href: "/collections/t-shirts", label: "T-Shirts" },
    { href: "/account/wishlist", label: "Wishlist" },
  ],
  Info: [
    { href: "/about", label: "About SXTN" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" },
  ],
  Policies: [
    { href: "/shipping-policy", label: "Shipping Policy" },
    { href: "/returns", label: "Returns & Exchanges" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-sxtn-black text-sxtn-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/brand-logo.svg"
                alt="SXTN"
                width={80}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-sxtn-gray-400 text-sm leading-relaxed max-w-xs">
              Streetwear for the ones who move different. India-made, globally
              worn.
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-display text-sm uppercase tracking-widest text-sxtn-gray-400 mb-4">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-sxtn-gray-300 hover:text-sxtn-white transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-sxtn-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-sxtn-gray-500">
            &copy; {year} SXTN. All rights reserved.
          </p>
          <p className="text-xs text-sxtn-gray-500">
            Made in India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
