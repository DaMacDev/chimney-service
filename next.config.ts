import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Ships TypeScript source (private git dependency with no build step).
  transpilePackages: ["@vodkadav/ui"],
  images: {
    // Gallery/hero photos are referenced remotely (Unsplash) and YouTube
    // thumbnails for the before/after facades. Swap for your own CDN later.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
