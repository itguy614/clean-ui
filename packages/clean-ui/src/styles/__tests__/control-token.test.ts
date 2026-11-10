import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { PACKAGES, sourceFiles, splitSelectorList, stripComments } from "./css-helpers";

/** Every component in every package, by file name — the editor's as well as clean-ui's (#228). */
const COMPONENT_FILES = sourceFiles(/\.vue$/);
const COMPONENTS = new Map(COMPONENT_FILES.map((f) => [basename(f), f]));

/**
 * #114 — a component must not write a themeable property as a bare declaration in its
 * style binding. Inline declarations outrank every stylesheet rule, so each one forces
 * `!important` on any consumer who wants to restyle it, and on the library itself:
 * CuiButtonGroup carried ten of them, CuiInput three, and CuiButton needed one to beat
 * its *own* inline background on hover.
 *
 * The values are still computed in the component. They are emitted as private
 * `--_<component>-<slot>` custom properties and read back by the component's stylesheet
 * as `var(--cui-<component>-<slot>, var(--_<component>-<slot>))`. See "Themeable
 * properties" in CLAUDE.md.
 *
 * This list is OPT-IN: "once converted, stays converted". Around 50 of the ~106
 * components still write paint inline, and this release converts four of them, so an
 * opt-out list would be a backlog wearing a checklist's clothes. Add each component here
 * as its own PR converts it.
 *
 * #211 measured the drift: 22 components emitted a private token but only 10 were listed,
 * so 14 — CuiInput and CuiSelect among them — could quietly regain a bare declaration. All
 * 22 are listed now (CuiTooltip had to finish its colours first). The check reads the
 * `<script>` and the template's `:style` bindings (#333): a bare key in a binding outranks
 * the stylesheet exactly as one in a computed style does.
 */
const CONVERTED: Array<{ file: string; issue: string }> = [
  { file: "CuiButton.vue", issue: "#114" },
  { file: "CuiCard.vue", issue: "#115" },
  { file: "CuiCardHeader.vue", issue: "#115" },
  { file: "CuiCardBody.vue", issue: "#115" },
  { file: "CuiCardFooter.vue", issue: "#115" },
  { file: "CuiCardMedia.vue", issue: "#115" },
  { file: "CuiCombobox.vue", issue: "#123" },
  { file: "CuiTagInput.vue", issue: "#123" },
  { file: "CuiListboxPanel.vue", issue: "#137" },
  { file: "CuiListboxOption.vue", issue: "#137" },
  { file: "CuiListboxStatus.vue", issue: "#212" },
  { file: "CuiInputStepper.vue", issue: "#123" },
  { file: "CuiBanner.vue", issue: "#119" },
  { file: "CuiScrollArea.vue", issue: "#143" },
  { file: "CuiInput.vue", issue: "#211" },
  { file: "CuiSelect.vue", issue: "#211" },
  { file: "CuiTextarea.vue", issue: "#211" },
  { file: "CuiCheckbox.vue", issue: "#211" },
  { file: "CuiRadio.vue", issue: "#211" },
  { file: "CuiToggle.vue", issue: "#211" },
  { file: "CuiTabs.vue", issue: "#211" },
  { file: "CuiAlert.vue", issue: "#211" },
  { file: "CuiToast.vue", issue: "#211" },
  { file: "CuiTooltip.vue", issue: "#211" },
  { file: "CuiIcon.vue", issue: "#211" },
  { file: "CuiProgress.vue", issue: "#211" },
  { file: "CuiBackdrop.vue", issue: "#211" },
  { file: "CuiAvatarGroup.vue", issue: "#211" },
  { file: "CuiToolbar.vue", issue: "#190" },
  { file: "CuiToolbarSeparator.vue", issue: "#190" },
  { file: "CuiList.vue", issue: "#195" },
  { file: "CuiListItem.vue", issue: "#195" },
  { file: "CuiStatusDot.vue", issue: "#234" },
  { file: "CuiPinInput.vue", issue: "#196" },
  { file: "CuiDatePicker.vue", issue: "#466" },
  { file: "CuiDateRangePicker.vue", issue: "#466" },
  { file: "CuiColorPicker.vue", issue: "#467" },
  { file: "CuiModal.vue", issue: "#407" },
  { file: "CuiSlideover.vue", issue: "#407" },
  { file: "CuiTransferList.vue", issue: "#469" },
  { file: "CuiMaskedInput.vue", issue: "#469" },
  { file: "CuiTreeView.vue", issue: "#468" },
  { file: "CuiTreeNode.vue", issue: "#468" },
  { file: "CuiCodeBlock.vue", issue: "#484" },
  { file: "CuiModalHeader.vue", issue: "#489" },
  { file: "CuiModalBody.vue", issue: "#489" },
  { file: "CuiModalFooter.vue", issue: "#489" },
  { file: "CuiConfirmDialog.vue", issue: "#489" },
  { file: "CuiDataGridColumnManager.vue", issue: "#489" },
  { file: "CuiDataGridViewManager.vue", issue: "#489" },
  { file: "CuiTimePicker.vue", issue: "#489" },
  { file: "CuiDivider.vue", issue: "#489" },
  { file: "CuiKbd.vue", issue: "#489" },
  { file: "CuiTimelineItem.vue", issue: "#489" },
  // The editor's paint lives in its stylesheet, read through public tokens (#228).
  { file: "CuiMarkdownEditor.vue", issue: "#228" },
  { file: "CuiMarkdownEditorToolbar.vue", issue: "#228" },
  { file: "CuiMarkdownViewer.vue", issue: "#228" },
];

