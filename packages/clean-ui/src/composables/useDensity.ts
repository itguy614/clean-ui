import { ref, watch } from "vue";

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

// Shared reactive state — all components see the same density.
const activeDensity = ref<DensityId>(loadDensity());

const VALID_IDS = new Set<string>(DENSITY_PRESETS.map((p) => p.id));

function loadDensity(): DensityId {
  if (typeof window === "undefined") return DEFAULT;
  const stored = localStorage.getItem(STORAGE_KEY);
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

  localStorage.setItem(STORAGE_KEY, id);
}

// Apply on init + on change.
applyDensity(activeDensity.value);
watch(activeDensity, applyDensity);

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
