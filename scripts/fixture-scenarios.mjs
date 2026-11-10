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
import { rmSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const FIXTURE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../fixtures/consumer-app");

export const SCENARIOS = {
  basic: {
    input: "index.html",
    outDir: "dist",
    skipGuarantees: { "theme-tree-shakes": "App.vue calls useTheme() on purpose (#463)" },
  },
  grid: { input: "grid.html", outDir: "dist-grid", skipGuarantees: {} },
  editor: { input: "editor.html", outDir: "dist-editor", skipGuarantees: {} },
  render: { input: "render.html", outDir: "dist-render", skipGuarantees: {} },
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
