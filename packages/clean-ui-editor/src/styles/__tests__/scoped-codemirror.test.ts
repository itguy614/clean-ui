import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * #227: `editor.css` ships in every consumer's bundle, so a rule that reaches a bare
 * CodeMirror class (`.cm-tooltip`, `.cm-completionIcon`…) restyles every OTHER CodeMirror on
 * the page too, and its `!important`s can't be undone. A tooltip renders outside the
 * editor's subtree, so its rules belong in the per-instance theme extension
 * (`theme/editor-theme.ts`), not here. Every selector in this sheet that names a CodeMirror
 * class must be reached through one of the editor's own `cui-*` classes.
 */
const css = readFileSync(resolve(__dirname, "../editor.css"), "utf-8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Every selector of every style rule, with the at-rule preludes (`@media …`) left out. */
const selectors = [...css.matchAll(/([^{};]+)\{/g)]
  .map((m) => m[1].trim())
  .filter((prelude) => !prelude.startsWith("@"))
  .flatMap((list) => list.split(",").map((s) => s.trim()));

describe("editor.css leaves other CodeMirror instances alone (#227)", () => {
  it("scopes every `.cm-*` selector under a `.cui-*` class", () => {
    const unscoped = selectors.filter((sel) => {
      const cm = sel.search(/\.cm-/);
      return cm !== -1 && !/\.cui-[\w-]+/.test(sel.slice(0, cm));
    });
    expect(unscoped).toEqual([]);
  });

  it("targets no tooltip or completion class at all", () => {
    expect(selectors.filter((sel) => /\.cm-(tooltip|completion)/.test(sel))).toEqual([]);
  });
});
