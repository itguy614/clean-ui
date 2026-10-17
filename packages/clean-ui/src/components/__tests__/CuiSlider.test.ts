import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CuiSlider from "../CuiSlider.vue";

describe("CuiSlider", () => {
  it("renders a native range input reflecting modelValue, min, max, step", () => {
    const wrapper = mount(CuiSlider, {
      props: { modelValue: 40, min: 0, max: 100, step: 5 },
    });
    const input = wrapper.get("input[type=range]");
    expect((input.element as HTMLInputElement).value).toBe("40");
    expect(input.attributes("min")).toBe("0");
    expect(input.attributes("max")).toBe("100");
    expect(input.attributes("step")).toBe("5");
  });

  it("emits update:modelValue with the parsed numeric value on input", async () => {
    const wrapper = mount(CuiSlider, { props: { modelValue: 10 } });
    const input = wrapper.get("input[type=range]");
    (input.element as HTMLInputElement).value = "75";
    await input.trigger("input");

    const events = wrapper.emitted("update:modelValue");
    expect(events).toHaveLength(1);
    expect(events![0]).toEqual([75]);
    expect(typeof events![0][0]).toBe("number");
  });

  it("clamps the native input value to max when set above range", async () => {
    const wrapper = mount(CuiSlider, { props: { modelValue: 0, min: 0, max: 10 } });
    const input = wrapper.get("input[type=range]");
    // The native range input clamps its own value to [min,max].
    (input.element as HTMLInputElement).value = "999";
    await input.trigger("input");

    const events = wrapper.emitted("update:modelValue");
    expect(events).toHaveLength(1);
    expect(events![0]).toEqual([10]);
  });

  it("clamps the native input value to min when set below range", async () => {
    const wrapper = mount(CuiSlider, { props: { modelValue: 50, min: 20, max: 80 } });
    const input = wrapper.get("input[type=range]");
    (input.element as HTMLInputElement).value = "-5";
    await input.trigger("input");

    const events = wrapper.emitted("update:modelValue");
    expect(events![0]).toEqual([20]);
  });

  it("exposes the step on the native input so it governs keyboard arrow increments", () => {
    const wrapper = mount(CuiSlider, { props: { modelValue: 0, min: 0, max: 100, step: 10 } });
    // Arrow-key stepping is delegated to the native range input (not simulated in jsdom).
    // Verify the contract that drives it: the step attribute is wired through.
    expect(wrapper.get("input[type=range]").attributes("step")).toBe("10");
  });

  it("disables the input when disabled", async () => {
    const wrapper = mount(CuiSlider, { props: { modelValue: 30, disabled: true } });
    const input = wrapper.get("input[type=range]");
    expect((input.element as HTMLInputElement).disabled).toBe(true);
  });

  it("reflects external modelValue updates onto the input", async () => {
    const wrapper = mount(CuiSlider, { props: { modelValue: 10 } });
    const input = wrapper.get("input[type=range]");
    expect((input.element as HTMLInputElement).value).toBe("10");

    await wrapper.setProps({ modelValue: 60 });
    expect((input.element as HTMLInputElement).value).toBe("60");
  });
});

// #172: the label prop rendered a <label> with no `for`, and formatValue never reached
// assistive tech. (The focus ring is checked in the browser suite.)
describe("CuiSlider accessibility", () => {
  it("names the range input with its label prop", () => {
    const wrapper = mount(CuiSlider, { props: { label: "Volume" }, attachTo: document.body });
    const input = wrapper.get("input[type=range]").element as HTMLInputElement;
    expect(input.id).toBeTruthy();
    expect([...input.labels!].map((l) => l.textContent!.trim())).toEqual(["Volume"]);
    wrapper.unmount();
  });

  it("points the label at a caller-supplied id", () => {
    const wrapper = mount(CuiSlider, { props: { label: "Volume", id: "vol" } });
    expect(wrapper.get("label").attributes("for")).toBe("vol");
    expect(wrapper.get("input[type=range]").attributes("id")).toBe("vol");
  });

  it("gives two sliders distinct ids", () => {
    const wrapper = mount({
      components: { CuiSlider },
      template: `<div><CuiSlider label="A" /><CuiSlider label="B" /></div>`,
    });
    const ids = wrapper.findAll("input[type=range]").map((i) => i.attributes("id"));
    expect(new Set(ids).size).toBe(2);
  });

  it("announces the formatted value via aria-valuetext", async () => {
    const wrapper = mount(CuiSlider, { props: { modelValue: 250, max: 1000, formatValue: (v: number) => `$${v}` } });
    expect(wrapper.get("input[type=range]").attributes("aria-valuetext")).toBe("$250");
    await wrapper.setProps({ modelValue: 300 });
    expect(wrapper.get("input[type=range]").attributes("aria-valuetext")).toBe("$300");
  });

  it("leaves aria-valuetext off without formatValue, so the number is announced as-is", () => {
    const wrapper = mount(CuiSlider, { props: { modelValue: 40 } });
    expect(wrapper.get("input[type=range]").attributes("aria-valuetext")).toBeUndefined();
  });
});
