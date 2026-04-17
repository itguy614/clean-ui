import type { TailwindBreakpoint, TailwindSpacing, ResponsiveValue } from "../types/grid";
import { BREAKPOINT_ORDER, type ActiveBreakpoint } from "../composables/useBreakpoint";

/**
 * Resolve a responsive value to the currently active value based on breakpoint.
 * Follows Tailwind's mobile-first model: smallest defined breakpoint applies
 * until a larger one overrides it.
 */
export function resolveResponsive<T>(
  value: ResponsiveValue<T> | undefined,
  defaultValue: T,
  breakpoint: ActiveBreakpoint,
): T {
  if (value === undefined) return defaultValue;
  if (typeof value !== "object") return value as T;

  if (breakpoint === "base") {
    // Below all breakpoints — no responsive key applies, use default
    return defaultValue;
  }

  const currentIndex = BREAKPOINT_ORDER.indexOf(breakpoint as TailwindBreakpoint);

  // Walk from current breakpoint downward to find the nearest defined value
  for (let i = currentIndex; i >= 0; i--) {
    const bp = BREAKPOINT_ORDER[i];
    if ((value as Record<string, T>)[bp] !== undefined) {
      return (value as Record<string, T>)[bp];
    }
  }

  return defaultValue;
}

/**
 * Convert a Tailwind spacing scale value to a CSS length.
 * Follows the standard: value * 0.25rem, with special cases for "0" and "px".
 */
const SPACING_MAP: Record<TailwindSpacing, string> = {
  "0": "0",
  px: "1px",
  "0.5": "0.125rem",
  "1": "0.25rem",
  "1.5": "0.375rem",
  "2": "0.5rem",
  "2.5": "0.625rem",
  "3": "0.75rem",
  "3.5": "0.875rem",
  "4": "1rem",
  "5": "1.25rem",
  "6": "1.5rem",
  "7": "1.75rem",
  "8": "2rem",
  "9": "2.25rem",
  "10": "2.5rem",
  "11": "2.75rem",
  "12": "3rem",
  "14": "3.5rem",
  "16": "4rem",
  "20": "5rem",
  "24": "6rem",
  "28": "7rem",
  "32": "8rem",
  "36": "9rem",
  "40": "10rem",
  "44": "11rem",
  "48": "12rem",
  "52": "13rem",
  "56": "14rem",
  "60": "15rem",
  "64": "16rem",
  "72": "18rem",
  "80": "20rem",
  "96": "24rem",
};

export function spacingToCss(spacing: TailwindSpacing): string {
  return SPACING_MAP[spacing] ?? "0";
}

/**
 * Container max-width values matching Tailwind's container breakpoints.
 */
export const CONTAINER_WIDTHS: Record<string, string> = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
  full: "100%",
};
