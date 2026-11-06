import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import CuiTimePicker from "../../components/CuiTimePicker.vue";
import { frames } from "../../../../../config/test/browser-helpers";

/**
 * #178: minTime/maxTime, driven by real key events. The steppers must stop at the range's
 * ends (rather than wrap past them) and their aria-valuemin/max must say so.
 */
describe("CuiTimePicker minTime / maxTime (real browser)", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  async function open(props: Record<string, unknown>) {
    wrapper = mount(CuiTimePicker, { attachTo: document.body, props: { format: "24", ...props } });
    (wrapper.find(".cui-time-picker__trigger").element as HTMLElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    await frames(12);
  }

  const emitted = () => (wrapper!.emitted("update:modelValue") ?? []).map((e) => String(e[0]));
  const hours = () => document.querySelector<HTMLElement>('.cui-time-picker__panel [role="spinbutton"]')!;

  it("ArrowUp at the max hour does not wrap, and ArrowDown stops at the min", async () => {
    await open({ modelValue: "16:00", minTime: "15:00", maxTime: "17:00" });
    expect(hours().getAttribute("aria-valuemin")).toBe("15");
    expect(hours().getAttribute("aria-valuemax")).toBe("17");
    expect(document.activeElement).toBe(hours());

    await userEvent.keyboard("{ArrowUp}");
    await frames(4);
    expect(emitted().at(-1)).toBe("17:00");

    // Up again would have wrapped to 00:00 before the range existed.
    await userEvent.keyboard("{ArrowUp}");
    await frames(4);
    expect(emitted().at(-1)).toBe("17:00");
    expect(emitted().every((v) => v >= "15:00" && v <= "17:00")).toBe(true);

    await wrapper!.setProps({ modelValue: "17:00" });
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}");
    await frames(4);
    expect(emitted().every((v) => v >= "15:00" && v <= "17:00")).toBe(true);
    expect(emitted().at(-1)).toBe("15:00");
  });

  it("a typed hour outside the range is clamped to it", async () => {
    await open({ modelValue: "16:00", minTime: "15:00", maxTime: "17:00" });
    // Typed after the existing "16": "169", far past the 17 maximum.
    await userEvent.keyboard("9");
    await frames(4);
    expect(emitted().at(-1)).toBe("17:00");
  });
});
