import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { h, nextTick, type Component } from "vue";
import { mount } from "@vue/test-utils";
import main from "../../styles/main.css?inline";
import { frames, injectStyle, mountHosts } from "../../../../../config/test/browser-helpers";
// @ts-ignore -- an untyped script module, shared with the contrast audit (tests are not type-checked)
import { contrastRatio } from "../../../../../scripts/contrast/color-math.mjs";
import CuiFormField from "../../components/CuiFormField.vue";
import CuiInput from "../../components/CuiInput.vue";
import CuiTextarea from "../../components/CuiTextarea.vue";
import CuiSelect from "../../components/CuiSelect.vue";

/**
 * #191 — `labelPosition="floating"` is CSS only: `:placeholder-shown` / `:focus-within` on a
 * control that marked itself. So it is all laid-out geometry and resolved colour, which
 * only a real browser has; jsdom evaluates neither `:has()` nor a transform.
 */
describe("CuiFormField floating label (real browser)", () => {
  let removeStyle: () => void;
  beforeAll(() => {
    // The real stylesheet, so the theme scales are the shipped ones. Transitions finish at
    // once, so a measurement is of the state rather than a frame of the way there.
    removeStyle = injectStyle(`${main}
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
      box: q(".cui-input, .cui-textarea, .cui-select__trigger"),
      native: q("input, textarea"),
    };
  }

  const rect = (el: Element) => el.getBoundingClientRect();
  const overlaps = (a: DOMRect, b: DOMRect) =>
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

  /** Resting: the label's text sits inside the control's box. */
  function rests(label: HTMLElement, box: HTMLElement) {
    const l = rect(label), b = rect(box);
    return l.top >= b.top && l.bottom <= b.bottom;
  }
  /** Floated: wholly above the control, clear of its top border. */
  function floats(label: HTMLElement, box: HTMLElement) {
    return rect(label).bottom <= rect(box).top;
  }

  it("rests inside an empty control and floats above it on focus", async () => {
    const { label, box, native } = field(CuiInput);
    await frames(2);
    expect(rests(label, box)).toBe(true);
    // Centred on the control, which is where its value will be typed.
    const l = rect(label), b = rect(box);
    expect(Math.abs((l.top + l.bottom) / 2 - (b.top + b.bottom) / 2)).toBeLessThan(2);
    // And it starts where the value's text starts, not at the border.
    expect(Math.abs(l.left - rect(native).left)).toBeLessThan(2);

    native.focus();
    await frames(2);
    expect(floats(label, box)).toBe(true);
    // Smaller once floated, back at the field's left edge like a top label.
    expect(rect(label).height).toBeLessThan(l.height);
    expect(Math.abs(rect(label).left - b.left)).toBeLessThan(2);

    native.blur();
    await frames(2);
    expect(rests(label, box)).toBe(true);
  });

  it("stays up while the control has a value", async () => {
    const { label, box } = field(CuiInput, {}, { modelValue: "ada@example.com" });
    await frames(2);
    expect(floats(label, box)).toBe(true);
  });

  it("floats for a value set with no event, as autofill sets one", async () => {
    const { label, box, native } = field(CuiInput);
    await frames(2);
    expect(rests(label, box)).toBe(true);
    // No `input` event, so no v-model and nothing in JS knows — only `:placeholder-shown`.
    (native as HTMLInputElement).value = "ada@example.com";
    await frames(2);
    expect(floats(label, box)).toBe(true);
    (native as HTMLInputElement).value = "";
    await frames(2);
    expect(rests(label, box)).toBe(true);
  });

  it("keeps a control's own placeholder and never draws the label over it", async () => {
    const { label, box, native } = field(CuiInput, {}, { placeholder: "you@example.com" });
    await frames(2);
    expect(native.getAttribute("placeholder")).toBe("you@example.com");
    expect(floats(label, box)).toBe(true);
  });

  it("reserves room above the control, so the floated label stays inside the field", async () => {
    const { root, label, native } = field(CuiInput);
    native.focus();
    await frames(2);
    expect(rect(label).top).toBeGreaterThanOrEqual(rect(root).top - 0.5);
  });

  it("does not collide with a prefix", async () => {
    const { label, box, root } = field(CuiInput, {}, {}, { prefix: () => h("span", { class: "probe" }, "https://") });
    await frames(2);
    // A prefix pins the label up, where it can't meet it…
    expect(floats(label, box)).toBe(true);
    expect(overlaps(rect(label), rect(root.querySelector(".cui-input__prefix")!))).toBe(false);
  });

  it("does not collide with the error or help text", async () => {
    for (const props of [{ error: true, errorMessage: "Enter an email" }, { helpText: "We never share it" }]) {
      const { root, label, native } = field(CuiInput, props);
      const footer = root.querySelector(".cui-form-field__error, .cui-form-field__help")!;
      await frames(2);
      expect(overlaps(rect(label), rect(footer))).toBe(false);
      native.focus();
      await frames(2);
      expect(overlaps(rect(label), rect(footer))).toBe(false);
      // And the footer still sits below the control.
      expect(rect(footer).top).toBeGreaterThanOrEqual(rect(root.querySelector(".cui-input")!).bottom);
    }
  });

  it("rests a textarea's label on its first line, not its middle", async () => {
    const { label, box, native } = field(CuiTextarea, {}, { rows: 5 });
    await frames(2);
    expect(rests(label, box)).toBe(true);
    const l = rect(label);
    const firstLine = rect(box).top + parseFloat(getComputedStyle(native).paddingTop) + parseFloat(getComputedStyle(native).lineHeight) / 2;
    expect(Math.abs((l.top + l.bottom) / 2 - firstLine)).toBeLessThan(3);
    native.focus();
    await frames(2);
    expect(floats(label, box)).toBe(true);
  });

  it("falls back to a top label on CuiSelect", async () => {
    const { root, box } = field(CuiSelect, {}, { options: [{ value: "a", label: "Alpha" }] });
    await frames(2);
    const label = root.querySelector<HTMLElement>(".cui-form-field__label")!;
    expect(getComputedStyle(label).transform).toBe("none");
    expect(rect(label).bottom).toBeLessThanOrEqual(rect(box).top);
    // Full size, exactly as a `top` field draws it.
    expect(getComputedStyle(label).fontSize).toBe("14px");
    expect(Math.round(rect(root.querySelector(".cui-form-field__label-text")!).height)).toBeGreaterThan(17);
  });

  // --- Contrast: the floated label is ~12px text, so it needs 4.5:1, not the 3:1 of large text.

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
      const { label, box, native } = field(CuiInput);
      await frames(2);
      const labelEl = label.parentElement!;
      // Resting over the control's own background.
      const rest = contrast(getComputedStyle(labelEl).color, getComputedStyle(box).backgroundColor);
      native.focus();
      await frames(2);
      // Floated over the field's background — the page's here.
      const floated = contrast(getComputedStyle(labelEl).color, getComputedStyle(document.body).backgroundColor);
      expect(rest, `resting ${rest.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      expect(floated, `floated ${floated.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      await nextTick();
    });
  });
});
