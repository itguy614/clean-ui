import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { readTag, splitSelectorList, walk } from "./css-helpers";

/**
 * #147 — `.cui-typography` is opt-in, but consumers put it *around* components (the docs
 * site's `<main>`, a `CuiCardBody`), so prose rules reach inside them. Prose rules are
 * (0,1,1) and a component's themeable rules zero-specificity, so a prose rule that reaches a
 * component's element repaints it: a breadcrumb's list took prose markers, a table's cells
 * ignored its `size`. Two halves keep that from coming back:
 *
 *  - every prose element rule lives in main.css's two prose blocks, under their exclusions, and
 *  - every element a component renders that a block styles carries a component's `cui-*`
 *    class — not just a typography helper's, which the second block lets through.
 */
const PACKAGES = resolve(__dirname, "../../../..");
const EXCLUSION = /^\.cui-typography :where\(\s*:not\(\[class\^="cui-"\]\):not\(\[class\*=" cui-"\]\)/;
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const sources = (ext: string) =>
  ["clean-ui", "clean-ui-editor"].flatMap((pkg) => walk(resolve(PACKAGES, pkg, "src"))).filter((f) => f.endsWith(ext));

/** Top-level selectors in some CSS that reach an element inside a typography scope (the font-family `*` aside). */
function proseSelectors(css: string): string[] {
  return [...stripComments(css).matchAll(/(?:^|[}\n])\s*([^{}@]+)\{/g)]
    .flatMap((m) => splitSelectorList(m[1]))
    // A nested rule (`&…`) is inside a block already.
    .filter((s) => !s.includes("&") && /\.cui-typography\)?(\s*[>+~]\s*|\s+)(?!\*)\S/.test(s));
}

const main = stripComments(readFileSync(resolve(__dirname, "../main.css"), "utf-8"));
const blocks = proseSelectors(main);

/** A block's body, from the brace after its selector to the matching close. */
function body(selector: string): string {
  const open = main.indexOf("{", main.indexOf(selector));
  let depth = 0;
  for (let i = open; i < main.length; i++) {
    if (main[i] === "{") depth++;
    else if (main[i] === "}" && --depth === 0) return main.slice(open + 1, i);
  }
  return "";
}

/** The tags the blocks style, from their `&:is(…)` rules — `pre code` contributes `code`. */
const proseTags = [
  ...new Set(
    blocks.flatMap((b) => [...body(b).matchAll(/&:is\(([^)]*)\)/g)].flatMap((m) => m[1].split(",").map((t) => t.trim().split(/\s+/).pop()!))),
  ),
];
/** The typography helpers the second block lets through: classes that don't mark a component. */
const HELPERS = new Set(blocks.flatMap((b) => [...b.matchAll(/\.(cui-[a-z0-9-]+)/g)].map((m) => m[1])));

/** `<component :is>` that never renders a prose element, by file and binding — with why. */
const DYNAMIC_EXEMPT: Record<string, string> = {
  "clean-ui/src/components/CuiIcon.vue:iconComponent": "an icon component, which renders an <svg>",
  "clean-ui/src/components/CuiTabs.vue:tab.labelSlot": "a tab's label slot content, the consumer's own",
};

describe("the typography layer leaves components alone (#147)", () => {
  it("writes every prose element rule in main.css's two blocks, each under the exclusion", () => {
    expect(blocks).toHaveLength(2);
    for (const b of blocks) expect(b).toMatch(EXCLUSION);
  });

  it("has no prose element rule in any other stylesheet", () => {
    const elsewhere = [...sources(".css"), ...sources(".vue")]
      .filter((f) => !f.endsWith("styles/main.css"))
      .flatMap((f) => {
        const text = readFileSync(f, "utf-8");
        const css = f.endsWith(".vue") ? [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n") : text;
        return proseSelectors(css).map((s) => `${relative(PACKAGES, f)}: ${s}`);
      });
    expect(elsewhere).toEqual([]);
  });

  it("finds the elements the blocks style, and the helpers they let through", () => {
    // A parser that silently matched nothing would pass the template check below.
    expect(proseTags).toEqual(expect.arrayContaining(["h1", "a", "p", "code", "pre", "ul", "li", "td", "th", "table"]));
    expect(HELPERS).toContain("cui-lead");
    expect(HELPERS).not.toContain("cui-kbd"); // CuiKbd's own root
  });

  it("gives every element a component renders that the blocks style a component's cui-* class", () => {
    // `<component :is>` too: CuiTableCell's td/th, the titled headings, CuiButton's link.
    const open = new RegExp(`<(${[...proseTags, "component"].join("|")})(?=[\\s/>])`, "g");
    const unclassed: string[] = [];
    for (const file of sources(".vue")) {
      const source = readFileSync(file, "utf-8");
      const start = source.search(/^<template>/m);
      if (start === -1) continue;
      const template = source.slice(start, source.lastIndexOf("</template>")).replace(/<!--[\s\S]*?-->/g, "");
      const where = relative(PACKAGES, file);
      for (const m of template.matchAll(open)) {
        const tag = readTag(template, m.index!);
        const binding = m[1] === "component" ? /:is="([^"]+)"/.exec(tag)?.[1] : undefined;
        if (binding && `${where}:${binding}` in DYNAMIC_EXEMPT) continue;
        // A static class only — one a binding adds may be conditional — naming a component.
        const classes = /\sclass="([^"]*)"/.exec(tag)?.[1].split(/\s+/) ?? [];
        if (!classes.some((c) => c.startsWith("cui-") && !HELPERS.has(c))) unclassed.push(`${where}: ${tag.slice(0, 70)}`);
      }
    }
    expect(unclassed).toEqual([]);
  });
});