/** Properties a consumer has a legitimate claim on. Layout and geometry are not here. */
const THEMEABLE = [
  "background",
  "backgroundColor",
  "color",
  "border",
  "borderColor",
  "borderRadius",
  "height",
  "padding",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  "paddingBottom",
  "paddingInline",
  "paddingBlock",
  "fontSize",
  "gap",
];

/**
 * The `<script>` block only, with `withDefaults(...)` removed — a prop default like
 * `color: "primary"` is the obvious false positive, and it is a value, not a style.
 */
function styleSource(source: string): string {
  const start = source.indexOf("<script");
  const end = source.lastIndexOf("</script>");
  if (start === -1 || end === -1) return "";
  return source
    .slice(start, end)
    .replace(/withDefaults\s*\([\s\S]*?\n\}\);/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}

/**
 * The text of every `:style` / `v-bind:style` binding in the template, comments removed.
 * A static `style="…"` attribute is not scanned: it has no keys, only CSS.
 */
function templateStyleBindings(source: string): string {
  const start = source.indexOf("<template");
  const end = source.lastIndexOf("</template>");
  if (start === -1 || end === -1) return "";
  const template = source.slice(start, end).replace(/<!--[\s\S]*?-->/g, "");
  const bindings = [...template.matchAll(/(?:v-bind)?:style\s*=\s*(?:"([^"]*)"|'([^']*)')/g)];
  return bindings.map((m) => m[1] ?? m[2]).join("\n");
}

/** `MarkdownEditor` → `markdown-editor`, the private prefix's spelling. */
const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

describe("converted components emit themeable properties as tokens (#114)", () => {
  it("finds every listed component, in clean-ui and the editor", () => {
    expect(CONVERTED.filter(({ file }) => !COMPONENTS.has(file))).toEqual([]);
    // Keyed by file name, so two packages sharing one would leave one of them unscanned.
    expect(COMPONENTS.size).toBe(COMPONENT_FILES.length);
  });

  for (const { file, issue } of CONVERTED) {
    it(`${file} writes no bare themeable declaration in a template :style binding`, () => {
      const path = COMPONENTS.get(file);
      if (!path) return; // reported by the test above
      const bindings = templateStyleBindings(readFileSync(path, "utf-8"));
      const offenders = THEMEABLE.filter((prop) => new RegExp(`(^|[{,\\s])['"]?${prop}['"]?\\s*:`, "m").test(bindings));
      expect(
        offenders,
        `${file} (${issue}) must move these to its stylesheet, or emit --_${kebab(file.replace(/^Cui|\.vue$/g, ""))}-* custom properties`,
      ).toEqual([]);
    });

    it(`${file} writes no bare themeable declaration in its style binding`, () => {
      const path = COMPONENTS.get(file);
      if (!path) return; // reported by the test above
      const script = styleSource(readFileSync(path, "utf-8"));

      const offenders = THEMEABLE.filter(
        (prop) =>
          // A bare object key — `background: "…"` — as opposed to the quoted custom-property
          // key the pattern requires, `"--_button-bg": "…"`.
          new RegExp(`(^|[{,\\s])${prop}\\s*:\\s*[\`"']`, "m").test(script) ||
          // Or an assignment onto a style object, `base.background = …` (#211: CuiAlert, CuiToast
          // and CuiBackdrop built their paint that way, and passed). A direct DOM write —
          // `el.style.height = …`, CuiTextarea's autosize — is behaviour, not a binding.
          new RegExp(`(?<!\\.style)\\.${prop}\\s*=[^=]`, "m").test(script),
      );

      expect(
        offenders,
        `${file} (${issue}) must emit these as --_${kebab(file.replace(/^Cui|\.vue$/g, ""))}-* custom properties`,
      ).toEqual([]);
    });
  }
});

/**
 * #228 — the stylesheet half, for a component whose paint lives in a separate stylesheet
 * rather than its SFC. The editor declared `--_cme-*` properties and consumed them
 * directly, so no public token existed and none of its rules was zero-specificity: a
 * consumer could not retheme its border or focus ring without `!important`. Opt-in, like
 * `CONVERTED`.
 */
const CONVERTED_STYLESHEETS: Array<{ file: string; component: string; part: string; issue: string }> = [
  // `part` is the element the tokens paint; `--error` is the state allowed to paint it at
  // normal specificity, so neither tokens nor a consumer rule can hide an invalid field.
  { file: "clean-ui-editor/src/styles/editor.css", component: "markdown-editor", part: "cui-markdown-editor__control", issue: "#228" },
];

/** The properties a themeable slot paints. */
const PAINT = /(?:^|[;\s])(border(?:-color|-radius)?|box-shadow|background(?:-color)?)\s*:/;

/** CLAUDE.md's slot vocabulary — a closed set, like the colour-role slots. */
const SLOTS = new Set([
  ...["bg", "color", "border", "height", "px", "py", "gap", "font-size", "radius"],
  ...["hover-bg", "hover-color", "hover-border", "active-bg", "focus-ring", "focus-border"],
  "width", // an overlay panel's width preset, which is not CuiSize (#407)
  ...["pressed-bg", "pressed-color", "pressed-border"], // a toggle's on state (#396)
]);

/** `:where(…)` around the whole selector — not `:where(.x):hover`, which is (0,1,0) again. */
function isWholeWhere(selector: string): boolean {
  if (!selector.startsWith(":where(")) return false;
  let depth = 0;
  for (let i = ":where".length; i < selector.length; i++) {
    if (selector[i] === "(") depth++;
    // A pseudo-element cannot sit inside :where(), so `:where(.x)::after` is the whole-where
    // form for it, at (0,0,1) rather than the (0,1,1) of `.x::after`.
    else if (selector[i] === ")" && --depth === 0) return /^(::[\w-]+)?$/.test(selector.slice(i + 1));
  }
  return false;
}

describe("converted stylesheets read every private property through its public token (#228)", () => {
  for (const { file, component, part, issue } of CONVERTED_STYLESHEETS) {
    const css = stripComments(readFileSync(resolve(PACKAGES, file), "utf-8"));
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selectors: splitSelectorList(m[1].trim()), body: m[2] }));

    it(`${file} (${issue}) reads its private properties only as the public token's fallback`, () => {
      const reads = [
        ...css.matchAll(new RegExp(`(var\\(\\s*--cui-${component}-([\\w-]+)\\s*,\\s*)?var\\(\\s*--_${component}-([\\w-]+)\\s*\\)`, "g")),
      ];
      // A scan that matched nothing would pass vacuously.
      expect(reads.length).toBeGreaterThan(0);
      // Each read is wrapped, and the public token names the same slot as the private one.
      expect(reads.filter((m) => m[2] !== m[3]).map((m) => m[0])).toEqual([]);
      // Every slot, declared or read, is from the vocabulary.
      const slots = new Set([...css.matchAll(new RegExp(`--(?:cui-|_)${component}-([\\w-]+)`, "g"))].map((m) => m[1]));
      expect([...slots].filter((s) => !SLOTS.has(s))).toEqual([]);
      // And no private property keeps an old ad-hoc prefix.
      expect(css).not.toMatch(/--_(btn|sel|ta|cb|cme)-/);
    });

    it(`${file} (${issue}) wraps every rule that reads a public token whole in :where()`, () => {
      const reading = new RegExp(`var\\(\\s*--cui-${component}-`);
      const selectors = rules.filter(({ body }) => reading.test(body)).flatMap(({ selectors }) => selectors);
      expect(selectors.length).toBeGreaterThan(0);
      expect(selectors.filter((s) => !isWholeWhere(s))).toEqual([]);
    });

    it(`${file} (${issue}) paints ${part} only through zero-specificity rules, its error state aside`, () => {
      // Once converted, stays converted: a rule that paints the part without reading a token —
      // `… :focus-within { border-color: var(--cui-primary) }` — would outrank both the token
      // and a consumer's rule, and the check above would never look at it.
      const targetsPart = new RegExp(`\\.${part}(?![\\w-])[^\\s>+~]*\\)?$`);
      const offenders = rules
        .filter(({ body }) => PAINT.test(body))
        .flatMap(({ selectors }) => selectors)
        .filter((s) => targetsPart.test(s) && !isWholeWhere(s) && !s.includes(`${component}--error`));
      expect(offenders).toEqual([]);
    });
  }
});

