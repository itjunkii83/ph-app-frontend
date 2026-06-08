import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compile the shared player package from source so its 'use client' boundaries
  // are handled by the toolkit's own Next compiler (no prebuilt bundle).
  transpilePackages: ["@harbor/player"],
};

export default nextConfig;
