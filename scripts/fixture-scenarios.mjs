/**
 * The pages of fixtures/consumer-app, one per scenario, and how to build one. Shared by
 * scripts/check-bundle-budget.mjs (a gzip budget per scenario) and
 * scripts/check-fixture-guarantees.mjs (the package guarantees, checked on every scenario's
 * build): a page added here is budgeted and guarded with no change to either script (#384).
 *
 * `basic` is the minimal app; `grid` is a data grid with a modal, a slideover and toasts,
 * where 1.5.0 grew ~12 kB that the minimal page never saw (#377). `editor` is the editor
 * barrel and `render` its `/render` subpath alone, budgeted separately so `/render` pulling
 * CodeMirror back in fails (#226).
 *
 * `skipGuarantees` maps a guarantee id (see check-fixture-guarantees.mjs) to the reason it
 * does not hold for that page. A guarantee runs on every scenario that doesn't list it, and
 * a listed one that holds again fails, so the skip is removed. Every page passes every
 * guarantee today except `basic`, which uses useTheme on purpose.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const FIXTURE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../fixtures/consumer-app");

/**
 * `maxIconPaths`: the most SVG path literals the built page may hold (the `icon-paths` guarantee,
 * #207). Measured at 3 (basic), 31 (grid), 25 (editor) and 0 (render), each with about 2x headroom;
 * clean-ui 1.x measured 371, 378, 462 and 0, because every icon carried all six weights of path data.
 * A page that draws more icons raises its own limit, deliberately.
 */
export const SCENARIOS = {
  basic: {
    input: "index.html",
    outDir: "dist",
    maxIconPaths: 8,
    skipGuarantees: { "theme-tree-shakes": "App.vue calls useTheme() on purpose (#463)" },
  },
  grid: { input: "grid.html", outDir: "dist-grid", maxIconPaths: 60, skipGuarantees: {} },
  editor: { input: "editor.html", outDir: "dist-editor", maxIconPaths: 60, skipGuarantees: {} },
  render: { input: "render.html", outDir: "dist-render", maxIconPaths: 4, skipGuarantees: {} },
  // Not budgeted: two opt-in theme files imported on top of the default stylesheet (#220).
  // `themes` lists the non-default themes whose CSS the page imports; every other scenario
  // imports none, so the guarantee `theme-css-opt-in` fails if a theme leaks into `styles`.
  themes: { input: "themes.html", outDir: "dist-themes", themes: ["forest", "ruby"], maxIconPaths: 8, skipGuarantees: {} },
};

/**
 * Build one scenario's page with `vite build` and return its output directory. With
 * `baseline`, the named package is swapped for its same-shaped stub
 * (CUI_BUNDLE_BASELINE, see fixtures/consumer-app/vite.config.ts) and the page goes to
 * `<outDir>-baseline`. `vite build` alone, not the fixture's `npm run build`: its vue-tsc
 * pass doesn't depend on the scenario or the baseline aliases (they are Vite-only), and
 * scripts/verify-fixture.mjs has already run it.
 */
export function buildScenario(scenario, { baseline } = {}) {
  const { input, outDir: base } = SCENARIOS[scenario];
  const outDir = baseline ? `${base}-baseline` : base;
  rmSync(join(FIXTURE_DIR, outDir), { recursive: true, force: true });
  execFileSync(join(FIXTURE_DIR, "node_modules", ".bin", "vite"), ["build"], {
    cwd: FIXTURE_DIR,
    stdio: "inherit",
    env: { ...process.env, CUI_BUNDLE_BASELINE: baseline ?? "", CUI_BUNDLE_INPUT: input, CUI_BUNDLE_OUTDIR: outDir },
  });
  return join(FIXTURE_DIR, outDir);
}

/**
 * An SVG path's data as a string literal in built JS: `"M213.66,101.66l-80,80a8,8,0,0,1…"`. It
 * matches Phosphor's `d:"M…"` and the generated built-ins' bare array strings alike, and no
 * prose: after the leading M it is digits, dots, commas and minus signs only, up to the first
 * command letter, so a word beginning with M cannot match (#207).
 */
export const SVG_PATH_DATA = /"M[\d.,-]+[A-Za-z][\dA-Za-z.,-]*"/g;

/**
 * A built page's size, by area. `gzip` is the sum of each .js and .css asset's own gzip, the
 * figure the budget has always used. It splits into `css`, `icons` (what the path data costs
 * the JS: its gzip minus the gzip of the same JS with every path literal emptied) and `js` (the
 * rest). `paths` and `pathBytes` count the path literals themselves. A gzip stream is not
 * additive, so the split is each area's marginal cost, and the three sum to `gzip` exactly.
 */
export function analyzeBuild(distDir) {
  const assetsDir = join(distDir, "assets");
  const files = existsSync(assetsDir) ? readdirSync(assetsDir) : [];
  const out = { gzip: 0, css: 0, js: 0, icons: 0, paths: 0, pathBytes: 0 };
  for (const file of files) {
    const text = readFileSync(join(assetsDir, file));
    if (file.endsWith(".css")) {
      out.css += gzipSync(text).length;
    } else if (file.endsWith(".js")) {
      const source = text.toString("utf-8");
      const paths = source.match(SVG_PATH_DATA) ?? [];
      const whole = gzipSync(text).length;
      const without = paths.length ? gzipSync(source.replace(SVG_PATH_DATA, `""`)).length : whole;
      out.js += without;
      out.icons += whole - without;
      out.paths += paths.length;
      out.pathBytes += paths.reduce((n, p) => n + p.length - 2, 0);
    } else continue;
  }
  out.gzip = out.css + out.js + out.icons;
  return out;
}
