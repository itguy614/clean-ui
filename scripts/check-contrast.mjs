#!/usr/bin/env node
/**
 * WCAG AA contrast audit, generalized across packages. Run: node scripts/check-contrast.mjs
 *
 * Each package contributes a "source" — a module under scripts/contrast/
 * exporting `run()`, which prints its own per-theme detail (unchanged from
 * before there was more than one source) and returns
 * `{ failures, infoCount, totalChecks }`. Extending coverage to a new
 * package's tokens means adding one entry to SOURCES below and a new
 * scripts/contrast/<package>.mjs; nothing else about this script changes.
 *
 * This has never been a CI gate (no process.exit on failure) — that's
 * unchanged here too. It's a local/manual audit tool.
 */
import { run as runCleanUi } from "./contrast/clean-ui.mjs";

const SOURCES = [
  { name: "@itguy614/clean-ui", run: runCleanUi },
  // A future package adds a line here, e.g.:
  // { name: "@itguy614/clean-ui-editor", run: runEditor },
];

const allFailures = [];
let totalInfo = 0;
let totalChecks = 0;

for (const source of SOURCES) {
  if (SOURCES.length > 1) console.log(`\n########## ${source.name} ##########\n`);
  const result = source.run();
  allFailures.push(...result.failures.map((f) => ({ ...f, source: source.name })));
  totalInfo += result.infoCount;
  totalChecks += result.totalChecks;
}

console.log("═".repeat(94));
if (allFailures.length === 0) {
  console.log("🎉 All checks pass!");
} else {
  console.log(`⚠️  ${allFailures.length} check(s) below threshold.\n`);
  console.log("FAILURES:");
  console.log("─".repeat(94));
  for (const f of allFailures) {
    const sourceLabel = SOURCES.length > 1 ? `[${f.source}] ` : "";
    console.log(
      `  ${sourceLabel}[${f.mode.toUpperCase()}] ${f.theme.padEnd(8)} ${f.label.padEnd(48)} ${f.ratio.toFixed(2)}:1 (need ${f.threshold}:1)  ${f.fg} on ${f.bg}`,
    );
  }
}
console.log("");