/**
 * #454 — the same read-through contract for a component whose stylesheet is its own
 * `<style>` block. #333 converted what a template `:style` binding painted, but the
 * stylesheets kept reading the private `--_<c>-<slot>` token directly (`height:
 * var(--_input-height)`), so a consumer's container token or plain `.cui-input` rule could
 * not win. A listed component must read EVERY private token as the fallback of its public
 * one — `var(--cui-<c>-<slot>, var(--_<c>-<slot>))`, or nested in a fallback of one, as
 * CuiBanner's border colour is inside `--cui-banner-border`'s — and wherever it does,
 * inside a rule wrapped whole in `:where()`, so a consumer's plain rule at (0,1,0) wins too.
 *
 * `privateOnly` lists slots with no public layer ON PURPOSE, each with its reason: a size
 * preset's geometry (a toggle's knob), a value that follows the data (a progress fill's
 * position), a floating label's offset, a part's own colour that the closed slot vocabulary
 * has no name for. They may be read bare, anywhere. An entry the stylesheet no longer reads
 * is stale and fails.
 *
 * The converted list is the half that also checks `:where()`. The half below it,
 * `PRIVATE_ONLY`, is the guard turned on everywhere: it covers every component, so a new one
 * cannot add a direct private read.
 */
const TRANSFORM_ORIGIN =
  "a floating panel scales from its trigger: a private value only, with no public token, since a consumer has nothing to restyle (CLAUDE.md, Motion)";
