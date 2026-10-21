import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { h, defineComponent, ref, type Ref } from "vue";
import CuiModal from "../../components/CuiModal.vue";
import CuiDatePicker from "../../components/CuiDatePicker.vue";
import CuiDateRangePicker from "../../components/CuiDateRangePicker.vue";
import CuiTimePicker from "../../components/CuiTimePicker.vue";
import { frames } from "./helpers";

/**
 * #286 — a picker's panel is a CuiPopover, a layer on the shared Escape stack (#278), so the
 * stack decides what Escape closes: the panel first, then the modal around it. The pickers
 * used to handle Escape themselves and stop it, which hid the key from the stack — it worked
 * only by convention.
 *
 * Real browser: which element ends up focused, and the order the document listener sees.
 */
describe("a picker inside a modal (real browser)", () => {
  let wrapper: VueWrapper | undefined;
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  /** Mount `picker` inside an open CuiModal; returns the modal's v-model. */
  function inModal(picker: () => ReturnType<typeof h>): Ref<boolean> {
    const open = ref(true);
    const Host = defineComponent({
      setup: () => () => h(CuiModal, { visible: open.value, title: "Edit", "onUpdate:visible": (v: boolean) => (open.value = v) }, picker),
    });
    wrapper = mount(Host, { attachTo: document.body });
    return open;
  }

  /** Wait for a condition, frame by frame — an animation's length is not ours to assume. */
  async function until(check: () => boolean, maxFrames = 120) {
    for (let i = 0; i < maxFrames && !check(); i++) await frames(1);
    return check();
  }

  const modalOpen = () => !!document.querySelector(".cui-modal--visible");

  /** Whether an Escape got as far as the document, where the layer stack listens. */
  function escapeReachesDocument() {
    let reached = false;
    const seen = (e: KeyboardEvent) => {
      if (e.key === "Escape") reached = true;
    };
    document.addEventListener("keydown", seen, { capture: false });
    return () => {
      document.removeEventListener("keydown", seen);
      return reached;
    };
  }

  /** Open the panel from `field`, then: the first Escape closes it alone, the second the modal. */
  async function escapesInOrder(open: Ref<boolean>, field: HTMLElement, panelOpen: () => boolean) {
    field.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(await until(panelOpen)).toBe(true);
    // Escape goes wherever focus went — the grid. It must reach the stack, not be stopped.
    const reached = escapeReachesDocument();
    await userEvent.keyboard("{Escape}");
    expect(await until(() => !panelOpen())).toBe(true);
    expect(reached()).toBe(true);
    expect(modalOpen()).toBe(true);
    expect(await until(() => document.activeElement === field)).toBe(true);

    await userEvent.keyboard("{Escape}");
    expect(await until(() => !open.value)).toBe(true);
  }

  it("date picker: the panel first, then the modal", async () => {
    const open = inModal(() => h(CuiDatePicker, { id: "d", modelValue: "2026-03-15" }));
    await frames(4);
    await escapesInOrder(open, document.querySelector<HTMLElement>("#d")!, () => !!document.querySelector('[role="grid"]'));
  });

  it("date range picker: the panel first, then the modal", async () => {
    const open = inModal(() => h(CuiDateRangePicker, { id: "r", modelValue: { start: "2026-03-15", end: null } }));
    await frames(4);
    await escapesInOrder(open, document.querySelector<HTMLElement>("#r")!, () => !!document.querySelector('[role="grid"]'));
  });

  it("time picker: Escape from inside its panel closes the panel first, then the modal", async () => {
    const open = inModal(() => h(CuiTimePicker, { id: "t", modelValue: "09:30", format: "24" }));
    await frames(4);
    const panelOpen = () => !!document.querySelector(".cui-time-picker__panel");
    const trigger = document.querySelector<HTMLElement>("#t")!;
    trigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(await until(panelOpen)).toBe(true);
    // Opening moves focus into the panel: this Escape starts there, not on the trigger.
    expect(await until(() => !!document.activeElement?.closest(".cui-time-picker__panel"))).toBe(true);
    const reached = escapeReachesDocument();
    await userEvent.keyboard("{Escape}");
    expect(await until(() => !panelOpen())).toBe(true);
    expect(reached()).toBe(true);
    expect(modalOpen()).toBe(true);
    expect(await until(() => document.activeElement === trigger)).toBe(true);

    await userEvent.keyboard("{Escape}");
    expect(await until(() => !open.value)).toBe(true);
  });
});
