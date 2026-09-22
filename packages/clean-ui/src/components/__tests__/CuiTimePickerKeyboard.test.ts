import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiTimePicker from "../CuiTimePicker.vue";

/**
 * #74 / #103 — the trigger was a bare `<div>`: no tabindex, no role. The
 * component could not be reached by keyboard at all, and #78 had to skip it
 * because there was nothing focusable for a `<label for>` to resolve to.
 */
describe("CuiTimePicker trigger", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  function mountPicker(props: Record<string, unknown> = {}) {
    wrapper = mount(CuiTimePicker, { attachTo: document.body, props: { modelValue: "09:30", ...props } });
    return wrapper;
  }

  const trigger = () => wrapper!.find(".cui-time-picker__trigger");
  const panelOpen = () => !!document.querySelector(".cui-popover__panel");

  it("is focusable and announces itself as a combobox", () => {
    mountPicker();
    expect(trigger().attributes("tabindex")).toBe("0");
    expect(trigger().attributes("role")).toBe("combobox");
    expect(trigger().attributes("aria-expanded")).toBe("false");
  });

  it.each(["Enter", " ", "ArrowDown"])("opens on %s", async (k) => {
    mountPicker();
    await trigger().trigger("keydown", { key: k });
    await wrapper!.vm.$nextTick();

    expect(panelOpen()).toBe(true);
    expect(trigger().attributes("aria-expanded")).toBe("true");
  });

  it("closes on Escape", async () => {
    mountPicker();
    await trigger().trigger("keydown", { key: "Enter" });
    await wrapper!.vm.$nextTick();
    expect(panelOpen()).toBe(true);

    await trigger().trigger("keydown", { key: "Escape" });
    await wrapper!.vm.$nextTick();
    expect(panelOpen()).toBe(false);
  });

  it("stays shut and out of the tab order when disabled", async () => {
    mountPicker({ disabled: true });
    expect(trigger().attributes("tabindex")).toBe("-1");
    expect(trigger().attributes("aria-disabled")).toBe("true");

    await trigger().trigger("keydown", { key: "Enter" });
    await wrapper!.vm.$nextTick();
    expect(panelOpen()).toBe(false);
  });

  it("takes id and aria-* on the trigger, so a label can name it (#103)", () => {
    mountPicker({ id: "start-time", ariaLabelledby: "lbl", ariaDescribedby: "hint" });
    expect(trigger().attributes("id")).toBe("start-time");
    expect(trigger().attributes("aria-labelledby")).toBe("lbl");
    expect(trigger().attributes("aria-describedby")).toBe("hint");
  });

  it("focus() lands on the trigger, not the wrapper", () => {
    mountPicker();
    (wrapper!.vm as unknown as { focus: () => void }).focus();
    expect(document.activeElement).toBe(trigger().element);
  });
});
