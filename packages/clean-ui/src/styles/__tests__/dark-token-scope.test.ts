import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC = resolve(__dirname, "../..");

/**
 * #121 — design tokens must be declared on the element carrying `dark`, never
 * on every element below it.
 *
 * `:where(.dark, .dark *) .cui-x { color: … }` is fine and used ~30 times: a
 * descendant *rule* setting ordinary properties. What is not fine is a
 * `.dark *` selector that *declares* a `--cui-*` / `--color-*` token, because
 * custom properties inherit — re-declaring one on every descendant overrides
 * whatever an ancestor set, on each element individually, so a subtree can no
 * longer be re-themed. The blanket form is muscle memory in this codebase, so
 * the rule needs a build failure behind it rather than a line in CLAUDE.md.
 */
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === "__tests__") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(css|vue)$/.test(entry)) out.push(full);
  }
  return out;
}

/**
 * Every `selector { … }` rule, ignoring comments. Statement at-rules
 * (`@import …;`, `@custom-variant …;`) sit in the same gap between blocks as
 * the next selector does, so anything up to the last `;` is dropped — that is
 * also what keeps `@custom-variant dark (&:where(.dark, .dark *))` out of the
 * scan, which is the one place the blanket form genuinely belongs.
 */
function rules(css: string): Array<{ selector: string; body: string }> {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: m[1].split(";").pop()!.trim(),
    body: m[2],
  }));
}

describe("dark-mode token declarations stay on the scoping root (#121)", () => {
  const offenders: string[] = [];

  for (const file of sourceFiles(SRC)) {
    for (const { selector, body } of rules(readFileSync(file, "utf-8"))) {
      // `.dark *` — the blanket form, matching every descendant.
      if (!/\.dark\s*\*/.test(selector)) continue;
      const declared = [...body.matchAll(/(--(?:cui|color)-[\w-]+)\s*:/g)].map((m) => m[1]);
      if (declared.length > 0) {
        offenders.push(
          `${file.replace(`${SRC}/`, "")}: ${selector.replace(/\s+/g, " ")} declares ${declared.join(", ")}`,
        );
      }
    }
  }

  it("declares no --cui-* / --color-* token under a `.dark *` selector", () => {
    expect(offenders).toEqual([]);
  });
});
