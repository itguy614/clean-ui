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
 */
const CONVERTED: Array<{ file: string; issue: string }> = [
  { file: "CuiButton.vue", issue: "#114" },
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

      const offenders = THEMEABLE.filter((prop) =>
        // A bare object key — `background: "…"` — as opposed to the quoted custom-property
        // key the pattern requires, `"--_button-bg": "…"`.
        new RegExp(`(^|[{,\\s])${prop}\\s*:\\s*[\`"']`, "m").test(script),
      );

      expect(
        offenders,
        `${file} (${issue}) must emit these as --_${file.replace(/^Cui|\.vue$/g, "").toLowerCase()}-* custom properties`,
      ).toEqual([]);
    });
  }
});
