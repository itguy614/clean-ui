import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const COMPONENTS = resolve(__dirname, "../../components");

/**
 * #123 — a component that belongs in a form row must take its metrics from
 * `INPUT_SIZE_SCALE`, not from a table of its own.
 *
 * `CuiCombobox`, `CuiTagInput` and `CuiInputStepper` each had a private size table with
 * different heights, paddings and font sizes, so stacking any of them above a `CuiInput`
 * produced controls of different heights whose text started at different x positions. All
 * three also supported only `sm | md | lg`, silently clamping `xs` and `xl`, and bypassed
 * the `scaleControlHeight` floor. CLAUDE.md already said not to do this — "All components
 * import from here. Never define local size maps or size types" — so the rule needed
 * enforcing rather than restating.
 *
 * OPT-IN, like the `CONVERTED` list in control-token.test.ts. Sixteen components define a
 * local size record and most are legitimate: a Kbd, a CodeBlock or a TreeView sizes a
 * glyph, not a form field. Listing the form row explicitly says what the rule covers, at
 * the cost of someone adding a new form control here when they write one.
 */
const FORM_CONTROLS = [
  "CuiInput.vue",
  "CuiSelect.vue",
  "CuiTextarea.vue",
  "CuiTimePicker.vue",
  "CuiCombobox.vue",
  "CuiTagInput.vue",
  "CuiInputStepper.vue",
  "CuiMaskedInput.vue",
  "CuiDatePicker.vue",
  "CuiDateRangePicker.vue",
];

/**
 * The metrics that decide whether two controls line up. A local table of anything else —
 * a dropdown's max-height, a stepper's button glyph — is not what this guards.
 */
const ALIGNMENT_KEYS = ["height", "minHeight", "padding", "paddingLeft", "paddingInline", "px", "fontSize", "font"];

/** The `<script>` block, minus comments — a key named in prose is not a declaration. */
function script(source: string): string {
  const start = source.indexOf("<script");
  const end = source.lastIndexOf("</script>");
  if (start === -1 || end === -1) return "";
  return source
    .slice(start, end)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}

/**
 * A size table is an object literal keyed by size names whose entries carry alignment
 * metrics — `{ sm: { height: … }, md: { … } }`. Deriving from the shared scale inside a
 * `computed` is fine and is the point; re-tabulating per size is not.
 */
function localSizeTables(src: string): string[] {
  const found: string[] = [];
  for (const match of src.matchAll(/(?:^|\n)\s*(?:const|let)\s+(\w+)[^=]*=\s*\{([\s\S]*?)\n\};/g)) {
    const [, name, body] = match;
    const keyedBySize = /(^|[\s{,])(xs|sm|md|lg|xl)\s*:\s*\{/.test(body);
    const hasAlignment = ALIGNMENT_KEYS.some((k) => new RegExp(`[\\s{,]${k}\\s*:`).test(body));
    if (keyedBySize && hasAlignment) found.push(name);
  }
  return found;
}

describe("form controls size themselves from the shared scale (#123)", () => {
  for (const file of FORM_CONTROLS) {
    it(`${file} defines no local size table`, () => {
      const src = script(readFileSync(resolve(COMPONENTS, file), "utf-8"));

      expect(
        localSizeTables(src),
        `${file} must take its metrics from INPUT_SIZE_SCALE (utils/sizing.ts) so it lines up with the other form controls`,
      ).toEqual([]);
    });
  }

  it("covers every component that sizes itself from the shared scale", () => {
    // The list above is the weak part of this guard: a new form control is only covered
    // once someone remembers to add it. This closes that — anything importing
    // INPUT_SIZE_SCALE is form-row shaped by definition and must be on the list, so a new
    // control is caught the day it is written rather than the day someone notices.
    const users = readdirSync(COMPONENTS)
      .filter((f) => f.endsWith(".vue"))
      .filter((f) => readFileSync(resolve(COMPONENTS, f), "utf-8").includes("INPUT_SIZE_SCALE"));

    expect(users.filter((f) => !FORM_CONTROLS.includes(f))).toEqual([]);
  });
});
