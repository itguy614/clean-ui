import { effectScope, ref, watch } from "vue";
import { safeGetItem, safeSetItem } from "../utils/storage";

export type DensityId = "compact" | "default" | "comfortable";

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

const STORAGE_KEY = "cui-density";
const CLASS_PREFIX = "cui-density-";
const DEFAULT: DensityId = "default";

const VALID_IDS = new Set<string>(DENSITY_PRESETS.map((p) => p.id));

// Shared reactive state — all components see the same density. Starts at the default and is
// filled from storage on first use (see restoreDensity), never at import (#209).
const activeDensity = ref<DensityId>(DEFAULT);

function loadDensity(): DensityId {
  const stored = safeGetItem(STORAGE_KEY);
  return stored && VALID_IDS.has(stored) ? (stored as DensityId) : DEFAULT;
}

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
 * Importing the library does none of this (#209, #389): no localStorage read or write, and
 * no change to `<html>`'s classes, which may be the consumer's own. The persisting watcher
 * is created here too, so only a real change after this writes to storage.
 */
export function restoreDensity(): void {
  if (restored) return;
  restored = true;
  activeDensity.value = loadDensity();
  if (activeDensity.value !== DEFAULT) applyDensity(activeDensity.value);
  // Detached: the first caller is usually a component, whose unmount must not stop it.
  effectScope(true).run(() => {
    watch(activeDensity, (id) => {
      applyDensity(id);
      safeSetItem(STORAGE_KEY, id);
    });
  });
}

/**
 * Density management composable. Shared singleton, mirrors `useTheme`.
 * Restores the stored density on first use. Sets the active UI density once for the whole app (or a scoped subtree, if
 * you apply a `cui-density-*` class to a container yourself).
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
