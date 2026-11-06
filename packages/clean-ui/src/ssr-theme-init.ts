import { THEME_CLASS_PREFIX, THEME_STORAGE_KEY } from "./ssr-constants";

/**
 * SSR Theme Init Script
 *
 * Paste this as an inline <script> in your Nuxt/HTML <head> BEFORE
 * any stylesheets. It reads the theme from localStorage and applies
 * the correct classes to <html> before the page paints — eliminating FOUC.
 *
 * Usage in Nuxt (nuxt.config.ts):
 *   import { ssrThemeInitScript } from '@itguy614/clean-ui'
 *
 *   export default defineNuxtConfig({
 *     app: {
 *       head: {
 *         script: [
 *           { children: ssrThemeInitScript, type: 'text/javascript' },
 *         ],
 *       },
 *     },
 *   })
 *
 * With this script in the head, the class is on <html> before first paint, so an app need
 * not call `restoreTheme()` at startup. Pair it with `ssrDensityInitScript` for density.
 *
 * Keys read:
 *   - "cui-theme"  → adds "cui-theme-{id}" class (theme preset)
 *
 * Dark mode is class-based (`.dark`) but the library doesn't own a persistence
 * key for it — if your app persists a dark preference, add a matching line here
 * (read your own key and toggle the "dark" class) to also avoid a dark FOUC.
 */
export const ssrThemeInitScript = `
(function() {
  try {
    var theme = localStorage.getItem('${THEME_STORAGE_KEY}');
    if (theme && theme !== 'default' && theme !== 'navy') {
      document.documentElement.classList.add('${THEME_CLASS_PREFIX}' + theme);
    }
  } catch(e) {}
})();
`.trim()
