import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiDatePicker from "../CuiDatePicker.vue";

/**
 * #74 — the calendar was built from unfocusable `<div>`s with a click handler:
 * no tabindex, no role, no keydown listener anywhere in the component. A date
 * could be picked only with a pointer (WCAG 2.1.1).
 */
describe("CuiDatePicker keyboard", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  /** Mount with the panel open, focused on a known date. */
  async function openOn(iso: string, props: Record<string, unknown> = {}) {
    wrapper = mount(CuiDatePicker, {
      attachTo: document.body,
      props: { modelValue: iso, ...props },
    });
    // CuiPopover is uncontrolled here; drive its visibility the way a click does.
    await wrapper.find(".cui-popover > div").trigger("click");
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    return wrapper;
  }

  const cell = (key: string) => document.querySelector<HTMLElement>(`[data-cui-cell="${key}"]`);
  const focusedCell = () => (document.activeElement as HTMLElement | null)?.dataset.cuiCell;
  const grid = () => document.querySelector<HTMLElement>('[role="grid"]')!;

  async function key(k: string, init: KeyboardEventInit = {}) {
    const target = (document.activeElement as HTMLElement) ?? grid();
    target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...init }));
    await wrapper!.vm.$nextTick();
    await wrapper!.vm.$nextTick();
  }

  it("renders a grid of gridcells, not bare divs", async () => {
    await openOn("2026-03-15");
    expect(grid()).toBeTruthy();
    expect(document.querySelectorAll('[role="gridcell"]').length).toBeGreaterThan(27);
  });

  it("starts focus on the selected date", async () => {
    await openOn("2026-03-15");
    expect(focusedCell()).toBe("d:2026-2-15");
  });

  it("moves a day at a time with left and right", async () => {
    await openOn("2026-03-15");
    await key("ArrowRight");
    expect(focusedCell()).toBe("d:2026-2-16");
    await key("ArrowLeft");
    await key("ArrowLeft");
    expect(focusedCell()).toBe("d:2026-2-14");
  });

  it("moves a week at a time with up and down", async () => {
    await openOn("2026-03-15");
    await key("ArrowDown");
    expect(focusedCell()).toBe("d:2026-2-22");
    await key("ArrowUp");
    await key("ArrowUp");
    expect(focusedCell()).toBe("d:2026-2-8");
  });

  it("Home and End go to the ends of the week", async () => {
    await openOn("2026-03-18"); // a Wednesday
    await key("Home");
    expect(focusedCell()).toBe("d:2026-2-15"); // Sunday
    await key("End");
    expect(focusedCell()).toBe("d:2026-2-21"); // Saturday
  });

  it("PageUp and PageDown move by a month, pulling the view with them", async () => {
    await openOn("2026-03-15");
    await key("PageDown");
    expect(focusedCell()).toBe("d:2026-3-15");
    // the visible month followed, so the focused cell is one a user can see
    expect(cell("d:2026-3-15")).toBeTruthy();
    await key("PageUp");
    await key("PageUp");
    expect(focusedCell()).toBe("d:2026-1-15");
  });

  it("shift turns the page keys into a year", async () => {
    await openOn("2026-03-15");
    await key("PageDown", { shiftKey: true });
    expect(focusedCell()).toBe("d:2027-2-15");
    await key("PageUp", { shiftKey: true });
    await key("PageUp", { shiftKey: true });
    expect(focusedCell()).toBe("d:2025-2-15");
  });

  it("stepping off the end of a month pages the calendar rather than focusing nothing", async () => {
    await openOn("2026-03-31");
    await key("ArrowRight");

    expect(focusedCell()).toBe("d:2026-3-1");
    expect(cell("d:2026-3-1"), "the cell must actually be rendered").toBeTruthy();
  });

  it("Enter selects the focused date", async () => {
    await openOn("2026-03-15");
    await key("ArrowRight");
    await key("Enter");

    const emitted = wrapper!.emitted("update:modelValue")!;
    expect(String(emitted[emitted.length - 1][0])).toContain("2026-03-16");
  });

  it("Space selects too", async () => {
    await openOn("2026-03-15");
    await key("ArrowDown");
    await key(" ");

    const emitted = wrapper!.emitted("update:modelValue")!;
    expect(String(emitted[emitted.length - 1][0])).toContain("2026-03-22");
  });

  it("Escape closes without selecting", async () => {
    await openOn("2026-03-15");
    await key("ArrowRight");
    await key("Escape");

    expect(document.querySelector('[role="grid"]')).toBeNull();
    expect(wrapper!.emitted("update:modelValue")).toBeUndefined();
  });

  it("only the focused cell is in the tab order", async () => {
    await openOn("2026-03-15");
    const zero = document.querySelectorAll('[role="gridcell"][tabindex="0"]');

    expect(zero).toHaveLength(1);
    expect((zero[0] as HTMLElement).dataset.cuiCell).toBe("d:2026-2-15");
  });

  it("marks the selected day and any disabled days", async () => {
    await openOn("2026-03-15", { minDate: "2026-03-10" });
    expect(cell("d:2026-2-15")!.getAttribute("aria-selected")).toBe("true");
    expect(cell("d:2026-2-16")!.getAttribute("aria-selected")).toBe("false");
    expect(cell("d:2026-2-5")!.getAttribute("aria-disabled")).toBe("true");
  });

  it("reaches disabled days but refuses to select them", async () => {
    // A calendar is a grid whose shape carries meaning — skipping cells would
    // make it impossible to navigate. Selection is what refuses, not movement.
    await openOn("2026-03-15", { minDate: "2026-03-10" });
    for (let i = 0; i < 6; i++) await key("ArrowLeft");
    expect(focusedCell()).toBe("d:2026-2-9");

    await key("Enter");
    expect(wrapper!.emitted("update:modelValue")).toBeUndefined();
  });
});
