import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { parse } from "vue/compiler-sfc";

/**
 * #215 — a user-facing string belongs in the message catalogue, or a fully localised app
 * still shows English: "Filters", "Today", "Save current", a pagination landmark named
 * "Pagination". This fails on any literal a component's template puts in front of a user —
 * a text node, a string literal inside `{{ }}`, or the value of a prose attribute (`aria-*`,
 * `title`, `placeholder`, `alt`, `label`), static or a literal in its binding — unless it is
 * listed below with why.
 *
 * Enumerated ARIA attributes take keywords (`aria-live="polite"`) and the id-reference ones
 * take ids, so neither is checked. Strings a script builds are not seen. Prop defaults are the other route English took (`placeholder: "Search..."`);
 * those now fall back to the catalogue too.
 */
const ALLOWED: Record<string, string> = {
  "clean-ui/src/components/CuiTimePicker.vue:AM": "part of the 12-hour time format, which the field, its mask and the emitted value use too — localising the buttons alone would show two words",
  "clean-ui/src/components/CuiTimePicker.vue:PM": "as AM",
  "clean-ui/src/components/CuiFlex.vue:Flex (depth:": "the debug overlay, a developer aid",
  "clean-ui/src/components/CuiGrid.vue:Grid (depth:": "the debug overlay, a developer aid",
};

/** ARIA attributes whose values are keywords from the spec, never prose. */
const ENUMERATED = new Set([
  "aria-live", "aria-orientation", "aria-haspopup", "aria-autocomplete", "aria-current", "aria-sort",
  "aria-relevant", "aria-atomic", "aria-hidden", "aria-modal", "aria-checked", "aria-pressed",
  "aria-expanded", "aria-selected", "aria-disabled", "aria-busy", "aria-invalid", "aria-multiselectable",
  "aria-readonly", "aria-required",
  // id references
  "aria-controls", "aria-labelledby", "aria-describedby", "aria-owns", "aria-activedescendant",
  "aria-errormessage", "aria-details", "aria-flowto",
]);

/** Attributes whose value a user reads or hears. */
const isProseAttr = (name: string) =>
  (name.startsWith("aria-") && !ENUMERATED.has(name)) || ["title", "placeholder", "alt", "label"].includes(name);

/** The string literals in an expression's source — `copied ? "Copied" : "Copy"`. */
const stringLiterals = (source: string) =>
  [...source.matchAll(/(===?|!==?)?\s*(["'`])((?:(?!\2)[^\\]|\\.)*)\2/g)]
    // A literal something is compared with (`selecting === 'start'`) is a value, not text.
    .filter((m) => !m[1])
    .map((m) => m[3]);

const PACKAGES = resolve(__dirname, "../../..");
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return entry === "__tests__" ? [] : walk(path);
    return [path];
  });
}
const where = (f: string) => relative(PACKAGES, f).split(sep).join("/");

interface TemplateNode {
  type: number;
  content?: string | { content: string };
  name?: string;
  arg?: { content: string };
  exp?: { content: string };
  value?: { content: string };
  props?: TemplateNode[];
  children?: TemplateNode[];
  branches?: TemplateNode[];
}

/** Every literal a template shows a user. */
function literals(node: TemplateNode, out: string[] = []): string[] {
  if (node.type === 2 && typeof node.content === "string") out.push(node.content.trim());
  // `{{ … }}`: the string literals in its expression.
  if (node.type === 5 && typeof node.content === "object") out.push(...stringLiterals(node.content.content));
  for (const prop of node.props ?? []) {
    if (prop.type === 6 && prop.name && isProseAttr(prop.name) && prop.value) out.push(prop.value.content.trim());
    if (prop.type === 7 && prop.name === "bind" && prop.arg && isProseAttr(prop.arg.content) && prop.exp) {
      out.push(...stringLiterals(prop.exp.content));
    }
  }
  for (const child of [...(node.children ?? []), ...(node.branches ?? [])]) literals(child, out);
  return out;
}

const files = ["clean-ui", "clean-ui-editor"].flatMap((pkg) => walk(resolve(PACKAGES, pkg, "src"))).filter((f) => f.endsWith(".vue"));

describe("user-facing strings come from the message catalogue (#215)", () => {
  const found: string[] = [];
  for (const file of files) {
    const { descriptor } = parse(readFileSync(file, "utf-8"), { filename: file });
    const ast = descriptor.template?.ast as TemplateNode | undefined;
    if (!ast) continue;
    for (const text of literals(ast)) {
      // Prose: two letters in a row. Punctuation and separators (`·`, `/`, `–`) are layout.
      if (/\p{L}{2}/u.test(text)) found.push(`${where(file)}:${text}`);
    }
  }

  it("shows a user no literal prose outside the catalogue", () => {
    expect(found.filter((entry) => !(entry in ALLOWED))).toEqual([]);
  });

  it("keeps the allowlist honest", () => {
    expect(Object.keys(ALLOWED).filter((entry) => !found.includes(entry))).toEqual([]);
  });
});