const FLOAT_OFFSET = { "float-offset": "a floating label's line box, from the form field" };
const PART_COLOUR = "a part's own colour has no slot in the closed vocabulary; its rule is whole :where(), so a consumer's plain rule wins";
const CONVERTED_SFC_STYLESHEETS: Array<{ file: string; component: string; privateOnly: Record<string, string>; issue: string }> = [
  { file: "CuiInput.vue", component: "input", privateOnly: FLOAT_OFFSET, issue: "#454" },
  { file: "CuiSelect.vue", component: "select", privateOnly: {}, issue: "#454" },
  { file: "CuiTextarea.vue", component: "textarea", privateOnly: FLOAT_OFFSET, issue: "#454" },
  { file: "CuiCheckbox.vue", component: "checkbox", privateOnly: {}, issue: "#454" },
  { file: "CuiRadio.vue", component: "radio", privateOnly: {}, issue: "#454" },
  {
    file: "CuiToggle.vue",
    component: "toggle",
    privateOnly: {
      height: "the track's height follows the size preset, with the knob and the track width (#333)",
      "knob-size": "the knob's box follows the size preset (#333)",
      active: "the pressed border has no slot in the vocabulary",
    },
    issue: "#454",
  },
  { file: "CuiCombobox.vue", component: "combobox", privateOnly: {}, issue: "#454" },
  {
    file: "CuiProgress.vue",
    component: "progress",
    privateOnly: {
      width: "the circle's box is tied to its SVG",
      height: "the circle's box is tied to its SVG (the bar's track reads --cui-progress-height)",
      percent: "the fill's position follows the value",
    },
    issue: "#454",
  },
  {
    file: "CuiAlert.vue",
    component: "alert",
    privateOnly: { "icon-color": PART_COLOUR, "dismiss-color": PART_COLOUR },
    issue: "#454",
  },
  { file: "CuiBanner.vue", component: "banner", privateOnly: {}, issue: "#454" },
  { file: "CuiDataGridColumnManager.vue", component: "data-grid-column-manager", privateOnly: {}, issue: "#489" },
  { file: "CuiTimePicker.vue", component: "time-picker", privateOnly: {}, issue: "#489" },
  {
    file: "CuiCodeBlock.vue",
    component: "code-block",
    privateOnly: {
      "line-height": "the size preset's line height has no slot in the closed vocabulary, and no public token (#484)",
      "header-font-size": "the header title's size follows the size preset; the code's own font-size is public (#484)",
    },
    issue: "#484",
  },
  { file: "CuiConfirmDialog.vue", component: "confirm-dialog", privateOnly: {}, issue: "#489" },
  { file: "CuiDivider.vue", component: "divider", privateOnly: { spacing: "follows the `spacing` prop: margin geometry from the data, with no slot in the vocabulary (#489)" }, issue: "#489" },
  { file: "CuiKbd.vue", component: "kbd", privateOnly: { "min-width": "the size preset's key width, with no slot in the vocabulary and no public token (#489)" }, issue: "#489" },
  { file: "CuiTimelineItem.vue", component: "timeline-item", privateOnly: {}, issue: "#489" },
  {
    file: "CuiToast.vue",
    component: "toast",
    privateOnly: { "icon-color": PART_COLOUR, "dismiss-color": PART_COLOUR, "progress-bg": PART_COLOUR, "progress-bar": PART_COLOUR },
    issue: "#454",
  },
  { file: "CuiTabs.vue", component: "tabs", privateOnly: {}, issue: "#454" },
  { file: "CuiTagInput.vue", component: "tag-input", privateOnly: {}, issue: "#454" },
  {
    file: "CuiTooltip.vue",
    component: "tooltip",
    privateOnly: { "transform-origin": TRANSFORM_ORIGIN },
    issue: "#454",
  },
];

