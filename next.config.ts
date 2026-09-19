import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the development badge from covering the logger's floating actions.
  devIndicators: false,
};

export default nextConfig;
