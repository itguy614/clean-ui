#!/usr/bin/env node
/**
 * Build check (#220): the stylesheets the package ships split the way its `exports` say.
 * Run from `packages/clean-ui` after `vite build` (`check:imports` does, in CI).
 *
 *   dist/clean-ui.css        the default (Navy) theme only: no other theme's class selector
 *   dist/themes/<name>.css   exactly its own theme's selectors, and its `--cui-theme-<name>` marker
 *   dist/styles/all.css      `clean-ui.css` plus every theme file: what 1.x's `clean-ui.css` was
 *   package.json "exports"   an explicit entry for each, pointing at a file that exists
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadThemes, optIn, sourceProblems, themeFilesOnDisk } from "./themes-list.mjs";

const root = process.cwd();
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const problems = [];
const read = (path) => {
  const file = resolve(root, path);
  if (!existsSync(file)) {
    problems.push(`${path} is missing`);
    return "";
  }
  return readFileSync(file, "utf8");
};

// The sources against the one list (themes.json): files, exports, ids. A mismatch names the fix.
const themeList = loadThemes(root);
problems.push(...sourceProblems({ themes: themeList, files: themeFilesOnDisk(root), exports: pkg.exports ?? {} }));
const THEMES = optIn(themeList).map((t) => t.id);

/** The `cui-theme-<id>` ids a stylesheet's selectors name. */
const themeIds = (css) => new Set([...css.matchAll(/\.cui-theme-([a-z][a-z0-9-]*)/g)].map((m) => m[1]));
const NAVY = new Set(themeList.filter((t) => t.default).flatMap((t) => [t.id, ...(t.aliases ?? [])]));

const base = read("dist/clean-ui.css");
const stray = [...themeIds(base)].filter((id) => !NAVY.has(id));
if (stray.length) problems.push(`dist/clean-ui.css names non-default theme class(es): ${stray.join(", ")}`);
// The default stays in: Navy as a class, for a scoped subtree's way back (#330).
if (![...NAVY].every((id) => themeIds(base).has(id))) problems.push("dist/clean-ui.css lost the default (Navy) theme class");

for (const name of THEMES) {
  const css = read(`dist/themes/${name}.css`);
  const ids = [...themeIds(css)];
  if (ids.length !== 1 || ids[0] !== name) problems.push(`dist/themes/${name}.css names [${ids}], expected only [${name}]`);
  if (!css.includes(`--cui-theme-${name}: 1`)) problems.push(`dist/themes/${name}.css lacks its --cui-theme-${name} marker`);
}

const all = read("dist/styles/all.css");
const missing = THEMES.filter((name) => !themeIds(all).has(name));
if (missing.length) problems.push(`dist/styles/all.css is missing theme(s): ${missing.join(", ")}`);
if (!all.startsWith(base.replace(/\n*$/, "\n"))) problems.push("dist/styles/all.css does not begin with dist/clean-ui.css");
if (pkg.exports?.["./styles/all.css"] !== "./dist/styles/all.css") problems.push('package.json exports["./styles/all.css"] is wrong');
if (pkg.exports?.["./styles"] !== "./dist/clean-ui.css") problems.push('package.json exports["./styles"] is wrong');

if (problems.length) {
  console.error(`check-theme-css: ${problems.length} problem(s):\n  - ${problems.join("\n  - ")}`);
  process.exit(1);
}
console.log(`check-theme-css: clean-ui.css is Navy only; ${THEMES.length} theme files and the all-in-one are as exported.`);