/** The text of every `<style>` block in an SFC, comments removed. */
function sfcStyles(source: string): string {
  return stripComments([...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n"));
}

/**
 * Every `var(--_<name>…)` in a stylesheet, and the public token it is the fallback of, if
 * any: the nearest enclosing `var(--cui-<token>, …)` call. `var(--cui-a, 1px solid
 * var(--_a-b))` is through `a`; so is `var(--cui-a, calc(1px + var(--_a-b)))`.
 */
function privateReads(css: string): Array<{ name: string; through: string | undefined }> {
  const reads: Array<{ name: string; through: string | undefined }> = [];
  // One frame per open paren; `token` is set on a `var(--cui-…,` call.
  const stack: Array<string | undefined> = [];
  for (let i = 0; i < css.length; i++) {
    if (css[i] === ")") {
      stack.pop();
      continue;
    }
    if (css[i] !== "(") continue;
    const isVar = css.slice(Math.max(0, i - 3), i) === "var";
    const argument = isVar ? /^\s*(--[\w-]+)/.exec(css.slice(i + 1, i + 80))?.[1] : undefined;
    if (argument?.startsWith("--_")) reads.push({ name: argument.slice(3), through: [...stack].reverse().find((t) => t !== undefined) });
    stack.push(argument?.startsWith("--cui-") && /^\s*--[\w-]+\s*,/.test(css.slice(i + 1, i + 80)) ? argument.slice(6) : undefined);
  }
  return reads;
}

describe("converted component stylesheets read every private property through its public token (#454)", () => {
  for (const { file, component, privateOnly, issue } of CONVERTED_SFC_STYLESHEETS) {
    const path = COMPONENTS.get(file);
    const css = path ? sfcStyles(readFileSync(path, "utf-8")) : "";
    const hint = `${file} (${issue}): read it as var(--cui-${component}-<slot>, var(--_${component}-<slot>)) inside a whole :where() rule, or list the slot in privateOnly with a reason`;

    it(`${file} reads each --_${component}-<slot> only as the fallback of --cui-${component}-<slot>`, () => {
      expect(path, `${file} is not a component`).toBeDefined();
      const reads = privateReads(css).filter((r) => r.name.startsWith(`${component}-`));
      // A scan that matched nothing would pass vacuously.
      expect(reads.length).toBeGreaterThan(0);
      const bare = reads
        .filter((r) => !(r.name.slice(component.length + 1) in privateOnly))
        .filter((r) => !r.through?.startsWith(`${component}-`))
        .map((r) => `var(--_${r.name})`);
      expect([...new Set(bare)], hint).toEqual([]);
    });

    it(`${file} wraps every rule that reads a public --cui-${component}-* token whole in :where()`, () => {
      const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selectors: splitSelectorList(m[1].trim()), body: m[2] }));
      const reading = new RegExp(`var\\(\\s*--cui-${component}-`);
      const selectors = rules.filter(({ body }) => reading.test(body)).flatMap(({ selectors }) => selectors);
      expect(selectors.length).toBeGreaterThan(0);
      expect(selectors.filter((s) => !isWholeWhere(s)), hint).toEqual([]);
    });

    it(`${file} keeps no stale privateOnly entry`, () => {
      const stale = Object.keys(privateOnly).filter((slot) => !new RegExp(`var\\(\\s*--_${component}-${slot}(?![\\w-])`).test(css));
      expect(stale).toEqual([]);
    });
  }
});

