#!/usr/bin/env node
/**
 * Assertions over fixtures/consumer-app's build output and installed
 * node_modules — the package guarantees this repo advertises, expressed
 * mechanically instead of asserted in a changelog. Run after
 * scripts/verify-fixture.mjs has installed the fixture.
 *
 * A guarantee about the build output runs on every fixture page: this script
 * builds each scenario in scripts/fixture-scenarios.mjs (the table the bundle
 * budget uses) and checks its output, so a regression only one page triggers
 * (a data grid pulling in the icon barrel, say) still fails, naming that page
 * (#384). A scenario opts out of a guarantee only in that table, with the
 * reason. A guarantee about the install (`scope: "install"`) runs once.
 *
 * Extensible by design: add an entry to GUARANTEES to cover a new package or
 * regression, or to SCENARIOS to cover a new page; nothing else about this
 * script or its CI step needs to change.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FIXTURE_DIR, SCENARIOS, SVG_PATH_DATA, buildScenario } from "./fixture-scenarios.mjs";

const FIXTURE_NODE_MODULES = join(FIXTURE_DIR, "node_modules");

/**
 * A page's built assets of the given types, concatenated. Throws when there are none: a
 * guarantee run over an empty string passes without having checked anything.
 */
function readBuiltAssets(distDir, extensions) {
  const assetsDir = join(distDir, "assets");
  const files = existsSync(assetsDir)
    ? readdirSync(assetsDir).filter((file) => extensions.some((ext) => file.endsWith(ext)))
    : [];
  if (files.length === 0) throw new Error(`no ${extensions.join("/")} assets in ${assetsDir} to check.`);
  return files.map((file) => readFileSync(join(assetsDir, file), "utf-8")).join("\n");
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

const PACKAGES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../packages");

/** Every non-test source file of every workspace package. */
function packageSources() {
  const files = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "__tests__" || entry.name === "node_modules" || entry.name === "dist") continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|vue)$/.test(entry.name) && !/\.test(-d)?\.ts$/.test(entry.name)) files.push(full);
    }
  }
  for (const pkg of readdirSync(PACKAGES_DIR)) {
    const src = join(PACKAGES_DIR, pkg, "src");
    if (existsSync(src)) walk(src);
  }
  return files;
}

/**
 * The text of every dev warning, read from the source (#369): the static fragments of every
 * string passed to `warnOnce(`, `warnVariantColor(`, the editor's `warnDev(` or its plugin
 * registry's `warnings.push(` (#462), plus the fragments of devWarn.ts itself
 * (where warnVariantColor builds its messages). A new warning is covered without anyone listing
 * it. Fragments are split at `${…}` holes, escapes and quotes, since a minifier re-spells those,
 * and only the long ones kept, so one can't match by chance.
 */
