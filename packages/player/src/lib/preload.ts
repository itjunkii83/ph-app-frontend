import { Presentation } from "../types/presentation";
import { getSections } from "./presentation/normalize";
import { resolveAssetUrl } from "./assets";

// Warm the browser cache for every asset a presentation references, so playback
// runs with no black-frame pop-in (the moment buffers like a video, then plays
// instantly). Stored values are relative keys; they are resolved against the
// configured Storage base before warming. Image layers warm via Image(); the
// soundtrack warms via Audio with a safety cap so a large file can't stall start.

function collectRaw(presentation: Presentation): {
  images: string[];
  audio: string | null;
} {
  const images = new Set<string>();
  const add = (u: unknown) => {
    if (typeof u === "string" && u.trim()) images.add(u);
  };
  for (const section of getSections(presentation)) {
    for (const l of section.stageLayers || []) add(l?.config?.src);
    for (const slide of section.slides || [])
      for (const l of slide.layers || []) add(l?.config?.src);
  }
  const audioRaw = presentation.settings?.audioUrl;
  const audio = typeof audioRaw === "string" && audioRaw.trim() ? audioRaw : null;
  return { images: Array.from(images), audio };
}

export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    const done = () => resolve();
    img.onload = done;
    img.onerror = done; // a failed asset must not block playback
    img.src = url;
    if (img.complete) resolve();
  });
}

function preloadAudio(url: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "auto";
    const done = () => resolve();
    audio.addEventListener("canplaythrough", done, { once: true });
    audio.addEventListener("error", done, { once: true });
    audio.src = url;
    // Don't block the start more than a few seconds on a large soundtrack;
    // it streams from the warmed cache once playback begins.
    setTimeout(done, 4000);
  });
}

/**
 * Resolves once all referenced media has loaded (or settled). `base` is the
 * Storage base URL used to resolve relative keys. `onProgress` fires after each
 * asset finishes (and once up front with 0) so the UI can show a real progress
 * bar.
 */
export async function preloadPresentationMedia(
  presentation: Presentation,
  base: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  const { images, audio } = collectRaw(presentation);
  const imageUrls = images.map((k) => resolveAssetUrl(k, base)).filter(Boolean);
  const audioUrl = audio ? resolveAssetUrl(audio, base) : "";

  const tasks: Promise<void>[] = imageUrls.map(preloadImage);
  if (audioUrl) tasks.push(preloadAudio(audioUrl));

  const total = tasks.length;
  let loaded = 0;
  onProgress?.(0, total);
  await Promise.all(
    tasks.map((task) =>
      task.then(() => {
        loaded += 1;
        onProgress?.(loaded, total);
      }),
    ),
  );
}
