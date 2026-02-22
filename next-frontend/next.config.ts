import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: true,
  },
  reactCompiler: true,
  reactStrictMode: true,
};

export default nextConfig;
