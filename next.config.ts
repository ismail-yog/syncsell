import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "i.ebayimg.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  serverExternalPackages: ["@anthropic-ai/sdk"],
};

export default nextConfig;
