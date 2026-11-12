import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { THEME_PRESETS } from "../../composables/useTheme";
import { stripComments } from "./css-helpers";

/**
 * #220 — the seven non-default palettes are opt-in files, one source each, and
 * `dist/clean-ui.css` carries Navy only. The built output is checked by
 * `scripts/check-theme-css.mjs` (`check:imports`); this is the source half, which needs no build.
 */
const styles = resolve(__dirname, "..");
const pkgRoot = resolve(styles, "../..");
const pkg = JSON.parse(readFileSync(resolve(pkgRoot, "package.json"), "utf8"));
const read = (...p: string[]) => stripComments(readFileSync(resolve(styles, ...p), "utf8"));

const files = readdirSync(resolve(styles, "themes")).filter((f) => f.endsWith(".css")).map((f) => f.slice(0, -4)).sort();
const nonDefault = THEME_PRESETS.map((p) => p.id).filter((id) => id !== "default").sort();
const themeIds = (css: string) => [...new Set([...css.matchAll(/\.cui-theme-([a-z][a-z0-9-]*)/g)].map((m) => m[1]))];

describe("theme files (#220)", () => {
  it("there is one file per non-default preset, and no other", () => {
    expect(files).toEqual(nonDefault);
  });

  it("main.css and the Navy stylesheet name no other theme's class", () => {
    for (const css of [read("main.css"), read("themes.css")]) {
      expect(themeIds(css).filter((id) => id !== "default" && id !== "navy")).toEqual([]);
    }
    expect(themeIds(read("themes.css")).sort()).toEqual(["default", "navy"]);
  });

  it.each(files)("%s.css holds its own theme alone, with its marker and all three dark forms", (name) => {
    const css = read("themes", `${name}.css`);
    expect(themeIds(css)).toEqual([name]);
    expect(css).toContain(`--cui-theme-${name}: 1;`);
    // The same-element form is `.dark.dark`: one class heavier than an outer theme's `.cui-theme-y .dark`.
    for (const selector of [`.dark .cui-theme-${name}`, `.cui-theme-${name}.dark.dark`, `.cui-theme-${name} .dark`]) {
      expect(css, selector).toContain(selector);
    }
    // Each file carries both a light and a dark scale, and nothing that needs Tailwind or a layer.
    expect(css.match(/--color-primary-500:/g)).toHaveLength(1);
    expect(css.match(/--color-surface-950:/g)).toHaveLength(2);
    expect(css).not.toMatch(/@(theme|layer|import|apply|custom-variant)\b/);
  });

  it.each(files)("package.json exports ./themes/%s.css", (name) => {
    expect(pkg.exports[`./themes/${name}.css`]).toBe(`./dist/themes/${name}.css`);
  });

  it("exports the default and all-in-one stylesheets, and lists the theme files as side effects", () => {
    expect(pkg.exports["./styles"]).toBe("./dist/clean-ui.css");
    expect(pkg.exports["./styles/all.css"]).toBe("./dist/styles/all.css");
    expect(pkg.sideEffects).toContain("**/*.css");
  });

  it("the build script lays out the same set of files", () => {
    const script = readFileSync(resolve(pkgRoot, "scripts/build-theme-css.mjs"), "utf8");
    const listed = /THEME_FILES = \[([^\]]*)\]/.exec(script)![1].match(/"([a-z]+)"/g)!.map((s) => s.slice(1, -1));
    expect([...listed].sort()).toEqual(files);
  });
});
