import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CuiInput from "../CuiInput.vue";

describe("CuiInput", () => {
  it("emits update:modelValue on input (v-model round-trip)", async () => {
    const wrapper = mount(CuiInput, { props: { modelValue: "" } });
    const input = wrapper.get("input.cui-input__native");
    await input.setValue("hello");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["hello"]);
  });

  it("reflects modelValue into the native input value", () => {
    const wrapper = mount(CuiInput, { props: { modelValue: "preset" } });
    expect((wrapper.get("input.cui-input__native").element as HTMLInputElement).value).toBe("preset");
  });

  it("clearable shows a clear button that emits clear and empties the value", async () => {
    const wrapper = mount(CuiInput, { props: { modelValue: "stuff", clearable: true } });
    const clearBtn = wrapper.get("button.cui-input__clear");
    await clearBtn.trigger("click");
    expect(wrapper.emitted("clear")).toHaveLength(1);
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([""]);
  });

  it("does not show the clear button when there is no value", () => {
    const wrapper = mount(CuiInput, { props: { modelValue: "", clearable: true } });
    expect(wrapper.find("button.cui-input__clear").exists()).toBe(false);
  });

  it("password type renders a toggle that switches the input type", async () => {
    const wrapper = mount(CuiInput, { props: { type: "password", modelValue: "secret" } });
    const native = wrapper.get("input.cui-input__native");
    expect(native.attributes("type")).toBe("password");
    await wrapper.get("button.cui-input__password-toggle").trigger("click");
    expect(wrapper.get("input.cui-input__native").attributes("type")).toBe("text");
  });

  it("renders the error message and sets aria-invalid when error is set", () => {
    const wrapper = mount(CuiInput, {
      props: { error: true, errorMessage: "Required field" },
    });
    expect(wrapper.get(".cui-input__error").text()).toBe("Required field");
    expect(wrapper.get("input.cui-input__native").attributes("aria-invalid")).toBe("true");
  });

  it("passes disabled and readonly through to the native input", () => {
    const disabled = mount(CuiInput, { props: { disabled: true } });
    expect(disabled.get("input.cui-input__native").attributes("disabled")).toBeDefined();

    const readonly = mount(CuiInput, { props: { readonly: true } });
    expect(readonly.get("input.cui-input__native").attributes("readonly")).toBeDefined();
  });

  it("hides the clear button when disabled even with a value", () => {
    const wrapper = mount(CuiInput, {
      props: { modelValue: "stuff", clearable: true, disabled: true },
    });
    expect(wrapper.find("button.cui-input__clear").exists()).toBe(false);
  });
});
