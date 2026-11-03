import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * #227: the editor's stylesheets ship in every consumer's bundle, so a rule that reaches a
 * bare CodeMirror class (`.cm-tooltip`, `.cm-completionIcon`…) restyles every OTHER
 * CodeMirror on the page too, and its `!important`s can't be undone. The slash menu's
 * rules belong in the per-instance theme extension (`theme/editor-theme.ts`), not in a
 * stylesheet. Every selector in a stylesheet that names a CodeMirror class must be reached
 * through one of the editor's own `cui-*` classes.
 */
const SRC = resolve(__dirname, "../..");

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" || e.name === "node_modules" ? [] : cssFiles(path);
    return e.name.endsWith(".css") ? [path] : [];
  });
}

/** Every selector of every style rule in the editor's stylesheets, at-rule preludes left out. */
const selectors = cssFiles(SRC)
  .map((f) => readFileSync(f, "utf-8").replace(/\/\*[\s\S]*?\*\//g, ""))
  .flatMap((css) => [...css.matchAll(/([^{};]+)\{/g)])
  .map((m) => m[1].trim())
  .filter((prelude) => !prelude.startsWith("@"))
  .flatMap((list) => list.split(",").map((s) => s.trim()));

describe("the editor's stylesheets leave other CodeMirror instances alone (#227)", () => {
  it("finds the sheet it is guarding", () => {
    expect(selectors.length).toBeGreaterThan(10);
  });

  it("scopes every `.cm-*` selector under a `.cui-*` class", () => {
    const unscoped = selectors.filter((sel) => {
      const cm = sel.search(/\.cm-/);
      // A `.cui-*` inside `:not(…)` excludes, it doesn't scope.
      const before = sel.slice(0, cm).replace(/:not\([^)]*\)/g, "");
      return cm !== -1 && !/\.cui-[\w-]+/.test(before);
    });
    expect(unscoped).toEqual([]);
  });

  it("targets no tooltip or completion class at all", () => {
    expect(selectors.filter((sel) => /\.cm-(tooltip|completion)/.test(sel))).toEqual([]);
  });
});
