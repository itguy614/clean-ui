import { ref, watch } from "vue";
import { safeGetItem, safeSetItem } from "../utils/storage";

export interface ThemePreset {
  id: string;
  label: string;
  description: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "mono", label: "Mono", description: "Monochrome" },
  { id: "default", label: "Navy", description: "Navy blue (base scale)" },
  { id: "forest", label: "Forest", description: "Natural green" },
  { id: "amber", label: "Amber", description: "Warm orange with warm grays" },
  { id: "azure", label: "Azure", description: "Vibrant blue" },
  { id: "teal", label: "Teal", description: "Cool teal" },
  { id: "violet", label: "Violet", description: "Rich purple" },
  { id: "ruby", label: "Ruby", description: "Bold red" },
];

const STORAGE_KEY = "cui-theme";
const CLASS_PREFIX = "cui-theme-";

// Only the classes clean-ui itself may add. `applyTheme` strips these and no
// others, so a consuming app's own `cui-theme-<brand>` class on <html> — a
// documented way to ship a custom palette — is never removed (issue #85).
const PRESET_CLASSES = new Set(THEME_PRESETS.map((p) => `${CLASS_PREFIX}${p.id}`));

function loadTheme(): string {
  // No-op default: with nothing stored, don't force a theme — "default" adds no
  // class, leaving whatever the consumer set (their own theme, or the base scale).
  return safeGetItem(STORAGE_KEY) ?? "default";
}

// Shared reactive singleton — all components see the same theme.
const activeTheme = ref<string>(loadTheme());

function applyTheme(themeId: string) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  for (const cls of Array.from(root.classList)) {
    if (PRESET_CLASSES.has(cls)) {
      root.classList.remove(cls);
    }
  }

  if (themeId !== "default") {
    root.classList.add(`${CLASS_PREFIX}${themeId}`);
  }
}

// Persist + reflect changes. Registered at module scope, but the callback only
// runs when the theme actually *changes* (via setTheme) — so merely importing
// the library never rewrites <html>. This is the fix for the import-time side
// effect: no unconditional `applyTheme(...)` at module load.
watch(activeTheme, (newTheme) => {
  applyTheme(newTheme);
  safeSetItem(STORAGE_KEY, newTheme);
});

// Re-apply a previously-stored selection the first time the composable is used
// (browser only) — on demand, not as an import side effect. Only applies when
// the user explicitly stored a theme; otherwise the document is left untouched.
let restored = false;
function restoreStoredTheme() {
  if (restored) return;
  restored = true;
  if (safeGetItem(STORAGE_KEY) != null) {
    applyTheme(activeTheme.value);
  }
}

/**
 * Theme management composable.
 * Shared singleton — all components see the same theme.
 */
export function useTheme() {
  restoreStoredTheme();

  function setTheme(themeId: string) {
    activeTheme.value = themeId;
  }

  function getTheme(): string {
    return activeTheme.value;
  }

  return {
    /** Current theme ID (reactive) */
    theme: activeTheme,
    /** List of available theme presets */
    presets: THEME_PRESETS,
    /** Set the active theme by ID */
    setTheme,
    /** Get the current theme ID */
    getTheme,
  };
}
