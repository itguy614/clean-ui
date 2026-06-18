import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CuiTextarea from "../CuiTextarea.vue";

describe("CuiTextarea", () => {
  it("renders modelValue into the native textarea and emits on input (v-model round-trip)", async () => {
    const wrapper = mount(CuiTextarea, { props: { modelValue: "hello" } });
    const ta = wrapper.get("textarea");
    expect((ta.element as HTMLTextAreaElement).value).toBe("hello");

    await ta.setValue("world");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["world"]);
  });

  it("respects the rows prop", () => {
    const wrapper = mount(CuiTextarea, { props: { rows: 7 } });
    expect(wrapper.get("textarea").attributes("rows")).toBe("7");
  });

  it("defaults to 3 rows", () => {
    const wrapper = mount(CuiTextarea);
    expect(wrapper.get("textarea").attributes("rows")).toBe("3");
  });

  it("sets the disabled attribute when disabled", () => {
    const wrapper = mount(CuiTextarea, { props: { disabled: true } });
    expect(wrapper.get("textarea").attributes("disabled")).toBeDefined();
    expect(wrapper.find(".cui-textarea--disabled").exists()).toBe(true);
  });

  it("shows error message and sets aria-invalid when error is set", () => {
    const wrapper = mount(CuiTextarea, {
      props: { error: true, errorMessage: "Required field" },
    });
    expect(wrapper.get("textarea").attributes("aria-invalid")).toBe("true");
    const err = wrapper.find(".cui-textarea__error");
    expect(err.exists()).toBe(true);
    expect(err.text()).toBe("Required field");
    expect(wrapper.find(".cui-textarea--error").exists()).toBe(true);
  });

  it("does not render an error message when error is false", () => {
    const wrapper = mount(CuiTextarea, { props: { errorMessage: "ignored" } });
    expect(wrapper.find(".cui-textarea__error").exists()).toBe(false);
    expect(wrapper.get("textarea").attributes("aria-invalid")).toBeUndefined();
  });
});
