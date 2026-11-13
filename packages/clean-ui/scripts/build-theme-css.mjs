#!/usr/bin/env node
/**
 * Post-`vite build` (#220): lays out the theme stylesheets, from the one source of each palette
 * (`src/styles/themes/<name>.css`).
 *
 *   dist/themes/<name>.css   copied as written: an opt-in theme, no processing needed (plain
 *                            selectors, no `@theme`, no Tailwind)
 *   dist/styles/all.css      `dist/clean-ui.css` followed by every theme, in the list's `cascade` order:
 *                            what `clean-ui.css` was before the themes left it. For a setup
 *                            with no bundler or no per-theme control: one import to switch back.
 *
 * Run from `packages/clean-ui`. The order is the old file's (`cascade` in themes.json), kept so that two nested themes
 * resolve a specificity tie exactly as they did.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { cascadeOrder, loadThemes, sourceProblems, themeFilesOnDisk } from "./themes-list.mjs";

const root = process.cwd();
const src = resolve(root, "src/styles/themes");
const dist = resolve(root, "dist");

// The one list (themes.json) says which files exist; fail early if the directory disagrees.
const themes = loadThemes(root);
const THEME_FILES = cascadeOrder(themes).map((t) => t.id);
const stray = sourceProblems({ themes, files: themeFilesOnDisk(root), exports: {} }).filter((p) => !p.includes('"exports"'));
if (stray.length) throw new Error(`build-theme-css: ${stray.join("; ")}`);
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
