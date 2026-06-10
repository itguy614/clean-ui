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

export const INPUT_SIZE_SCALE: Record<string, SizeStyle> = {
  xs: { height: "1.75rem", px: "0.5rem", fontSize: "0.75rem" },
  sm: { height: "2rem", px: "0.75rem", fontSize: "0.8125rem" },
  md: { height: "2.5rem", px: "1rem", fontSize: "1rem" },
  lg: { height: "3rem", px: "1.25rem", fontSize: "1.0625rem" },
  xl: { height: "3.5rem", px: "1.5rem", fontSize: "1.125rem" },
};

export const BUTTON_SIZE_SCALE: Record<string, ButtonSizeStyle> = {
  xs: { height: "1.75rem", px: "0.5rem", fontSize: "0.75rem", gap: "0.25rem" },
  sm: { height: "2rem", px: "0.75rem", fontSize: "0.8125rem", gap: "0.375rem" },
  md: { height: "2.5rem", px: "1rem", fontSize: "1rem", gap: "0.5rem" },
  lg: { height: "3rem", px: "1.5rem", fontSize: "1.0625rem", gap: "0.5rem" },
  xl: { height: "3.5rem", px: "2rem", fontSize: "1.125rem", gap: "0.625rem" },
};

export const TEXTAREA_SIZE_SCALE: Record<string, { px: string; py: string; fontSize: string }> = {
  xs: { px: "0.5rem", py: "0.25rem", fontSize: "0.75rem" },
  sm: { px: "0.75rem", py: "0.375rem", fontSize: "0.8125rem" },
  md: { px: "1rem", py: "0.5rem", fontSize: "1rem" },
  lg: { px: "1.25rem", py: "0.625rem", fontSize: "1.0625rem" },
  xl: { px: "1.5rem", py: "0.75rem", fontSize: "1.125rem" },
};
