import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import CuiRadioGroup from "../CuiRadioGroup.vue";
import CuiRadio from "../CuiRadio.vue";
import { describeRovingFocusContract } from "../../composables/__tests__/roving-focus-contract";

function mountGroup(props: Record<string, unknown> = {}) {
  return mount(CuiRadioGroup, {
    props,
    slots: {
      default: () => [
        h(CuiRadio, { value: "a", label: "Apple" }),
        h(CuiRadio, { value: "b", label: "Banana" }),
        h(CuiRadio, { value: "c", label: "Cherry" }),
      ],
    },
  });
}

describe("CuiRadioGroup", () => {
  it("reflects the group modelValue as the checked child", () => {
    const wrapper = mountGroup({ modelValue: "b" });
    const radios = wrapper.findAllComponents(CuiRadio);
    expect(radios[0].find('[role="radio"]').attributes("aria-checked")).toBe("false");
    expect(radios[1].find('[role="radio"]').attributes("aria-checked")).toBe("true");
    expect(radios[2].find('[role="radio"]').attributes("aria-checked")).toBe("false");
  });

  it("emits update:modelValue with the clicked radio's value", async () => {
    const wrapper = mountGroup({ modelValue: "a" });
    const radios = wrapper.findAllComponents(CuiRadio);
    await radios[2].find('[role="radio"]').trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")![0]).toEqual(["c"]);
  });

  it("selecting a new radio deselects the previously selected one", async () => {
    const wrapper = mountGroup({ modelValue: "a" });
    await wrapper.find('[role="radio"]'); // ensure rendered
    const radios = wrapper.findAllComponents(CuiRadio);

    await radios[1].find('[role="radio"]').trigger("click");
    // parent owns the value; emulate v-model by writing the prop back
    await wrapper.setProps({ modelValue: wrapper.emitted("update:modelValue")!.at(-1)![0] });

    expect(radios[0].find('[role="radio"]').attributes("aria-checked")).toBe("false");
    expect(radios[1].find('[role="radio"]').attributes("aria-checked")).toBe("true");
    expect(radios[2].find('[role="radio"]').attributes("aria-checked")).toBe("false");
  });

  it("does not emit when the group is disabled", async () => {
    const wrapper = mountGroup({ modelValue: "a", disabled: true });
    const radios = wrapper.findAllComponents(CuiRadio);
    await radios[1].find('[role="radio"]').trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeFalsy();
  });

  it("renders children as buttons when variant='buttons'", () => {
    const wrapper = mountGroup({ modelValue: "a", variant: "buttons" });
    const buttons = wrapper.findAll("button.cui-radio-button");
    // button variant renders <button> elements (not <label>) inside a button group
    expect(buttons).toHaveLength(3);
    expect(buttons[0].attributes("role")).toBe("radio");
    expect(buttons[0].classes()).toContain("cui-radio-button--active");
    expect(buttons[1].classes()).not.toContain("cui-radio-button--active");
    expect(wrapper.find(".cui-radio-group--buttons").exists()).toBe(true);
  });

  it("button variant still drives selection through the group", async () => {
    const wrapper = mountGroup({ modelValue: "a", variant: "buttons" });
    const buttons = wrapper.findAll("button.cui-radio-button");
    await buttons[2].trigger("click");
    expect(wrapper.emitted("update:modelValue")![0]).toEqual(["c"]);
  });
});

// #231 — a radio group is one tab stop; arrows move (and select) with wrapping.
describeRovingFocusContract("CuiRadioGroup", {
  mount: () => mount(CuiRadioGroup, {
    props: { modelValue: "a" },
    attachTo: document.body,
    slots: { default: () => ["a", "b", "c"].map((v) => h(CuiRadio, { value: v, label: v })) },
  }),
  items: () => [...document.querySelectorAll<HTMLElement>('[role="radio"]')],
  orientation: "vertical",
  wrap: true,
});

describe("CuiRadioGroup tab stop (#231)", () => {
  it("puts the stop on the checked radio, and -1 on the rest", async () => {
    const wrapper = mount(CuiRadioGroup, {
      props: { modelValue: "b" },
      attachTo: document.body,
      slots: { default: () => ["a", "b", "c"].map((v) => h(CuiRadio, { value: v, label: v })) },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('[role="radio"]').map((r) => r.attributes("tabindex"))).toEqual(["-1", "0", "-1"]);
    wrapper.unmount();
  });

  it("leaves a standalone radio at its own tab stop", () => {
    const wrapper = mount(CuiRadio, { props: { value: "x", label: "X" } });
    expect(wrapper.get('[role="radio"]').attributes("tabindex")).toBe("0");
  });
});
