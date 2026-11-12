// The storage keys, class names and ids `useTheme` / `useDensity` share with the pre-paint init
// scripts (ssr-theme-init.ts, ssr-density-init.ts). One definition, so a script and its
// composable cannot drift apart. The scripts interpolate these into source text that runs
// before any module does.

export const THEME_STORAGE_KEY = "cui-theme";
export const THEME_CLASS_PREFIX = "cui-theme-";

export const DENSITY_STORAGE_KEY = "cui-density";
export const DENSITY_CLASS_PREFIX = "cui-density-";
/** Every density id, the default included (it adds no class). */
export const DENSITY_IDS = ["compact", "default", "comfortable"] as const;
export const DEFAULT_DENSITY_ID = "default";

// `useColorMode` and ssr-color-mode-init.ts. The dark class is the one `useColorScheme` and
// every `:root.dark, .dark` token block key on.
export const COLOR_MODE_STORAGE_KEY = "cui-color-mode";
export const DARK_CLASS = "dark";
/** The three choices; "system" follows `prefers-color-scheme` and is the default. */
export const COLOR_MODE_IDS = ["light", "dark", "system"] as const;
export const DEFAULT_COLOR_MODE_ID = "system";
export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";
