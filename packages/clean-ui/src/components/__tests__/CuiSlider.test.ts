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

describe("CuiSlider id fallback", () => {
  it("falls back to a generated id for an empty id, so the label still names the input", () => {
    const wrapper = mount(CuiSlider, { props: { label: "Volume", id: "" } });
    const id = wrapper.get("input[type=range]").attributes("id");
    expect(id).toBeTruthy();
    expect(wrapper.get("label").attributes("for")).toBe(id);
  });
});

// #269 — motion where it helps: a click on the track glides; a drag and a keyboard step don't.
describe("CuiSlider motion", () => {
  const thumb = (w: ReturnType<typeof mount>) => w.get(".cui-slider__thumb").element as HTMLElement;
  const input = (w: ReturnType<typeof mount>) => w.get("input[type=range]");

  it("glides on a click's jump, but follows a drag with no transition", async () => {
    const w = mount(CuiSlider, { props: { modelValue: 10 }, attachTo: document.body });
    await input(w).trigger("pointerdown");
    (input(w).element as HTMLInputElement).value = "60";
    await input(w).trigger("input");
    expect(thumb(w).style.transition, "the click's jump").not.toBe("none");
    (input(w).element as HTMLInputElement).value = "65";
    await input(w).trigger("input");
    expect(thumb(w).style.transition, "now a drag").toBe("none");
    w.unmount();
  });

  it("ends a press released off the slider, on the document", async () => {
    const w = mount(CuiSlider, { props: { modelValue: 10 }, attachTo: document.body });
    await input(w).trigger("pointerdown");
    (input(w).element as HTMLInputElement).value = "20";
    await input(w).trigger("input");
    (input(w).element as HTMLInputElement).value = "30";
    await input(w).trigger("input");
    document.dispatchEvent(new Event("pointerup"));
    await w.vm.$nextTick();
    expect(thumb(w).style.transition).not.toBe("none");
    expect(thumb(w).style.boxShadow).not.toContain("8px");
    w.unmount();
  });

  it("steps from the keyboard with no transition, and animates a v-model change", async () => {
    const w = mount(CuiSlider, { props: { modelValue: 10 }, attachTo: document.body });
    await input(w).trigger("keydown", { key: "ArrowRight" });
    expect(thumb(w).style.transition).toBe("none");
    await input(w).trigger("pointerdown");
    document.dispatchEvent(new Event("pointerup"));
    await w.setProps({ modelValue: 50 });
    expect(thumb(w).style.transition).not.toBe("none");
    w.unmount();
  });

  it("leaves a later v-model change gliding after Tab, or once the slider is left", async () => {
    const w = mount(CuiSlider, { props: { modelValue: 10 }, attachTo: document.body });
    await input(w).trigger("keydown", { key: "Tab" });
    await w.setProps({ modelValue: 30 });
    expect(thumb(w).style.transition, "Tab moves nothing").not.toBe("none");
    await input(w).trigger("keydown", { key: "ArrowRight" });
    expect(thumb(w).style.transition).toBe("none");
    await input(w).trigger("blur");
    await w.setProps({ modelValue: 50 });
    expect(thumb(w).style.transition, "left, then reset from outside").not.toBe("none");
    w.unmount();
  });

  it("doesn't start a press on a right-click", async () => {
    const w = mount(CuiSlider, { props: { modelValue: 10 }, attachTo: document.body });
    await input(w).trigger("pointerdown", { button: 2 });
    expect(thumb(w).style.boxShadow).not.toContain("8px");
    w.unmount();
  });
});
