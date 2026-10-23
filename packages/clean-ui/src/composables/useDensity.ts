import { ref, watch } from "vue";
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

// Shared reactive state — all components see the same density.
const activeDensity = ref<DensityId>(loadDensity());

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

// Importing the library must not touch the page (#389): no rewriting <html>'s density
// classes, which may be the consumer's own, and no writing to their localStorage. Unlike
// useTheme, which restores on its first use, a density stored by an earlier setDensity is
// still restored here, at import (#209 makes it lazy in 2.0); a stored "default" or an
// invalid value leaves the page as it is. A change persists and applies via the watcher.
if (activeDensity.value !== DEFAULT) applyDensity(activeDensity.value);
watch(activeDensity, (id) => {
  applyDensity(id);
  safeSetItem(STORAGE_KEY, id);
});

/**
 * Density management composable. Shared singleton, mirrors `useTheme`.
 * Sets the active UI density once for the whole app (or a scoped subtree, if
 * you apply a `cui-density-*` class to a container yourself).
 */
export function useDensity() {
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
