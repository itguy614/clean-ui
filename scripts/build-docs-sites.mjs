#!/usr/bin/env node
/**
 * Builds every docs site in config/docs-sites.mjs with its own base path and
 * composes them into one directory for a single GitHub Pages artifact —
 * Pages hosts one site per repository, so N docs apps become N
 * subdirectories of one artifact (the first entry keeps the site's root URL).
 * Every site rebuilds on every deploy, so none of them can go stale relative
 * to the others.
 *
 * GitHub Pages has no per-directory 404 support: it serves exactly one
 * `404.html`, from the artifact root, for ANY unmatched path anywhere on the
 * site — a `404.html` nested under a sub-site's own subdirectory is simply
 * never requested. For the root site this doesn't change anything (its
 * 404.html is still just its own index.html, as before — the browser's URL
 * never moves for a root-site deep link, since GitHub Pages served it at
 * that exact URL already). A deep link into a NON-root site (e.g.
 * /clean-ui/editor/some/route) is different: the one 404.html has to detect
 * that prefix and redirect to that site's own index.html, handing the real
 * path along; that site's index.html then restores it with
 * history.replaceState before its router reads the URL. Root-site deep links
 * never redirect and never need this restore step at all.
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DOCS_SITES } from "../config/docs-sites.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function log(message) {
  console.log(`[build-docs-sites] ${message}`);
}

function fail(message) {
  console.error(`\n✗ build-docs-sites: ${message}\n`);
  process.exit(1);
}

/** "/" | "/editor/" -> "" | "editor" (the root entry has no segment) */
function segmentFor(base) {
  return base.replace(/^\/|\/$/g, "");
}

const SESSION_KEY = "cui-docs-deep-link";

// Prepended to the root site's own index.html to make it double as the
// site-wide 404.html. Only acts (redirects) when the path matches a
// non-root site's segment; otherwise it's a no-op and the rest of this page
// — the root site's real shell — loads normally, at the URL the browser
// already has. That's the same effective behavior this repo's 404.html had
// before there was more than one site (a plain copy of index.html).
function dispatcherScript(siteBase, subSegments) {
  return `<script>
      (function () {
        var SITE_BASE = ${JSON.stringify(siteBase)};
        var SUB_SEGMENTS = ${JSON.stringify(subSegments)};
        var path = window.location.pathname;
        var rel = path.indexOf(SITE_BASE) === 0 ? path.slice(SITE_BASE.length) : path.replace(/^\\//, "");
        var matched = SUB_SEGMENTS.filter(function (seg) {
          return rel === seg || rel.indexOf(seg + "/") === 0;
        })[0];
        if (matched) {
          sessionStorage.setItem(${JSON.stringify(SESSION_KEY)}, path + window.location.search + window.location.hash);
          window.location.replace(SITE_BASE + matched + "/");
        }
      })();
    </script>`;
}

// Injected into every NON-root site's index.html — restores the real deep
// path (stashed by dispatcherScript above) before that site's own router
// reads the URL. The root site never redirects into itself, so it never
// needs this.
const DEEP_LINK_RESTORE_SNIPPET = `<script>
      (function () {
        var deepLink = sessionStorage.getItem(${JSON.stringify(SESSION_KEY)});
        if (!deepLink) return;
        sessionStorage.removeItem(${JSON.stringify(SESSION_KEY)});
        var here = window.location.pathname + window.location.search + window.location.hash;
        if (deepLink !== here) history.replaceState(null, "", deepLink);
      })();
    </script>`;

function injectIntoHead(indexHtmlPath, snippet) {
  const html = readFileSync(indexHtmlPath, "utf-8");
  if (!html.includes("<head>")) fail(`${indexHtmlPath}: no <head> tag found to inject into.`);
  writeFileSync(indexHtmlPath, html.replace("<head>", `<head>\n    ${snippet}`));
  return html;
}

/**
 * @param {string} outDir Absolute path to compose the combined artifact into.
 * @param {string} overallBase The whole site's base path, e.g. "/clean-ui/"
 *   in production or "/" for local testing — matches the current single-app
 *   VITE_BASE convention. Each site's own Vite `base` becomes
 *   `overallBase + itsSegment + "/"`.
 */
export function buildDocsSites(outDir, overallBase = "/") {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const [rootSite, ...subSites] = DOCS_SITES;
  if (!rootSite || rootSite.base !== "/") {
    fail(`config/docs-sites.mjs: the first entry's base must be "/" (the site's existing URL); got ${JSON.stringify(rootSite)}.`);
  }

  for (const site of DOCS_SITES) {
    const appDir = resolve(ROOT, site.dir);
    if (!existsSync(join(appDir, "package.json"))) fail(`${site.dir}: no package.json found.`);
    const pkg = JSON.parse(readFileSync(join(appDir, "package.json"), "utf-8"));
    const segment = segmentFor(site.base);
    const viteBase = overallBase + segment + (segment ? "/" : "");

    log(`Building ${pkg.name} with base "${viteBase}"...`);
    try {
      execFileSync("pnpm", ["--filter", pkg.name, "build"], {
        cwd: ROOT,
        stdio: "inherit",
        env: { ...process.env, VITE_BASE: viteBase },
      });
    } catch {
      fail(`${pkg.name} failed to build with base "${viteBase}".`);
    }

    const siteDist = join(appDir, "dist");
    if (!existsSync(siteDist)) fail(`${pkg.name}: expected ${siteDist} to exist after build.`);

    const target = segment ? join(outDir, segment) : outDir;
    mkdirSync(target, { recursive: true });
    cpSync(siteDist, target, { recursive: true });

    if (segment) injectIntoHead(join(target, "index.html"), DEEP_LINK_RESTORE_SNIPPET);

    log(`${pkg.name} composed at ${segment ? `/${segment}/` : "/"}`);
  }

  // The site-wide 404.html: the root site's own built index.html, plus the
  // dispatcher prepended — same file GitHub Pages actually serves for a
  // root-site deep link, just with a no-op check first.
  const subSegments = subSites.map((s) => segmentFor(s.base));
  const rootIndexHtml = readFileSync(join(outDir, "index.html"), "utf-8");
  const notFoundHtml = rootIndexHtml.replace("<head>", `<head>\n    ${dispatcherScript(overallBase, subSegments)}`);
  writeFileSync(join(outDir, "404.html"), notFoundHtml);
  log(
    `Wrote the site-root 404.html GitHub Pages actually serves for any unmatched path ` +
      `(dispatches to: ${["/", ...subSegments.map((s) => `/${s}/`)].join(", ")}).`,
  );

  log(`Composed ${DOCS_SITES.length} site(s) into ${outDir.startsWith(ROOT) ? outDir.slice(ROOT.length + 1) : outDir}/`);
}

// CLI entry point.
if (import.meta.url === `file://${process.argv[1]}`) {
  const outDir = resolve(ROOT, process.argv[2] ?? "combined-dist");
  buildDocsSites(outDir, process.env.VITE_BASE ?? "/");
}
