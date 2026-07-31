#!/usr/bin/env node
/**
 * Assertions over fixtures/consumer-app's build output and installed
 * node_modules — the package guarantees this repo advertises, expressed
 * mechanically instead of asserted in a changelog. Run after
 * scripts/verify-fixture.mjs has installed and built the fixture.
 *
 * Extensible by design: add an entry to GUARANTEES to cover a new package or
 * regression; nothing else about this script or its CI step needs to change.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_DIR = resolve(ROOT, "fixtures/consumer-app");
const FIXTURE_DIST = join(FIXTURE_DIR, "dist");
const FIXTURE_NODE_MODULES = join(FIXTURE_DIR, "node_modules");

function readBuiltAssets(extensions) {
  const assetsDir = join(FIXTURE_DIST, "assets");
  if (!existsSync(assetsDir)) return "";
  return readdirSync(assetsDir)
    .filter((file) => extensions.some((ext) => file.endsWith(ext)))
    .map((file) => readFileSync(join(assetsDir, file), "utf-8"))
    .join("\n");
}

/** Every installed directory named `packageName` whose own package.json confirms it. */
function findInstalledCopies(root, packageName) {
  const found = [];
  function walk(dir, depth) {
    if (depth > 8) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === ".bin") continue;
      const full = join(dir, entry.name);
      if (entry.name === packageName) {
        const pkgJsonPath = join(full, "package.json");
        if (existsSync(pkgJsonPath)) {
          try {
            if (JSON.parse(readFileSync(pkgJsonPath, "utf-8")).name === packageName) {
              found.push(full);
              continue;
            }
          } catch {
            /* not a real package dir — fall through and keep walking it */
          }
        }
      }
      // Only descend into a nested node_modules — a package's own internal
      // file tree (dist/, src/, etc.) can't contain another copy of itself,
      // so walking into it is wasted work for a fixture this small.
      const nested = join(full, "node_modules");
      if (existsSync(nested)) walk(nested, depth + 1);
    }
  }
  walk(root, 0);
  return found;
}

const GUARANTEES = [
  {
    name: "@itguy614/clean-ui: no full icon-package barrel in the built bundle (#42)",
    check() {
      const js = readBuiltAssets([".js"]);
      const distinctIcons = new Set(js.match(/Ph[A-Z][A-Za-z0-9]*/g) ?? []);
      // The curated built-in set (src/icons/builtin.ts) is ~50 icons today and
      // grows slowly; the regression this guards is the *entire*
      // @phosphor-icons/vue package (~1500+) leaking in via the lazy resolver
      // or a stray dynamic import — nowhere near this threshold either way.
      const THRESHOLD = 150;
      if (distinctIcons.size > THRESHOLD) {
        return (
          `found ${distinctIcons.size} distinct Phosphor icon identifiers (over ${THRESHOLD}) — ` +
          `looks like the full icon package leaked in, not the curated built-in set.`
        );
      }
      return null;
    },
  },
  {
    name: "@itguy614/clean-ui: no base Tailwind utilities layer in the built stylesheet (#62)",
    check() {
      const css = readBuiltAssets([".css"]);
      const utilityMarkers = [".flex{", ".grid{", ".hidden{", ".block{", ".container{", ".sr-only{", ".inline-flex{"];
      const found = utilityMarkers.filter((marker) => css.includes(marker));
      if (found.length > 0) {
        return `found generic Tailwind utility selector(s) in the built CSS: ${found.join(", ")}.`;
      }
      return null;
    },
  },
  {
    name: "vue: exactly one installed copy (single-instance dependency)",
    check() {
      const copies = findInstalledCopies(FIXTURE_NODE_MODULES, "vue");
      if (copies.length !== 1) {
        return `found ${copies.length} installed copies of vue: ${copies.join(", ") || "(none)"}.`;
      }
      return null;
    },
  },
];

if (!existsSync(FIXTURE_DIST)) {
  console.error(`\n✗ check-fixture-guarantees: ${FIXTURE_DIST} does not exist — run scripts/verify-fixture.mjs first.\n`);
  process.exit(1);
}

let failed = 0;
for (const { name, check } of GUARANTEES) {
  const failure = check();
  if (failure) {
    failed++;
    console.error(`✗ ${name}\n  ${failure}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed}/${GUARANTEES.length} guarantee(s) broken.\n`);
  process.exit(1);
}

console.log(`\nAll ${GUARANTEES.length} guarantee(s) held.`);
