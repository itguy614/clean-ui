import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC = resolve(__dirname, "../..");
const STYLES = resolve(__dirname, "..");

/** Split a selector list on top-level commas only — the ones inside `:where(…)` don't separate selectors. */
function splitSelectorList(selector: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of selector) {
    if (char === "(" || char === "[") depth++;
    else if (char === ")" || char === "]") depth--;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current.trim());
  return parts.filter(Boolean);
}

/** Read one whole start tag from `source` at `start`, ignoring `>` inside attribute values. */
function readTag(source: string, start: number): string {
  let quote: string | null = null;
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ">") {
      return source.slice(start, i + 1);
    }
  }
  return source.slice(start);
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return entry === "__tests__" ? [] : walk(path);
    return [path];
  });
}

/**
 * #72 — the library must not ship a page-wide reset. Tailwind's preflight is
 * global by construction (`*`, `html`, `a`, `ul`, `button`, …), so importing
 * `tailwindcss` put it in `dist/clean-ui.css` and every consumer inherited it:
 * zeroed heading and paragraph margins, no list markers, `border-width: 0`.
 * `./preflight.css` replaces it with the same rules scoped to `cui-*` subtrees.
 */
describe("no global reset ships from the library's CSS", () => {
  const css = Object.fromEntries(
    readdirSync(STYLES)
      .filter((f) => f.endsWith(".css"))
      .map((f) => [f, readFileSync(join(STYLES, f), "utf8")] as const),
  );

  it("never imports the full `tailwindcss` entrypoint", () => {
    // `tailwindcss/theme.css` is fine and intentional — it engages the engine so
    // the `@theme` block in theme.css is compiled instead of shipping raw. The
    // bare entrypoint is what drags preflight and the utilities layer along.
    for (const [file, source] of Object.entries(css)) {
      expect(source, file).not.toMatch(/@import\s+["']tailwindcss["']/);
    }
  });

  it("imports preflight.css into `@layer base`", () => {
    // Unlayered beats layered at any specificity, so an unlayered reset would
    // override a consumer's `@layer utilities` — which is where Tailwind puts
    // `px-3`, `mb-2` and the rest. Tailwind's own preflight sat in `base`.
    expect(css["main.css"]).toMatch(/@import\s+["']\.\/preflight\.css["']\s+layer\(base\)/);
    expect(css["main.css"]).toMatch(/@layer\s+theme,\s*base,\s*components,\s*utilities;/);
  });

  it("scopes every rule in preflight.css to a `cui-*` subtree", () => {
    const source = css["preflight.css"];
    expect(source).toBeDefined();

    // Strip comments, then check each selector list.
    const declarations = source.replace(/\/\*[\s\S]*?\*\//g, "");
    const selectors = [...declarations.matchAll(/(^|\})\s*([^{}@]+?)\s*\{/g)].map((m) => m[2].trim());

    expect(selectors.length).toBeGreaterThan(10);
    for (const selector of selectors) {
      for (const part of splitSelectorList(selector)) {
        expect(part, `unscoped selector in preflight.css: ${part}`).toMatch(
          /^:where\(\[class\^="cui-"\], \[class\*=" cui-"\]\)/,
        );
      }
    }
  });
});

/**
 * The scope is "an element with a `cui-*` class, and its descendants", so a
 * teleported panel that renders straight into `<body>` without a `cui-*` class
 * of its own lands outside it — no `box-sizing`, no `font: inherit` on the
 * inputs and buttons inside it. That breaks only for consumers who aren't
 * already supplying preflight themselves, which is exactly the case with no
 * other safety net, so guard it here.
 */
describe("teleported roots stay inside the scope", () => {
  it("gives every <Teleport> root element a cui-* class", () => {
    const offenders: string[] = [];

    for (const file of walk(SRC).filter((f) => f.endsWith(".vue"))) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/<Teleport\b[^>]*>\s*(?=<[a-zA-Z])/g)) {
        const rootTag = readTag(source, match.index + match[0].length);
        if (!/class="[^"]*\bcui-/.test(rootTag) && !/:class="[^"]*cui-/.test(rootTag)) {
          offenders.push(`${file.replace(SRC + "/", "")}: ${rootTag.split("\n")[0].trim()}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
