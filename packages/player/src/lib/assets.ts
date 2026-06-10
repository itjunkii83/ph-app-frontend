"use client";

import { createContext, useContext } from "react";

// Asset model: presentation media is referenced by a RELATIVE KEY (the object
// path under the bucket), resolved at render time against a per-app configured
// base URL. No absolute/tokenized URLs are baked into the doc, so moving buckets
// or fronting a CDN is a config change, not a data rewrite.
//
// Tokenless public serving requires the media to live under the only public-read
// prefix, presentations/media/** (see storage.rules). A browser <img>/<audio> GET
// carries no Firebase auth, so anything outside that prefix 403s silently — the
// resolver warns loudly in dev to catch it.

export const PUBLIC_MEDIA_PREFIX = "presentations/media/";

// The configured Storage base URL (e.g. https://firebasestorage.googleapis.com/
// v0/b/<bucket>/o/). The app provides it; effects read it via useAssetUrl.
export const AssetContext = createContext<string>("");

const isProd =
  (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
    ?.NODE_ENV === "production";

function devWarn(message: string): void {
  if (!isProd && typeof console !== "undefined") {
    console.warn(`[@harbor/player] ${message}`);
  }
}

function hasScheme(src: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(src) || /^(data|blob):/i.test(src);
}

/**
 * Resolve a relative Storage key against the configured base URL. The single
 * chokepoint for both images and audio. Every silent-failure mode is made loud
 * in dev:
 * - an absolute/external URL is a fenced escape hatch (relative keys are canonical)
 * - an empty base means NEXT_PUBLIC_STORAGE_BASE_URL is unset
 * - a key outside presentations/media/** will 403 when loaded tokenlessly
 */
export function resolveAssetUrl(
  src: string | undefined | null,
  base: string,
): string {
  if (!src) return "";
  if (hasScheme(src)) {
    devWarn(
      `non-key asset src "${src}"; relative keys under ${PUBLIC_MEDIA_PREFIX}** are canonical`,
    );
    return src; // fenced external escape hatch
  }
  const key = src.replace(/^\/+/, "");
  if (!base) {
    devWarn(
      `NEXT_PUBLIC_STORAGE_BASE_URL is not set; cannot resolve asset key "${key}"`,
    );
    return key;
  }
  if (!key.startsWith(PUBLIC_MEDIA_PREFIX)) {
    devWarn(
      `asset key "${key}" is outside the public prefix ${PUBLIC_MEDIA_PREFIX}** and will 403 when loaded tokenlessly`,
    );
  }
  const sep = base.endsWith("/") ? "" : "/";
  return `${base}${sep}${encodeURIComponent(key)}?alt=media`;
}

export function useAssetUrl(src: string | undefined | null): string {
  return resolveAssetUrl(src, useContext(AssetContext));
}
