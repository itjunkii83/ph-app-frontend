import { ManagedFont } from '../../types/fonts';

// Ensure preconnect links exist for Google Fonts (do once)
let preconnectAdded = false;
function ensurePreconnect() {
  if (preconnectAdded || typeof document === 'undefined') return;
  preconnectAdded = true;

  const origins = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  origins.forEach((origin) => {
    if (!document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      if (origin.includes('gstatic')) {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    }
  });
}

export async function loadFont(font: ManagedFont): Promise<void> {
  if (font.source !== 'google') return;

  ensurePreconnect();

  const existing = document.querySelector(`link[data-font-family="${font.family}"]`);
  if (existing) {
    // Already injected, just wait for it to be ready
    await waitForFont(font.family, font.weights);
    return;
  }

  const weights = font.weights.length > 0 ? font.weights.join(';') : '400';
  const family = font.family.replace(/ /g, '+');
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weights}&display=swap`;

  // Create and inject the stylesheet link
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.setAttribute('data-font-family', font.family);
  document.head.appendChild(link);

  // Wait for the font to actually be available
  await waitForFont(font.family, font.weights);
}

async function waitForFont(family: string, weights: number[]): Promise<void> {
  // Wait for document.fonts to be ready first
  await document.fonts.ready;

  // Then explicitly load and wait for each weight we need
  const weightsToLoad = weights.length > 0 ? weights : [400];

  const loadPromises = weightsToLoad.map(async (weight) => {
    const fontSpec = `${weight} 16px "${family}"`;

    // Check if already loaded
    if (document.fonts.check(fontSpec)) {
      return;
    }

    // Try to load it
    try {
      await document.fonts.load(fontSpec);
    } catch {
      // Some fonts may not support all weights, that's ok
    }
  });

  await Promise.all(loadPromises);

  // Final check: wait a frame to ensure rendering is ready
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

export async function loadFonts(fonts: ManagedFont[]): Promise<void> {
  await Promise.all(fonts.map(loadFont));
}
