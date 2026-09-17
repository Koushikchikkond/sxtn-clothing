import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase storage
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Unsplash (placeholder images during dev)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      // Cloudflare R2 public bucket
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
      // Custom R2 domain (if configured later)
      {
        protocol: "https",
        hostname: "images.sxtn.in",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
