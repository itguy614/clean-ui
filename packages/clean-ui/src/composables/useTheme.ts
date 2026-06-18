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
const DARK_STORAGE_KEY = "cui-dark";
const CLASS_PREFIX = "cui-theme-";

const isBrowser = typeof window !== "undefined";

function loadTheme(): string {
  if (!isBrowser) return "mono";
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "mono";
  } catch {
    return "mono";
  }
}

function loadDarkMode(): boolean {
  if (!isBrowser) return false;
  try {
    const stored = localStorage.getItem(DARK_STORAGE_KEY);
    if (stored !== null) return stored === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

// Shared reactive state
const activeTheme = ref<string>(loadTheme());
const isDark = ref<boolean>(loadDarkMode());

function applyTheme(themeId: string) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  for (const cls of Array.from(root.classList)) {
    if (cls.startsWith(CLASS_PREFIX)) {
      root.classList.remove(cls);
    }
  }

  if (themeId !== "default") {
    root.classList.add(`${CLASS_PREFIX}${themeId}`);
  }
}

function applyDarkMode(dark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", dark);
}

// Apply on init (browser only)
applyTheme(activeTheme.value);
applyDarkMode(isDark.value);

watch(activeTheme, (newTheme) => {
  applyTheme(newTheme);
  if (isBrowser) {
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // localStorage unavailable (SSR, private browsing, etc.)
    }
  }
});

watch(isDark, (newDark) => {
  applyDarkMode(newDark);
  if (isBrowser) {
    try {
      localStorage.setItem(DARK_STORAGE_KEY, String(newDark));
    } catch {
      // localStorage unavailable
    }
  }
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

  function toggleDark() {
    isDark.value = !isDark.value;
  }

  function setDark(dark: boolean) {
    isDark.value = dark;
  }

  return {
    /** Current theme preset ID (reactive) */
    theme: activeTheme,
    /** Whether dark mode is active (reactive) */
    isDark,
    /** List of available theme presets */
    presets: THEME_PRESETS,
    /** Set the active theme by ID */
    setTheme,
    /** Get the current theme ID */
    getTheme,
    /** Toggle between dark and light mode */
    toggleDark,
    /** Explicitly set dark mode on or off */
    setDark,
  };
}
