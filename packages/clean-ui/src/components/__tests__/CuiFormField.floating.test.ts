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
import CuiIcon from "../CuiIcon.vue";
import { FLOATING_LABEL_SCALE, INPUT_SIZE_SCALE } from "../../utils/sizing";
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
    expect(marker(CuiTextarea, { size: "xl" })).toBe("multiline xl");
    expect(marker(CuiMaskedInput, { mask: "(999) 999-9999" })).toBe("inline md");
    // A leading icon: the label rests after it.
    expect(marker(CuiInput, {}, { prefix: () => h(CuiIcon, { name: "x" }) })).toBe("inline md lead");
    // Something sits where the label would rest, or is part of the value, so it stays up.
    expect(marker(CuiInput, {}, { prefix: () => "https://" })).toBe("pinned md");
    expect(marker(CuiInput, {}, { prefix: () => h(CuiIcon, { name: "x", size: "lg" }) })).toBe("pinned md");
    expect(marker(CuiInput, {}, { "suffix-button": () => h("button", "Go") })).toBe("pinned md");
    expect(marker(CuiInputStepper)).toBe("pinned md fit");
    // A trailing button the resting label must stay clear of.
    expect(marker(CuiInput, { clearable: true })).toBe("inline md end");
    expect(marker(CuiInput, { type: "password" })).toBe("inline md end");
    expect(floatWarnings()).toEqual([]);
  });

  it("grows the control one size step through its private height", () => {
    const style = (control: Component, props = {}, selector = ".cui-input") =>
      (mountField(control, {}, props).find(selector).element as HTMLElement).style;
    expect(style(CuiInput).getPropertyValue("--_input-height")).toBe(FLOATING_LABEL_SCALE.md.height);
    expect(style(CuiInput).getPropertyValue("--_input-float-offset")).toBe(FLOATING_LABEL_SCALE.md.offset);
    expect(style(CuiInput, { size: "xl" }).getPropertyValue("--_input-height")).toBe(FLOATING_LABEL_SCALE.xl.height);
    expect(style(CuiTextarea, {}, ".cui-textarea").getPropertyValue("--_ta-float-offset")).toBe(
      FLOATING_LABEL_SCALE.md.offset,
    );
    expect(style(CuiInputStepper, {}, ".cui-input-stepper").getPropertyValue("--_input-stepper-height")).toBe(
      FLOATING_LABEL_SCALE.md.height,
    );
    // Not floating: the size's own height, and no offset.
    const top = mountField(CuiInput, { labelPosition: "top" }).find(".cui-input").element as HTMLElement;
    expect(top.style.getPropertyValue("--_input-height")).toBe(INPUT_SIZE_SCALE.md.height);
    expect(top.style.getPropertyValue("--_input-float-offset")).toBe("");
  });

  it.each([
    ["an xs CuiInput", CuiInput, { size: "xs" }],
    ["a sm CuiInput", CuiInput, { size: "sm" }],
    ["a sm CuiTextarea", CuiTextarea, { size: "sm" }],
    ["a vertical CuiInputStepper", CuiInputStepper, { orientation: "vertical" }],
  ])("falls back to top on %s, with a warning that names the size", (_, control, props) => {
    const w = mountField(control as Component, {}, props);
    expect(w.find("[data-cui-float-label]").exists()).toBe(false);
    // Its own height and placeholder, as outside a floating field.
    expect(w.find("input, textarea").attributes("placeholder")).toBeUndefined();
    expect(floatWarnings()).toHaveLength(1);
    expect(String(floatWarnings()[0][0])).toContain("md, lg or xl");
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
