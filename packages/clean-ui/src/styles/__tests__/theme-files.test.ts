import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { THEME_PRESETS } from "../../composables/useTheme";
import { stripComments } from "./css-helpers";
import {
  cascadeOrder,
  loadThemes,
  optIn,
  sourceProblems,
  syncExports,
  themeFilesOnDisk,
  SYNC_COMMAND,
} from "../../../scripts/themes-list.mjs";

/**
 * #220 — the seven non-default palettes are opt-in files, and `dist/clean-ui.css` carries Navy
 * only. The one list is `styles/themes/themes.json`; every other place derives from it. The
 * built output is checked by `scripts/check-theme-css.mjs` (`check:imports`); this is the source
 * half, which needs no build.
 */
const styles = resolve(__dirname, "..");
const pkgRoot = resolve(styles, "../..");
const pkg = JSON.parse(readFileSync(resolve(pkgRoot, "package.json"), "utf8"));
const read = (...p: string[]) => stripComments(readFileSync(resolve(styles, ...p), "utf8"));

const themes = loadThemes(pkgRoot);
const files = themeFilesOnDisk(pkgRoot);
const ids = optIn(themes).map((t) => t.id);
const themeIds = (css: string) => [...new Set([...css.matchAll(/\.cui-theme-([a-z][a-z0-9-]*)/g)].map((m) => m[1]))];

describe("the one theme list (#220)", () => {
  it("useTheme's presets are the list, in order, with the public shape unchanged", () => {
    expect(THEME_PRESETS).toEqual(themes.map(({ id, label, description }) => ({ id, label, description })));
    expect(THEME_PRESETS.map((p) => p.id)).toEqual(["mono", "default", "forest", "amber", "azure", "teal", "violet", "ruby"]);
    for (const p of THEME_PRESETS) expect(Object.keys(p).sort()).toEqual(["description", "id", "label"]);
  });

  it("the sources agree with it as committed", () => {
    expect(sourceProblems({ themes, files, exports: pkg.exports })).toEqual([]);
  });

  it("the all-in-one keeps the old order, mono last", () => {
    expect(cascadeOrder(themes).map((t) => t.id)).toEqual(["forest", "amber", "azure", "teal", "violet", "ruby", "mono"]);
  });

  it("a theme added to the list without its file is a problem, naming the file", () => {
    const fake = [...themes, { id: "fake", label: "Fake", description: "x", cascade: 99 }];
    const problems = sourceProblems({ themes: fake, files, exports: pkg.exports });
    expect(problems.some((p) => p.includes("src/styles/themes/fake.css does not exist"))).toBe(true);
  });

  it("a theme file the list does not name is a problem", () => {
    expect(sourceProblems({ themes, files: [...files, "orphan"], exports: pkg.exports }).join()).toContain("does not list \"orphan\"");
  });

  it("exports out of step with the list fail with the exact fix command", () => {
    const fake = [...themes, { id: "fake", label: "Fake", description: "x", cascade: 99 }];
    const problems = sourceProblems({ themes: fake, files: [...files, "fake"], exports: pkg.exports });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(SYNC_COMMAND);
    // And a removed entry, and a wrong target, are caught the same way.
    const fewer = { ...pkg.exports };
    delete fewer["./themes/ruby.css"];
    expect(sourceProblems({ themes, files, exports: fewer })[0]).toContain(SYNC_COMMAND);
    expect(sourceProblems({ themes, files, exports: { ...pkg.exports, "./themes/ruby.css": "./dist/nope.css" } })[0]).toContain(SYNC_COMMAND);
  });

  it("syncing the exports is idempotent, and repairs a drifted map", () => {
    const once = syncExports(pkg.exports, themes);
    expect(once).toEqual(pkg.exports);
    expect(Object.keys(once)).toEqual(Object.keys(pkg.exports)); // order too: no churn in the diff
    expect(Object.keys(syncExports(once, themes))).toEqual(Object.keys(once));
    const fake = [...themes, { id: "fake", label: "Fake", description: "x", cascade: 99 }];
    const grown = syncExports(pkg.exports, fake);
    expect(grown["./themes/fake.css"]).toBe("./dist/themes/fake.css");
    expect(sourceProblems({ themes: fake, files: [...files, "fake"], exports: grown })).toEqual([]);
    expect(syncExports(grown, themes)).toEqual(pkg.exports); // and shrinks back
  });

  it("a duplicate id, a second default or a repeated cascade is a problem", () => {
    const dup = [...themes, { ...themes[2] }];
    expect(sourceProblems({ themes: dup, files, exports: pkg.exports }).length).toBeGreaterThan(0);
    const twoDefaults = themes.map((t) => (t.id === "mono" ? { ...t, default: true } : t));
    expect(sourceProblems({ themes: twoDefaults, files, exports: pkg.exports }).join()).toContain("exactly one");
    const sameCascade = themes.map((t) => (t.id === "mono" ? { ...t, cascade: 1 } : t));
    expect(sourceProblems({ themes: sameCascade, files, exports: pkg.exports }).join()).toContain("cascade");
  });
});

describe("theme files (#220)", () => {
  it("main.css and the Navy stylesheet name no other theme's class", () => {
    const navy = themes.filter((t) => t.default).flatMap((t) => [t.id, ...(t.aliases ?? [])]);
    for (const css of [read("main.css"), read("themes.css")]) {
      expect(themeIds(css).filter((id) => !navy.includes(id))).toEqual([]);
    }
    expect(themeIds(read("themes.css")).sort()).toEqual([...navy].sort());
  });

  it.each(ids)("%s.css holds its own theme alone, with its marker and all three dark forms", (name) => {
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

  it("lists the all-in-one and default stylesheets, and the theme files as side effects", () => {
    expect(pkg.exports["./styles"]).toBe("./dist/clean-ui.css");
    expect(pkg.exports["./styles/all.css"]).toBe("./dist/styles/all.css");
    expect(pkg.sideEffects).toContain("**/*.css");
    expect(pkg.scripts["sync:themes"]).toContain("sync-theme-exports.mjs");
  });
});
