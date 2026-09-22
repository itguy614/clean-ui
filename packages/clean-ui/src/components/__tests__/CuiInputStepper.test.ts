import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CuiInputStepper from "../CuiInputStepper.vue";

// In horizontal layout the buttons render in DOM order: [decrement, increment].
function buttons(wrapper: ReturnType<typeof mount>) {
  const all = wrapper.findAll("button");
  return { dec: all[0], inc: all[1] };
}

describe("CuiInputStepper", () => {
  it("increment adds step to the model value", async () => {
    const wrapper = mount(CuiInputStepper, { props: { modelValue: 5, step: 2 } });
    await buttons(wrapper).inc.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([7]);
  });

  it("decrement subtracts step from the model value", async () => {
    const wrapper = mount(CuiInputStepper, { props: { modelValue: 5, step: 2 } });
    await buttons(wrapper).dec.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([3]);
  });

  it("does not increment past max", async () => {
    const wrapper = mount(CuiInputStepper, { props: { modelValue: 10, max: 10, step: 1 } });
    const { inc } = buttons(wrapper);
    expect(inc.attributes("disabled")).toBeDefined();
    await inc.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("does not decrement below min", async () => {
    const wrapper = mount(CuiInputStepper, { props: { modelValue: 0, min: 0, step: 1 } });
    const { dec } = buttons(wrapper);
    expect(dec.attributes("disabled")).toBeDefined();
    await dec.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("wrap rolls increment from max back to min", async () => {
    const wrapper = mount(CuiInputStepper, { props: { modelValue: 5, min: 1, max: 5, step: 1, wrap: true } });
    await buttons(wrapper).inc.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([1]);
  });

  it("disabled blocks both increment and decrement", async () => {
    const wrapper = mount(CuiInputStepper, { props: { modelValue: 5, disabled: true } });
    const { dec, inc } = buttons(wrapper);
    await inc.trigger("click");
    await dec.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });
});

/**
 * #74 — the stepper had no keydown handling at all: the value could only be
 * changed by clicking +/- or retyping it. That is a WCAG 2.1.1 gap in its own
 * right, and it is also why CuiTimePicker was unusable from the keyboard once
 * its panel was open — the hour and minute fields simply ignored the arrows.
 */
describe("CuiInputStepper keyboard", () => {
  function mountStepper(props: Record<string, unknown> = {}) {
    return mount(CuiInputStepper, { props: { modelValue: 5, min: 0, max: 10, step: 1, ...props } });
  }

  const lastValue = (w: ReturnType<typeof mountStepper>) => {
    const emitted = w.emitted("update:modelValue")!;
    return emitted[emitted.length - 1][0];
  };

  it("steps up and down with the arrow keys", async () => {
    const wrapper = mountStepper();
    await wrapper.find("input").trigger("keydown", { key: "ArrowUp" });
    expect(lastValue(wrapper)).toBe(6);

    const down = mountStepper();
    await down.find("input").trigger("keydown", { key: "ArrowDown" });
    expect(lastValue(down)).toBe(4);
  });

  it("honours step", async () => {
    const wrapper = mountStepper({ modelValue: 10, step: 5, max: 100 });
    await wrapper.find("input").trigger("keydown", { key: "ArrowUp" });
    expect(lastValue(wrapper)).toBe(15);
  });

  it("respects min and max", async () => {
    const atMax = mountStepper({ modelValue: 10 });
    await atMax.find("input").trigger("keydown", { key: "ArrowUp" });
    expect(atMax.emitted("update:modelValue")).toBeUndefined();

    const atMin = mountStepper({ modelValue: 0 });
    await atMin.find("input").trigger("keydown", { key: "ArrowDown" });
    expect(atMin.emitted("update:modelValue")).toBeUndefined();
  });

  it("wraps when asked to", async () => {
    const wrapper = mountStepper({ modelValue: 10, wrap: true });
    await wrapper.find("input").trigger("keydown", { key: "ArrowUp" });
    expect(lastValue(wrapper)).toBe(0);
  });

  it("Home and End jump to the bounds", async () => {
    const home = mountStepper();
    await home.find("input").trigger("keydown", { key: "Home" });
    expect(lastValue(home)).toBe(0);

    const end = mountStepper();
    await end.find("input").trigger("keydown", { key: "End" });
    expect(lastValue(end)).toBe(10);
  });

  it("PageUp and PageDown move in coarser jumps, still clamped", async () => {
    const wrapper = mountStepper({ modelValue: 0, max: 100, min: 0 });
    await wrapper.find("input").trigger("keydown", { key: "PageUp" });
    expect(lastValue(wrapper)).toBe(10);

    const clamped = mountStepper({ modelValue: 5, max: 10, min: 0 });
    await clamped.find("input").trigger("keydown", { key: "PageUp" });
    expect(lastValue(clamped)).toBe(10);
  });

  it("does nothing when disabled", async () => {
    const wrapper = mountStepper({ disabled: true });
    await wrapper.find("input").trigger("keydown", { key: "ArrowUp" });
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("announces itself as a spinbutton with its range", () => {
    const wrapper = mountStepper();
    const input = wrapper.find("input");
    expect(input.attributes("role")).toBe("spinbutton");
    expect(input.attributes("aria-valuenow")).toBe("5");
    expect(input.attributes("aria-valuemin")).toBe("0");
    expect(input.attributes("aria-valuemax")).toBe("10");
  });
});
