import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Compile the shared player package from source (handles its 'use client'
  // boundaries via the studio's own Next compiler).
  transpilePackages: ['@harbor/player'],
};

export default nextConfig;
