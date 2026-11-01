#!/usr/bin/env node
/**
 * Measures the gzip *delta* a consumer bundle grows by when it imports a
 * publishable package — not that package's own `dist` size, which is what
 * scripts/postbuild.mjs (packages/clean-ui) reports and which no requirement
 * actually cares about. Requires fixtures/consumer-app's tarball install to
 * already be in place (run scripts/verify-fixture.mjs first).
 *
 * Usage: `node scripts/check-bundle-budget.mjs [package ...]` — checks the budget
 * entries for the named packages, or every entry when none is named.
 *
 * Method: for each budget entry (a package and one fixture page, see SCENARIOS),
 * build fixtures/consumer-app twice from the *same* source — once against the
 * real package, once with that package swapped for a same-shaped stub
 * (CUI_BUNDLE_BASELINE=<package>, see fixtures/consumer-app/vite.config.ts) —
 * and diff the gzip totals. Budgets are read from fixtures/size-budget.json,
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
 * The fixture's pages, one per budget scenario. `basic` is the minimal app; `grid`
 * is a data grid with a modal, a slideover and toasts, where 1.5.0 grew ~12 kB that the
 * minimal page never saw (#377). `editor` is the editor barrel and `render` its `/render`
 * subpath alone, budgeted separately so `/render` pulling CodeMirror back in fails (#226).
 */
const SCENARIOS = {
  basic: { input: "index.html", outDir: "dist" },
  grid: { input: "grid.html", outDir: "dist-grid" },
  editor: { input: "editor.html", outDir: "dist-editor" },
  render: { input: "render.html", outDir: "dist-render" },
};

/** Build one scenario's page, with or without `pkg`, and return its gzip total. */
function build(scenario, pkg, baseline) {
  const { input, outDir: base } = SCENARIOS[scenario];
  const outDir = baseline ? `${base}-baseline` : base;
  rmSync(join(FIXTURE_DIR, outDir), { recursive: true, force: true });
  execFileSync("npm", ["run", "build"], {
    cwd: FIXTURE_DIR,
    stdio: "inherit",
    env: { ...process.env, CUI_BUNDLE_BASELINE: baseline ? pkg : "", CUI_BUNDLE_INPUT: input, CUI_BUNDLE_OUTDIR: outDir },
  });
  return gzipTotal(join(FIXTURE_DIR, outDir));
}

if (!existsSync(BUDGET_FILE)) fail(`${BUDGET_FILE} does not exist.`);

const { budgets } = JSON.parse(readFileSync(BUDGET_FILE, "utf-8"));
if (!budgets.length) fail(`No budget entries in ${BUDGET_FILE}.`);
const requested = process.argv.slice(2);
for (const pkg of requested) {
  if (!budgets.some((b) => b.package === pkg)) fail(`No budget entry for "${pkg}" in ${BUDGET_FILE}.`);
}
const entries = requested.length ? budgets.filter((b) => requested.includes(b.package)) : budgets;

for (const pkg of new Set(entries.map((b) => b.package))) {
  if (!existsSync(join(FIXTURE_DIR, "node_modules", ...pkg.split("/")))) {
    fail(`fixtures/consumer-app has no installed ${pkg} — run scripts/verify-fixture.mjs first.`);
  }
}

const format = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;
const over = [];

for (const entry of entries) {
  const { package: pkg } = entry;
  const scenario = entry.scenario ?? "basic";
  if (!SCENARIOS[scenario]) {
    fail(`Unknown scenario "${scenario}" in ${BUDGET_FILE}; the fixture has: ${Object.keys(SCENARIOS).join(", ")}.`);
  }
  const label = `${pkg} ${scenario}`;
  console.log(`[check-bundle-budget] ${label}: building with the real package...`);
  const withPackage = build(scenario, pkg, false);
  console.log(`[check-bundle-budget] ${label}: building with the baseline stub...`);
  const baseline = build(scenario, pkg, true);
  const delta = withPackage - baseline;
  console.log(
    `[check-bundle-budget] ${label}: with-package: ${format(withPackage)}, baseline: ${format(baseline)}, ` +
      `delta: ${format(delta)}, budget: ${format(entry.gzipBytes)}`,
  );
  if (delta > entry.gzipBytes) {
    over.push(
      `${pkg}: the ${scenario} scenario grew by ${format(delta)} gzip, over its ${format(entry.gzipBytes)} budget ` +
        `(measured ${entry.measured})`,
    );
  } else {
    console.log(`✓ ${label}: bundle delta ${format(delta)} is within the ${format(entry.gzipBytes)} budget.`);
  }
}

if (over.length) {
  fail(
    `${over.join("; ")}. If this growth is expected, update the "gzipBytes" and ` +
      `"measured" fields in ${BUDGET_FILE} deliberately.`,
  );
}
