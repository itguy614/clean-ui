import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { h, nextTick, type Component } from "vue";
import CuiFormField from "../CuiFormField.vue";
import CuiInput from "../CuiInput.vue";
import CuiTextarea from "../CuiTextarea.vue";
import CuiMaskedInput from "../CuiMaskedInput.vue";
import CuiInputStepper from "../CuiInputStepper.vue";
import CuiSelect from "../CuiSelect.vue";
import CuiDatePicker from "../CuiDatePicker.vue";
import CuiTimePicker from "../CuiTimePicker.vue";
import { __clearWarned } from "../../utils/devWarn";

/**
 * #191 — `labelPosition="floating"`. The motion is CSS (see the browser suite); what is
 * checked here is the wiring: the label stays a real, associated <label>; supported controls
 * mark their native element and get the single-space placeholder `:placeholder-shown`
 * needs; everything else is left unmarked, so the field falls back to `top`, and says so.
 */
function mountField(
  control: Component,
  fieldProps: Record<string, unknown> = {},
  controlProps: Record<string, unknown> = {},
  slots: Record<string, () => unknown> = {},
) {
  return mount(CuiFormField, {
    props: { label: "Email", labelPosition: "floating", ...fieldProps },
    slots: { default: (f: Record<string, unknown>) => h(control, { ...f, ...controlProps }, slots) },
    attachTo: document.body,
  });
}

describe("CuiFormField labelPosition=floating", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    __clearWarned();
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
    document.body.innerHTML = "";
  });

  const floatWarnings = () => warn.mock.calls.filter(([m]) => String(m).includes('labelPosition="floating"'));

  it("keeps the label a real <label>, associated with the input", () => {
    const w = mountField(CuiInput);
    const label = w.find("label.cui-form-field__label");
    const input = w.find("input");
    expect(w.classes()).toContain("cui-form-field--floating");
    expect(label.attributes("for")).toBe(input.attributes("id"));
    expect(input.attributes("aria-labelledby")).toBe(label.attributes("id"));
    expect(label.text()).toContain("Email");
    // Never swapped for a placeholder: the only placeholder is the invisible empty test.
    expect(input.attributes("placeholder")).toBe(" ");
  });

  it("wires required and the error message exactly as a top label does", () => {
    const w = mountField(CuiInput, { required: true, error: true, errorMessage: "Enter an email" });
    const input = w.find("input");
    expect(input.attributes("aria-required")).toBe("true");
    expect(input.attributes("aria-invalid")).toBe("true");
    expect(w.find(".cui-form-field__required").exists()).toBe(true);
    expect(w.find(".cui-form-field__label .cui-sr-only").exists()).toBe(true);
    const error = w.find(".cui-form-field__error");
    expect(error.text()).toBe("Enter an email");
    expect(input.attributes("aria-describedby")).toContain(error.attributes("id"));
  });

  it("marks each supported control with how its label rests", () => {
    const marker = (control: Component, props = {}, slots = {}) =>
      mountField(control, {}, props, slots).find("[data-cui-float-label]").attributes("data-cui-float-label");
    expect(marker(CuiInput)).toBe("inline md");
    expect(marker(CuiInput, { size: "lg", type: "number" })).toBe("inline lg");
    expect(marker(CuiTextarea, { size: "sm" })).toBe("multiline sm");
    expect(marker(CuiMaskedInput, { mask: "(999) 999-9999" })).toBe("inline md");
    // Something sits where the label would rest, so it stays up.
    expect(marker(CuiInput, {}, { prefix: () => "$" })).toBe("pinned");
    expect(marker(CuiInput, {}, { "suffix-button": () => h("button", "Go") })).toBe("pinned");
    expect(marker(CuiInputStepper)).toBe("pinned");
    expect(floatWarnings()).toEqual([]);
  });

  it("keeps a control's own placeholder", () => {
    const w = mountField(CuiInput, {}, { placeholder: "you@example.com" });
    expect(w.find("input").attributes("placeholder")).toBe("you@example.com");
  });

  it("leaves controls alone outside a floating field", () => {
    for (const labelPosition of ["top", "left"]) {
      const w = mountField(CuiInput, { labelPosition });
      expect(w.find("input").attributes("placeholder")).toBeUndefined();
      expect(w.find("[data-cui-float-label]").exists()).toBe(false);
    }
    expect(mount(CuiInput).find("[data-cui-float-label]").exists()).toBe(false);
  });

  it.each([
    ["CuiSelect", CuiSelect, { options: [{ value: "a", label: "Alpha" }] }],
    // Both render a supported control inside; neither may claim support through it.
    ["CuiDatePicker", CuiDatePicker, {}],
    ["CuiTimePicker", CuiTimePicker, {}],
  ])("falls back to top on %s, with a warning", (_, control, props) => {
    const w = mountField(control as Component, {}, props);
    expect(w.find("[data-cui-float-label]").exists()).toBe(false);
    expect(floatWarnings()).toHaveLength(1);
    expect(String(floatWarnings()[0][0])).toContain('"Email"');
    // The label is still wired to the control.
    expect(w.find("label").attributes("for")).toBeTruthy();
  });

  it("marks only the control the label names, not an input inside a composite", () => {
    // A CuiInput without the field's id, as a transfer list's filter box or a grid's search is.
    const w = mount(CuiFormField, {
      props: { label: "Members", labelPosition: "floating" },
      slots: { default: () => h("div", [h(CuiInput, { placeholder: "Filter" })]) },
      attachTo: document.body,
    });
    expect(w.find("[data-cui-float-label]").exists()).toBe(false);
    expect(w.find("input").attributes("placeholder")).toBe("Filter");
    expect(floatWarnings()).toHaveLength(1);
  });

  it("warns when switched to floating around an unsupported control", async () => {
    const w = mountField(CuiSelect, { labelPosition: "top" }, { options: [] });
    expect(floatWarnings()).toEqual([]);
    await w.setProps({ labelPosition: "floating" });
    await nextTick();
    expect(floatWarnings()).toHaveLength(1);
  });

  it("does not warn for a field without a label", () => {
    mountField(CuiSelect, { label: undefined }, { options: [] });
    expect(floatWarnings()).toEqual([]);
  });
});
