const WORDS_PER_MINUTE = 200;
const MIN_READING_MS = 3000;
const MAX_READING_MS = 30000;
const EMPTY_TEXT_MS = 5000;

export function calculateReadingDuration(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return EMPTY_TEXT_MS;

  const words = trimmed.split(/\s+/).length;
  const ms = (words / WORDS_PER_MINUTE) * 60 * 1000;
  return Math.min(MAX_READING_MS, Math.max(MIN_READING_MS, Math.round(ms)));
}

export function getTextStats(text: string): {
  characters: number;
  words: number;
  readingTimeMs: number;
  readingTimeFormatted: string;
} {
  const trimmed = text.trim();
  const characters = trimmed.length;
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const readingTimeMs = calculateReadingDuration(text);

  const seconds = Math.round(readingTimeMs / 1000);
  const readingTimeFormatted =
    seconds >= 60
      ? `${Math.floor(seconds / 60)}m ${seconds % 60}s`
      : `${seconds}s`;

  return { characters, words, readingTimeMs, readingTimeFormatted };
}
