import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "6XTN — Streetwear",
    template: "%s | 6XTN",
  },
};

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The header/footer are already rendered in the root layout
  return <>{children}</>;
}
