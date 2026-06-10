import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the GSAP/SplitText effects in the player: React StrictMode's dev
  // double-invoke restarts their timelines and leaves the text static (the engine
  // disables it for the same reason). The player is otherwise StrictMode-safe.
  reactStrictMode: false,
  // Compile the shared player package from source so its 'use client' boundaries
  // are handled by the toolkit's own Next compiler (no prebuilt bundle).
  transpilePackages: ["@harbor/player"],
};

export default nextConfig;
