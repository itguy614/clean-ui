import { COLOR_MODE_STORAGE_KEY, DARK_CLASS, DARK_SCHEME_QUERY } from "./ssr-constants";

/**
 * SSR Color Mode Init Script
 *
 * Paste this as an inline <script> in your Nuxt/HTML <head> BEFORE any stylesheets, next to
 * `ssrThemeInitScript` and `ssrDensityInitScript`. It reads the stored colour mode from
 * localStorage and sets the "dark" class on <html> before the page paints, so a dark page
 * does not flash light first. "system" (and no stored value, or an unknown one) follows
 * `prefers-color-scheme`.
 *
 * Usage in Nuxt (nuxt.config.ts):
 *   import { ssrColorModeInitScript } from '@itguy614/clean-ui'
 *
 *   export default defineNuxtConfig({
 *     app: {
 *       head: {
 *         script: [
 *           { children: ssrColorModeInitScript, type: 'text/javascript' },
 *         ],
 *       },
 *     },
 *   })
 *
 * Keys read:
 *   - "cui-color-mode" -> "dark" adds the class and "light" removes it; anything else asks
 *     `matchMedia("(prefers-color-scheme: dark)")`. Where that is unavailable the class is
 *     left alone. Same as `useColorMode`.
 *
 * Under a strict CSP, give the inline script your own nonce or hash.
 */
export const ssrColorModeInitScript = `
(function() {
  var mode = null;
  try { mode = localStorage.getItem('${COLOR_MODE_STORAGE_KEY}'); } catch(e) {}
  try {
    var dark = mode === 'dark' || (mode !== 'light' && window.matchMedia('${DARK_SCHEME_QUERY}').matches);
    document.documentElement.classList.toggle('${DARK_CLASS}', dark);
  } catch(e) {}
})();
`.trim();
