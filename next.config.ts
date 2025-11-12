import createNextPWA from "next-pwa";
import type { NextConfig } from "next";

const withPWA = createNextPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development"
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  output: "export",
  images: {
    unoptimized: true
  }
};

export default withPWA(nextConfig);