/**
 * #454 — the guard on everywhere. A component's stylesheet may read a private
 * `--_<x>-<y>` property only as (inside the fallback of) a public `--cui-…` token, unless
 * the slot is listed here with a reason. Anything not converted above is checked too, so a
 * new component cannot add a direct private read: it converts, or it is listed.
 *
 * Every entry is a slot read bare ON PURPOSE, and counts: one the stylesheet no longer reads
 * fails as stale. A converted component's own `privateOnly` is allowed as well, so it is
 * not repeated here.
 */
const GEOMETRY = "geometry or state computed by the component from a prop or the data; no slot in the vocabulary to name it";
const LISTBOX_BY_DESIGN =
  "CuiListboxPanel and CuiListboxOption read their consumer's public tokens by tokenPrefix and map them onto --_listbox-* ON PURPOSE (#137)";
const PRIVATE_ONLY: Record<string, Record<string, string>> = {
  "CuiAvatarGroup.vue": { "avatar-group-spacing": `the overlap follows the \`spacing\` prop (${GEOMETRY})` },
  "CuiBackdrop.vue": { "backdrop-opacity": `follows the \`opacity\` prop (${GEOMETRY})` },
  "CuiContextMenu.vue": { "context-menu-transform-origin": TRANSFORM_ORIGIN },
  "CuiDateRangePicker.vue": { "date-range-picker-field-width": `the start and end fields are as wide as the \`format\` prop's text (${GEOMETRY})` },
  "CuiDropdownMenu.vue": { "dropdown-menu-transform-origin": TRANSFORM_ORIGIN },
  "CuiDropdownSub.vue": { "dropdown-sub-transform-origin": TRANSFORM_ORIGIN },
  "CuiPopover.vue": { "popover-transform-origin": TRANSFORM_ORIGIN },
  // TODO(#454): CuiDataGrid is being reworked in #474; this is a sticky offset, so it likely stays.
  "CuiDataGridTable.vue": { "data-grid-head-top": `a sticky offset measured from the first header row (${GEOMETRY})` },
  "CuiFormField.vue": Object.fromEntries(
    [
      "label-color",
      ...["px", "inset", "lead", "end", "color", "room", "scale", "fs", "origin-y", "drop", "rest-color"].map((s) => `float-${s}`),
    ].map((slot) => [`form-field-${slot}`, "the floating label's geometry and colour state, declared and read inside this stylesheet"]),
  ),
  "CuiIcon.vue": {
    "icon-width": `follows the \`size\` prop (${GEOMETRY})`,
    "icon-height": `follows the \`size\` prop (${GEOMETRY})`,
    "duotone-opacity": `follows the \`duotoneOpacity\` prop (${GEOMETRY})`,
    "duotone-color": `follows the \`duotoneColor\` prop (${GEOMETRY})`,
  },
  "CuiInputStepper.vue": { "input-stepper-float-offset": "a floating label's line box, from the form field" },
  "CuiToastProvider.vue": {
    "toast-peek-transform": `a toast's place in the stack follows its index (${GEOMETRY})`,
    "toast-peek-opacity": `a toast's place in the stack follows its index (${GEOMETRY})`,
  },
  // Merged by other PRs after this guard was written. Each is geometry the stylesheet reads
  // behind no public token, as that component's own comment says; none is paint.
  "CuiColorPicker.vue": Object.fromEntries(
    ["radius-sm", "track-height", "thumb-size", "swatch-size", "thumb-blur"].map((s) => [
      `color-picker-${s}`,
      "the size preset's geometry, with no public token (see CuiColorPicker's rootVars comment)",
    ]).concat(
      ["hue", "value"].map((s) => [`color-picker-${s}`, "a colour that follows the picked value (the data), not a theme colour"]),
    ),
  ),
  "CuiTreeNode.vue": {
    "tree-view-depth": "this row's depth, from the data",
    "tree-view-indent": "the size preset's indent step, with no public token (CuiTreeView emits it)",
    "tree-view-icon-size": "the size preset's glyph size, with no public token (CuiTreeView emits it)",
  },
  "CuiTransferList.vue": {
    "transfer-list-title-font-size": "a part's own size has no slot in the closed vocabulary (the option rows' font-size is public)",
    "transfer-list-max-height": "follows the `height` prop",
  },
  // Its own token reads (--cui-list-radius, with CuiList's private --_list-radius as the
  // fallback) are already through the public layer; the corner is a derivation of them.
  "CuiListItem.vue": {
    "list-corner": "declared in this stylesheet from var(--cui-list-radius, …): the corner shared by the first-child and last-child rules",
  },
  "CuiListboxPanel.vue": Object.fromEntries(
    ["transform-origin", "bg", "border", "radius", "shadow", "padding"].map((s) => [`listbox-panel-${s}`, s === "transform-origin" ? TRANSFORM_ORIGIN : LISTBOX_BY_DESIGN]),
  ),
  "CuiListboxOption.vue": Object.fromEntries(
    ["item-padding", "font-size", "item-color", "item-radius", "item-selected-bg", "item-focus-bg", "item-disabled-color"].map((s) => [`listbox-${s}`, LISTBOX_BY_DESIGN]),
  ),
};

