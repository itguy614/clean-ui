import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { sourceFiles } from "./css-helpers";

/**
 * #213 — every `src/components/*.vue` has a `<style>` block, or is listed here with the
 * reason it needs none. The inline-paint conversions (#114 …) were opt-in, which is how
 * CuiCodeBlock (#484) kept `padding` and `background` in a style object after the rest of the
 * library had moved on: nothing noticed a component that never got a stylesheet.
 *
 * Two lists, and the line between them is the point:
 *
 * - `NO_PAINT` is a component that has no paint of its own: it renders only other components
 *   (whose stylesheets paint it), a renderless wrapper, or computes layout geometry from its
 *   props (CLAUDE.md: layout components use inline `:style`). It must not write any paint
 *   inline, which the scan below enforces, so nothing that styles itself can hide here.
 * - `INLINE_PAINT` is the backlog: components that DO still write paint inline and have no
 *   stylesheet. It cannot grow (a new component is on neither list and fails), each entry
 *   counts the distinct paint properties it writes (so a new one in an exempt file fails, and
 *   so does a stale count), and an entry whose component gains a `<style>` block or loses its
 *   inline paint fails until it is removed.
 *
 * Paint here is colour, surface, shape and type: `background`, `color`, `border*`,
 * `box-shadow`, `font-size`, `font-weight`, `text-transform`, `letter-spacing`, `opacity`.
 * Geometry (`padding`, `gap`, `width`, `display`, `position`) is layout, not scanned.
 */
const COMPONENT_FILES = sourceFiles(/[\\/]clean-ui[\\/]src[\\/]components[\\/][^\\/]+\.vue$/);
const COMPONENTS = new Map(COMPONENT_FILES.map((f) => [basename(f), f]));

const COMPOSES = (parts: string) => `renders only ${parts}, which carry the paint`;

const NO_PAINT: Record<string, string> = {
  // Renderless: the template is a slot or a Vue built-in, and the content carries its own paint.
  "CuiConfigProvider.vue": "renders only its slot: provides the message catalogue and defaults",
  "CuiTransition.vue": "wraps Vue's <Transition>; the motion is utils/motion hooks, the content is the consumer's",
  "CuiTransitionGroup.vue": "wraps Vue's <TransitionGroup>; the motion is utils/motion hooks and shared classes in main.css",
  // Composition: another component paints it.
  "CuiCheckboxGroup.vue": "group layout and error container come from the shared .cui-control-group* classes (components-shared.css)",
  "CuiToggleGroup.vue": "group layout and error container come from the shared .cui-control-group* classes (components-shared.css)",
  "CuiDropdownRadioGroup.vue": "a role=radiogroup div around its slot; the items are CuiDropdownItem",
  "CuiDataGridCardView.vue": COMPOSES("CuiGrid"),
  "CuiDataGridPagination.vue": COMPOSES("CuiPagination"),
  "CuiDataGridSearch.vue": "renders CuiInput; the one inline style is layout (position, max-width, flex)",
  "CuiCopyButton.vue": "renders CuiTooltip and CuiButton; the one inline style is the icon's transform and transition",
  "CuiMaskedInput.vue": COMPOSES("CuiInput (#469 moved its own paint out)"),
  "CuiStack.vue": COMPOSES("CuiFlex"),
  "CuiTreeView.vue": "emits only private --_tree-view-* properties; its rows are CuiTreeNode, whose stylesheet paints them (#468)",
  "CuiInputAttachment.vue": "a div around its slot and a button-group context: the attached button's corners are CuiButton's",
  "CuiForm.vue": "a <form> around its slot, with no styling of its own",
  "CuiFormValues.vue": "hidden inputs for form submission: never visible",
  // Layout components: computed geometry from props, inline by design (CLAUDE.md, Layout Components).
  "CuiContainer.vue": "layout: width and padding from props",
  "CuiFlexItem.vue": "layout: flex shorthand and alignment from props",
  "CuiGridItem.vue": "layout: grid span and placement from props",
  "CuiSpacer.vue": "layout: an empty box sized from props",
  "CuiTimeline.vue": "layout: a flex column; the items are CuiTimelineItem",
  // The table's paint lives in CuiTable's stylesheet and main.css, selecting these by class.
  "CuiTableBody.vue": "painted by CuiTable's stylesheet",
  "CuiTableHead.vue": "painted by CuiTable's stylesheet",
  "CuiTableFoot.vue": "painted by CuiTable's stylesheet",
  "CuiTableRow.vue": "painted by CuiTable's stylesheet",
  "CuiTableCell.vue": "painted by CuiTable's stylesheet; the inline style is text-align, width and white-space from props",
};

