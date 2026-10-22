import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * #296 — a public composable or utility ships with its docs. Most had no page, or appeared
 * only in a component page's code sample, so nobody could find them. This fails when a public
 * helper isn't named in the docs site's pages or component metadata — outside an import line
 * or a comment — unless it is exempt below, with why. A stale exemption fails too.
 *
 * "Helper": every value exported from index.ts except components (`Cui*`), context keys
 * (`*Key`) and the few listed in NOT_HELPERS. Opt-out, so a new export is guarded by default.
 */
const NOT_HELPERS = ["createCleanUI", "version", "default"];

const EXEMPT: Record<string, string> = {};

const ROOT = resolve(__dirname, "../../../..");
const index = readFileSync(resolve(__dirname, "../index.ts"), "utf-8");

/** Value (not type) names exported from index.ts. */
function exportedValues(): string[] {
  const names: string[] = [];
  for (const m of index.matchAll(/^export\s+\{([^}]*)\}/gm)) {
    for (const part of m[1].split(",")) {
      const name = part.trim();
      if (!name || name.startsWith("type ")) continue;
      names.push(name.split(/\s+as\s+/).pop()!.trim());
    }
  }
  for (const m of index.matchAll(/^export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+(\w+)/gm)) names.push(m[1]);
  return names;
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return entry === "__tests__" ? [] : walk(path);
    return [path];
  });
}

// The pages and the component metadata, without import lines and comments: an import alone
// documents nothing.
const docs = ["pages", "meta"]
  .flatMap((dir) => walk(resolve(ROOT, "apps/docs/src", dir)))
  .filter((f) => /\.(vue|ts)$/.test(f))
  .map((f) =>
    readFileSync(f, "utf-8")
      // One import statement — `import { a, b } from "x"` over any number of lines, or a bare
      // `import "x"` — and nothing past it.
      .replace(/^\s*import\s+(?:[^;'"]*?\s+from\s+)?["'][^"'\n]+["'];?/gm, "")
      // A block comment opens at a line start or after a space — never `image/*`.
      .replace(/(^|\s)\/\*[\s\S]*?\*\//g, "$1")
      .replace(/(^|\s)\/\/[^\n]*/g, "$1")
      .replace(/<!--[\s\S]*?-->/g, ""),
  )
  .join("\n");

const helpers = [...new Set(exportedValues())].filter(
  (n) => !/^Cui[A-Z]/.test(n) && !/Key$/.test(n) && !NOT_HELPERS.includes(n),
);

describe("every public helper is documented (#296)", () => {
  it("can see every export", () => {
    // A re-export by star hides its names from the scan above: name them instead.
    expect(index.match(/^export\s+\*/gm) ?? []).toEqual([]);
  });

  it("finds the helpers it guards", () => {
    expect(helpers).toEqual(expect.arrayContaining(["useRovingFocus", "useClickOutside", "formatDate"]));
  });

  it("mentions each by name somewhere in the docs", () => {
    const undocumented = helpers.filter((n) => !(n in EXEMPT) && !new RegExp(`\\b${n}\\b`).test(docs));
    expect(undocumented).toEqual([]);
  });

  it("keeps the exemption list honest", () => {
    const stale = Object.keys(EXEMPT).filter((n) => !helpers.includes(n) || new RegExp(`\\b${n}\\b`).test(docs));
    expect(stale).toEqual([]);
  });
});
