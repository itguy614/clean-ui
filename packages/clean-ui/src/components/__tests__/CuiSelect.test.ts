import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CuiSelect from "../CuiSelect.vue";

const OPTIONS = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana" },
  { value: "c", label: "Cherry" },
];

function bodyOptions() {
  return Array.from(
    document.querySelectorAll(".cui-select__dropdown .cui-select__option"),
  ) as HTMLElement[];
}

describe("CuiSelect behavior", () => {
  it("opens the listbox on trigger click", async () => {
    const wrapper = mount(CuiSelect, {
      props: { options: OPTIONS },
      attachTo: document.body,
    });

    // Closed initially: no dropdown teleported, combobox not expanded.
    expect(document.querySelector(".cui-select__dropdown")).toBeNull();
    expect(wrapper.get('[role="combobox"]').attributes("aria-expanded")).toBe("false");

    await wrapper.get('[role="combobox"]').trigger("click");

    expect(document.querySelector(".cui-select__dropdown")).not.toBeNull();
    expect(wrapper.get('[role="combobox"]').attributes("aria-expanded")).toBe("true");
    expect(bodyOptions()).toHaveLength(3);

    wrapper.unmount();
  });

  it("selecting an option emits the value and closes (single)", async () => {
    const wrapper = mount(CuiSelect, {
      props: { options: OPTIONS },
      attachTo: document.body,
    });

    await wrapper.get('[role="combobox"]').trigger("click");
    bodyOptions()[1].click();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("update:modelValue")).toEqual([["b"]]);
    // Single select closes after choosing.
    expect(document.querySelector(".cui-select__dropdown")).toBeNull();

    wrapper.unmount();
  });

  it("multiple accumulates an array and stays open", async () => {
    const wrapper = mount(CuiSelect, {
      props: { options: OPTIONS, multiple: true, modelValue: [] },
      attachTo: document.body,
    });

    await wrapper.get('[role="combobox"]').trigger("click");

    bodyOptions()[0].click();
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("update:modelValue")!.at(-1)).toEqual([["a"]]);
    // Stays open in multiple mode.
    expect(document.querySelector(".cui-select__dropdown")).not.toBeNull();

    // Simulate the parent committing the first selection, then pick a second.
    await wrapper.setProps({ modelValue: ["a"] });
    bodyOptions()[2].click();
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("update:modelValue")!.at(-1)).toEqual([["a", "c"]]);

    wrapper.unmount();
  });

  it("clearable emits null to clear the value", async () => {
    const wrapper = mount(CuiSelect, {
      props: { options: OPTIONS, clearable: true, modelValue: "a" },
      attachTo: document.body,
    });

    const clearBtn = wrapper.get(".cui-select__clear");
    await clearBtn.trigger("click");

    expect(wrapper.emitted("update:modelValue")).toEqual([[null]]);

    wrapper.unmount();
  });

  it("shows the placeholder when empty and the label when a value is set", async () => {
    const wrapper = mount(CuiSelect, {
      props: { options: OPTIONS, placeholder: "Pick a fruit" },
      attachTo: document.body,
    });

    expect(wrapper.get(".cui-select__placeholder").text()).toBe("Pick a fruit");
    expect(wrapper.find(".cui-select__label").exists()).toBe(false);

    await wrapper.setProps({ modelValue: "c" });

    expect(wrapper.find(".cui-select__placeholder").exists()).toBe(false);
    expect(wrapper.get(".cui-select__label").text()).toBe("Cherry");

    wrapper.unmount();
  });
});
