import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, ref } from "vue";
import CuiPinInput from "../CuiPinInput.vue";
import CuiForm from "../CuiForm.vue";
import CuiFormField from "../CuiFormField.vue";

const mounted: VueWrapper[] = [];
afterEach(() => mounted.splice(0).forEach((w) => w.unmount()));

function setup(props: Record<string, unknown> = {}) {
  const w = mount(CuiPinInput, { props, attachTo: document.body });
  mounted.push(w);
  const input = w.find("input").element as HTMLInputElement;
  return { w, input };
}

/** Type as a browser would: beforeinput (cancellable), then the edit, then input. */
async function type(w: VueWrapper, input: HTMLInputElement, text: string) {
  for (const ch of text) {
    const before = new InputEvent("beforeinput", { inputType: "insertText", data: ch, bubbles: true, cancelable: true });
    if (!input.dispatchEvent(before)) continue;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    if (input.value.length - (end - start) >= input.maxLength) continue; // maxlength
    input.value = input.value.slice(0, start) + ch + input.value.slice(end);
    input.setSelectionRange(start + 1, start + 1);
    input.dispatchEvent(new InputEvent("input", { inputType: "insertText", data: ch, bubbles: true }));
    await w.vm.$nextTick();
  }
}

function paste(input: HTMLInputElement, text: string) {
  const e = new Event("paste", { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(e, "clipboardData", { value: { getData: () => text } });
  input.dispatchEvent(e);
  return e;
}

const emitted = (w: VueWrapper) => (w.emitted("update:modelValue") ?? []).map((a) => a[0]);
const boxText = (w: VueWrapper) => w.findAll(".cui-pin-input__box").map((b) => b.text());

describe("CuiPinInput", () => {
  it("renders one box per character, presentational", () => {
    const { w } = setup({ length: 4 });
    expect(w.findAll(".cui-pin-input__box")).toHaveLength(4);
    expect(w.find(".cui-pin-input__boxes").attributes("aria-hidden")).toBe("true");
    expect(w.findAll("input")).toHaveLength(1);
  });

  it("puts the one-time-code attributes on the single real input", () => {
    const { input } = setup({ length: 6 });
    expect(input.getAttribute("autocomplete")).toBe("one-time-code");
    expect(input.getAttribute("inputmode")).toBe("numeric");
    expect(input.maxLength).toBe(6);
    expect(input.type).toBe("text");
  });

  it("uses a text keypad for alphanumeric codes", () => {
    const { input } = setup({ type: "alphanumeric" });
    expect(input.getAttribute("inputmode")).toBe("text");
  });

  it("emits each typed character and shows it in its box", async () => {
    const { w, input } = setup({ length: 4 });
    input.focus();
    await type(w, input, "12");
    expect(emitted(w)).toEqual(["1", "12"]);
    expect(boxText(w)).toEqual(["1", "2", "", ""]);
  });

  it("rejects a letter in a digits code, without losing the character under the caret", async () => {
    const { w, input } = setup({ length: 4, modelValue: "12" });
    input.focus();
    input.setSelectionRange(0, 1); // overwrite selection on box 0
    await type(w, input, "a");
    expect(emitted(w)).toEqual([]);
    expect(input.value).toBe("12");
  });

  it("falls back to restoring the value when beforeinput is unavailable", async () => {
    const { w, input } = setup({ length: 4, modelValue: "12" });
    input.focus();
    input.value = "a2";
    input.dispatchEvent(new InputEvent("input", { inputType: "insertText", data: "a", bubbles: true }));
    await w.vm.$nextTick();
    expect(input.value).toBe("12");
    expect(emitted(w)).toEqual([]);
  });

  it("accepts letters in an alphanumeric code, upper-casing them when asked", async () => {
    const { w, input } = setup({ length: 4, type: "alphanumeric", uppercase: true });
    input.focus();
    await type(w, input, "a1-b");
    expect(emitted(w).at(-1)).toBe("A1B");
  });

  it("sanitises a pasted, formatted code before truncating it", async () => {
    const { w, input } = setup({ length: 6 });
    input.focus();
    const e = paste(input, " 123-456 789");
    expect(e.defaultPrevented).toBe(true);
    expect(emitted(w)).toEqual(["123456"]);
    expect(input.value).toBe("123456");
  });

  it("inserts a short paste at the caret", async () => {
    const { w, input } = setup({ length: 6, modelValue: "19" });
    input.focus();
    input.setSelectionRange(1, 1);
    paste(input, "2 3");
    expect(emitted(w)).toEqual(["1239"]);
  });

  it("emits complete with the value when the last character is filled", async () => {
    const { w, input } = setup({ length: 4 });
    input.focus();
    await type(w, input, "123");
    expect(w.emitted("complete")).toBeUndefined();
    await type(w, input, "4");
    expect(w.emitted("complete")).toEqual([["1234"]]);
  });

  it("emits complete on a full paste", () => {
    const { w, input } = setup({ length: 4 });
    input.focus();
    paste(input, "9876");
    expect(w.emitted("complete")).toEqual([["9876"]]);
  });

  it("overwrites the character in the box the caret is in", async () => {
    const { w, input } = setup({ length: 4, modelValue: "1234" });
    input.focus();
    input.setSelectionRange(1, 1);
    input.dispatchEvent(new Event("select"));
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 2]);
    await type(w, input, "9");
    expect(emitted(w)).toEqual(["1934"]);
  });

  it("keeps the last character selected when full, so typing replaces it", async () => {
    const { input } = setup({ length: 4, modelValue: "1234" });
    input.focus();
    expect([input.selectionStart, input.selectionEnd]).toEqual([3, 4]);
  });

  it("backspace removes the previous character from the first empty box", async () => {
    const { w, input } = setup({ length: 4, modelValue: "123" });
    input.focus();
    expect([input.selectionStart, input.selectionEnd]).toEqual([3, 3]);
    input.value = "12";
    input.setSelectionRange(2, 2);
    input.dispatchEvent(new InputEvent("input", { inputType: "deleteContentBackward", bubbles: true }));
    await w.vm.$nextTick();
    expect(emitted(w)).toEqual(["12"]);
    expect(input.selectionStart).toBe(2);
  });

  it("moves between boxes with the arrow keys, Home and End", async () => {
    const { w, input } = setup({ length: 4, modelValue: "123" });
    input.focus();
    await w.find("input").trigger("keydown", { key: "ArrowLeft" });
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 3]);
    await w.find("input").trigger("keydown", { key: "Home" });
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 1]);
    await w.find("input").trigger("keydown", { key: "ArrowLeft" });
    expect(input.selectionStart).toBe(0);
    await w.find("input").trigger("keydown", { key: "End" });
    expect([input.selectionStart, input.selectionEnd]).toEqual([3, 3]);
    await w.find("input").trigger("keydown", { key: "ArrowRight" });
    expect([input.selectionStart, input.selectionEnd]).toEqual([3, 3]);
  });

  it("marks the caret's box active only while focused", async () => {
    const { w, input } = setup({ length: 4, modelValue: "1" });
    expect(w.find(".cui-pin-input__box--active").exists()).toBe(false);
    input.focus();
    await w.vm.$nextTick();
    const boxes = w.findAll(".cui-pin-input__box");
    expect(boxes[1].classes()).toContain("cui-pin-input__box--active");
    expect(boxes[1].find(".cui-pin-input__caret").exists()).toBe(true);
    input.blur();
    await w.vm.$nextTick();
    expect(w.find(".cui-pin-input__caret").exists()).toBe(false);
  });

  it("follows v-model, sanitising what it is given", async () => {
    const { w } = setup({ length: 4, modelValue: "1-2" });
    expect(boxText(w)).toEqual(["1", "2", "", ""]);
    await w.setProps({ modelValue: "98765" });
    expect(boxText(w)).toEqual(["9", "8", "7", "6"]);
    expect((w.find("input").element as HTMLInputElement).value).toBe("9876");
  });

  it("works two-way through v-model", async () => {
    const code = ref("");
    const w = mount(
      { render: () => h(CuiPinInput, { length: 4, modelValue: code.value, "onUpdate:modelValue": (v: string) => (code.value = v) }) },
      { attachTo: document.body },
    );
    mounted.push(w);
    const input = w.find("input").element as HTMLInputElement;
    input.focus();
    paste(input, "42");
    await w.vm.$nextTick();
    expect(code.value).toBe("42");
    code.value = "";
    await w.vm.$nextTick();
    expect(input.value).toBe("");
  });

  it("masks characters with dots on a password input", () => {
    const { w, input } = setup({ length: 4, modelValue: "12", mask: true });
    expect(input.type).toBe("password");
    expect(w.findAll(".cui-pin-input__dot")).toHaveLength(2);
    expect(w.find(".cui-pin-input__boxes").text()).toBe("");
  });

  describe("ARIA wiring", () => {
    it("names the input by its label and describes it by the description", () => {
      const { w, input } = setup({ label: "Verification code", description: "Six digits from the text message", id: "otp" });
      const label = w.find("label");
      expect(label.attributes("for")).toBe("otp");
      expect(label.text()).toContain("Verification code");
      const desc = w.find(".cui-pin-input__description");
      expect(desc.attributes("id")).toBe("otp-description");
      expect(input.getAttribute("aria-describedby")).toBe("otp-description");
    });

    it("generates an id when none is given", () => {
      const { w, input } = setup({ label: "Code" });
      expect(input.id).toMatch(/^cui-pin-input-/);
      expect(w.find("label").attributes("for")).toBe(input.id);
    });

    it("links the error message and marks the input invalid", () => {
      const { w, input } = setup({ id: "otp", description: "d", error: true, errorMessage: "Wrong code", ariaDescribedby: "extra" });
      const err = w.find(".cui-field-error");
      expect(err.attributes("id")).toBe("otp-error");
      expect(err.text()).toBe("Wrong code");
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(input.getAttribute("aria-describedby")).toBe("otp-description extra otp-error");
      expect(w.classes()).toContain("cui-pin-input--error");
    });

    it("forwards native control props to the input, not the wrapper", () => {
      const { w, input } = setup({ name: "otp", ariaLabelledby: "lbl", ariaRequired: true, autocomplete: "off" });
      expect(input.name).toBe("otp");
      expect(input.getAttribute("aria-labelledby")).toBe("lbl");
      expect(input.getAttribute("aria-required")).toBe("true");
      expect(input.getAttribute("autocomplete")).toBe("off");
      expect(w.attributes("name")).toBeUndefined();
    });

    it("marks required visually and for assistive tech", () => {
      const { w, input } = setup({ label: "Code", required: true });
      expect(input.getAttribute("aria-required")).toBe("true");
      expect(w.find(".cui-pin-input__required").attributes("aria-hidden")).toBe("true");
    });
  });

  it("disables and makes readonly the real input", () => {
    expect(setup({ disabled: true }).input.disabled).toBe(true);
    expect(setup({ readonly: true }).input.readOnly).toBe(true);
  });

  it("ignores a paste while readonly", () => {
    const { w, input } = setup({ readonly: true });
    input.focus();
    paste(input, "123456");
    expect(emitted(w)).toEqual([]);
  });

  it("focuses the input on a click on the boxes", async () => {
    const { w, input } = setup({ length: 4, modelValue: "12" });
    await w.find("input").trigger("mousedown", { button: 0, clientX: 0 });
    expect(document.activeElement).toBe(input);
  });

  it("exposes el, focus and blur", () => {
    const { w, input } = setup();
    const vm = w.vm as unknown as { el: HTMLElement; focus: () => void; blur: () => void };
    expect(vm.el).toBe(w.element);
    vm.focus();
    expect(document.activeElement).toBe(input);
    vm.blur();
    expect(document.activeElement).not.toBe(input);
  });

  it("emits themeable properties as private custom properties", () => {
    const { w } = setup({ size: "lg", color: "success" });
    const style = w.attributes("style") ?? "";
    expect(style).toContain("--_pin-input-height");
    expect(style).toContain("--_pin-input-focus-border: var(--cui-success)");
  });

  it("clamps xs and xl to the sizes it styles", () => {
    const sm = setup({ size: "sm" }).w.attributes("style");
    expect(setup({ size: "xs" }).w.attributes("style")).toBe(sm);
  });

  it("binds through CuiFormField inside a CuiForm", async () => {
    const values = ref<Record<string, unknown>>({ code: "" });
    const w = mount(
      {
        render: () =>
          h(
            CuiForm,
            { modelValue: values.value, "onUpdate:modelValue": (v: Record<string, unknown>) => (values.value = v) },
            () =>
              h(CuiFormField, { name: "code", label: "Code", helpText: "Six digits", required: true }, {
                default: (f: Record<string, unknown>) => h(CuiPinInput, { ...f }),
              }),
          ),
      },
      { attachTo: document.body },
    );
    mounted.push(w);
    const input = w.find("input").element as HTMLInputElement;
    const label = w.find(".cui-form-field__label");
    expect(input.getAttribute("aria-labelledby")).toBe(label.attributes("id"));
    expect(input.id).toBe(label.attributes("for"));
    expect(input.getAttribute("aria-required")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    input.focus();
    paste(input, "123456");
    await w.vm.$nextTick();
    expect(values.value.code).toBe("123456");
  });
});
