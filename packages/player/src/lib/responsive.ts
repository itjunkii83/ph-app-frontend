import { createContext, useContext } from "react";

// The responsive sizing model. Authored px are interpreted as proportions of the
// base canvas and emitted as container-relative units (cqi/cqb/cqmin) relative to
// the player container (NOT vw/vh, since the player is sometimes boxed inside the
// studio). clamp() floors keep type legible in any orientation.

export interface BaseCanvas {
  baseWidth: number;
  baseHeight: number;
}

export const DEFAULT_BASE: BaseCanvas = { baseWidth: 1920, baseHeight: 1080 };

export const SizingContext = createContext<BaseCanvas>(DEFAULT_BASE);

export function useBaseCanvas(): BaseCanvas {
  return useContext(SizingContext);
}

// Horizontal extent: authored px along the base width -> container inline size.
export function cqWidth(px: number, base: BaseCanvas = DEFAULT_BASE): string {
  return `${(px / base.baseWidth) * 100}cqi`;
}

// Vertical extent: authored px along the base height -> container block size.
export function cqHeight(px: number, base: BaseCanvas = DEFAULT_BASE): string {
  return `${(px / base.baseHeight) * 100}cqb`;
}

// Type size: authored px (relative to base height) -> cqmin with a legibility
// clamp. cqmin uses the smaller container axis, so text stays readable in both
// portrait and landscape rather than collapsing when one dimension is small.
export function cqFontSize(
  px: number,
  base: BaseCanvas = DEFAULT_BASE,
  opts: { minPx?: number; maxPx?: number } = {},
): string {
  const ratio = (px / base.baseHeight) * 100; // percent of base height
  const minPx = opts.minPx ?? 14; // never below ~14px for legibility
  const maxPx = opts.maxPx ?? Math.round(px * 1.6); // cap growth on huge containers
  return `clamp(${minPx}px, ${ratio}cqmin, ${maxPx}px)`;
}

// Map an authored layer length + unit into a container-relative CSS length.
// `%` passes through (already relative to the parent, which fills the stage);
// `px` converts to proportions of the base canvas; `vw`/`vh` are reinterpreted
// against the player container so a boxed studio preview matches live playback.
export function cqLength(
  value: number,
  unit: string,
  axis: "x" | "y",
  base: BaseCanvas = DEFAULT_BASE,
): string {
  switch (unit) {
    case "px":
      return axis === "x" ? cqWidth(value, base) : cqHeight(value, base);
    case "vw":
      return `${value}cqi`;
    case "vh":
      return `${value}cqb`;
    case "%":
      return `${value}%`;
    default:
      return `${value}${unit}`;
  }
}
