import type { GradientProps } from "../types/common";
import { resolveColor } from "./color";

/**
 * A resolved gradient, as two CSS background layer lists (top layer first) for the same paint.
 * They differ only in how the stops are interpolated, so a component declares `fallback`
 * first and lets `modern` take over where the browser understands it (an `@supports (background:
 * linear-gradient(in oklch shorter hue, red, blue))` block in the component's stylesheet).
 */
export interface ResolvedGradient {
  /** Plain sRGB interpolation: understood everywhere. */
  fallback: string;
  /** Interpolated in oklch, so the midpoint keeps its chroma instead of going muddy. */
  modern: string;
}

export const DEFAULT_GRADIENT_ANGLE = 180;

// Fixed internals: a fractal-noise tile with its opacity baked into the image, desaturated so
// it grains lightness only. A static data URI: no pseudo-element, no blend mode, no per-render work.
const GRAIN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>" +
  "<filter id='g' x='0' y='0' width='100%' height='100%'>" +
  "<feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/>" +
  "<feColorMatrix type='saturate' values='0'/></filter>" +
  "<rect width='100%' height='100%' filter='url(#g)' opacity='0.18'/></svg>";

/** The grain layer: a tiled image to stack above a gradient. */
export const GRAIN_LAYER = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}") 0 0 / 160px 160px repeat`;

const CACHE_LIMIT = 100;
const cache = new Map<string, ResolvedGradient>();

/**
 * Resolve gradient props to CSS, or `null` when there is no gradient to paint. Pure and
 * SSR-safe. Follows `resolveColor()`: a role in a stop maps to `var(--cui-{role})`, anything
 * else passes through. `gradient` (a raw CSS string) wins over the flat props and is used as
 * written in both forms. A linear gradient needs both `from` and `to`; `via` is an optional
 * middle stop.
 *
 *   resolveGradient({ from: "primary", to: "info", angle: 90 })
 *   // → { fallback: "linear-gradient(90deg, var(--cui-primary), var(--cui-info))",
 *   //     modern:   "linear-gradient(in oklch shorter hue 90deg, …)" }
 *
 * Results are cached by their inputs, so a component re-rendering with the same props gets the
 * same object back.
 */
export function resolveGradient(options: GradientProps): ResolvedGradient | null {
  const { from, via, to, angle = DEFAULT_GRADIENT_ANGLE, smooth = false, gradient } = options;
  const raw = gradient?.trim();
  if (!raw && !(from && to)) return null;

  const key = JSON.stringify(raw ? [raw, smooth] : [from, via, to, angle, smooth]);
  const hit = cache.get(key);
  if (hit) return hit;

  let fallback: string;
  let modern: string;
  if (raw) {
    fallback = modern = raw;
  } else {
    const stops = [from, via, to].filter(Boolean).map((c) => resolveColor(c));
    fallback = `linear-gradient(${angle}deg, ${stops.join(", ")})`;
    modern = `linear-gradient(in oklch shorter hue ${angle}deg, ${stops.join(", ")})`;
  }
  const resolved: ResolvedGradient = smooth
    ? { fallback: `${GRAIN_LAYER}, ${fallback}`, modern: `${GRAIN_LAYER}, ${modern}` }
    : { fallback, modern };

  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(key, resolved);
  return resolved;
}
