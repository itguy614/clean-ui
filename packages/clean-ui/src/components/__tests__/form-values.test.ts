import { describe, it, expect, afterEach } from "vitest";
import { mount, enableAutoUnmount } from "@vue/test-utils";
import { nextTick, type Component } from "vue";
import CuiSelect from "../CuiSelect.vue";
import CuiCombobox from "../CuiCombobox.vue";
import CuiTagInput from "../CuiTagInput.vue";

enableAutoUnmount(afterEach);

// #303 (and #174): each listbox field posts its values under `name`, never its search text.
// CuiCombobox and CuiTagInput used to put `name` on the search input, so a post carried the
// half-typed draft, or the option's label.
const options = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana" },
];

function inForm(component: Component, props: Record<string, unknown>) {
  const w = mount(
    { components: { C: component }, template: `<form @change="changes++"><C v-bind="p" /></form>`, data: () => ({ p: props, changes: 0 }) },
    { attachTo: document.body },
  );
  const post = () => new FormData(w.find("form").element).getAll("f");
  return { w, post, vm: w.vm as unknown as { p: Record<string, unknown>; changes: number } };
}

describe.each([
  ["CuiSelect", CuiSelect, { options }],
  ["CuiCombobox", CuiCombobox, { options }],
])("%s posts its value", (_name, component, base) => {
  it("single: the value, not the label; empty when nothing is selected", () => {
    expect(inForm(component, { ...base, name: "f", modelValue: "b" }).post()).toEqual(["b"]);
    expect(inForm(component, { ...base, name: "f", modelValue: null }).post()).toEqual([""]);
  });

  it("multiple: one entry per value, none when empty", () => {
    expect(inForm(component, { ...base, name: "f", multiple: true, modelValue: ["a", "b"] }).post()).toEqual(["a", "b"]);
    expect(inForm(component, { ...base, name: "f", multiple: true, modelValue: [] }).post()).toEqual([]);
  });
});

describe("CuiTagInput posts its tags", () => {
  it("one entry per tag, and never the half-typed text", async () => {
    const { w, post } = inForm(CuiTagInput, { name: "f", modelValue: ["vue", "ts"] });
    await w.find("input:not([type=hidden])").setValue("rea");
    expect(post()).toEqual(["vue", "ts"]);
  });
});

describe("CuiCombobox never posts its search text", () => {
  it("keeps the typed query out of the form", async () => {
    const { w, post } = inForm(CuiCombobox, { options, name: "f", modelValue: "a" });
    const input = w.find("input:not([type=hidden])");
    input.element.dispatchEvent(new FocusEvent("focus"));
    await input.setValue("Ban");
    expect(post()).toEqual(["a"]);
  });
});

describe("the form hears value changes", () => {
  it.each([
    ["CuiCombobox", CuiCombobox, { options, modelValue: "a" }, "b"],
    ["CuiTagInput", CuiTagInput, { modelValue: ["vue"] }, ["vue", "ts"]],
  ])("%s fires change", async (_n, component, props, next) => {
    const { vm } = inForm(component, { ...props, name: "f" });
    vm.p = { ...vm.p, modelValue: next };
    await nextTick();
    await nextTick();
    expect(vm.changes).toBe(1);
  });
});
