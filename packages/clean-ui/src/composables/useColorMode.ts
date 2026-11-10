import { computed, effectScope, onScopeDispose, ref, watch, type EffectScope } from "vue";
import { safeGetItem, safeSetItem } from "../utils/storage";
import {
  COLOR_MODE_IDS,
  COLOR_MODE_STORAGE_KEY,
  DARK_CLASS,
  DARK_SCHEME_QUERY,
  DEFAULT_COLOR_MODE_ID,
} from "../ssr-constants";

// Derived from the ids the pre-paint init script reads, so adding one updates both.
export type ColorMode = (typeof COLOR_MODE_IDS)[number];

const DEFAULT: ColorMode = DEFAULT_COLOR_MODE_ID;
const VALID_MODES = new Set<string>(COLOR_MODE_IDS);

// Shared reactive state — all components see the same mode. Starts at the default and is
// filled from storage on first use (see restoreColorMode), never at import.
const mode = ref<ColorMode>(DEFAULT);
// What the OS prefers, kept live by the change listener while the mode is "system".
const systemDark = ref(false);
/** The resolved scheme: an explicit mode as chosen, "system" as the OS currently prefers. */
const isDark = computed(() => (mode.value === "system" ? systemDark.value : mode.value === "dark"));

/** The dark-scheme media query, or null on the server and where matchMedia is missing. */
function darkQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  try {
    return window.matchMedia(DARK_SCHEME_QUERY);
  } catch {
    return null;
  }
}

function applyDark(dark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(DARK_CLASS, dark);
}

// The change listener exists only while the mode is "system".
let query: MediaQueryList | null = null;
function onSystemChange(event: MediaQueryListEvent) {
  systemDark.value = event.matches;
}

function stopFollowingSystem() {
  query?.removeEventListener("change", onSystemChange);
  query = null;
}

function followSystem() {
  if (query) return;
  const q = darkQuery();
  if (!q) return;
  // Re-read: the OS may have changed while the listener was off.
  systemDark.value = q.matches;
  q.addEventListener("change", onSystemChange);
  query = q;
}

let restored = false;
let scope: EffectScope | null = null;

/**
 * Read the stored colour mode and apply the resolved scheme to `<html>`'s `dark` class,
 * once; later calls do nothing. `useColorMode()` calls it, so an app that uses the
 * composable never needs to. Call it yourself at startup only if the scheme must apply
 * before anything renders it (or use `ssrColorModeInitScript`, which does it before first
 * paint).
 *
 * A stored `"light"` or `"dark"` always wins over a stale `dark` class. Nothing stored, a
 * stored `"system"` or a value that isn't a mode means `"system"`: the class follows the
 * OS, and is left alone where `matchMedia` is unavailable.
 *
 * Needs a DOM: on the server it only reads the default. Importing the library does none of
 * this: no `cui-color-mode` localStorage read or write, no change to `<html>`'s classes, no
 * `matchMedia` listener. The persisting watcher and the listener (added only while the mode
 * is "system") are created here and live for the page's lifetime, in a detached effect
 * scope, since the first caller is usually a component whose unmount must not stop them.
 */
export function restoreColorMode(): void {
  if (restored) return;
  const stored = safeGetItem(COLOR_MODE_STORAGE_KEY);
  const valid = stored != null && VALID_MODES.has(stored);
  mode.value = valid ? (stored as ColorMode) : DEFAULT;
  if (mode.value === "system") followSystem();
  if (mode.value !== "system" || query) applyDark(isDark.value);
  scope = effectScope(true);
  scope.run(() => {
    onScopeDispose(stopFollowingSystem);
    watch(mode, (next) => {
      if (next === "system") followSystem();
      else stopFollowingSystem();
      safeSetItem(COLOR_MODE_STORAGE_KEY, next);
    });
    watch(isDark, applyDark);
  });
  // Last, so a failure above leaves the next call free to try again.
  restored = true;
}

/**
 * Stop the watchers and the listener and allow `restoreColorMode()` to run again.
 * @internal Not exported from the barrel: for tests and hot-module replacement.
 */
export function disposeColorMode(): void {
  scope?.stop(); // removes the listener, through onScopeDispose
  scope = null;
  restored = false;
}

/**
 * Colour mode composable: light, dark, or follow the system. Shared singleton, mirrors
 * `useTheme`. Restores the stored mode on first use (browser only; see `restoreColorMode`).
 * It owns the `dark` class on `<html>`; `useColorScheme()` still just observes it.
 */
export function useColorMode() {
  restoreColorMode();

  function setMode(next: ColorMode) {
    if (VALID_MODES.has(next)) mode.value = next;
  }

  /** Flip the resolved scheme (system + dark becomes light) and store it as an explicit mode. */
  function toggle() {
    setMode(isDark.value ? "light" : "dark");
  }

  return {
    /** The chosen mode (reactive): "light", "dark" or "system" */
    mode,
    /** The scheme in effect (reactive); for "system", what the OS prefers */
    isDark,
    /** Choose a mode */
    setMode,
    /** Switch to the opposite of the resolved scheme */
    toggle,
  };
}
