/**
 * Loads the built `dist` the way a no-bundler, native-ESM consumer would — with no `process`
 * global, where a bare `process.env.NODE_ENV` read throws a ReferenceError at import (#369) —
 * and asserts it neither throws nor warns. Dev warnings are simply off there, as with Vue's
 * browser builds. Run after `vite build` (it is part of `check:imports`).
 *
 * `process` is deleted from `globalThis` before the first import, so each module's top-level
 * `typeof process` check sees what it would in a browser.
 */
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
// The modules this package itself guards (#369). Not the barrel: it imports `vue`, whose Node
// CJS entry reads `process` itself, so a page with no `process` needs vue's browser build there.
const ENTRIES = ["utils/devWarn.js", "duplicate-guard.js"];

for (const entry of ENTRIES) {
  if (!existsSync(resolve(dist, entry))) {
    console.error(`✗ check-native-esm: dist/${entry} is missing — run the build first.`);
    process.exit(1);
  }
}

const realProcess = globalThis.process;
const warnings = [];
const realWarn = console.warn;
console.warn = (...args) => warnings.push(args.join(" "));

let failure = null;
try {
  delete globalThis.process;
  if (typeof globalThis.process !== "undefined") throw new Error("could not remove the `process` global for this check.");
  for (const entry of ENTRIES) {
    await import(pathToFileURL(resolve(dist, entry)).href);
  }
  // Drive duplicate-guard's warning path explicitly: a different version is already stamped.
  globalThis.__CUI_INSTANCE__ = "0.0.0-other";
  const { registerInstance } = await import(pathToFileURL(resolve(dist, "duplicate-guard.js")).href);
  registerInstance("9.9.9");
  const { warnOnce } = await import(pathToFileURL(resolve(dist, "utils/devWarn.js")).href);
  warnOnce("should be silent without process");
} catch (error) {
  failure = error;
} finally {
  globalThis.process = realProcess;
  console.warn = realWarn;
}

if (failure) {
  console.error(`✗ check-native-esm: importing dist with no \`process\` threw: ${failure?.stack ?? failure}`);
  process.exit(1);
}
if (warnings.length > 0) {
  console.error(`✗ check-native-esm: warned with no \`process\` (it should be silent): ${warnings[0]}`);
  process.exit(1);
}
console.log(`✓ check-native-esm: ${ENTRIES.join(", ")} load with no \`process\`, and stay silent.`);
