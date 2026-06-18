import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import CuiToggleGroup from "../CuiToggleGroup.vue";
import CuiToggle from "../CuiToggle.vue";

describe("CuiToggleGroup", () => {
  it("adds a toggle's value to the array v-model when clicked", async () => {
    const wrapper = mount(CuiToggleGroup, {
      props: { modelValue: [] },
      slots: {
        default: () => [
          h(CuiToggle, { value: "a", label: "A" }),
          h(CuiToggle, { value: "b", label: "B" }),
        ],
      },
    });

    const toggles = wrapper.findAllComponents(CuiToggle);
    await toggles[0].trigger("click");

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    expect(emitted![0][0]).toEqual(["a"]);
  });

  it("removes a value from the array v-model when an already-selected toggle is clicked", async () => {
    const wrapper = mount(CuiToggleGroup, {
      props: { modelValue: ["a", "b"] },
      slots: {
        default: () => [
          h(CuiToggle, { value: "a", label: "A" }),
          h(CuiToggle, { value: "b", label: "B" }),
        ],
      },
    });

    const toggles = wrapper.findAllComponents(CuiToggle);
    await toggles[0].trigger("click");

    expect(wrapper.emitted("update:modelValue")![0][0]).toEqual(["b"]);
  });

  it("reflects the group's selected values as aria-checked on child toggles", () => {
    const wrapper = mount(CuiToggleGroup, {
      props: { modelValue: ["b"] },
      slots: {
        default: () => [
          h(CuiToggle, { value: "a", label: "A" }),
          h(CuiToggle, { value: "b", label: "B" }),
        ],
      },
    });

    const toggles = wrapper.findAllComponents(CuiToggle);
    expect(toggles[0].attributes("aria-checked")).toBe("false");
    expect(toggles[1].attributes("aria-checked")).toBe("true");
  });

  it("does not emit when the group is disabled", async () => {
    const wrapper = mount(CuiToggleGroup, {
      props: { modelValue: [], disabled: true },
      slots: {
        default: () => [h(CuiToggle, { value: "a", label: "A" })],
      },
    });

    const toggle = wrapper.findComponent(CuiToggle);
    expect(toggle.attributes("aria-disabled")).toBe("true");
    await toggle.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeFalsy();
  });

  it("standalone CuiToggle emits boolean update:modelValue toggling its value", async () => {
    const wrapper = mount(CuiToggle, {
      props: { modelValue: false, label: "Solo" },
    });

    await wrapper.trigger("click");
    expect(wrapper.emitted("update:modelValue")![0]).toEqual([true]);

    await wrapper.setProps({ modelValue: true });
    await wrapper.trigger("click");
    expect(wrapper.emitted("update:modelValue")![1]).toEqual([false]);
  });

  it("uses vertical orientation automatically for 3+ child toggles", () => {
    const wrapper = mount(CuiToggleGroup, {
      props: { modelValue: [] },
      slots: {
        default: () => [
          h(CuiToggle, { value: "a", label: "A" }),
          h(CuiToggle, { value: "b", label: "B" }),
          h(CuiToggle, { value: "c", label: "C" }),
        ],
      },
    });

    expect(wrapper.classes()).toContain("cui-toggle-group--vertical");
  });
});
