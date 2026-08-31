import type { NextConfig } from 'next';
import path from 'node:path';

// The monorepo root (two levels up from apps/studio_v2).
const repoRoot = path.resolve(__dirname, '..', '..');

const nextConfig: NextConfig = {
  // StrictMode's dev double-invoke breaks the GSAP/SplitText effect timelines in
  // @harbor/player (matches the toolkit and studio).
  reactStrictMode: false,
  // Both apps compile @harbor/player from source (no build step). The player keeps
  // its 'use client' directives through the App Router compiler.
  transpilePackages: ['@harbor/player'],
  // CRITICAL for this monorepo. @harbor/player is a symlinked workspace package we
  // consume from SOURCE. Without an explicit root, Next infers the workspace root
  // as this app dir, so Turbopack cannot reliably watch or cache-invalidate edits
  // to packages/player/src (which live ABOVE that inferred root). The symptom was
  // brutal: you edit a player effect, the studio still renders the OLD compiled
  // version, and the only cure is wiping .next by hand. Pointing the Turbopack root
  // (dev) and the file-tracing root (build) at the real repo root makes the player
  // source a first-class watched input, so a save to an effect hot-reloads here.
  // See ./CLAUDE.md ("The cache trap") for the full story.
  turbopack: {
    root: repoRoot,
  },
  outputFileTracingRoot: repoRoot,
  // Park the Next dev-tools badge in the bottom-right so it stops overlapping the
  // left-hand Rail. (Values: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'.)
  devIndicators: {
    position: 'bottom-right',
  },
};

export default nextConfig;
