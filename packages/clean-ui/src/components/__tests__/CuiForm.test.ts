import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import CuiForm from "../CuiForm.vue";
import CuiFormField from "../CuiFormField.vue";
import CuiInput from "../CuiInput.vue";

// A small fixture: a CuiForm wrapping a name-bound CuiFormField + CuiInput.
// The field's v-slot bindings (v-bind="f") wire v-model + error to the form.
function mountForm(resolver?: (values: Record<string, unknown>) => Record<string, string>) {
  return mount(CuiForm, {
    props: { resolver, modelValue: { email: "" } },
    slots: {
      default: () =>
        h(
          CuiFormField,
          { name: "email", label: "Email" },
          { default: (f: Record<string, unknown>) => h(CuiInput, f) },
        ),
    },
  });
}

describe("CuiForm behavior", () => {
  it("field binding via v-slot writes the typed value into the form values", async () => {
    const wrapper = mountForm();
    await wrapper.find("input").setValue("hi@example.com");

    const updates = wrapper.emitted("update:modelValue") as Array<[Record<string, unknown>]>;
    expect(updates).toBeTruthy();
    expect(updates[updates.length - 1][0]).toEqual({ email: "hi@example.com" });
  });

  it("submit with a passing resolver emits submit with the current values", async () => {
    const wrapper = mountForm(() => ({}));
    await wrapper.find("input").setValue("hi@example.com");
    await wrapper.find("form").trigger("submit");
    await wrapper.vm.$nextTick();

    const submit = wrapper.emitted("submit") as Array<[Record<string, unknown>]>;
    expect(submit).toHaveLength(1);
    expect(submit[0][0]).toEqual({ email: "hi@example.com" });
    expect(wrapper.emitted("submit-invalid")).toBeUndefined();
  });

  it("submit with a failing resolver emits submit-invalid and populates errors", async () => {
    const wrapper = mountForm(() => ({ email: "Required" }));
    await wrapper.find("form").trigger("submit");
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("submit")).toBeUndefined();
    const invalid = wrapper.emitted("submit-invalid") as Array<[Record<string, string>]>;
    expect(invalid).toHaveLength(1);
    expect(invalid[0][0]).toEqual({ email: "Required" });
  });

  it("a failing resolver renders the field's error message through CuiFormField", async () => {
    const wrapper = mountForm(() => ({ email: "Required" }));
    await wrapper.find("form").trigger("submit");
    await wrapper.vm.$nextTick();

    const errEl = wrapper.find(".cui-form-field__error");
    expect(errEl.exists()).toBe(true);
    expect(errEl.text()).toBe("Required");
    expect(wrapper.find(".cui-form-field--error").exists()).toBe(true);
  });
});
