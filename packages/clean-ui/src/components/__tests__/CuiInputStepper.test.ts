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
