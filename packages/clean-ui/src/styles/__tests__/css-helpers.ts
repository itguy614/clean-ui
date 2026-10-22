import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Helpers shared by the stylesheet guards (preflight, typography exclusion). */

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
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return entry === "__tests__" ? [] : walk(path);
    return [path];
  });
}
