import { effectScope, ref, watch } from "vue";
import { safeGetItem, safeSetItem } from "../utils/storage";
import { DENSITY_CLASS_PREFIX, DENSITY_IDS, DENSITY_STORAGE_KEY } from "../ssr-constants";

// Derived from the ids the pre-paint init script reads, so adding one updates both.
export type DensityId = (typeof DENSITY_IDS)[number];

export interface DensityPreset {
  id: DensityId;
  label: string;
  description: string;
}

export const DENSITY_PRESETS: DensityPreset[] = [
  { id: "compact", label: "Compact", description: "Tighter spacing — more on screen" },
  { id: "default", label: "Default", description: "Balanced default spacing" },
  { id: "comfortable", label: "Comfortable", description: "Roomier spacing" },
];

const STORAGE_KEY = DENSITY_STORAGE_KEY;
const CLASS_PREFIX = DENSITY_CLASS_PREFIX;
const DEFAULT: DensityId = "default";

const VALID_IDS = new Set<string>(DENSITY_PRESETS.map((p) => p.id));

// Shared reactive state — all components see the same density. Starts at the default and is
// filled from storage on first use (see restoreDensity), never at import (#209).
const activeDensity = ref<DensityId>(DEFAULT);

function applyDensity(id: DensityId) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  for (const cls of Array.from(root.classList)) {
    if (cls.startsWith(CLASS_PREFIX)) root.classList.remove(cls);
  }

  // default == :root baseline, so no class is needed for it.
  if (id !== "default") root.classList.add(`${CLASS_PREFIX}${id}`);
}

let restored = false;

/**
 * Read the stored density and apply it to `<html>`, once; later calls do nothing.
 * `useDensity()` calls it, so an app that uses the composable never needs to. Call it
 * yourself at startup only if density must apply before anything renders it (a stored
 * "default", or a value that isn't a density, leaves the page as it is).
 *
 * Needs a DOM: on the server it only reads the default. Importing the library does none of
 * this (#209, #389): no density localStorage read or write, and
 * no change to `<html>`'s classes, which may be the consumer's own. The persisting watcher
 * is created here too, so only a real change after this writes to storage.
 */
export function restoreDensity(): void {
  if (restored) return;
  const stored = safeGetItem(STORAGE_KEY);
  const valid = stored != null && VALID_IDS.has(stored);
  activeDensity.value = valid ? (stored as DensityId) : DEFAULT;
  // A stored density always wins, "default" included: applying it strips a stale
  // cui-density-* class. Nothing stored, or a value that isn't a density, leaves <html> alone.
  if (valid) applyDensity(activeDensity.value);
  // Detached: the first caller is usually a component, whose unmount must not stop it.
  effectScope(true).run(() => {
    watch(activeDensity, (id) => {
      applyDensity(id);
      safeSetItem(STORAGE_KEY, id);
    });
  });
  // Last, so a failure above leaves the next call free to try again.
  restored = true;
}

/**
 * Density management composable. Shared singleton, mirrors `useTheme`.
 * Restores the stored density on first use (browser only; see `restoreDensity`).
 * Sets the active UI density once for the whole app (or a scoped subtree, if you apply a
 * `cui-density-*` class to a container yourself).
 */
export function useDensity() {
  restoreDensity();

  function setDensity(id: DensityId) {
    activeDensity.value = id;
  }

  function getDensity(): DensityId {
    return activeDensity.value;
  }

  return {
    /** Current density id (reactive) */
    density: activeDensity,
    /** Available density presets */
    presets: DENSITY_PRESETS,
    /** Set the active density */
    setDensity,
    /** Get the current density id */
    getDensity,
  };
}
