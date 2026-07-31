import { version } from "./version";
import { warnOnce } from "./utils/devWarn";

interface CleanUIGlobal {
  __CUI_INSTANCE__?: string;
}

/**
 * Every seam a satellite package relies on — form binding context, the icon
 * registry, theme/density state — is a module-scope singleton. Two copies of
 * clean-ui in one consumer tree (a version mismatch that defeats deduping)
 * make those fail *silently*: no error, just a missing label or a "?" icon
 * glyph. Stamp this copy's version on a shared global the first time any
 * copy loads, and warn once if a second, different version shows up.
 *
 * Exported (not re-exported from the barrel) so it can be exercised directly
 * from a test without relying on module-cache tricks to simulate two copies.
 */
export function registerInstance(
  current: string,
  g: CleanUIGlobal = globalThis as CleanUIGlobal,
): void {
  const existing = g.__CUI_INSTANCE__;
  if (existing === undefined) {
    g.__CUI_INSTANCE__ = current;
    return;
  }
  if (existing === current) return;

  warnOnce(
    `[clean-ui] Detected two copies of @itguy614/clean-ui: v${existing} and v${current}. ` +
      "Components share module-scope singletons (form context, the icon registry, theme/density " +
      "state), so a duplicated instance can fail silently instead of erroring. Fix: dedupe " +
      "@itguy614/clean-ui to one copy (check your lockfile / bundler resolution), or widen the " +
      "consuming package's peer dependency range so both resolve to the same install.",
  );
}

registerInstance(version);
