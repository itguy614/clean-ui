/**
 * Shared size scales for form controls and buttons.
 * Single source of truth — all components import from here.
 */

import type { CuiSize } from "../types/common";

/** Canonical ordering of the size scale, smallest → largest. */
export const SIZE_ORDER: readonly CuiSize[] = ["xs", "sm", "md", "lg", "xl"];

/**
 * Clamp a requested size to the nearest size a component actually supports.
 * Components accept the full `CuiSize` union for API uniformity, then narrow
 * to what they style. Out-of-range sizes map to the closest supported step.
 *
 *   clampSize("xl", ["sm", "md"]) // → "md"
 *   clampSize("xs", ["sm", "md"]) // → "sm"
 */
export function clampSize<T extends CuiSize>(
  size: CuiSize,
  supported: readonly T[],
): T {
  if ((supported as readonly CuiSize[]).includes(size)) return size as unknown as T;
  const target = SIZE_ORDER.indexOf(size);
  let best = supported[0];
  let bestDist = Infinity;
  for (const s of supported) {
    const dist = Math.abs(SIZE_ORDER.indexOf(s) - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }
  return best;
}

export interface SizeStyle {
  height: string;
  px: string;
  fontSize: string;
}

export interface ButtonSizeStyle extends SizeStyle {
  gap: string;
}

// --- Density scaling ---------------------------------------------------------
// Spatial dimensions are multiplied by --cui-density-scale (default 1, so these
// are identical to the base values when no density class is applied). Heights of
// interactive controls additionally clamp to a 24px floor (WCAG 2.5.8 target
// size). Font sizes are NEVER scaled — density moves whitespace, not type.
const DS = "var(--cui-density-scale, 1)";
/**
 * Scale a single spatial value (padding, gap, indent) by the density scale.
 * `"0.5rem"` → `"calc(0.5rem * var(--cui-density-scale, 1))"`. Default scale is
 * 1, so the result is identical to the input when no density class is applied.
 * Use this in JS-emitted size maps instead of hand-writing the calc() string.
 */
export const scaleDensity = (v: string) => `calc(${v} * ${DS})`;
/** Like {@link scaleDensity} but floored at the 24px minimum touch target (WCAG 2.5.8) — for interactive control heights. */
export const scaleControlHeight = (v: string) => `max(24px, calc(${v} * ${DS}))`;

// Short local aliases for the dense scale tables below.
const d = scaleDensity;
const dh = scaleControlHeight;

export const INPUT_SIZE_SCALE: Record<string, SizeStyle> = {
  xs: { height: dh("1.75rem"), px: d("0.5rem"), fontSize: "0.75rem" },
  sm: { height: dh("2rem"), px: d("0.75rem"), fontSize: "0.8125rem" },
  md: { height: dh("2.5rem"), px: d("1rem"), fontSize: "1rem" },
  lg: { height: dh("3rem"), px: d("1.25rem"), fontSize: "1.0625rem" },
  xl: { height: dh("3.5rem"), px: d("1.5rem"), fontSize: "1.125rem" },
};

export const BUTTON_SIZE_SCALE: Record<string, ButtonSizeStyle> = {
  xs: { height: dh("1.75rem"), px: d("0.5rem"), fontSize: "0.75rem", gap: d("0.25rem") },
  sm: { height: dh("2rem"), px: d("0.75rem"), fontSize: "0.8125rem", gap: d("0.375rem") },
  md: { height: dh("2.5rem"), px: d("1rem"), fontSize: "1rem", gap: d("0.5rem") },
  lg: { height: dh("3rem"), px: d("1.5rem"), fontSize: "1.0625rem", gap: d("0.5rem") },
  xl: { height: dh("3.5rem"), px: d("2rem"), fontSize: "1.125rem", gap: d("0.625rem") },
};

export const TEXTAREA_SIZE_SCALE: Record<string, { px: string; py: string; fontSize: string }> = {
  xs: { px: d("0.5rem"), py: d("0.25rem"), fontSize: "0.75rem" },
  sm: { px: d("0.75rem"), py: d("0.375rem"), fontSize: "0.8125rem" },
  md: { px: d("1rem"), py: d("0.5rem"), fontSize: "1rem" },
  lg: { px: d("1.25rem"), py: d("0.625rem"), fontSize: "1.0625rem" },
  xl: { px: d("1.5rem"), py: d("0.75rem"), fontSize: "1.125rem" },
};
