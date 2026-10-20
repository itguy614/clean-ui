import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readTag, splitSelectorList, walk } from "./css-helpers";

/**
 * #147 — `.cui-typography` is opt-in, but consumers put it *around* components (the docs
 * site's `<main>`, a `CuiCardBody`), so prose rules reach inside them. Prose rules are
 * (0,1,1) and a component's themeable rules zero-specificity, so an unexcluded prose rule
 * repaints the component: a breadcrumb's list took prose markers, a table's cells ignored
 * its `size`. Two halves keep that from coming back:
 *
 *  - every prose element selector carries the `cui-*` exclusion on its subject, and
 *  - every element a component renders that a prose rule targets carries a `cui-*` class,
 *    since the exclusion keys on *carrying* the class (CLAUDE.md § Critical Gotchas).
 */
const EXCLUSION = ':where(:not([class^="cui-"]):not([class*=" cui-"]))';
const PROSE_TAGS = ["p", "small", "a", "blockquote", "footer", "code", "kbd", "pre", "ul", "ol", "li", "hr", "table", "th", "td", "mark", "h1", "h2", "h3", "h4", "h5", "h6"];
const PACKAGES = resolve(__dirname, "../../../..");

const main = readFileSync(resolve(__dirname, "../main.css"), "utf-8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Every selector in main.css that reaches an element inside a `.cui-typography` scope. */
function proseSelectors(): string[] {
  return [...main.matchAll(/([^{}]+)\{/g)]
    .flatMap((m) => splitSelectorList(m[1]))
    .filter((s) => /\.cui-typography(\s*>\s*|\s+)(?!\*)[a-z:]/.test(s));
}

/** The selector's last compound — the element it styles — with combinators outside parentheses as the split points. */
function subject(selector: string): string {
  let depth = 0;
  let last = 0;
  for (let i = 0; i < selector.length; i++) {
    const c = selector[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (depth === 0 && /[\s>+~]/.test(c)) last = i + 1;
  }
  return selector.slice(last);
}

describe("the typography layer leaves components alone (#147)", () => {
  it("finds the prose rules it is guarding", () => {
    // A parser that silently matched nothing would pass every assertion below.
    expect(proseSelectors().length).toBeGreaterThan(25);
  });

  it("excludes cui-* elements on the subject of every prose selector", () => {
    // The nested heading block writes the exclusion once, on its `:is(h1…h6)` parent.
    const missing = proseSelectors().filter((s) => !subject(s).includes(EXCLUSION));
    expect(missing).toEqual([]);
  });

  it("gives every prose-targeted element a component renders a cui-* class", () => {
    const files = ["clean-ui", "clean-ui-editor"]
      .flatMap((pkg) => walk(resolve(PACKAGES, pkg, "src")))
      .filter((f) => f.endsWith(".vue"));
    const open = new RegExp(`<(${PROSE_TAGS.join("|")})(?=[\\s/>])`, "g");
    const unclassed: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf-8");
      const template = source.slice(source.indexOf("<template"), source.lastIndexOf("</template>"));
      for (const m of template.matchAll(open)) {
        const tag = readTag(template, m.index!);
        // A static `cui-*` class, or one a binding names — `:class="['cui-x', …]"`.
        if (!/(^|\s):?class="[^"]*\bcui-/.test(tag)) unclassed.push(`${file.split("/src/")[1]}: ${tag.slice(0, 60)}`);
      }
    }
    expect(unclassed).toEqual([]);
  });
});
