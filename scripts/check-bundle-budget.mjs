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
 * Method: for each budget entry (a package and one fixture page, see SCENARIOS in
 * scripts/fixture-scenarios.mjs),
 * build fixtures/consumer-app twice from the *same* source — once against the
 * real package, once with that package swapped for a same-shaped stub
 * (CUI_BUNDLE_BASELINE=<package>, see fixtures/consumer-app/vite.config.ts) —
 * and diff the gzip totals. Budgets are read from fixtures/size-budget.json,
 * which is committed and hand-updated; this script never rewrites it, so a
 * regression fails loudly instead of quietly raising its own ceiling.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FIXTURE_DIR, SCENARIOS, buildScenario } from "./fixture-scenarios.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
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

if (!existsSync(BUDGET_FILE)) fail(`${BUDGET_FILE} does not exist.`);

const { budgets } = JSON.parse(readFileSync(BUDGET_FILE, "utf-8"));
if (!budgets.length) fail(`No budget entries in ${BUDGET_FILE}.`);
const requested = process.argv.slice(2);
for (const pkg of requested) {
  if (!budgets.some((b) => b.package === pkg)) fail(`No budget entry for "${pkg}" in ${BUDGET_FILE}.`);
}
const entries = requested.length ? budgets.filter((b) => requested.includes(b.package)) : budgets;

// Every budgeted package, not just the requested ones: a scenario can use more than its own
// (the editor's page uses clean-ui too, its peer).
for (const pkg of new Set(budgets.map((b) => b.package))) {
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
  const withPackage = gzipTotal(buildScenario(scenario));
  console.log(`[check-bundle-budget] ${label}: building with the baseline stub...`);
  const baseline = gzipTotal(buildScenario(scenario, { baseline: pkg }));
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
