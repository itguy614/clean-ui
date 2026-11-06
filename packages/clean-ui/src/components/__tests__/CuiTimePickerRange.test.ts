import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiTimePicker from "../CuiTimePicker.vue";
import CuiDateRangePicker from "../CuiDateRangePicker.vue";
import { INPUT_SIZE_SCALE } from "../../utils/sizing";
import { __clearWarned } from "../../utils/devWarn";

/** #178: minTime and maxTime were declared, documented as constraints, and read by nothing. */
let wrapper: VueWrapper | undefined;

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

async function open(props: Record<string, unknown>) {
  wrapper = mount(CuiTimePicker, { attachTo: document.body, props });
  await wrapper.get(".cui-time-picker__trigger").trigger("keydown", { key: "Enter" });
  await wrapper.vm.$nextTick();
  await wrapper.vm.$nextTick();
}

const spin = () => [...document.querySelectorAll<HTMLInputElement>('[role="spinbutton"]')];
const periodButtons = () => [...document.querySelectorAll<HTMLButtonElement>(".cui-time-picker__period")];
const last = () => {
  const e = wrapper!.emitted("update:modelValue")!;
  return e[e.length - 1][0];
};
async function type(el: HTMLInputElement, value: string) {
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  await wrapper!.vm.$nextTick();
}

describe("CuiTimePicker minTime / maxTime", () => {
  it("reflects the range on the spinbuttons (24h)", async () => {
    await open({ modelValue: "10:30", format: "24", minTime: "09:15", maxTime: "17:45" });
    const [h, m] = spin();
    expect([h.getAttribute("aria-valuemin"), h.getAttribute("aria-valuemax")]).toEqual(["9", "17"]);
    // 10:xx has every minute available.
    expect([m.getAttribute("aria-valuemin"), m.getAttribute("aria-valuemax")]).toEqual(["0", "59"]);
  });

  it("narrows the minute stepper at the range's end hours", async () => {
    await open({ modelValue: "09:30", format: "24", minTime: "09:15", maxTime: "17:45" });
    const [, m] = spin();
    expect([m.getAttribute("aria-valuemin"), m.getAttribute("aria-valuemax")]).toEqual(["15", "59"]);
  });

  it("clamps a typed hour into the range", async () => {
    await open({ modelValue: "10:30", format: "24", minTime: "09:00", maxTime: "17:00" });
    await type(spin()[0], "3");
    expect(last()).toBe("09:30");
  });

  it("clamps the minutes when the hour moves onto a bound", async () => {
    await open({ modelValue: "10:05", format: "24", minTime: "09:30", maxTime: "17:00" });
    await type(spin()[0], "9");
    expect(last()).toBe("09:30");
  });

  it("the steppers stop at the bound instead of wrapping", async () => {
    await open({ modelValue: "17:00", format: "24", minTime: "09:00", maxTime: "17:00" });
    const [h, m] = spin();
    h.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    await wrapper!.vm.$nextTick();
    expect(wrapper!.emitted("update:modelValue")).toBeUndefined();
    // minutes at 17:00 can only be 00.
    expect(m.getAttribute("aria-valuemax")).toBe("0");
  });

  it("clamps in 12h and keeps the model in hh:mm AM/PM", async () => {
    await open({ modelValue: "10:00 AM", format: "12", minTime: "09:00 AM", maxTime: "05:30 PM" });
    periodButtons()[1].click();
    await wrapper!.vm.$nextTick();
    // 10:00 PM is past the end; the nearest selectable time is the max.
    expect(last()).toBe("05:30 PM");
  });

  it("accepts a 24h range string while the model is 12h", async () => {
    await open({ modelValue: "10:00 AM", format: "12", minTime: "09:00", maxTime: "17:30" });
    periodButtons()[1].click();
    await wrapper!.vm.$nextTick();
    expect(last()).toBe("05:30 PM");
  });

  it("disables the AM/PM button that would leave the range", async () => {
    await open({ modelValue: "02:00 PM", format: "12", minTime: "01:00 PM", maxTime: "06:00 PM" });
    const [am, pm] = periodButtons();
    expect(am.disabled).toBe(true);
    expect(pm.disabled).toBe(false);
  });

  it("enables both periods without a range", async () => {
    await open({ modelValue: "02:00 PM", format: "12" });
    expect(periodButtons().map((b) => b.disabled)).toEqual([false, false]);
  });

  it("does not commit an out-of-range value on Enter", async () => {
    await open({ modelValue: "20:00", format: "24", minTime: "09:00", maxTime: "17:00" });
    const panel = document.querySelector(".cui-time-picker__panel")!;
    panel.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(last()).toBe("17:00");
  });

  it("keeps the full bounds without a range", async () => {
    await open({ modelValue: "10:30", format: "24" });
    const [h] = spin();
    expect([h.getAttribute("aria-valuemin"), h.getAttribute("aria-valuemax")]).toEqual(["0", "23"]);
  });
});

describe("CuiTimePicker bad ranges", () => {
  beforeEach(() => __clearWarned());

  it.each([
    ["inverted", { minTime: "17:00", maxTime: "09:00" }],
    ["invalid", { minTime: "25:99", maxTime: "17:00" }],
  ])("%s: warns in development and is ignored", async (_n, range) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await open({ modelValue: "20:00", format: "24", ...range });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("CuiTimePicker");
    const [h] = spin();
    expect([h.getAttribute("aria-valuemin"), h.getAttribute("aria-valuemax")]).toEqual(["0", "23"]);
  });

  it("is silent in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await open({ modelValue: "20:00", format: "24", minTime: "17:00", maxTime: "09:00" });
    expect(warn).not.toHaveBeenCalled();
    expect(spin()[0].getAttribute("aria-valuemax")).toBe("23");
  });
});

describe("CuiDateRangePicker size (#178)", () => {
  it.each(["xs", "sm", "md", "lg", "xl"] as const)("drives the trigger's height, padding and font at %s", (size) => {
    wrapper = mount(CuiDateRangePicker, { props: { size } });
    const el = wrapper.get(".cui-date-range-picker__trigger").element as HTMLElement;
    const s = INPUT_SIZE_SCALE[size];
    expect(el.style.getPropertyValue("--_date-range-picker-height")).toBe(s.height);
    expect(el.style.getPropertyValue("--_date-range-picker-px")).toBe(s.px);
    expect(el.style.getPropertyValue("--_date-range-picker-font-size")).toBe(s.fontSize);
  });
});
