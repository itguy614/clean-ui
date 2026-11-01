import { readdirSync, statSync } from "node:fs";
import { expect } from "vitest";
import { join, relative, resolve, sep } from "node:path";

/** Helpers shared by the stylesheet guards (preflight, typography exclusion). */

/** The workspace's `packages/` directory. */
export const PACKAGES = resolve(__dirname, "../../../..");

/**
 * The `src` of every workspace package — the library and each satellite — so the style
 * contracts cover a package that consumes clean-ui as well as clean-ui itself (#228: the
 * editor sat outside every one of them, which is how it shipped no public token). A new
 * satellite is covered without anyone listing it.
 */
export const SOURCE_ROOTS = readdirSync(PACKAGES)
  .map((pkg) => join(PACKAGES, pkg, "src"))
  .filter((src) => statSync(src, { throwIfNoEntry: false })?.isDirectory());

const SKIPPED_DIRS = new Set(["__tests__", "node_modules", "dist"]);

/** Every source file in every package, tests and type tests aside: walked once per test file, on first use. */
let sources: string[] | undefined;

/** Every source file in every package whose path matches `pattern`. */
export function sourceFiles(pattern: RegExp): string[] {
  sources ??= SOURCE_ROOTS.flatMap((root) => walk(root)).filter((f) => !/\.test(-d)?\.ts$/.test(f));
  return sources.filter((f) => pattern.test(f));
}

/** A path relative to `packages/`, with forward slashes: `clean-ui-editor/src/styles/editor.css`. */
export function where(file: string): string {
  return relative(PACKAGES, file).split(sep).join("/");
}

/** Split a selector list on top-level commas only — the ones inside `:where(…)` don't separate selectors. */
export function splitSelectorList(selector: string): string[] {
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
export function readTag(source: string, start: number): string {
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

/** An SFC's `<script>` blocks, comments stripped, so a commented-out example isn't read as code. */
export function script(source: string): string {
  const start = source.indexOf("<script");
  const end = source.lastIndexOf("</script>");
  if (start === -1 || end === -1) return "";
  return source
    .slice(start, end)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}

export function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return SKIPPED_DIRS.has(entry.name) ? [] : walk(path);
    return [path];
  });
}

/** Block comments out, so a comment that mentions a rule can't satisfy or break it. */
export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** An exemption: how many findings a file is allowed, and why. */
export interface Exemption {
  count: number;
  why: string;
}

/**
 * The guard pattern: every file's findings must match its exemption's count exactly, and
 * every exemption must still be needed. A file with findings and no exemption fails, an
 * extra finding in an exempt file fails, and so does a stale exemption.
 */
export function expectExemptions(found: Record<string, number>, exempt: Record<string, Exemption>): void {
  const files = new Set([...Object.keys(found), ...Object.keys(exempt)]);
  const mismatched = [...files]
    .filter((f) => (found[f] ?? 0) !== (exempt[f]?.count ?? 0))
    .map((f) => `${f}: ${found[f] ?? 0} found, ${exempt[f]?.count ?? 0} exempt`);
  expect(mismatched).toEqual([]);
}
