import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { Providers } from "./providers";
import { SmoothScrolling } from "./smooth-scrolling";

export const metadata: Metadata = {
  title: {
    default: "6XTN — Streetwear",
    template: "%s | 6XTN",
  },
  description:
    "6XTN is a direct-to-consumer streetwear brand. Shop the latest drops, collections, and limited-edition pieces.",
  keywords: ["streetwear", "clothing", "6XTN", "fashion", "India"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "6XTN",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "6XTN",
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
