import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const COMPONENTS = resolve(__dirname, "../../components");

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
 * `<script>` only; template `:style` bindings are still unguarded, which is its own issue.
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

describe("converted components emit themeable properties as tokens (#114)", () => {
  for (const { file, issue } of CONVERTED) {
    it(`${file} writes no bare themeable declaration in its style binding`, () => {
      const script = styleSource(readFileSync(resolve(COMPONENTS, file), "utf-8"));

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
        `${file} (${issue}) must emit these as --_${file.replace(/^Cui|\.vue$/g, "").toLowerCase()}-* custom properties`,
      ).toEqual([]);
    });
  }
});
