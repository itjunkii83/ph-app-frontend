import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // StrictMode's dev double-invoke breaks the GSAP/SplitText effect timelines in
  // @harbor/player (matches the toolkit and studio).
  reactStrictMode: false,
  // Both apps compile @harbor/player from source (no build step). The player keeps
  // its 'use client' directives through the App Router compiler.
  transpilePackages: ['@harbor/player'],
};

export default nextConfig;
