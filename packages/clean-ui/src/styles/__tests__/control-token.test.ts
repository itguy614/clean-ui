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
  { file: "CuiModal.vue", issue: "#407" },
  { file: "CuiSlideover.vue", issue: "#407" },
  { file: "CuiTransferList.vue", issue: "#469" },
  { file: "CuiMaskedInput.vue", issue: "#469" },
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
    else if (selector[i] === ")" && --depth === 0) return i === selector.length - 1;
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
