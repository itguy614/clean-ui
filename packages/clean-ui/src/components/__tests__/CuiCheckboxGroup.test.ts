import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import CuiCheckboxGroup from "../CuiCheckboxGroup.vue";
import CuiCheckbox from "../CuiCheckbox.vue";

describe("CuiCheckboxGroup", () => {
  it("checking a child checkbox adds its value to the group v-model array", async () => {
    const Host = defineComponent({
      setup() {
        const selected = ref<Array<string | number>>([]);
        return { selected };
      },
      render() {
        return h(
          CuiCheckboxGroup,
          {
            modelValue: this.selected,
            "onUpdate:modelValue": (v: Array<string | number>) => (this.selected = v),
          },
          () => [
            h(CuiCheckbox, { value: "a", label: "A" }),
            h(CuiCheckbox, { value: "b", label: "B" }),
          ],
        );
      },
    });

    const wrapper = mount(Host);
    const boxes = wrapper.findAllComponents(CuiCheckbox);
    expect(boxes).toHaveLength(2);

    await boxes[0].trigger("click");
    expect(wrapper.vm.selected).toEqual(["a"]);

    await boxes[1].trigger("click");
    expect(wrapper.vm.selected).toEqual(["a", "b"]);
  });

  it("clicking a checked child removes its value from the array", async () => {
    const Host = defineComponent({
      setup() {
        const selected = ref<Array<string | number>>(["a", "b"]);
        return { selected };
      },
      render() {
        return h(
          CuiCheckboxGroup,
          {
            modelValue: this.selected,
            "onUpdate:modelValue": (v: Array<string | number>) => (this.selected = v),
          },
          () => [
            h(CuiCheckbox, { value: "a", label: "A" }),
            h(CuiCheckbox, { value: "b", label: "B" }),
          ],
        );
      },
    });

    const wrapper = mount(Host);
    const boxes = wrapper.findAllComponents(CuiCheckbox);

    await boxes[0].trigger("click");
    expect(wrapper.vm.selected).toEqual(["b"]);
  });

  it("reflects checked state from the group model via aria-checked", () => {
    const wrapper = mount(CuiCheckboxGroup, {
      props: { modelValue: ["b"] },
      slots: {
        default: () => [
          h(CuiCheckbox, { value: "a", label: "A" }),
          h(CuiCheckbox, { value: "b", label: "B" }),
        ],
      },
    });
    const boxes = wrapper.findAllComponents(CuiCheckbox);
    expect(boxes[0].attributes("aria-checked")).toBe("false");
    expect(boxes[1].attributes("aria-checked")).toBe("true");
  });

  it("standalone checkbox uses a boolean v-model", async () => {
    const wrapper = mount(CuiCheckbox, {
      props: {
        modelValue: false,
        label: "Standalone",
        "onUpdate:modelValue": (v: boolean) => wrapper.setProps({ modelValue: v }),
      },
    });
    expect(wrapper.attributes("aria-checked")).toBe("false");

    await wrapper.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([true]);
    expect(wrapper.attributes("aria-checked")).toBe("true");
  });

  it("a disabled group does not mutate the model when a child is clicked", async () => {
    const Host = defineComponent({
      setup() {
        const selected = ref<Array<string | number>>([]);
        return { selected };
      },
      render() {
        return h(
          CuiCheckboxGroup,
          {
            modelValue: this.selected,
            disabled: true,
            "onUpdate:modelValue": (v: Array<string | number>) => (this.selected = v),
          },
          () => [h(CuiCheckbox, { value: "a", label: "A" })],
        );
      },
    });

    const wrapper = mount(Host);
    const box = wrapper.findComponent(CuiCheckbox);
    expect(box.attributes("aria-disabled")).toBe("true");

    await box.trigger("click");
    expect(wrapper.vm.selected).toEqual([]);
  });

  it("auto orientation is horizontal for 2 children and vertical for 3+", () => {
    const twoChildren = mount(CuiCheckboxGroup, {
      slots: {
        default: () => [
          h(CuiCheckbox, { value: "a" }),
          h(CuiCheckbox, { value: "b" }),
        ],
      },
    });
    expect(twoChildren.classes()).toContain("cui-checkbox-group--horizontal");

    const threeChildren = mount(CuiCheckboxGroup, {
      slots: {
        default: () => [
          h(CuiCheckbox, { value: "a" }),
          h(CuiCheckbox, { value: "b" }),
          h(CuiCheckbox, { value: "c" }),
        ],
      },
    });
    expect(threeChildren.classes()).toContain("cui-checkbox-group--vertical");
  });
});
