import { ref, watch } from "vue";

export interface ThemePreset {
  id: string;
  label: string;
  description: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "mono", label: "Mono", description: "Monochrome — default theme" },
  { id: "default", label: "Navy", description: "Navy blue" },
  { id: "forest", label: "Forest", description: "Natural green" },
  { id: "amber", label: "Amber", description: "Warm orange with warm grays" },
  { id: "azure", label: "Azure", description: "Vibrant blue" },
  { id: "teal", label: "Teal", description: "Cool teal" },
  { id: "violet", label: "Violet", description: "Rich purple" },
  { id: "ruby", label: "Ruby", description: "Bold red" },
];

const STORAGE_KEY = "cui-theme";
const CLASS_PREFIX = "cui-theme-";

// Shared reactive state
const activeTheme = ref<string>(loadTheme());

// Migrate old product-based IDs → color-based IDs
const LEGACY_IDS: Record<string, string> = {
  stock: "forest",
  access: "amber",
  temp: "azure",
  dayton: "teal",
  stat: "violet",
};

function loadTheme(): string {
  if (typeof window === "undefined") return "mono";
  const stored = localStorage.getItem(STORAGE_KEY) ?? "mono";
  return LEGACY_IDS[stored] ?? stored;
}

function applyTheme(themeId: string) {
  if (typeof document === "undefined") return;

  // Remove all theme classes
  const root = document.documentElement;
  for (const cls of Array.from(root.classList)) {
    if (cls.startsWith(CLASS_PREFIX)) {
      root.classList.remove(cls);
    }
  }

  // Apply new theme (default = no class needed, uses @theme values)
  if (themeId !== "default") {
    root.classList.add(`${CLASS_PREFIX}${themeId}`);
  }

  // Persist
  localStorage.setItem(STORAGE_KEY, themeId);
}

// Apply on init
applyTheme(activeTheme.value);

// Watch for changes
watch(activeTheme, (newTheme) => {
  applyTheme(newTheme);
});

/**
 * Theme management composable.
 * Shared singleton — all components see the same theme.
 */
export function useTheme() {
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
