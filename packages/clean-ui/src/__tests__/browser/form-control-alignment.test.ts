import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { h } from "vue";
import { mount } from "@vue/test-utils";
import main from "../../styles/main.css?inline";
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
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens";
    // The `--color-*` scale comes from the Tailwind `@theme`, which is inert in a raw
    // stylesheet — and without it `border: 1px solid var(--cui-border-strong)` is an
    // invalid shorthand, so the controls render with NO border and every height is 2px out.
    style.textContent = `${main}
      :root {
        --color-surface-50:#fafafa; --color-surface-100:#f4f4f5; --color-surface-200:#e4e4e7;
        --color-surface-300:#d4d4d8; --color-surface-400:#a1a1aa; --color-surface-500:#71717a;
        --color-surface-600:#52525b; --color-surface-700:#3f3f46; --color-surface-800:#27272a;
        --color-surface-900:#18181b; --color-surface-950:#09090b;
        --color-primary-100:#e0e7ff; --color-primary-300:#a5b4fc; --color-primary-500:#4f46e5;
        --color-primary-700:#3730a3; --color-primary-900:#1e1b4b;
      }`;
    document.head.append(style);
  });

  afterAll(() => document.getElementById("cui-tokens")?.remove());

  const mounted: Array<{ unmount: () => void }> = [];
  const hosts: HTMLElement[] = [];
  afterEach(() => {
    mounted.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((h) => h.remove());
  });

  const OPTIONS = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Beta" },
  ];

  /**
   * Mount a control and return the element that actually draws its box — the one carrying
   * the border. Each of these wraps that in a field wrapper holding the label and error
   * message, and they do not agree on which class sits where, so find it by what it does
   * rather than by name.
   */
  function control(component: unknown, size: string, extra: Record<string, unknown> = {}) {
    const host = document.createElement("div");
    host.style.width = "320px";
    document.body.append(host);
    hosts.push(host);
    const w = mount(component as never, { props: { size, ...extra }, attachTo: host });
    mounted.push(w);
    const root = w.element as HTMLElement;
    const bordered = Array.from(root.querySelectorAll<HTMLElement>("*")).find(
      (e) => getComputedStyle(e).borderTopWidth !== "0px",
    );
    return (bordered ?? root) as HTMLElement;
  }

  /** Where the text starts, measured from the control's left edge — the issue's complaint. */
  function textIndent(el: HTMLElement) {
    const text = el.querySelector<HTMLElement>("input, [class*='__value'], [class*='__placeholder']");
    if (!text) return null;
    return Math.round(text.getBoundingClientRect().left - el.getBoundingClientRect().left);
  }

  const box = (el: HTMLElement) => ({
    height: Math.round(el.getBoundingClientRect().height),
    indent: textIndent(el),
    fontSize: getComputedStyle(el.querySelector("input") ?? el).fontSize,
  });

  describe.each(["xs", "sm", "md", "lg", "xl"])("at size=%s", (size) => {
    it("gives the combobox the same height, indent and font size as an input", () => {
      const input = box(control(CuiInput, size));
      const combo = box(control(CuiCombobox, size, { options: OPTIONS }));

      // The combobox grows with its tag rows, so its height is a floor: equal when empty.
      expect(combo.height).toBe(input.height);
      expect(combo.indent).toBe(input.indent);
      expect(combo.fontSize).toBe(input.fontSize);
    });

    it("gives the tag input the same metrics", () => {
      const input = box(control(CuiInput, size));
      const tags = box(control(CuiTagInput, size));

      expect(tags.height).toBe(input.height);
      expect(tags.indent).toBe(input.indent);
      expect(tags.fontSize).toBe(input.fontSize);
    });

    it("gives the select the same height and indent", () => {
      // CuiInput used to put the height on its inner element, so the borders sat outside
      // it and every input was 2px taller than the select beside it (#123).
      const input = box(control(CuiInput, size));
      const select = box(control(CuiSelect, size, { options: OPTIONS }));

      expect(select.height).toBe(input.height);
      expect(select.indent).toBe(input.indent);
    });

    it("gives the stepper the same height", () => {
      // Its value is centred between the +/- buttons, so indent does not apply.
      expect(box(control(CuiInputStepper, size)).height).toBe(box(control(CuiInput, size)).height);
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
