#!/usr/bin/env node
/**
 * Measures the gzip *delta* a consumer bundle grows by when it imports a
 * publishable package — not that package's own `dist` size, which is what
 * scripts/postbuild.mjs (packages/clean-ui) reports and which no requirement
 * actually cares about. Requires fixtures/consumer-app's tarball install to
 * already be in place (run scripts/verify-fixture.mjs first).
 *
 * Method: for each scenario in the budget file (one fixture page each, see SCENARIOS),
 * build fixtures/consumer-app twice from the *same* source — once
 * against the real package, once with it swapped for a same-shaped stub
 * (CUI_BUNDLE_BASELINE=1, see fixtures/consumer-app/vite.config.ts) — and
 * diff the gzip totals. Budgets are read from fixtures/size-budget.json,
 * which is committed and hand-updated; this script never rewrites it, so a
 * regression fails loudly instead of quietly raising its own ceiling.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync, rmSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_DIR = resolve(ROOT, "fixtures/consumer-app");
const BUDGET_FILE = resolve(ROOT, "fixtures/size-budget.json");

function fail(message) {
  console.error(`\n✗ check-bundle-budget: ${message}\n`);
  process.exit(1);
}

function gzipTotal(distDir) {
  const assetsDir = join(distDir, "assets");
  if (!existsSync(assetsDir)) return 0;
  return readdirSync(assetsDir)
    .filter((file) => file.endsWith(".js") || file.endsWith(".css"))
    .reduce((total, file) => total + gzipSync(readFileSync(join(assetsDir, file))).length, 0);
}

/**
 * The fixture's pages, one per budget scenario (#377). `basic` is the minimal app; `grid`
 * is a data grid with a modal, a slideover and toasts, where 1.5.0 grew ~12 kB that the
 * minimal page never saw.
 */
const SCENARIOS = {
  basic: { input: "index.html", outDir: "dist" },
  grid: { input: "grid.html", outDir: "dist-grid" },
};

/** Build one scenario's page, with or without clean-ui, and return its gzip total. */
function build(scenario, baseline) {
  const { input, outDir: base } = SCENARIOS[scenario];
  const outDir = baseline ? `${base}-baseline` : base;
  rmSync(join(FIXTURE_DIR, outDir), { recursive: true, force: true });
  execFileSync("npm", ["run", "build"], {
    cwd: FIXTURE_DIR,
    stdio: "inherit",
    env: { ...process.env, CUI_BUNDLE_BASELINE: baseline ? "1" : "0", CUI_BUNDLE_INPUT: input, CUI_BUNDLE_OUTDIR: outDir },
  });
  return gzipTotal(join(FIXTURE_DIR, outDir));
}

if (!existsSync(join(FIXTURE_DIR, "node_modules", "@itguy614", "clean-ui"))) {
  fail(`fixtures/consumer-app has no installed @itguy614/clean-ui — run scripts/verify-fixture.mjs first.`);
}
if (!existsSync(BUDGET_FILE)) fail(`${BUDGET_FILE} does not exist.`);

const { budgets } = JSON.parse(readFileSync(BUDGET_FILE, "utf-8"));
const entries = budgets.filter((b) => b.package === "@itguy614/clean-ui");
if (!entries.length) fail(`No budget entry for "@itguy614/clean-ui" in ${BUDGET_FILE}.`);

const format = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;
const over = [];

for (const entry of entries) {
  const scenario = entry.scenario ?? "basic";
  if (!SCENARIOS[scenario]) {
    fail(`Unknown scenario "${scenario}" in ${BUDGET_FILE}; the fixture has: ${Object.keys(SCENARIOS).join(", ")}.`);
  }
  console.log(`[check-bundle-budget] ${scenario}: building with the real package...`);
  const withPackage = build(scenario, false);
  console.log(`[check-bundle-budget] ${scenario}: building with the baseline stub...`);
  const baseline = build(scenario, true);
  const delta = withPackage - baseline;
  console.log(
    `[check-bundle-budget] ${scenario}: with-package: ${format(withPackage)}, baseline: ${format(baseline)}, ` +
      `delta: ${format(delta)}, budget: ${format(entry.gzipBytes)}`,
  );
  if (delta > entry.gzipBytes) {
    over.push(
      `the ${scenario} scenario grew by ${format(delta)} gzip, over its ${format(entry.gzipBytes)} budget ` +
        `(measured ${entry.measured})`,
    );
  } else {
    console.log(`✓ ${scenario}: bundle delta ${format(delta)} is within the ${format(entry.gzipBytes)} budget.`);
  }
}

if (over.length) {
  fail(
    `@itguy614/clean-ui: ${over.join("; ")}. If this growth is expected, update the "gzipBytes" and ` +
      `"measured" fields in ${BUDGET_FILE} deliberately.`,
  );
}
