import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['tokenburner.vercel.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tokenburner.vercel.app',
      },
    ],
  },
};

export default nextConfig;