/**
 * The backlog: still writes paint inline, with no stylesheet. `paint` is how many distinct
 * paint properties the scan finds. Convert one (as #484 did CuiCodeBlock) and delete its
 * entry; they are converted in the #489 follow-ups.
 */
const INLINE_PAINT: Record<string, { paint: number; reason: string }> = {
  "CuiDataGridColumnManager.vue": { paint: 4, reason: "static style attributes on the row, the drag handle and the group label" },
  "CuiDataGridViewManager.vue": { paint: 4, reason: "static style attributes on the view rows and the delete button" },
  "CuiDivider.vue": { paint: 5, reason: "the line, the label and the container are computed style objects" },
  "CuiKbd.vue": { paint: 7, reason: "the key cap is a style object" },
  "CuiTimePicker.vue": { paint: 7, reason: "the field, the panel and the segments are style objects" },
  "CuiTimelineItem.vue": { paint: 5, reason: "the dot, the connector and the text are style objects" },
};

const PAINT = [
  "background",
  "background-color",
  "color",
  "border",
  "border-color",
  "border-radius",
  "box-shadow",
  "font-size",
  "font-weight",
  "text-transform",
  "letter-spacing",
  "opacity",
];
const camel = (p: string) => p.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

const hasStyleBlock = (source: string) => /<style[\s>]/.test(source);

/**
 * The distinct paint properties a component writes inline: a template `:style` binding, a
 * static `style="…"` attribute, a style object in the script (`color: "…"`, `s.color = …`),
 * or a direct `el.style.color = …` write.
 */
