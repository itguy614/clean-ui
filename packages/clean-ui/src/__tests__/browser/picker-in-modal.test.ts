import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { h, defineComponent, ref } from "vue";
import CuiModal from "../../components/CuiModal.vue";
import CuiDatePicker from "../../components/CuiDatePicker.vue";
import CuiTimePicker from "../../components/CuiTimePicker.vue";
import { frames } from "./helpers";

/**
 * #286 — a picker's panel is a CuiPopover, a layer on the shared Escape stack (#278), so the
 * stack decides what Escape closes: the panel first, then the modal around it. The calendar
 * used to handle Escape itself and stop it, which hid the key from the stack — it worked only
 * by convention.
 *
 * Real browser: which element ends up focused, and the order the document listener sees.
 */
describe("a picker inside a modal (real browser)", () => {
  let wrapper: VueWrapper | undefined;
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  const open = ref(true);
  const InModal = (picker: ReturnType<typeof h>) =>
    defineComponent({
      setup: () => () =>
        h(CuiModal, { visible: open.value, title: "Edit", "onUpdate:visible": (v: boolean) => (open.value = v) }, () => picker),
    });

  const modalOpen = () => !!document.querySelector(".cui-modal--visible");

  it("closes the date panel on the first Escape, the modal on the second", async () => {
    open.value = true;
    wrapper = mount(InModal(h(CuiDatePicker, { id: "d", modelValue: "2026-03-15" })), { attachTo: document.body });
    await frames(4);
    const field = document.querySelector<HTMLInputElement>("#d")!;
    field.focus();
    await userEvent.keyboard("{ArrowDown}");
    await frames(4);
    expect(document.querySelector('[role="grid"]')).not.toBeNull();

    await userEvent.keyboard("{Escape}");
    await frames(4);
    expect(document.querySelector('[role="grid"]')).toBeNull();
    expect(modalOpen()).toBe(true);
    expect(document.activeElement).toBe(field);

    await userEvent.keyboard("{Escape}");
    await new Promise((r) => setTimeout(r, 400));
    expect(open.value).toBe(false);
  });

  it("does the same for the time panel, from its trigger", async () => {
    open.value = true;
    wrapper = mount(InModal(h(CuiTimePicker, { id: "t", modelValue: "09:30", format: "24" })), { attachTo: document.body });
    await frames(4);
    const trigger = document.querySelector<HTMLElement>("#t")!;
    trigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    await frames(4);
    const panelOpen = () => !!document.querySelector(".cui-time-picker__panel, .cui-popover__content");
    expect(panelOpen()).toBe(true);

    await userEvent.keyboard("{Escape}");
    await frames(4);
    expect(panelOpen()).toBe(false);
    expect(modalOpen()).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });
});
