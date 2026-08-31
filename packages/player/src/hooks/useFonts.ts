"use client";

import { useState, useEffect } from "react";
import { ManagedFont } from "../types/fonts";
import { loadFonts } from "../lib/fonts/loader";
import { useManagedFonts } from "../fonts/fonts-context";

const DEFAULT_FONTS: ManagedFont[] = [
  { family: "Inter", source: "google", weights: [400, 500, 600, 700], styles: ["normal"] },
  { family: "Georgia", source: "system", weights: [400, 700], styles: ["normal", "italic"] },
];

/**
 * Loads the given font families. Managed-font metadata comes from
 * ManagedFontsContext (the player provides it), NOT from a prop or a /api/fonts
 * fetch: this hook runs inside individual effects, so a network/app coupling here
 * would break the Next-agnostic boundary. Unknown families fall back to a direct
 * Google Fonts load.
 */
export function useFonts(fontFamilies: string[]) {
  const managedFonts = useManagedFonts();
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Stable signature so an unmemoized context array doesn't re-run the effect.
  const managedKey = managedFonts
    .map((f) => `${f.family}:${(f.weights || []).join("|")}:${f.isActive !== false}`)
    .join(",");

  useEffect(() => {
    if (fontFamilies.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const fontsToLoad: ManagedFont[] = [];
        for (const family of fontFamilies) {
          const managed = managedFonts.find(
            (f) => f.family === family && f.isActive !== false,
          );
          if (managed) {
            fontsToLoad.push(managed);
          } else {
            const defaultFont = DEFAULT_FONTS.find((f) => f.family === family);
            if (defaultFont) {
              fontsToLoad.push(defaultFont);
            } else {
              fontsToLoad.push({
                family,
                source: "google",
                // Cover the weights effects actually render (HardCut styles 600,
                // DreamySmoke defaults 700). Loading only 400 made the browser
                // synthesize faux-bold, which reads as the wrong typeface.
                weights: [400, 600, 700],
                styles: ["normal"],
              });
            }
          }
        }

        await loadFonts(fontsToLoad);

        if (!cancelled) {
          setLoaded(fontsToLoad.map((f) => f.family));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load fonts");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontFamilies.join(","), managedKey]);

  return { loading, loaded, error };
}