describe("no component stylesheet reads a private property directly (#454)", () => {
  const converted = new Map(CONVERTED_SFC_STYLESHEETS.map((c) => [c.file, c]));

  it("lists only components that exist, and only ones not already converted", () => {
    expect(Object.keys(PRIVATE_ONLY).filter((file) => !COMPONENTS.has(file))).toEqual([]);
    expect(Object.keys(PRIVATE_ONLY).filter((file) => converted.has(file))).toEqual([]);
  });

  for (const [file, path] of COMPONENTS) {
    const css = sfcStyles(readFileSync(path, "utf-8"));
    if (!css.includes("--_")) continue;
    const own = converted.get(file);
    const allowed = new Set([
      ...Object.keys(PRIVATE_ONLY[file] ?? {}),
      ...Object.keys(own?.privateOnly ?? {}).map((slot) => `${own!.component}-${slot}`),
    ]);

    it(`${file} has no direct private read`, () => {
      const bare = privateReads(css)
        // Through a token of its own component (`tabs-…` in `--cui-tabs-…`), not any public one.
        .filter((r) => (!r.through || r.through.split("-")[0] !== r.name.split("-")[0]) && !allowed.has(r.name))
        .map((r) => `var(--_${r.name})`);
      expect(
        [...new Set(bare)],
        `${file}: read it as the fallback of a public token (var(--cui-<c>-<slot>, var(--_<c>-<slot>)), in a whole :where() rule), or list it in PRIVATE_ONLY with a reason`,
      ).toEqual([]);
    });
  }

  for (const [file, entries] of Object.entries(PRIVATE_ONLY)) {
    it(`${file} keeps no stale exemption`, () => {
      const path = COMPONENTS.get(file);
      const bare = new Set(path ? privateReads(sfcStyles(readFileSync(path, "utf-8"))).filter((r) => !r.through).map((r) => r.name) : []);
      expect(Object.keys(entries).filter((name) => !bare.has(name))).toEqual([]);
    });
  }
});
