/**
 * The motion tokens' names, and their defaults in ms: what `styles/main.css` declares on
 * `:root` (#261). Keep the two in step — `utils/__tests__/motion.test.ts` checks them.
 */
export const MOTION_DURATIONS = {
  instant: 0,
  press: 120,
  fast: 150,
  base: 200,
  slow: 250,
} as const;

export type MotionDuration = keyof typeof MOTION_DURATIONS;

/** A CSS time — `150ms`, `0.2s` — in ms; null for anything else. */
function parseTime(value: string): number | null {
  const m = /^(-?\d*\.?\d+)(ms|s)$/.exec(value.trim());
  if (!m) return null;
  return Number(m[1]) * (m[2] === "s" ? 1000 : 1);
}

/**
 * A motion token's duration in ms, as it resolves on `el` (the document root by default),
 * so a JS wait follows the CSS it waits for, overrides included. Read it when the wait
 * starts, not at setup: a container's override, or a theme, may change it.
 *
 * Falls back to the token's default under server rendering, or where the token isn't
 * set (a consumer who loads no library CSS, a test DOM).
 */
export function motionDuration(name: MotionDuration, el?: Element | null): number {
  const fallback = MOTION_DURATIONS[name];
  if (typeof window === "undefined") return fallback;
  return parseTime(getComputedStyle(el ?? document.documentElement).getPropertyValue(`--cui-duration-${name}`)) ?? fallback;
}
