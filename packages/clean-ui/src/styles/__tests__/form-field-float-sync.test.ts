import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FLOATING_LABEL_SCALE, INPUT_SIZE_SCALE, TEXTAREA_SIZE_SCALE, type FloatingLabelSize } from "../../utils/sizing";

/**
 * #191 — a floating label rests where the control's text starts and floats into room the
 * control keeps for it, but CSS cannot read a value off the control (custom properties only
 * inherit downward), so CuiFormField restates each size's padding, font sizes and scale in
 * its stylesheet. This keeps that copy honest: change a scale without the field and the
 * label drifts off the text, or onto the value, with nothing else failing.
 */
const sfc = readFileSync(resolve(__dirname, "../../components/CuiFormField.vue"), "utf-8");
const SIZES: FloatingLabelSize[] = ["md", "lg", "xl"];

/** The rem inside a scale entry: `calc(0.5rem * var(--cui-density-scale, 1))` → "0.5rem". */
const rem = (v: string) => /([\d.]+rem)/.exec(v)![1];
const num = (v: string) => parseFloat(v);

/** The custom properties declared in the rule whose `:has()` argument is `marker`. */
function decls(marker: string): Record<string, string> {
  const escaped = marker.replace(/[[\]"~]/g, "\\$&");
  const body = new RegExp(`\\.cui-form-field--floating:has\\(${escaped}\\)\\s*\\{([^}]*)\\}`).exec(sfc)?.[1] ?? "";
  return Object.fromEntries([...body.matchAll(/(--_form-field-float-[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

/** A size's values: the base rule (md) overlaid by its size rule, then the textarea's. */
function field(size: FloatingLabelSize, multiline = false) {
  const merged = {
    ...decls("[data-cui-float-label]"),
    ...(size === "md" ? {} : decls(`[data-cui-float-label~="${size}"]`)),
    ...(multiline ? decls(`[data-cui-float-label~="multiline"][data-cui-float-label~="${size}"]`) : {}),
  };
  return {
    px: merged["--_form-field-float-px"],
    fs: merged["--_form-field-float-fs"],
    scale: merged["--_form-field-float-scale"],
  };
}

describe("floating label geometry matches the size scales", () => {
  it.each(SIZES)("input, %s", (size) => {
    const css = field(size);
    expect(css.px).toBe(rem(INPUT_SIZE_SCALE[size].px));
    expect(css.fs).toBe(INPUT_SIZE_SCALE[size].fontSize);
    // Scaled from the value's size to the floated label's: 12px, 13px at xl, whose line box
    // (line-height 1.25) is the control's offset.
    const labelFs = { md: 0.75, lg: 0.75, xl: 0.8125 }[size];
    expect(num(css.scale)).toBeCloseTo(labelFs / num(css.fs), 4);
    expect(num(FLOATING_LABEL_SCALE[size].offset)).toBe(labelFs * 1.25);
  });

  it.each(SIZES)("textarea, %s", (size) => {
    expect(field(size, true).px).toBe(rem(TEXTAREA_SIZE_SCALE[size].px));
    expect(TEXTAREA_SIZE_SCALE[size].fontSize).toBe(INPUT_SIZE_SCALE[size].fontSize);
  });

  it.each(SIZES)("the control's height and offsets, %s", (size) => {
    const f = FLOATING_LABEL_SCALE[size];
    // One step taller than the control's own size: md 48px, lg 56px, xl 64px.
    expect(num(rem(f.height))).toBe({ md: 3, lg: 3.5, xl: 4 }[size]);
    expect(num(rem(f.height))).toBeGreaterThan(num(rem(INPUT_SIZE_SCALE[size].height)));
  });

  it("the field's textarea maths uses the textarea's room: 6px, the line box, 2px", () => {
    const textarea = readFileSync(resolve(__dirname, "../../components/CuiTextarea.vue"), "utf-8");
    expect(textarea).toContain("padding-top: calc(var(--_ta-float-offset) + 0.5rem * var(--cui-density-scale, 1));");
    expect(sfc).toContain("--_form-field-float-drop: calc(0.125rem * var(--cui-density-scale, 1) + var(--_form-field-float-fs) * (1.25 * var(--_form-field-float-scale) + 0.175));");
    expect(sfc).toContain("margin-top: calc(1px + 0.375rem * var(--cui-density-scale, 1) + var(--_form-field-float-drop));");
  });
});
