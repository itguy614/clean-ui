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
