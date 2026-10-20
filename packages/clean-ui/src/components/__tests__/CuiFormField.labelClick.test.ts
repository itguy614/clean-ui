import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import CuiFormField from "../CuiFormField.vue";
import CuiCheckbox from "../CuiCheckbox.vue";
import CuiSelect from "../CuiSelect.vue";
import CuiDatePicker from "../CuiDatePicker.vue";
import CuiTimePicker from "../CuiTimePicker.vue";
import CuiToggle from "../CuiToggle.vue";
import CuiRadioGroup from "../CuiRadioGroup.vue";
import CuiRadio from "../CuiRadio.vue";

/**
 * #181 — a <label for> works only on a labelable element. CuiCheckbox's root is a <label> and
 * CuiSelect's trigger a div[role=combobox], so clicking a CuiFormField label above them did
 * nothing. The field now focuses such a control itself.
 */

function mountField(control: (f: Record<string, unknown>) => ReturnType<typeof h>, props: Record<string, unknown> = {}) {
  return mount(CuiFormField, {
    props: { label: "Field", ...props },
    slots: { default: (f: Record<string, unknown>) => control(f) },
    attachTo: document.body,
  });
}

describe("CuiFormField label click", () => {
  // Each mount is a fresh app, so generated ids repeat; leftovers (a teleported calendar)
  // would answer getElementById for the next test.
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("focuses and toggles a checkbox, whose root isn't labelable, as a native label would", async () => {
    const w = mountField((f) => h(CuiCheckbox, { id: f.id as string }));
    await w.find(".cui-form-field__label").trigger("click");
    const box = w.find('[role="checkbox"]');
    expect(document.activeElement).toBe(box.element);
    expect(w.findComponent(CuiCheckbox).emitted("update:modelValue")).toEqual([[true]]);
    w.unmount();
  });

  it("toggles a switch", async () => {
    const w = mountField((f) => h(CuiToggle, { id: f.id as string }));
    await w.find(".cui-form-field__label").trigger("click");
    expect(w.findComponent(CuiToggle).emitted("update:modelValue")).toEqual([[true]]);
    w.unmount();
  });

  it("does nothing for a disabled control", async () => {
    const w = mountField((f) => h(CuiCheckbox, { id: f.id as string, disabled: true }));
    await w.find(".cui-form-field__label").trigger("click");
    expect(document.activeElement).toBe(document.body);
    expect(w.findComponent(CuiCheckbox).emitted("update:modelValue")).toBeUndefined();
    w.unmount();
  });

  it("moves into a group to its tab stop", async () => {
    const w = mountField((f) =>
      h(CuiRadioGroup, { id: f.id as string, modelValue: "b" }, () => [h(CuiRadio, { value: "a", label: "A" }), h(CuiRadio, { value: "b", label: "B" })]),
    );
    await w.vm.$nextTick();
    await w.find(".cui-form-field__label").trigger("click");
    expect(document.activeElement?.getAttribute("role")).toBe("radio");
    w.unmount();
  });

  it("focuses a select's combobox trigger", async () => {
    const w = mountField((f) => h(CuiSelect, { id: f.id as string, options: ["a", "b"] }));
    await w.find(".cui-form-field__label").trigger("click");
    expect(document.activeElement).toBe(w.find('[role="combobox"]').element);
    w.unmount();
  });

  it("focuses a time picker's combobox trigger", async () => {
    const w = mountField((f) => h(CuiTimePicker, { id: f.id as string }));
    await w.find(".cui-form-field__label").trigger("click");
    expect(document.activeElement).toBe(w.find('[role="combobox"]').element);
    w.unmount();
  });

  it("leaves a date picker's native input to the label's own activation", async () => {
    const w = mountField((f) => h(CuiDatePicker, { id: f.id as string }));
    const input = document.getElementById(w.find(".cui-form-field__label").attributes("for")!) as HTMLInputElement;
    expect(input.tagName).toBe("INPUT"); // labelable: the browser focuses it
    let focusCalls = 0;
    input.focus = () => focusCalls++;
    await w.find(".cui-form-field__label").trigger("click");
    expect(focusCalls).toBe(0);
    w.unmount();
  });

  it("leaves a native input to the label's own behaviour", async () => {
    const w = mountField((f) => h("input", { id: f.id as string }));
    const input = w.find("input").element as HTMLInputElement;
    let focusCalls = 0;
    input.focus = () => focusCalls++;
    await w.find(".cui-form-field__label").trigger("click");
    expect(focusCalls).toBe(0); // the browser's label activation handles it
    w.unmount();
  });
});
