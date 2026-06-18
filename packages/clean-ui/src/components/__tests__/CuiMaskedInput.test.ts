import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CuiMaskedInput from "../CuiMaskedInput.vue";

// The component intercepts native `beforeinput` events, calls preventDefault,
// and manually rebuilds the masked value from the raw token characters. To
// exercise that path we dispatch real InputEvents on the inner <input>, the
// same way a browser would (with inputType + data). After each keystroke the
// component repositions the caret on nextTick, so we await it and type the
// next char at the resulting caret position. This mirrors real typing.
async function typeSequence(
  wrapper: ReturnType<typeof mount>,
  input: HTMLInputElement,
  text: string,
) {
  // Start at the first slot; the component repositions the caret after each
  // keystroke, so subsequent chars insert at the live caret position.
  input.setSelectionRange(0, 0);
  for (const char of text) {
    input.dispatchEvent(
      new InputEvent("beforeinput", {
        inputType: "insertText",
        data: char,
        bubbles: true,
        cancelable: true,
      }),
    );
    await wrapper.vm.$nextTick();
  }
}

describe("CuiMaskedInput", () => {
  it("formats raw modelValue through the mask on display", () => {
    const wrapper = mount(CuiMaskedInput, {
      props: { mask: "(###) ###-####", modelValue: "1234567890" },
    });
    const input = wrapper.find("input").element as HTMLInputElement;
    expect(input.value).toBe("(123) 456-7890");
  });

  it("fills unfilled token slots with fillChar", () => {
    const wrapper = mount(CuiMaskedInput, {
      props: { mask: "###-##", modelValue: "12" },
    });
    const input = wrapper.find("input").element as HTMLInputElement;
    expect(input.value).toBe("12_-__");
  });

  it("applies the mask to typed input and emits the raw value", async () => {
    const wrapper = mount(CuiMaskedInput, {
      props: { mask: "###-###", modelValue: "" },
      attachTo: document.body,
    });
    const input = wrapper.find("input").element as HTMLInputElement;

    await typeSequence(wrapper, input, "1234");

    // Raw value is digits only; formatted inserts the literal separator.
    const raw = wrapper.emitted("update:modelValue")!.at(-1)![0];
    expect(raw).toBe("1234");
    expect(wrapper.find("input").element.value).toBe("123-4__");

    wrapper.unmount();
  });

  it("rejects characters that do not match the token pattern", async () => {
    const wrapper = mount(CuiMaskedInput, {
      props: { mask: "###", modelValue: "" },
      attachTo: document.body,
    });
    const input = wrapper.find("input").element as HTMLInputElement;

    await typeSequence(wrapper, input, "a"); // letter into a digit-only mask

    // No emit at all because the filtered insert is empty.
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    expect(wrapper.find("input").element.value).toBe("___");

    wrapper.unmount();
  });

  it("emits both raw modelValue and the formatted value", async () => {
    const wrapper = mount(CuiMaskedInput, {
      props: { mask: "##/##", modelValue: "" },
      attachTo: document.body,
    });
    const input = wrapper.find("input").element as HTMLInputElement;

    await typeSequence(wrapper, input, "123");

    expect(wrapper.emitted("update:modelValue")!.at(-1)![0]).toBe("123");
    expect(wrapper.emitted("update:formattedValue")!.at(-1)![0]).toBe("12/3_");

    wrapper.unmount();
  });

  it("treats backslash-escaped mask characters as literals, not tokens", () => {
    // \# is a literal '#'; the following # is a digit token.
    const wrapper = mount(CuiMaskedInput, {
      props: { mask: "\\##", modelValue: "5" },
    });
    const input = wrapper.find("input").element as HTMLInputElement;
    expect(input.value).toBe("#5");
  });

  it("supports custom token definitions", () => {
    const wrapper = mount(CuiMaskedInput, {
      props: {
        mask: "XX",
        tokens: { X: { pattern: /[0-9a-fA-F]/ } },
        modelValue: "aF",
      },
    });
    const input = wrapper.find("input").element as HTMLInputElement;
    expect(input.value).toBe("aF");
  });
});
