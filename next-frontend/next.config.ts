import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/nowaster-backups/**",
      },
    ],
  },
  reactCompiler: true,
  reactStrictMode: true,
};

export default nextConfig;
