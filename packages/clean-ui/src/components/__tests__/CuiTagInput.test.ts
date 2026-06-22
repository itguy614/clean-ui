import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CuiTagInput from "../CuiTagInput.vue";

describe("CuiTagInput", () => {
  it("appends a created tag to the v-model array on Enter", async () => {
    const wrapper = mount(CuiTagInput, {
      props: { modelValue: ["alpha"] },
      attachTo: document.body,
    });

    const input = wrapper.find("input");
    await input.setValue("beta");
    await input.trigger("keydown", { key: "Enter" });

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    expect(emitted!.at(-1)![0]).toEqual(["alpha", "beta"]);

    wrapper.unmount();
  });

  it("does not add a duplicate tag", async () => {
    const wrapper = mount(CuiTagInput, {
      props: { modelValue: ["alpha"] },
      attachTo: document.body,
    });

    const input = wrapper.find("input");
    await input.setValue("alpha");
    await input.trigger("keydown", { key: "Enter" });

    // Already present -> addTag bails before emitting.
    expect(wrapper.emitted("update:modelValue")).toBeFalsy();

    wrapper.unmount();
  });

  it("removes the last tag on Backspace with an empty query", async () => {
    const wrapper = mount(CuiTagInput, {
      props: { modelValue: ["alpha", "beta"] },
      attachTo: document.body,
    });

    const input = wrapper.find("input");
    await input.trigger("keydown", { key: "Backspace" });

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    expect(emitted!.at(-1)![0]).toEqual(["alpha"]);

    wrapper.unmount();
  });

  it("renders the createText label in the create-new dropdown row", async () => {
    const wrapper = mount(CuiTagInput, {
      props: { modelValue: [], createText: "Make tag" },
      attachTo: document.body,
    });

    const input = wrapper.find("input");
    await input.trigger("focus");
    await input.setValue("gamma");
    await wrapper.vm.$nextTick();

    // Dropdown teleports to body.
    expect(document.body.textContent).toContain("Make tag");
    expect(document.body.textContent).toContain("gamma");

    wrapper.unmount();
  });

  it("does not create when allowCreate is false", async () => {
    const wrapper = mount(CuiTagInput, {
      props: { modelValue: [], allowCreate: false },
      attachTo: document.body,
    });

    const input = wrapper.find("input");
    await input.setValue("delta");
    await input.trigger("keydown", { key: "Enter" });

    expect(wrapper.emitted("update:modelValue")).toBeFalsy();

    wrapper.unmount();
  });
});
