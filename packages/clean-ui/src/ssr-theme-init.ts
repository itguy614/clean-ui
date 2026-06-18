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
 * Keys read:
 *   - "cui-theme"  → adds "cui-theme-{id}" class (theme preset)
 *   - "cui-dark"   → adds "dark" class when "true"
 */
export const ssrThemeInitScript = `
(function() {
  try {
    var theme = localStorage.getItem('cui-theme');
    if (theme && theme !== 'default') {
      document.documentElement.classList.add('cui-theme-' + theme);
    }
    var dark = localStorage.getItem('cui-dark');
    if (dark === 'true') {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();
`.trim()
