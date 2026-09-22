import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import CuiInput from "../CuiInput.vue";
import CuiTextarea from "../CuiTextarea.vue";
import CuiSelect from "../CuiSelect.vue";
import CuiCombobox from "../CuiCombobox.vue";
import CuiTagInput from "../CuiTagInput.vue";
import CuiInputStepper from "../CuiInputStepper.vue";
import CuiFileUpload from "../CuiFileUpload.vue";
import CuiSlider from "../CuiSlider.vue";
import CuiColorPicker from "../CuiColorPicker.vue";
import CuiCheckbox from "../CuiCheckbox.vue";
import CuiRadio from "../CuiRadio.vue";
import CuiToggle from "../CuiToggle.vue";
import CuiMaskedInput from "../CuiMaskedInput.vue";
import CuiDatePicker from "../CuiDatePicker.vue";
import CuiDateRangePicker from "../CuiDateRangePicker.vue";
import CuiFormField from "../CuiFormField.vue";

/**
 * #78 — no form control declared `id`, so Vue's attribute fallthrough dropped it
 * on the component's single root: `.cui-input-wrapper`, `.cui-select` and so on,
 * all plain `<div>`s. `<label for>` then pointed at something that cannot be
 * focused, so clicking the label did nothing and screen readers never formed the
 * label/control association. `name` and `autocomplete` were equally inert there.
 *
 * Each entry names the control's *focusable* element — the one a label has to
 * resolve to.
 */
const CONTROLS: {
  name: string;
  component: unknown;
  props?: Record<string, unknown>;
  /** Selector for the element the id must land on. */
  target: string;
  /** Controls with no native form element can't carry name/autocomplete. */
  nativeAttrs?: boolean;
}[] = [
  { name: "CuiInput", component: CuiInput, target: "input.cui-input__native" },
  { name: "CuiTextarea", component: CuiTextarea, target: "textarea.cui-textarea__native" },
  { name: "CuiCombobox", component: CuiCombobox, target: "input" },
  { name: "CuiTagInput", component: CuiTagInput, target: "input" },
  { name: "CuiInputStepper", component: CuiInputStepper, target: "input" },
  { name: "CuiFileUpload", component: CuiFileUpload, target: "input" },
  { name: "CuiSlider", component: CuiSlider, target: "input" },
  { name: "CuiColorPicker", component: CuiColorPicker, target: "input" },
  { name: "CuiCheckbox", component: CuiCheckbox, target: "input" },
  { name: "CuiRadio", component: CuiRadio, props: { value: "a" }, target: "input" },
  { name: "CuiToggle", component: CuiToggle, target: "input" },
  { name: "CuiMaskedInput", component: CuiMaskedInput, props: { mask: "00/00" }, target: "input" },
  { name: "CuiDatePicker", component: CuiDatePicker, target: "input" },
  { name: "CuiDateRangePicker", component: CuiDateRangePicker, target: "input" },
  // No native form control at all — its focusable surface is the trigger, so
  // `name`/`autocomplete` would be meaningless on it.
  { name: "CuiSelect", component: CuiSelect, target: ".cui-select__trigger", nativeAttrs: false },
];

describe("native control attributes land on the focusable element", () => {
  for (const { name, component, props, target, nativeAttrs = true } of CONTROLS) {
    it(`${name} puts id on ${target}`, () => {
      const wrapper = mount(component as never, {
        props: { ...props, id: "my-field" },
      });

      const el = wrapper.find(target);
      expect(el.exists(), `${name}: no ${target}`).toBe(true);
      expect(el.attributes("id")).toBe("my-field");
      // ...and NOT on the wrapper, which is what the bug did.
      expect(wrapper.element.getAttribute("id")).toBeNull();
    });

    it(`${name} puts aria-describedby and aria-labelledby on ${target}`, () => {
      const wrapper = mount(component as never, {
        props: { ...props, ariaDescribedby: "d1", ariaLabelledby: "l1" },
      });

      const el = wrapper.find(target);
      expect(el.attributes("aria-describedby")).toBe("d1");
      expect(el.attributes("aria-labelledby")).toBe("l1");
      expect(wrapper.element.getAttribute("aria-describedby")).toBeNull();
    });

    if (nativeAttrs) {
      it(`${name} puts name and autocomplete on ${target}`, () => {
        const wrapper = mount(component as never, {
          props: { ...props, name: "field-name", autocomplete: "off" },
        });

        const el = wrapper.find(target);
        expect(el.attributes("name")).toBe("field-name");
        expect(el.attributes("autocomplete")).toBe("off");
      });
    }
  }
});

describe("CuiFormField wires the association end to end", () => {
  function field(slotComponent: unknown, fieldProps: Record<string, unknown> = {}) {
    return mount(CuiFormField, {
      props: { label: "Bio", ...fieldProps },
      slots: { default: (f: Record<string, unknown>) => h(slotComponent as never, f) },
    });
  }

  it("makes label[for] resolve to the native control", () => {
    const wrapper = field(CuiTextarea);

    const labelFor = wrapper.find("label").attributes("for");
    expect(labelFor).toBeTruthy();
    // The whole point of #78: this used to be the wrapper div.
    expect(wrapper.find("textarea").attributes("id")).toBe(labelFor);
  });

  it("names a control whose focusable element is not labelable", () => {
    // CuiSelect's trigger is a div[role=combobox]; `for`/`id` alone forms no
    // association with it, so the field also passes aria-labelledby.
    const wrapper = field(CuiSelect, { label: "Country" });

    const labelId = wrapper.find("label").attributes("id");
    expect(labelId).toBeTruthy();
    expect(wrapper.find(".cui-select__trigger").attributes("aria-labelledby")).toBe(labelId);
  });

  it("points the control at its help text", () => {
    const wrapper = field(CuiInput, { helpText: "Max 200 characters" });

    const helpId = wrapper.find(".cui-form-field__help").attributes("id");
    expect(helpId).toBeTruthy();
    expect(wrapper.find("input").attributes("aria-describedby")).toBe(helpId);
  });

  it("points the control at its error message instead, when erroring", () => {
    const wrapper = field(CuiInput, { error: true, errorMessage: "Required" });

    const errorId = wrapper.find(".cui-form-field__error").attributes("id");
    expect(errorId).toBeTruthy();
    expect(wrapper.find("input").attributes("aria-describedby")).toBe(errorId);
  });

  it("omits aria-describedby when there is nothing to describe", () => {
    // A dangling reference to an element that isn't rendered is worse than none.
    const wrapper = field(CuiInput);
    expect(wrapper.find("input").attributes("aria-describedby")).toBeUndefined();
  });
});