function inlinePaint(source: string): string[] {
  const tStart = source.indexOf("<template");
  const tEnd = source.lastIndexOf("</template>");
  const template = tStart === -1 ? "" : source.slice(tStart, tEnd).replace(/<!--[\s\S]*?-->/g, "");
  const sStart = source.indexOf("<script");
  const sEnd = source.lastIndexOf("</script>");
  // `withDefaults(...)` out: a prop default like `color: "primary"` is a value, not a style.
  const script =
    sStart === -1
      ? ""
      : source
          .slice(sStart, sEnd)
          .replace(/withDefaults\s*\([\s\S]*?\n\}\);/g, "")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\/\/[^\n]*/g, "");
  const bindings = [...template.matchAll(/(?:v-bind)?:style\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map((m) => m[1] ?? m[2]).join("\n");
  const statics = [...template.matchAll(/(?<![:\w-])style\s*=\s*"([^"]*)"/g)].map((m) => m[1]).join("\n");

  const found = new Set<string>();
  for (const prop of PAINT) {
    const key = camel(prop);
    if (new RegExp(`(^|[{,\\s])['"]?${key}['"]?\\s*:`, "m").test(bindings)) found.add(prop);
    if (new RegExp(`(^|[{,\\s])${key}\\s*:\\s*[\`"']`, "m").test(script)) found.add(prop);
    if (new RegExp(`(?<!\\.style)\\.${key}\\s*=[^=]`, "m").test(script)) found.add(prop);
    if (new RegExp(`(^|[;\\s])${prop}\\s*:`).test(statics)) found.add(prop);
    if (new RegExp(`\\.style\\.${key}\\s*=[^=]`).test(template + script)) found.add(prop);
  }
  return [...found].sort();
}

describe("every component has a stylesheet or a justified exemption (#213)", () => {
  it("finds the components", () => {
    // A scan that matched nothing would pass vacuously.
    expect(COMPONENTS.size).toBeGreaterThan(100);
    expect(COMPONENTS.has("CuiCodeBlock.vue")).toBe(true);
  });

  it("lists only components that exist, each on one list", () => {
    const listed = [...Object.keys(NO_PAINT), ...Object.keys(INLINE_PAINT)];
    expect(listed.filter((file) => !COMPONENTS.has(file))).toEqual([]);
    expect(listed.filter((file, i) => listed.indexOf(file) !== i)).toEqual([]);
  });

  it("has a <style> block, or is listed", () => {
    const bare = [...COMPONENTS]
      .filter(([file, path]) => !hasStyleBlock(readFileSync(path, "utf-8")) && !(file in NO_PAINT) && !(file in INLINE_PAINT))
      .map(([file]) => file);
    expect(
      bare,
      "move its paint into a <style> block (static paint in the stylesheet, dynamic parts as private --_<c>-<slot> properties; see CLAUDE.md, Themeable Properties), or list it in NO_PAINT with the reason it has none",
    ).toEqual([]);
  });

  describe("NO_PAINT", () => {
    for (const [file, reason] of Object.entries(NO_PAINT)) {
      const source = COMPONENTS.has(file) ? readFileSync(COMPONENTS.get(file)!, "utf-8") : "";
      it(`${file} writes no paint inline (${reason})`, () => {
        expect(inlinePaint(source), `${file} paints inline: it belongs in a <style> block or in INLINE_PAINT`).toEqual([]);
      });
      it(`${file} has no <style> block to make the exemption stale`, () => {
        expect(hasStyleBlock(source), `${file} has a <style> block now: remove it from NO_PAINT`).toBe(false);
      });
    }
  });

  describe("INLINE_PAINT", () => {
    for (const [file, { paint, reason }] of Object.entries(INLINE_PAINT)) {
      const source = COMPONENTS.has(file) ? readFileSync(COMPONENTS.get(file)!, "utf-8") : "";
      it(`${file} still writes exactly ${paint} paint properties inline (${reason})`, () => {
        expect(hasStyleBlock(source), `${file} has a <style> block now: remove it from INLINE_PAINT`).toBe(false);
        const found = inlinePaint(source);
        expect(found.length, `${file} writes ${found.join(", ")}: update the count, or convert it and remove the entry`).toBe(paint);
      });
    }
  });

  it("the paint scan sees every way of writing one", () => {
    const wrap = (template: string, script = "") => `<script setup>${script}</script><template>${template}</template>`;
    expect(inlinePaint(wrap(`<div :style="{ background: 'red' }" />`))).toEqual(["background"]);
    expect(inlinePaint(wrap(`<div style="color: red; font-weight: 600" />`))).toEqual(["color", "font-weight"]);
    expect(inlinePaint(wrap(`<div />`, `const s = { borderRadius: "2px" };`))).toEqual(["border-radius"]);
    expect(inlinePaint(wrap(`<div />`, `s.fontSize = "1px";`))).toEqual(["font-size"]);
    expect(inlinePaint(wrap(`<div @mouseenter="e.target.style.color = 'red'" />`))).toEqual(["color"]);
    // Layout, and a prop default, are not paint.
    expect(inlinePaint(wrap(`<div :style="{ display: 'flex', padding: '1px', gap: '2px' }" />`))).toEqual([]);
    expect(inlinePaint(wrap(`<div />`, `const props = withDefaults(defineProps<P>(), {\n  color: "primary",\n});`))).toEqual([]);
  });
});
