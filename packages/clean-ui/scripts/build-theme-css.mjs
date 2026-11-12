#!/usr/bin/env node
/**
 * Post-`vite build` (#220): lays out the theme stylesheets, from the one source of each palette
 * (`src/styles/themes/<name>.css`).
 *
 *   dist/themes/<name>.css   copied as written: an opt-in theme, no processing needed (plain
 *                            selectors, no `@theme`, no Tailwind)
 *   dist/styles/all.css      `dist/clean-ui.css` followed by every theme, in the order below:
 *                            what `clean-ui.css` was before the themes left it. For a setup
 *                            with no bundler or no per-theme control: one import to switch back.
 *
 * Run from `packages/clean-ui`. The order is the old file's, kept so that two nested themes
 * resolve a specificity tie exactly as they did.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const THEME_FILES = ["forest", "amber", "azure", "teal", "violet", "ruby", "mono"];

const src = resolve(root, "src/styles/themes");
const dist = resolve(root, "dist");

const onDisk = readdirSync(src).filter((f) => f.endsWith(".css")).map((f) => f.slice(0, -4)).sort();
if (onDisk.join() !== [...THEME_FILES].sort().join()) {
  throw new Error(
    `build-theme-css: src/styles/themes has [${onDisk}] but THEME_FILES lists [${THEME_FILES}]; ` +
      `update the list here, the package.json "exports" and THEME_PRESETS together.`,
  );
}
const base = resolve(dist, "clean-ui.css");
if (!existsSync(base)) throw new Error("build-theme-css: dist/clean-ui.css is missing; run vite build first.");

mkdirSync(resolve(dist, "themes"), { recursive: true });
mkdirSync(resolve(dist, "styles"), { recursive: true });
for (const name of THEME_FILES) copyFileSync(resolve(src, `${name}.css`), resolve(dist, "themes", `${name}.css`));

const all = [readFileSync(base, "utf8").replace(/\n*$/, "\n")];
// Without each file's header comment (the usage note for someone importing it on its own).
for (const name of THEME_FILES) {
  all.push(readFileSync(resolve(src, `${name}.css`), "utf8").replace(/^\/\*[\s\S]*?\*\/\s*/, "").replace(/\n*$/, "\n"));
}
writeFileSync(resolve(dist, "styles/all.css"), all.join("\n"));
