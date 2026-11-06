import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import CuiDatePicker from "../../components/CuiDatePicker.vue";
import CuiDateRangePicker from "../../components/CuiDateRangePicker.vue";
import { frames, installTokens, injectStyle } from "../../../../../config/test/browser-helpers";

/**
 * #466 — the two override routes CuiDatePicker and CuiDateRangePicker now promise, as
 * CuiButton does (#114): a plain consumer rule, and a `--cui-<component>-*` token set on a
 * container. Real browser, because both are claims about the cascade.
 *
 * Each pins a different failure: a bare inline declaration (a style binding) outranks the
 * plain rule; an inline PUBLIC token outranks the container's.
 */
describe("date pickers' themeable properties (real browser)", () => {
  let teardown: Array<() => void> = [];
  beforeAll(() => {
    teardown = [installTokens(main)];
  });
  afterAll(() => teardown.forEach((t) => t()));

  let wrapper: VueWrapper | undefined;
  let host: HTMLElement | undefined;
  let extra: (() => void) | undefined;
  afterEach(() => {
    wrapper?.unmount();
    host?.remove();
    extra?.();
    wrapper = host = extra = undefined;
  });

  async function open(component: typeof CuiDatePicker | typeof CuiDateRangePicker, props: Record<string, unknown>, hostStyle = "") {
    host = document.createElement("div");
    host.setAttribute("style", hostStyle);
    document.body.append(host);
    wrapper = mount(component, { props, attachTo: host });
    (host.querySelector("input") as HTMLInputElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    await frames(12);
    return host;
  }

  const paint = (el: Element | null, prop: string) => getComputedStyle(el!).getPropertyValue(prop);
  const cell = (key: string) => document.querySelector(`[data-cui-cell="${key}"]`);

  describe("CuiDatePicker", () => {
    const props = { modelValue: "2026-03-15" };

    it("paints the selected day from the stylesheet", async () => {
      await open(CuiDatePicker, props);
      expect(paint(cell("d:2026-2-15"), "background-color")).not.toBe("rgba(0, 0, 0, 0)");
      expect(paint(cell("d:2026-2-15"), "font-weight")).toBe("600");
    });

    it("lets a plain consumer rule win, with no !important", async () => {
      extra = injectStyle(`.cui-date-picker__day--selected { background: rgb(1, 2, 3); color: rgb(4, 5, 6); }
        .cui-date-picker__day { border-radius: 2px; font-size: 20px; }
        .cui-date-picker__weekday { color: rgb(7, 8, 9); }`);
      await open(CuiDatePicker, props);
      const selected = cell("d:2026-2-15");
      expect(paint(selected, "background-color")).toBe("rgb(1, 2, 3)");
      expect(paint(selected, "color")).toBe("rgb(4, 5, 6)");
      expect(paint(selected, "border-top-left-radius")).toBe("2px");
      expect(paint(selected, "font-size")).toBe("20px");
      expect(paint(document.querySelector(".cui-date-picker__weekday"), "color")).toBe("rgb(7, 8, 9)");
    });

    it("lets a token set on a container win", async () => {
      // The panel is teleported to <body>, outside the host, so the token goes on <body>.
      document.body.style.setProperty("--cui-date-picker-pressed-bg", "rgb(10, 20, 30)");
      document.body.style.setProperty("--cui-date-picker-pressed-color", "rgb(40, 50, 60)");
      try {
        await open(CuiDatePicker, props);
        const selected = cell("d:2026-2-15");
        expect(paint(selected, "background-color")).toBe("rgb(10, 20, 30)");
        expect(paint(selected, "color")).toBe("rgb(40, 50, 60)");
      } finally {
        document.body.style.removeProperty("--cui-date-picker-pressed-bg");
        document.body.style.removeProperty("--cui-date-picker-pressed-color");
      }
    });
  });

  describe("CuiDateRangePicker", () => {
    const props = { modelValue: { start: "2026-03-12", end: "2026-03-18" } };

    it("lets a plain consumer rule win, with no !important", async () => {
      extra = injectStyle(`.cui-date-range-picker__trigger { background: rgb(1, 2, 3); border-color: rgb(4, 5, 6); border-radius: 3px; height: 50px; padding: 0 9px; }
        .cui-date-range-picker__field { color: rgb(7, 8, 9); font-size: 19px; }
        .cui-date-range-picker__day--selected { background: rgb(11, 12, 13); }
        .cui-date-range-picker__day--in-range { background: rgb(14, 15, 16); }`);
      const root = await open(CuiDateRangePicker, props);
      const trigger = root.querySelector(".cui-date-range-picker__trigger");
      expect(paint(trigger, "background-color")).toBe("rgb(1, 2, 3)");
      expect(paint(trigger, "border-top-color")).toBe("rgb(4, 5, 6)");
      expect(paint(trigger, "border-top-left-radius")).toBe("3px");
      expect(paint(trigger, "height")).toBe("50px");
      expect(paint(trigger, "padding-left")).toBe("9px");
      const field = root.querySelector(".cui-date-range-picker__field");
      expect(paint(field, "color")).toBe("rgb(7, 8, 9)");
      expect(paint(field, "font-size")).toBe("19px");
      expect(paint(cell("d:2026-2-12"), "background-color")).toBe("rgb(11, 12, 13)");
      expect(paint(cell("d:2026-2-14"), "background-color")).toBe("rgb(14, 15, 16)");
    });

    it("lets a token set on a container win", async () => {
      const root = await open(
        CuiDateRangePicker,
        props,
        "--cui-date-range-picker-bg: rgb(1, 2, 3); --cui-date-range-picker-border: rgb(4, 5, 6); --cui-date-range-picker-radius: 3px; --cui-date-range-picker-height: 50px; --cui-date-range-picker-font-size: 19px",
      );
      const trigger = root.querySelector(".cui-date-range-picker__trigger");
      expect(paint(trigger, "background-color")).toBe("rgb(1, 2, 3)");
      expect(paint(trigger, "border-top-color")).toBe("rgb(4, 5, 6)");
      expect(paint(trigger, "border-top-left-radius")).toBe("3px");
      expect(paint(trigger, "height")).toBe("50px");
      expect(paint(root.querySelector(".cui-date-range-picker__field"), "font-size")).toBe("19px");
    });

    it("lets a token on a container of the panel win for the range's ends", async () => {
      document.body.style.setProperty("--cui-date-range-picker-pressed-bg", "rgb(10, 20, 30)");
      document.body.style.setProperty("--cui-date-range-picker-pressed-color", "rgb(40, 50, 60)");
      try {
        await open(CuiDateRangePicker, props);
        expect(paint(cell("d:2026-2-12"), "background-color")).toBe("rgb(10, 20, 30)");
        expect(paint(cell("d:2026-2-18"), "color")).toBe("rgb(40, 50, 60)");
      } finally {
        document.body.style.removeProperty("--cui-date-range-picker-pressed-bg");
        document.body.style.removeProperty("--cui-date-range-picker-pressed-color");
      }
    });

    it("keeps the field as wide as the format, from a private property", async () => {
      const root = await open(CuiDateRangePicker, { ...props, format: "YYYY-MM-DD" });
      const field = root.querySelector(".cui-date-range-picker__field")!;
      expect(field.closest<HTMLElement>(".cui-date-range-picker__trigger")!.style.getPropertyValue("--_date-range-picker-field-width")).toBe("11ch");
      expect(parseFloat(paint(field, "width"))).toBeGreaterThan(0);
    });
  });
});
