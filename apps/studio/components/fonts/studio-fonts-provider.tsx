"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ManagedFontsProvider, type ManagedFont } from "@harbor/player";

/**
 * Studio-side bridge: fetches managed fonts from the studio's /api/fonts route
 * and feeds them into the player's ManagedFontsContext, so effects rendered in
 * the editor preview pick up custom/Firestore fonts. The package itself never
 * touches /api/fonts (it stays Next-agnostic).
 */
export function StudioFontsProvider({ children }: { children: ReactNode }) {
  const [fonts, setFonts] = useState<ManagedFont[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/fonts")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) setFonts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        /* fall back to the per-family Google loader */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <ManagedFontsProvider fonts={fonts}>{children}</ManagedFontsProvider>;
}
