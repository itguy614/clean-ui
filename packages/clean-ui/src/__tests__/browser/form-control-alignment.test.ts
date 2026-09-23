import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { h } from "vue";
import { mount } from "@vue/test-utils";
import main from "../../styles/main.css?inline";
import { installTokens } from "./helpers";
import CuiInput from "../../components/CuiInput.vue";
import CuiSelect from "../../components/CuiSelect.vue";
import CuiCombobox from "../../components/CuiCombobox.vue";
import CuiTagInput from "../../components/CuiTagInput.vue";
import CuiInputStepper from "../../components/CuiInputStepper.vue";
import CuiFormField from "../../components/CuiFormField.vue";

/**
 * #123 — the actual complaint: stack a CuiInput above a CuiCombobox, both `md`, and they
 * render at different heights with their text starting at different x positions.
 *
 * Asserted on laid-out geometry in a real browser rather than on the emitted strings: the
 * strings were never the point, and `max()` / `calc()` with a custom property inside
 * resolves to nothing in jsdom.
 */
describe("form controls line up (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => {
    removeTokens = installTokens(main);
  });
  afterAll(() => removeTokens());

  const mounted: Array<{ unmount: () => void }> = [];
  const hosts: HTMLElement[] = [];
  const teardown = () => {
    mounted.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((h) => h.remove());
  };
  afterEach(teardown);

  const OPTIONS = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Beta" },
  ];

  /**
   * The element that actually draws each control's box. Each component wraps that in a
   * field wrapper holding the label and error message, and they do not agree on which
   * class sits where — so the class is named per component rather than hunted for by
   * walking every descendant and asking which one has a border.
   */
  const BORDERED: Array<[unknown, string, Record<string, unknown>]> = [
    [CuiInput, ".cui-input", {}],
    [CuiSelect, ".cui-select__trigger", { options: OPTIONS }],
    [CuiCombobox, ".cui-combobox__control", { options: OPTIONS }],
    [CuiTagInput, ".cui-tag-input__control", {}],
    [CuiInputStepper, ".cui-input-stepper__control", {}],
  ];

  function control(component: unknown, size: string) {
    const [, selector, extra] = BORDERED.find(([c]) => c === component)!;
    const host = document.createElement("div");
    host.style.width = "320px";
    document.body.append(host);
    hosts.push(host);
    const w = mount(component as never, { props: { size, ...extra }, attachTo: host });
    mounted.push(w);
    return (w.element as HTMLElement).querySelector<HTMLElement>(selector)!;
  }

  /** Where the text starts, measured from the control's left edge — the issue's complaint. */
  function textIndent(el: HTMLElement) {
    const text = el.querySelector<HTMLElement>("input, [class*='__value'], [class*='__placeholder']");
    return text ? Math.round(text.getBoundingClientRect().left - el.getBoundingClientRect().left) : null;
  }

  const box = (el: HTMLElement) => ({
    height: Math.round(el.getBoundingClientRect().height),
    indent: textIndent(el),
    fontSize: getComputedStyle(el.querySelector("input") ?? el).fontSize,
  });

  describe.each(["xs", "sm", "md", "lg", "xl"])("at size=%s", (size) => {
    // One reference measurement per size, not one per test: it is a pure measurement of a
    // fresh mount, so taking it once is exactly as honest and saves 15 mounts across the
    // block — and CuiIcon's first mount pays for the whole Phosphor barrel.
    let input: ReturnType<typeof box>;
    beforeAll(() => {
      input = box(control(CuiInput, size));
      // Measured and torn down immediately: the numbers are what the tests need, and
      // leaving the fixture mounted would leak it past this block's afterEach.
      teardown();
      // Guards every `toBe(input.indent)` below: two nulls compare equal, so if the text
      // selector ever stops matching, the indent assertions would all pass vacuously.
      expect(input.indent, "reference indent must be measurable").not.toBeNull();
    });

    it.each([
      // The combobox and tag input grow with their tag rows, so height is a floor here —
      // equal when empty, which is how they are mounted.
      ["combobox", CuiCombobox, true],
      ["tag input", CuiTagInput, true],
      // CuiInput used to put the height on its inner element, so the borders sat outside
      // it and every input was 2px taller than the select beside it (#123).
      ["select", CuiSelect, true],
      // The stepper centres its value between the +/- buttons, so indent does not apply.
      ["stepper", CuiInputStepper, false],
    ])("gives the %s the same metrics as an input", (_label, component, comparesText) => {
      const other = box(control(component, size));

      expect(other.height).toBe(input.height);
      if (comparesText) {
        expect(other.indent).toBe(input.indent);
        expect(other.fontSize).toBe(input.fontSize);
      }
    });
  });

  describe("a required field beside an optional one", () => {
    // CuiFormField's label is a flex row, so its height is its tallest child. The required
    // marker inherited a taller line-height from the surrounding prose, growing the label
    // by ~1.4px and pushing a required field's control that much lower than its neighbour.
    // Small, but plainly visible on any two-column form row.
    function field(required: boolean) {
      const host = document.createElement("div");
      host.style.width = "320px";
      document.body.append(host);
      hosts.push(host);
      const w = mount(CuiFormField, {
        props: { label: "Label", required },
        slots: { default: () => h(CuiInput, { size: "md" }) },
        attachTo: host,
      });
      mounted.push(w);
      const root = w.element as HTMLElement;
      return {
        label: root.querySelector<HTMLElement>(".cui-form-field__label")!,
        control: root.querySelector<HTMLElement>(".cui-input")!,
      };
    }

    it("puts both controls at the same offset from the top of the field", () => {
      const req = field(true);
      const opt = field(false);

      const reqOffset = req.control.getBoundingClientRect().top - req.label.getBoundingClientRect().top;
      const optOffset = opt.control.getBoundingClientRect().top - opt.label.getBoundingClientRect().top;

      expect(reqOffset).toBeCloseTo(optOffset, 1);
    });

    it("keeps the label the same height with and without the marker", () => {
      expect(field(true).label.getBoundingClientRect().height).toBeCloseTo(
        field(false).label.getBoundingClientRect().height,
        1,
      );
    });
  });

  it("accepts xs and xl, which used to clamp to sm and lg", () => {
    const xs = box(control(CuiCombobox, "xs", { options: OPTIONS }));
    const sm = box(control(CuiCombobox, "sm", { options: OPTIONS }));
    const lg = box(control(CuiCombobox, "lg", { options: OPTIONS }));
    const xl = box(control(CuiCombobox, "xl", { options: OPTIONS }));

    expect(xs.height).toBeLessThan(sm.height);
    expect(xl.height).toBeGreaterThan(lg.height);
  });

  it("floors the height at the shared minimum target size", () => {
    // The private tables bypassed scaleControlHeight, so they kept shrinking below 24px.
    const host = document.createElement("div");
    host.setAttribute("style", "--cui-density-scale: 0.5");
    document.body.append(host);
    hosts.push(host);
    const w = mount(CuiCombobox, { props: { size: "xs", options: OPTIONS }, attachTo: host });
    mounted.push(w);
    const el = (w.element as HTMLElement).querySelector<HTMLElement>(".cui-combobox__control")!;

    expect(Math.round(el.getBoundingClientRect().height)).toBe(24);
  });
});
