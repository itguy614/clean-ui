import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readTag, splitSelectorList, walk } from "./css-helpers";

/**
 * #147 — `.cui-typography` is opt-in, but consumers put it *around* components (the docs
 * site's `<main>`, a `CuiCardBody`), so prose rules reach inside them. Prose rules are
 * (0,1,1) and a component's themeable rules zero-specificity, so a prose rule that reaches a
 * component's element repaints it: a breadcrumb's list took prose markers, a table's cells
 * ignored its `size`. Two halves keep that from coming back:
 *
 *  - every prose element rule lives in main.css's one prose block, under its exclusion, and
 *  - every element a component renders that the block styles carries a `cui-*` class,
 *    since the exclusion keys on *carrying* the class (CLAUDE.md § Critical Gotchas).
 */
const main = readFileSync(resolve(__dirname, "../main.css"), "utf-8").replace(/\/\*[\s\S]*?\*\//g, "");
const PACKAGES = resolve(__dirname, "../../../..");

/** `<component :is>` that never renders a prose element, by file and binding — with why. */
const DYNAMIC_EXEMPT: Record<string, string> = {
  "CuiIcon.vue:iconComponent": "an icon component, which renders an <svg>",
  "CuiTabs.vue:tab.labelSlot": "a tab's label slot content, the consumer's own",
};

/** Top-level selectors that reach an element inside a `.cui-typography` scope (the font-family `*` aside). */
const proseSelectors = [...main.matchAll(/(?:^|[}\n])\s*([^{}@]+)\{/g)]
  .flatMap((m) => splitSelectorList(m[1]))
  // A nested rule (`&…`) is inside the block already; its `:where(.cui-typography pre *)` is a condition.
  .filter((s) => !s.includes("&") && /\.cui-typography(\s*>\s*|\s+)(?!\*)\S/.test(s));

/** The prose block's body, from its opening brace to its matching close. */
function proseBlock(): string {
  const start = main.indexOf(proseSelectors[0]);
  const open = main.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < main.length; i++) {
    if (main[i] === "{") depth++;
    else if (main[i] === "}" && --depth === 0) return main.slice(open + 1, i);
  }
  return "";
}

/** The tags the block styles, from its `&:is(…)` rules. */
const proseTags = [...new Set([...proseBlock().matchAll(/&:is\(([^)]*)\)/g)].flatMap((m) => m[1].split(",").map((t) => t.trim())))];

describe("the typography layer leaves components alone (#147)", () => {
  it("writes every prose element rule in one block, under the exclusion", () => {
    expect(proseSelectors).toHaveLength(1);
    expect(proseSelectors[0]).toMatch(/^\.cui-typography :where\(\s*:not\(\[class\^="cui-"\]\):not\(\[class\*=" cui-"\]\)/);
  });

  it("finds the elements the block styles", () => {
    // A parser that silently matched nothing would pass the template check below.
    expect(proseTags).toEqual(expect.arrayContaining(["h1", "p", "a", "code", "pre", "ul", "li", "td", "th", "table"]));
  });

  it("gives every element a component renders that the block styles a cui-* class", () => {
    const files = ["clean-ui", "clean-ui-editor"]
      .flatMap((pkg) => walk(resolve(PACKAGES, pkg, "src")))
      .filter((f) => f.endsWith(".vue"));
    // `<component :is>` too: CuiTableCell's td/th, the titled headings, CuiButton's link.
    const open = new RegExp(`<(${[...proseTags, "component"].join("|")})(?=[\\s/>])`, "g");
    const unclassed: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf-8");
      const start = source.search(/^<template>/m);
      if (start === -1) continue;
      const template = source.slice(start, source.lastIndexOf("</template>")).replace(/<!--[\s\S]*?-->/g, "");
      for (const m of template.matchAll(open)) {
        const tag = readTag(template, m.index!);
        const binding = m[1] === "component" ? /:is="([^"]+)"/.exec(tag)?.[1] : undefined;
        if (binding && `${file.split("/").pop()}:${binding}` in DYNAMIC_EXEMPT) continue;
        // A static class, with a `cui-` token at a class boundary — the predicate's own terms.
        // One only a binding adds can be conditional, so it doesn't count.
        if (!/\sclass="(?:[^"]*\s)?cui-/.test(tag)) unclassed.push(`${file.split("/src/")[1]}: ${tag.slice(0, 70)}`);
      }
    }
    expect(unclassed).toEqual([]);
  });
});
