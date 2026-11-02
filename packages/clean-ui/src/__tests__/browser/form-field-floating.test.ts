import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { h, nextTick, type Component } from "vue";
import { mount } from "@vue/test-utils";
import main from "../../styles/main.css?inline";
import themeCss from "../../styles/theme.css?raw";
import { frames, injectStyle, mountHosts } from "../../../../../config/test/browser-helpers";
// @ts-ignore -- an untyped script module, shared with the contrast audit (tests are not type-checked)
import { contrastRatio } from "../../../../../scripts/contrast/color-math.mjs";
import CuiFormField from "../../components/CuiFormField.vue";
import CuiInput from "../../components/CuiInput.vue";
import CuiTextarea from "../../components/CuiTextarea.vue";
import CuiSelect from "../../components/CuiSelect.vue";
import CuiInputStepper from "../../components/CuiInputStepper.vue";
import CuiIcon from "../../components/CuiIcon.vue";

/**
 * #191 — `labelPosition="floating"` is an inset label, CSS only: `:placeholder-shown` /
 * `:focus-within` on a control that marked itself, inside a box one size step taller. So it
 * is all laid-out geometry and resolved colour, which only a real browser has; jsdom
 * evaluates neither `:has()` nor a transform.
 */
describe("CuiFormField floating label (real browser)", () => {
  let removeStyle: () => void;
  beforeAll(() => {
    // The real stylesheet, so the theme scales are the shipped ones — the default scale too,
    // which lives in a Tailwind `@theme` that is inert as raw CSS. Without it an undefined
    // `--color-*` drops the controls' borders and leaves the labels' colours inherited.
    // Transitions finish at once, so a measurement is of the state, not a frame on the way.
    removeStyle = injectStyle(`${main}
      ${themeCss.replace(/@theme\s*\{/, ":root {")}
      :root { --cui-duration-fast: 0ms; }
      body { background: var(--cui-surface-base); }`);
  });
  afterAll(() => removeStyle());

  const hosts = mountHosts();
  afterEach(() => {
    hosts.cleanup();
    document.documentElement.className = "";
  });

  function field(
    control: Component,
    fieldProps: Record<string, unknown> = {},
    controlProps: Record<string, unknown> = {},
    slots: Record<string, () => unknown> = {},
  ) {
    const host = hosts.host({ width: "320px", padding: "2rem 0" });
    const w = hosts.track(
      mount(CuiFormField, {
        props: { label: "Email", labelPosition: "floating", ...fieldProps },
        slots: { default: (f: Record<string, unknown>) => h(control, { ...f, ...controlProps }, slots) },
        attachTo: host,
      }),
    );
    const root = w.element as HTMLElement;
    const q = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
    return {
      w,
      root,
      label: q(".cui-form-field__label-text"),
      labelEl: q(".cui-form-field__label"),
      box: q(".cui-input, .cui-textarea, .cui-select__trigger, .cui-input-stepper__control"),
      native: q("input, textarea"),
    };
  }

  const rect = (el: Element) => el.getBoundingClientRect();
  const px = (el: Element, prop: string) => parseFloat(getComputedStyle(el).getPropertyValue(prop));
  const overlaps = (a: DOMRect, b: DOMRect) =>
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const mid = (r: DOMRect) => (r.top + r.bottom) / 2;

  /** The label's box lies inside the control's border box. */
  function inside(label: HTMLElement, box: HTMLElement) {
    const l = rect(label), b = rect(box);
    return l.top >= b.top - 0.5 && l.bottom <= b.bottom + 0.5 && l.left >= b.left - 0.5 && l.right <= b.right + 0.5;
  }
  /** The value's line box: centred in the native input's content box, line-height 1.25. */
  function valueLine(native: HTMLElement) {
    const r = rect(native);
    const top = r.top + px(native, "padding-top"), bottom = r.bottom - px(native, "padding-bottom");
    const v = px(native, "font-size") * 1.25;
    return { top: (top + bottom) / 2 - v / 2, bottom: (top + bottom) / 2 + v / 2 };
  }
  /** Resting: the label is the value's size, centred in the box. */
  const rests = (label: HTMLElement, box: HTMLElement) => Math.abs(mid(rect(label)) - mid(rect(box))) < 1;

  it("rests centred where the text starts, and floats inside the box above the value", async () => {
    const { label, box, native } = field(CuiInput);
    await frames(2);
    expect(rests(label, box)).toBe(true);
    expect(inside(label, box)).toBe(true);
    const resting = rect(label);
    // It starts where the value's text starts, not at the border.
    expect(Math.abs(resting.left - rect(native).left)).toBeLessThan(1);
    // The value's own size: 16px text in a 20px line box.
    expect(resting.height).toBeCloseTo(20, 0);

    native.focus();
    await frames(2);
    const floated = rect(label);
    expect(inside(label, box)).toBe(true);
    // 12px in a 15px line box, at the same start: no translateX.
    expect(floated.height).toBeCloseTo(15, 0);
    expect(Math.abs(floated.left - resting.left)).toBeLessThan(1);
    // Directly above the value, the two centred in the box as a pair.
    const value = valueLine(native);
    expect(Math.abs(floated.bottom - value.top)).toBeLessThan(1);
    expect(Math.abs((floated.top + value.bottom) / 2 - mid(rect(box)))).toBeLessThan(1);

    native.blur();
    await frames(2);
    expect(rests(label, box)).toBe(true);
  });

  it.each([
    ["md", 48, 15],
    ["lg", 56, 15],
    ["xl", 64, 16.25],
  ])("a floating %s control is one step taller: %ipx, its value %ipx down", async (size, height, offset) => {
    const { box, native, label } = field(CuiInput, {}, { size, modelValue: "ada@example.com" });
    await frames(2);
    expect(rect(box).height).toBeCloseTo(height, 1);
    expect(px(native, "padding-top")).toBeCloseTo(offset, 1);
    expect(rect(label).height).toBeCloseTo(offset, 0);
    expect(inside(label, box)).toBe(true);
  });

  it("scales with density", async () => {
    const { root, box } = field(CuiInput);
    root.style.setProperty("--cui-density-scale", "0.8");
    await frames(2);
    expect(rect(box).height).toBeCloseTo(48 * 0.8, 1);
  });

  it("falls back to a top label on an xs control, at its own height", async () => {
    const { root, labelEl, box, native } = field(CuiInput, {}, { size: "xs" });
    await frames(2);
    expect(root.querySelector("[data-cui-float-label]")).toBeNull();
    expect(getComputedStyle(labelEl).transform).toBe("none");
    expect(rect(labelEl).bottom).toBeLessThanOrEqual(rect(box).top);
    expect(rect(box).height).toBeCloseTo(28, 1);
    expect(px(native, "padding-top")).toBe(0);
  });

  it("floats for a value set with no event, as autofill sets one", async () => {
    const { label, box, native } = field(CuiInput);
    await frames(2);
    expect(rests(label, box)).toBe(true);
    // No `input` event, so no v-model and nothing in JS knows — only `:placeholder-shown`.
    (native as HTMLInputElement).value = "ada@example.com";
    await frames(2);
    expect(rests(label, box)).toBe(false);
    (native as HTMLInputElement).value = "";
    await frames(2);
    expect(rests(label, box)).toBe(true);
  });

  it("hides a control's own placeholder until focus, when the label has floated", async () => {
    const { label, box, native } = field(CuiInput, {}, { placeholder: "you@example.com" });
    await frames(2);
    expect(native.getAttribute("placeholder")).toBe("you@example.com");
    // The placeholder no longer holds the label up, and doesn't show under it.
    expect(rests(label, box)).toBe(true);
    expect(getComputedStyle(native, "::placeholder").color).toBe("rgba(0, 0, 0, 0)");
    native.focus();
    await frames(2);
    expect(rests(label, box)).toBe(false);
    expect(getComputedStyle(native, "::placeholder").color).not.toBe("rgba(0, 0, 0, 0)");
  });

  it("keeps the label up beside prefix text, the prefix's baseline on the value's", async () => {
    const { label, box, root, native } = field(CuiInput, {}, { modelValue: "" }, { prefix: () => "https://" });
    await frames(2);
    expect(rests(label, box)).toBe(false);
    expect(inside(label, box)).toBe(true);
    const prefix = root.querySelector<HTMLElement>(".cui-input__prefix")!;
    expect(px(prefix, "padding-top")).toBe(px(native, "padding-top"));
    expect(Math.abs(rect(prefix).top - rect(native).top)).toBeLessThan(1);
    expect(Math.abs(rect(prefix).bottom - rect(native).bottom)).toBeLessThan(1);
    // Its text is on the value's line, below the label.
    expect(rect(label).bottom).toBeLessThanOrEqual(valueLine(prefix).top + 0.5);
  });

  it("rests after a leading icon", async () => {
    const { label, box, root, native } = field(CuiInput, {}, {}, { prefix: () => h(CuiIcon, { name: "x" }) });
    await frames(2);
    expect(rests(label, box)).toBe(true);
    const icon = root.querySelector(".cui-input__prefix")!;
    expect(rect(label).left).toBeGreaterThanOrEqual(rect(icon).right);
    expect(Math.abs(rect(label).left - rect(native).left)).toBeLessThan(1);
    expect(overlaps(rect(label), rect(icon))).toBe(false);
  });

  it("keeps the clear and password buttons centred on the full height, clear of a resting label", async () => {
    const long = "Preferred contact email address for receipts and invoices";
    const { root, label, box } = field(CuiInput, { label: long }, { type: "password" });
    await frames(2);
    const toggle = root.querySelector(".cui-input__password-toggle")!;
    expect(Math.abs(mid(rect(toggle)) - mid(rect(box)))).toBeLessThan(1);
    expect(rests(label, box)).toBe(true);
    expect(overlaps(rect(label), rect(toggle))).toBe(false);
  });

  it("does not collide with the error or help text, which stay below", async () => {
    for (const props of [{ error: true, errorMessage: "Enter an email" }, { helpText: "We never share it" }]) {
      const { root, label, box, native } = field(CuiInput, props);
      const footer = root.querySelector(".cui-form-field__error, .cui-form-field__help")!;
      await frames(2);
      expect(overlaps(rect(label), rect(footer))).toBe(false);
      native.focus();
      await frames(2);
      expect(overlaps(rect(label), rect(footer))).toBe(false);
      expect(rect(footer).top).toBeGreaterThanOrEqual(rect(box).bottom);
    }
  });

  it("rests a textarea's label on its first line, floats it 6px below the border, and never moves the text", async () => {
    const { label, box, native } = field(CuiTextarea, {}, { rows: 5 });
    await frames(2);
    expect(inside(label, box)).toBe(true);
    const padding = px(native, "padding-top");
    // 6px + the 15px floated line box + 2px, reserved at rest too.
    expect(padding).toBeCloseTo(23, 1);
    const firstLine = rect(native).top + padding + px(native, "line-height") / 2;
    expect(Math.abs(mid(rect(label)) - firstLine)).toBeLessThan(0.6);
    native.focus();
    await frames(2);
    expect(inside(label, box)).toBe(true);
    expect(rect(label).top - rect(box).top - 1).toBeCloseTo(6, 0);
    expect(rect(label).height).toBeCloseTo(15, 0);
    expect(rect(label).bottom).toBeLessThanOrEqual(rect(native).top + padding);
    expect(px(native, "padding-top")).toBe(padding);
  });

  it("holds a stepper's always-floated label inside its taller box", async () => {
    const { label, box } = field(CuiInputStepper, { label: "Quantity" }, { modelValue: 3 });
    await frames(2);
    expect(rect(box).height).toBeCloseTo(48, 1);
    expect(inside(label, box)).toBe(true);
  });

  it("focuses the control when the floated label is clicked, as any label does", async () => {
    const { label } = field(CuiInput, {}, { modelValue: "ada@example.com" });
    await frames(2);
    const l = rect(label);
    // What a real click at the label's centre would hit.
    const hit = document.elementFromPoint((l.left + l.right) / 2, (l.top + l.bottom) / 2);
    expect(hit?.closest("label")).toBe(label.parentElement);
  });

  it("keeps a long floated label inside the box", async () => {
    const long = "Preferred contact email address for receipts and invoices";
    const { label, box } = field(CuiInput, { label: long }, { modelValue: "x" });
    await frames(2);
    expect(inside(label, box)).toBe(true);
  });

  it("flips only the transform origin right to left", async () => {
    const { root, label, box, native } = field(CuiInput);
    root.setAttribute("dir", "rtl");
    await frames(2);
    // Resting where the value starts, on the right.
    const right = rect(label).right;
    expect(Math.abs(right - rect(native).right)).toBeLessThan(1);
    native.focus();
    await frames(2);
    expect(Math.abs(rect(label).right - right)).toBeLessThan(1);
    expect(inside(label, box)).toBe(true);
  });

  it("falls back to a top label on CuiSelect", async () => {
    const { root, box, labelEl } = field(CuiSelect, {}, { options: [{ value: "a", label: "Alpha" }] });
    await frames(2);
    expect(getComputedStyle(labelEl).transform).toBe("none");
    expect(rect(labelEl).bottom).toBeLessThanOrEqual(rect(box).top);
    // Full size, exactly as a `top` field draws it.
    expect(getComputedStyle(labelEl).fontSize).toBe("14px");
    expect(Math.round(rect(root.querySelector(".cui-form-field__label-text")!).height)).toBeGreaterThan(17);
  });

  // --- Colour ---

  /** A colour as the browser resolves it, through a probe carrying it. */
  function resolved(token: string) {
    const probe = document.createElement("span");
    probe.style.color = `var(${token})`;
    document.body.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  }

  it("is secondary at rest and tertiary floated, and focus does not recolour it", async () => {
    const { labelEl, native } = field(CuiInput);
    await frames(2);
    expect(getComputedStyle(labelEl).color).toBe(resolved("--cui-text-secondary"));
    native.focus();
    await frames(2);
    expect(getComputedStyle(labelEl).color).toBe(resolved("--cui-text-tertiary"));
    native.blur();
    const filled = field(CuiInput, {}, { modelValue: "x" });
    await frames(2);
    expect(getComputedStyle(filled.labelEl).color).toBe(resolved("--cui-text-tertiary"));
  });

  it("is the error colour resting and floated", async () => {
    const { labelEl, native } = field(CuiInput, { error: true, errorMessage: "Enter an email" });
    await frames(2);
    expect(getComputedStyle(labelEl).color).toBe(resolved("--cui-error"));
    native.focus();
    await frames(2);
    expect(getComputedStyle(labelEl).color).toBe(resolved("--cui-error"));
  });

  it("dims with a disabled control", async () => {
    const { labelEl } = field(CuiInput, { disabled: true });
    await frames(2);
    expect(getComputedStyle(labelEl).opacity).toBe("0.5");
  });

  // --- Contrast: the floated label is 12px text, so it needs 4.5:1, not the 3:1 of large text.

  /** A CSS colour as hex, whatever notation the browser computed it in (oklch included). */
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  function hex(color: string): string {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }
  /** The same WCAG maths as `scripts/check-contrast.mjs`. */
  const contrast = (fg: string, bg: string): number => contrastRatio(hex(fg), hex(bg));

  const THEMES = ["navy", "mono", "forest", "amber", "azure", "teal", "violet", "ruby"];
  describe.each(THEMES)("cui-theme-%s", (theme) => {
    it.each(["light", "dark"])("keeps 4.5:1 resting and floated, %s", async (mode) => {
      document.documentElement.className = `cui-theme-${theme}${mode === "dark" ? " dark" : ""}`;
      const { labelEl, box, native } = field(CuiInput);
      await frames(2);
      // Both over the control's own background: the label is inside it either way.
      const bg = getComputedStyle(box).backgroundColor;
      const rest = contrast(getComputedStyle(labelEl).color, bg);
      native.focus();
      await frames(2);
      const floated = contrast(getComputedStyle(labelEl).color, bg);
      // Measuring the label's real colour, not an inherited fallback.
      expect(getComputedStyle(labelEl).color).not.toBe(getComputedStyle(document.body).color);
      expect(rest, `resting ${rest.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      expect(floated, `floated ${floated.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      await nextTick();
    });
  });
});
