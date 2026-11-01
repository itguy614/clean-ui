import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { INPUT_SIZE_SCALE, TEXTAREA_SIZE_SCALE } from "../../utils/sizing";

/**
 * #191 — a floating label rests where the control's text starts, but CSS cannot read a
 * value off the control (custom properties only inherit downward), so CuiFormField restates
 * each size's padding and font size in its stylesheet. This keeps that copy honest: change a
 * scale without the field and the label drifts off the text with nothing else failing.
 */
const sfc = readFileSync(resolve(__dirname, "../../components/CuiFormField.vue"), "utf-8");

/** The rem inside a scale entry: `calc(0.5rem * var(--cui-density-scale, 1))` → "0.5rem". */
const rem = (v: string) => /([\d.]+rem)/.exec(v)![1];

/** The declarations of the size rule whose marker selector is `selector`. */
function rule(selector: string) {
  const re = new RegExp(`:has\\(\\[data-cui-float-label${selector.replace(/[[\]"~]/g, "\\$&")}\\]\\)\\s*\\{([^}]*)\\}`);
  const body = re.exec(sfc)?.[1] ?? "";
  const px = /--_form-field-float-px:\s*([^;]+);/.exec(body)?.[1]?.trim();
  const fs = /--_form-field-float-fs:\s*([^;]+);/.exec(body)?.[1]?.trim();
  return { px, fs };
}

/** md is the base rule's default rather than a size rule. */
function base() {
  const body = /\.cui-form-field--floating:has\(\[data-cui-float-label\]\)\s*\{([^}]*)\}/.exec(sfc)![1];
  return {
    px: /--_form-field-float-px:\s*([^;]+);/.exec(body)![1].trim(),
    fs: /--_form-field-float-fs:\s*([^;]+);/.exec(body)![1].trim(),
  };
}

describe("floating label insets match the size scales", () => {
  it.each(["xs", "sm", "md", "lg", "xl"])("input, %s", (size) => {
    const css = size === "md" ? base() : rule(`~="${size}"`);
    expect(css.px).toBe(rem(INPUT_SIZE_SCALE[size].px));
    expect(css.fs).toBe(INPUT_SIZE_SCALE[size].fontSize);
  });

  it.each(["xs", "sm", "md", "lg", "xl"])("textarea, %s", (size) => {
    const t = TEXTAREA_SIZE_SCALE[size];
    expect(rule(`="multiline ${size}"`).px).toBe(rem(t.px));
    // The shared font size, and the field's 2 × py = px shortcut.
    expect(t.fontSize).toBe(INPUT_SIZE_SCALE[size].fontSize);
    expect(parseFloat(rem(t.py)) * 2).toBe(parseFloat(rem(t.px)));
  });
});
