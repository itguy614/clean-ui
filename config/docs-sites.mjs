/**
 * Every docs site GitHub Pages should host, and the base path each gets in
 * the composed artifact. Explicit rather than auto-discovered — "which apps
 * are deployable docs sites, at which path" isn't a safe thing to infer the
 * way "which packages are publishable" is (a `private` field wouldn't do
 * apps/docs any good, since it's already private and still deploys).
 *
 * The FIRST entry's base MUST be "/" — that's the site's existing URL, and
 * task 3.2.1 requires it to keep working unchanged. Every other entry's base
 * becomes a subdirectory of the composed artifact. See
 * scripts/build-docs-sites.mjs for how these get combined, and its root
 * 404.html for why a nested 404.html alone would NOT make a non-root site's
 * deep links work on GitHub Pages.
 */
export const DOCS_SITES = [{ dir: "apps/docs", base: "/" }];
