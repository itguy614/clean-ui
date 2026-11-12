import { effectScope, ref, watch } from "vue";
import { safeGetItem, safeSetItem } from "../utils/storage";
import { THEME_CLASS_PREFIX, THEME_STORAGE_KEY } from "../ssr-constants";
import { __DEV__, warnOnce } from "../utils/devWarn";

// Module-scoped, so the library doesn't pull Node's global types into its own build.
declare const process: { env: { NODE_ENV?: string } };

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

const STORAGE_KEY = THEME_STORAGE_KEY;
export const CLASS_PREFIX = THEME_CLASS_PREFIX;
const DEFAULT = "default";

// Only the classes clean-ui itself may add. `applyTheme` strips these and no
// others, so a consuming app's own `cui-theme-<brand>` class on <html> — a
// documented way to ship a custom palette — is never removed (issue #85).
// The Navy classes too (#330): a scoped subtree's way back to the default, never left on
// <html>, where the default needs no class and a class's literal scale would shadow a
// consumer's own :root palette.
const PRESET_CLASSES = new Set([...THEME_PRESETS.map((p) => `${CLASS_PREFIX}${p.id}`), `${CLASS_PREFIX}navy`]);

// Shared reactive state — all components see the same theme. Starts at the default and is
// filled from storage on first use (see restoreTheme), never at import (#463, as #209 did
// for density).
const activeTheme = ref<string>(DEFAULT);

function applyTheme(themeId: string) {
  if (typeof document === "undefined") return;
  // "navy" is the default's name; it adds no class either.
  if (themeId === "navy") themeId = "default";

  const root = document.documentElement;
  for (const cls of Array.from(root.classList)) {
    if (PRESET_CLASSES.has(cls)) {
      root.classList.remove(cls);
    }
  }

  if (themeId !== "default") {
    root.classList.add(`${CLASS_PREFIX}${themeId}`);
    // A consumer's own `cui-theme-<brand>` is not a preset: nothing of ours to import.
    if (THEME_PRESETS.some((p) => p.id === themeId)) warnIfStylesheetMissing(themeId);
  }
}

/**
 * Development only (#220): the seven non-default palettes are opt-in stylesheets, so a theme
 * whose file was not imported is a class that styles nothing and the page stays Navy. Each
 * file declares a `--cui-theme-<id>` marker on its class; read it back from `<html>`.
 * A stylesheet still loading when this runs reads as missing: import them ahead of the app.
 */
function warnIfStylesheetMissing(themeId: string) {
  const marker = `--cui-theme-${themeId}`;
  if (__DEV__ && process.env.NODE_ENV !== "production" && !getComputedStyle(document.documentElement).getPropertyValue(marker).trim()) warnOnce(
    `[clean-ui] setTheme("${themeId}"): the "${themeId}" theme's stylesheet is not loaded, so it has no effect. ` +
      `Import it: @itguy614/clean-ui/themes/${themeId}.css (or the all-in-one @itguy614/clean-ui/styles/all.css).`,
  );
}

let restored = false;

/**
 * Read the stored theme and apply it to `<html>`, once; later calls do nothing.
 * `useTheme()` calls it, so an app that uses the composable never needs to. Call it
 * yourself at startup only if the theme must apply before anything renders it (or use
 * `ssrThemeInitScript`, which does it before first paint). Nothing stored, or the default,
 * leaves the page as it is.
 *
 * Needs a DOM: on the server it only reads the default. Importing the library does none of
 * this: no `cui-theme` localStorage read or write, and no change to `<html>`'s classes,
 * which may be the consumer's own. The persisting watcher is created here too, so only a
 * real change after this writes to storage.
 */
export function restoreTheme(): void {
  if (restored) return;
  const stored = safeGetItem(STORAGE_KEY);
  activeTheme.value = stored ?? DEFAULT;
  // A stored choice always wins, the default included: applying it strips a stale preset
  // class (from static markup, say). Nothing stored leaves <html> as it is.
  if (stored != null) applyTheme(stored);
  // Detached: the first caller is usually a component, whose unmount must not stop it.
  effectScope(true).run(() => {
    watch(activeTheme, (newTheme) => {
      applyTheme(newTheme);
      safeSetItem(STORAGE_KEY, newTheme);
    });
  });
  // Last, so a failure above leaves the next call free to try again.
  restored = true;
}

/**
 * Theme management composable.
 * Shared singleton — all components see the same theme. Restores the stored theme on first
 * use (browser only; see `restoreTheme`).
 */
export function useTheme() {
  restoreTheme();

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
