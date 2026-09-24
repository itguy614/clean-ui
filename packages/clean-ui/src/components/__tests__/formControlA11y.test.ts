import { describe, it, expect } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import CuiCheckbox from "../CuiCheckbox.vue";
import CuiRadio from "../CuiRadio.vue";
import CuiToggle from "../CuiToggle.vue";
import CuiInput from "../CuiInput.vue";
import CuiTextarea from "../CuiTextarea.vue";
import CuiFormField from "../CuiFormField.vue";

/**
 * #173 / #175 — the form controls advertised accessibility they did not deliver.
 *
 * Checkbox, Radio and Toggle bound `id`/`aria-describedby`/`aria-labelledby` to their
 * hidden native input, which also carries `aria-hidden="true"` — so every one of those
 * attributes sat on an element removed from the accessibility tree, and CuiFormField's
 * whole labelling contract was silently inert for the three of them.
 *
 * Input and Textarea set `aria-invalid` and rendered an error message that nothing pointed
 * at, so a user was told something was wrong and never what.
 */
describe("the role-carrying element is the one that is described and named", () => {
  it.each([
    ["CuiCheckbox", CuiCheckbox, "checkbox", {}],
    ["CuiRadio", CuiRadio, "radio", { value: "a" }],
    ["CuiToggle", CuiToggle, "switch", {}],
  ])("%s", (_n, component, role, extra) => {
    const w = mount(component as never, {
      props: { id: "f1", ariaDescribedby: "help1", ariaLabelledby: "lab1", label: "L", ...extra },
    });

    // That the role element carries the attributes is asserted by the table in
    // `nativeControlAttrs.test.ts`. What is new here is the other half: the hidden input
    // must no longer hold attributes that only work inside the accessibility tree.
    const input = w.find("input");
    expect(input.attributes("aria-hidden")).toBe("true");
    expect(input.attributes("aria-describedby")).toBeUndefined();
    expect(input.attributes("aria-labelledby")).toBeUndefined();
  });

});

describe("an invalid control says why", () => {
  it.each([
    ["CuiInput", CuiInput, "input"],
    ["CuiTextarea", CuiTextarea, "textarea"],
  ])("%s points aria-describedby at its own error message", (_n, component, tag) => {
    const w = mount(component as never, {
      props: { id: "e1", modelValue: "", error: true, errorMessage: "Enter an email address" },
    });

    const control = w.find(tag);
    expect(control.attributes("aria-invalid")).toBeTruthy();

    // The reference has to resolve, and to the text the user needs — with no caller-supplied
    // description here, it is exactly the one error id.
    const id = control.attributes("aria-describedby");
    expect(w.get(`#${id}`).text()).toContain("Enter an email address");
  });

  it("keeps a caller's own aria-describedby alongside the error", () => {
    const w = mount(CuiInput, {
      props: { id: "e2", modelValue: "", ariaDescribedby: "hint", error: true, errorMessage: "Bad" },
    });
    const ids = (w.find("input").attributes("aria-describedby") ?? "").split(" ");
    expect(ids).toContain("hint");
    expect(ids.length).toBe(2);
  });

  it("sets no aria-describedby when there is nothing to describe", () => {
    const w = mount(CuiInput, { props: { modelValue: "" } });
    expect(w.find("input").attributes("aria-describedby")).toBeUndefined();
  });
});

describe("a required field says so", () => {
  it("announces required-ness, which the asterisk alone never did", () => {
    const w = mount(CuiFormField, { props: { label: "Email", required: true } });

    // The visible marker stays decorative...
    expect(w.find(".cui-form-field__required").attributes("aria-hidden")).toBe("true");
    // ...the label carries the word for anyone reading it...
    expect(w.find("label").text()).toContain("(required)");
  });

  it("forwards required as aria-required, which is a state rather than part of the name", async () => {
    const w = mount(CuiFormField, {
      props: { label: "Email", required: true },
      slots: { default: `<template #default="f"><input v-bind="f" /></template>` },
    });
    await flushPromises();
    expect(w.find("input").attributes("aria-required")).toBe("true");
  });

  it("reaches a control even when the field has no label to fold the word into", async () => {
    // The sr-only text rides on aria-labelledby, which CuiFormField only emits when there
    // is a label — so the state has to travel independently of it.
    const w = mount(CuiFormField, {
      props: { required: true },
      slots: { default: `<template #default="f"><input v-bind="f" /></template>` },
    });
    await flushPromises();
    expect(w.find("input").attributes("aria-required")).toBe("true");
  });

  it("does not repeat itself when requiredText already says it visibly", () => {
    const w = mount(CuiFormField, { props: { label: "Email", required: true, requiredText: "Required" } });
    expect(w.find("label").text()).toContain("Required");
    expect(w.find(".cui-sr-only").exists()).toBe(false);
  });
});