function devWarningStrings() {
  const MIN = 30;
  const out = new Set();
  const fragments = (literalSource) => {
    for (const m of literalSource.matchAll(/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)) {
      for (const part of (m[1] ?? m[2] ?? m[3]).split(/\$\{[^}]*\}|\\.|["'`]/)) {
        // Prose, not an identifier or import path that the bundle may legitimately hold.
        if (part.trim().length >= MIN && /\S\s+\S/.test(part)) out.add(part);
      }
    }
  };
  for (const file of packageSources()) {
    const code = readFileSync(file, "utf-8");
    if (file.endsWith("utils/devWarn.ts")) {
      fragments(code.replace(/^import .*$/gm, "").replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ""));
      continue;
    }
    for (const call of code.matchAll(/(?<![.\w]|function )(?:warnOnce|warnVariantColor|warnDev|warnings\.push)\s*\(/g)) {
      const start = call.index + call[0].length;
      let depth = 1;
      let i = start;
      let quote = null;
      for (; i < code.length && depth > 0; i++) {
        const c = code[i];
        if (quote) {
          if (c === "\\") i++;
          else if (c === quote) quote = null;
        } else if (c === '"' || c === "'" || c === "`") quote = c;
        else if (c === "(") depth++;
        else if (c === ")") depth--;
      }
      fragments(code.slice(start, i));
    }
  }
  return [...out];
}

const GUARANTEES = [
  {
    id: "icon-barrel",
    name: "no full icon-package barrel in the built bundle (#42)",
    check(distDir) {
      const js = readBuiltAssets(distDir, [".js"]);
      const distinctIcons = new Set(js.match(/Ph[A-Z][A-Za-z0-9]*/g) ?? []);
      // Nothing in a build should name a Phosphor component any more (the built-ins are
      // generated, see icon-paths below); the regression this guards is the *entire*
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
    id: "icon-paths",
    name: "built icon path data stays within the page's limit (#207)",
    check(distDir, scenario) {
      // Counts SVG path literals, whichever way they are spelled (a Phosphor `d:"M…"` or a
      // generated built-in's bare string). Each icon the page draws costs one per weight it
      // carries: with clean-ui 1.x's six-weight components, one rendered icon put ~360 paths
      // (~25 kB gzip) in the bundle; the generated built-ins carry only the weights the
      // library draws.
      const max = SCENARIOS[scenario].maxIconPaths;
      const paths = (readBuiltAssets(distDir, [".js"]).match(SVG_PATH_DATA) ?? []).length;
      if (paths >= max) {
        return (
          `found ${paths} SVG path literals (the limit is under ${max}) — an icon with weights the library ` +
          `never draws, or the full icon package, is in the bundle. See scripts/fixture-scenarios.mjs.`
        );
      }
      return null;
    },
  },
  {
    id: "no-tailwind-utilities",
    name: "no base Tailwind utilities layer in the built stylesheet (#62)",
    check(distDir) {
      const css = readBuiltAssets(distDir, [".css"]);
      const utilityMarkers = [".flex{", ".grid{", ".hidden{", ".block{", ".container{", ".sr-only{", ".inline-flex{"];
      const found = utilityMarkers.filter((marker) => css.includes(marker));
      if (found.length > 0) {
        return `found generic Tailwind utility selector(s) in the built CSS: ${found.join(", ")}.`;
      }
      return null;
    },
  },
  {
    id: "no-global-reset",
    name: "no global reset in the built stylesheet (#72)",
    check(distDir) {
      const css = readBuiltAssets(distDir, [".css"]);

      // The fixture uses no Tailwind of its own, so anything resembling
      // preflight in here came from the library. These two only ever appear in
      // preflight's `html`/`:host` rule, which is the one rule that cannot be
      // scoped — it *is* the host document.
      const globalFingerprints = ["text-size-adjust", "tab-size:"];
      const leaked = globalFingerprints.filter((marker) => css.includes(marker));
      if (leaked.length > 0) {
        return `found global reset declaration(s) in the built CSS: ${leaked.join(", ")}.`;
      }

      // Every box-sizing rule must be scoped to a cui-* subtree. This is the
      // load-bearing half: preflight's `*, ::before, ::after { box-sizing }` is
      // what silently restyled a consumer's own page, and it is the rule the
      // components genuinely depend on, so it cannot simply be dropped — only
      // scoped. An unscoped one means the blanket reset is back.
      const unscoped = [];
      for (const [, selector, declarations] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (declarations.includes("box-sizing") && !selector.includes("cui-")) {
          unscoped.push(selector.trim().slice(0, 80));
        }
      }
      if (unscoped.length > 0) {
        return `found box-sizing applied outside a cui-* scope: ${unscoped.join(" | ")}.`;
      }

      return null;
    },
  },
  {
    id: "density-tree-shakes",
    name: "an app that never uses density bundles none of it (#209)",
    check(distDir) {
      // useDensity's storage key and class prefix as string literals, which only that module
      // has (components mention `--cui-density-scale` inside CSS strings, never as a bare
      // literal). No fixture page uses density, so a hit means the module was kept: a
      // sideEffects entry for it, or work at import time, is back.
      const js = readBuiltAssets(distDir, [".js"]);
      return /["'`]cui-density-?["'`]/.test(js)
        ? "found useDensity's storage key in the built JS — the module was kept though nothing uses it."
        : null;
    },
  },
  {
    id: "theme-tree-shakes",
    name: "an app that never uses the theme composable bundles none of it (#463)",
    check(distDir) {
      // useTheme's storage key as a string literal, which only that module has (the class
      // prefix `cui-theme-` is shared with the overlays' scoped-theme code, so it is not
      // looked for). A page that doesn't call useTheme must not carry it: a sideEffects
      // entry for it, or work at import time, is back. (The basic page uses it on purpose,
      // and skips this in scripts/fixture-scenarios.mjs.)
      const js = readBuiltAssets(distDir, [".js"]);
      return /["'`]cui-theme["'`]/.test(js)
        ? "found useTheme's storage key in the built JS — the module was kept though nothing uses it."
        : null;
    },
  },
  {
    id: "color-mode-tree-shakes",
    name: "an app that never uses the colour mode composable bundles none of it (#487)",
    check(distDir) {
      // useColorMode's storage key as a string literal, which only that module has. No
      // fixture page uses it, so a hit means the module was kept: a sideEffects entry for
      // it, or work at import time, is back.
      const js = readBuiltAssets(distDir, [".js"]);
      return /["'`]cui-color-mode["'`]/.test(js)
        ? "found useColorMode's storage key in the built JS — the module was kept though nothing uses it."
        : null;
    },
  },
  {
    id: "no-dev-warnings",
    name: "no development warning text in the production bundle (#369)",
    check(distDir) {
      const js = readBuiltAssets(distDir, [".js"]);
      const strings = devWarningStrings();
      // Non-vacuity: a scan that found next to nothing would pass on any bundle.
      if (strings.length < 20) return `only found ${strings.length} warning fragments in the source; the scan is broken.`;
      const present = strings.filter((text) => js.includes(text));
      if (present.length > 0) {
        return `found ${present.length} development warning fragment(s) in the production bundle, e.g. "${present[0]}".`;
      }
      return null;
    },
  },
  {
    id: "single-vue",
    scope: "install",
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

function fail(message) {
  console.error(`\n✗ check-fixture-guarantees: ${message}\n`);
  process.exit(1);
}

// A skip naming a guarantee that doesn't exist (renamed, or a typo) would silently
// stop skipping nothing — or, worse, outlive the guarantee it excused.
for (const [scenario, { skipGuarantees = {} }] of Object.entries(SCENARIOS)) {
  for (const id of Object.keys(skipGuarantees)) {
    if (!GUARANTEES.some((g) => g.id === id && g.scope !== "install")) {
      fail(`scenario "${scenario}" skips "${id}", which is not a build-output guarantee.`);
    }
  }
}

if (!existsSync(join(FIXTURE_NODE_MODULES, ".bin", "vite"))) {
  fail("fixtures/consumer-app is not installed — run scripts/verify-fixture.mjs first.");
}

// Every page is rebuilt, not read from whatever an earlier run left behind: only the
// basic page is built by verify-fixture.mjs, and a stale dist-* would check old output.
const builds = {};
for (const scenario of Object.keys(SCENARIOS)) {
  console.log(`[check-fixture-guarantees] building the ${scenario} page...`);
  try {
    builds[scenario] = buildScenario(scenario);
  } catch (err) {
    fail(`the ${scenario} page failed to build (${err.message}) — see any vite output above.`);
  }
}

function runCheck(check, ...args) {
  try {
    return check(...args);
  } catch (err) {
    return err.message;
  }
}

let checked = 0;
let failed = 0;
function report(label, failure) {
  checked++;
  if (failure) {
    failed++;
    console.error(`✗ ${label}\n  ${failure}`);
  } else {
    console.log(`✓ ${label}`);
  }
}

for (const { id, name, scope, check } of GUARANTEES) {
  if (scope === "install") {
    report(name, runCheck(check));
    continue;
  }
  for (const [scenario, { skipGuarantees = {} }] of Object.entries(SCENARIOS)) {
    const label = `${name} [${scenario}]`;
    const failure = runCheck(check, builds[scenario], scenario);
    if (!(id in skipGuarantees)) {
      report(label, failure);
    } else if (failure) {
      console.log(`- ${label}: skipped (${skipGuarantees[id]})`);
    } else {
      // A skip outliving its reason hides the next regression on that page; like the
      // repo's other exemption lists, a stale one fails.
      report(label, `skipped (${skipGuarantees[id]}), but it holds now — remove the skip from scripts/fixture-scenarios.mjs.`);
    }
  }
}

if (failed > 0) {
  console.error(`\n${failed}/${checked} guarantee check(s) broken.\n`);
  process.exit(1);
}

console.log(`\nAll ${checked} guarantee check(s) held.`);
