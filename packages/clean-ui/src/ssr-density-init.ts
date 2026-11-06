import { DEFAULT_DENSITY_ID, DENSITY_CLASS_PREFIX, DENSITY_IDS, DENSITY_STORAGE_KEY } from "./ssr-constants";

/**
 * SSR Density Init Script
 *
 * Paste this as an inline <script> in your Nuxt/HTML <head> BEFORE any stylesheets, next to
 * `ssrThemeInitScript`. It reads the stored density from localStorage and applies its class
 * to <html> before the page paints, so a server-rendered or lazily loaded app does not flash
 * the default density first.
 *
 * Usage in Nuxt (nuxt.config.ts):
 *   import { ssrThemeInitScript, ssrDensityInitScript } from '@itguy614/clean-ui'
 *
 *   export default defineNuxtConfig({
 *     app: {
 *       head: {
 *         script: [
 *           { children: ssrThemeInitScript, type: 'text/javascript' },
 *           { children: ssrDensityInitScript, type: 'text/javascript' },
 *         ],
 *       },
 *     },
 *   })
 *
 * Keys read:
 *   - "cui-density" -> adds "cui-density-{id}" for "compact" or "comfortable". "default",
 *     an absent key and any other value add nothing, as in `useDensity`.
 *
 * Under a strict CSP, give the inline script your own nonce or hash.
 */
export const ssrDensityInitScript = `
(function() {
  try {
    var density = localStorage.getItem('${DENSITY_STORAGE_KEY}');
    if (${JSON.stringify(DENSITY_IDS.filter((id) => id !== DEFAULT_DENSITY_ID))}.indexOf(density) !== -1) {
      document.documentElement.classList.add('${DENSITY_CLASS_PREFIX}' + density);
    }
  } catch(e) {}
})();
`.trim();
