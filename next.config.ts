import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /* Disable ESLint and TypeScript errors from blocking production builds */
  eslint: {
    // Allows production builds to successfully complete even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allows production builds to successfully complete even if there are type errors
    ignoreBuildErrors: true,
  },

};

export default nextConfig;
