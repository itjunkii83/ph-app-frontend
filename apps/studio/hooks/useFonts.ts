'use client';

import { useState, useEffect } from 'react';
import { ManagedFont } from '@/types/fonts';
import { loadFonts } from '@/lib/fonts/loader';

const DEFAULT_FONTS: ManagedFont[] = [
  { family: 'Inter', source: 'google', weights: [400, 500, 600, 700], styles: ['normal'] },
  { family: 'Georgia', source: 'system', weights: [400, 700], styles: ['normal', 'italic'] },
];

export function useFonts(fontFamilies: string[]) {
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fontFamilies.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch('/api/fonts');
        const managedFonts: ManagedFont[] = res.ok ? await res.json() : [];

        const fontsToLoad: ManagedFont[] = [];
        for (const family of fontFamilies) {
          const managed = managedFonts.find(
            (f) => f.family === family && f.isActive !== false
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
                source: 'google',
                weights: [400],
                styles: ['normal'],
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
          setError(err instanceof Error ? err.message : 'Failed to load fonts');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fontFamilies.join(',')]);

  return { loading, loaded, error };
}
