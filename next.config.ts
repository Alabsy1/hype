import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't advertise the framework version in response headers.
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75, 85],
  },
};

export default nextConfig;
