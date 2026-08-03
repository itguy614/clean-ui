import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CuiTimePicker from "../CuiTimePicker.vue";
import { INPUT_SIZE_SCALE } from "../../utils/sizing";

const triggerHeight = (size: "sm" | "md" | "lg") => {
  const wrapper = mount(CuiTimePicker, { props: { size } });
  const trigger = wrapper.get(".cui-time-picker__trigger");
  return (trigger.element as HTMLElement).style.height;
};

describe("CuiTimePicker (#87)", () => {
  it("trigger height honors the size prop (matches INPUT_SIZE_SCALE, like CuiInput/CuiDatePicker)", () => {
    expect(triggerHeight("sm")).toBe(INPUT_SIZE_SCALE.sm.height);
    expect(triggerHeight("md")).toBe(INPUT_SIZE_SCALE.md.height);
    expect(triggerHeight("lg")).toBe(INPUT_SIZE_SCALE.lg.height);
  });

  it("sm and lg triggers are not the same height (size actually applies)", () => {
    expect(triggerHeight("sm")).not.toBe(triggerHeight("lg"));
  });
});
