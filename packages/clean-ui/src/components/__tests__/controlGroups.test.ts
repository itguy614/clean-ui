import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { Fragment, h } from "vue";
import CuiCheckboxGroup from "../CuiCheckboxGroup.vue";
import CuiCheckbox from "../CuiCheckbox.vue";
import CuiToggleGroup from "../CuiToggleGroup.vue";
import CuiToggle from "../CuiToggle.vue";
import CuiRadioGroup from "../CuiRadioGroup.vue";
import CuiRadio from "../CuiRadio.vue";

/**
 * #206 — the three form-control groups share their orientation logic, the multi-select pair
 * shares its provider, and all three share the .cui-control-group layout. What a shared
 * implementation tends to get wrong is the identity: a toggle group emitting checkbox-group
 * classes, or a checkbox inside a toggle group finding a context. Each group keeps its own.
 */
const GROUPS = [
  { name: "checkbox", Group: CuiCheckboxGroup, Item: CuiCheckbox, role: "group", others: ["toggle", "radio"] },
  { name: "toggle", Group: CuiToggleGroup, Item: CuiToggle, role: "group", others: ["checkbox", "radio"] },
  { name: "radio", Group: CuiRadioGroup, Item: CuiRadio, role: "radiogroup", others: ["checkbox", "toggle"] },
] as const;

describe.each(GROUPS)("Cui%sGroup's own identity", ({ name, Group, Item, role, others }) => {
  const mountGroup = (props: Record<string, unknown> = {}, count = 3) =>
    mount(Group as never, {
      props: { label: "Options", ...props },
      slots: { default: () => Array.from({ length: count }, (_, i) => h(Item as never, { value: `v${i}`, label: `Option ${i}` })) },
    });

  it("carries its own classes beside the shared ones, and no other group's", () => {
    const w = mountGroup({ error: true, errorMessage: "Pick one" });
    const root = w.element as HTMLElement;
    expect(root.classList).toContain(`cui-${name}-group`);
    expect(root.classList).toContain("cui-control-group");
    expect(root.classList).toContain(`cui-${name}-group--error`);
    expect(w.find(`.cui-${name}-group__options.cui-control-group__options`).exists()).toBe(true);
    expect(w.find(`.cui-${name}-group__error.cui-control-group__error`).text()).toBe("Pick one");
    for (const other of others) expect(w.html()).not.toContain(`cui-${other}-group`);
    expect(root.getAttribute("role")).toBe(role);
  });

  it("lays out two options in a row and three in a column, unless told", async () => {
    expect(mountGroup({}, 2).classes()).toContain("cui-control-group--horizontal");
    expect(mountGroup({}, 3).classes()).toContain("cui-control-group--vertical");
    expect(mountGroup({ orientation: "horizontal" }, 3).classes()).toContain(`cui-${name}-group--horizontal`);
  });

  it("counts the options of a v-for, not the fragment holding them", () => {
    const w = mount(Group as never, {
      props: { label: "Options" },
      // What a template `v-for` compiles to: one Fragment holding the options.
      slots: { default: () => [h(Fragment, null, [0, 1, 2].map((i) => h(Item as never, { value: `v${i}`, label: `${i}` })))] },
    });
    expect(w.classes()).toContain("cui-control-group--vertical");
  });
});

describe("multi-select groups provide under their own key", () => {
  it("a checkbox inside a toggle group stays standalone", async () => {
    const w = mount(CuiToggleGroup, {
      props: { modelValue: [], label: "Options" },
      slots: { default: () => h(CuiCheckbox, { value: "a", label: "A" }) },
    });
    await w.find("input").setValue(true);
    expect(w.emitted("update:modelValue")).toBeUndefined();
  });

  it("toggles one value in and out of the array", async () => {
    const w = mount(CuiCheckboxGroup, {
      props: { modelValue: ["a"], label: "Options", "onUpdate:modelValue": (v: unknown) => w.setProps({ modelValue: v as string[] }) },
      slots: { default: () => [h(CuiCheckbox, { value: "a", label: "A" }), h(CuiCheckbox, { value: "b", label: "B" })] },
    });
    await w.findAll("label")[1].trigger("click");
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual([["a", "b"]]);
    await w.findAll("label")[0].trigger("click");
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual([["b"]]);
  });
});
