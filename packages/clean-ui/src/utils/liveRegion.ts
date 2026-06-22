import type { CuiColor, LiveRegionMode } from "../types/common";

/** ARIA attributes for a live region — spread onto the root element via `v-bind`. */
export interface LiveRegionAttrs {
  role?: "alert" | "status";
  "aria-live": LiveRegionMode;
  "aria-atomic"?: "true";
}

/** Color roles that warrant an interrupting (assertive) announcement by default. */
const ASSERTIVE_COLORS: ReadonlySet<CuiColor> = new Set<CuiColor>(["error"]);

/**
 * Resolve ARIA live-region attributes for a feedback component from its color
 * severity, with an optional explicit override.
 *
 *  - `error`           → assertive (`role="alert"`, interrupts)
 *  - everything else   → polite    (`role="status"`, waits for idle)
 *  - override `"off"`  → no live region at all
 *
 * `aria-atomic="true"` ensures the whole message is re-read on change rather
 * than just the diff (also implied by `role`, set explicitly for older AT).
 */
export function resolveLiveRegion(
  color: CuiColor,
  override?: LiveRegionMode,
): LiveRegionAttrs {
  const mode: LiveRegionMode =
    override ?? (ASSERTIVE_COLORS.has(color) ? "assertive" : "polite");

  if (mode === "off") {
    return { "aria-live": "off" };
  }

  return {
    role: mode === "assertive" ? "alert" : "status",
    "aria-live": mode,
    "aria-atomic": "true",
  };
}
