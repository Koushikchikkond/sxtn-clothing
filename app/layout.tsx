import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { Providers } from "./providers";
import { SmoothScrolling } from "./smooth-scrolling";

export const metadata: Metadata = {
  title: {
    default: "SXTN — Streetwear",
    template: "%s | SXTN",
  },
  description:
    "SXTN is a direct-to-consumer streetwear brand. Shop the latest drops, collections, and limited-edition pieces.",
  keywords: ["streetwear", "clothing", "SXTN", "fashion", "India"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "SXTN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SmoothScrolling>
          <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <CartDrawer />
        </Providers>
        </SmoothScrolling>
      </body>
    </html>
  );
}
