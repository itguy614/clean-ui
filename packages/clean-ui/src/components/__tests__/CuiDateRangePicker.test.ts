import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiDateRangePicker from "../CuiDateRangePicker.vue";

// #74 — same unfocusable-grid problem as CuiDatePicker, and it shares the fix
// through useCalendarKeyboard. What is tested here is the range-specific half.
describe("CuiDateRangePicker keyboard", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  async function open(props: Record<string, unknown> = {}) {
    wrapper = mount(CuiDateRangePicker, {
      attachTo: document.body,
      props: { modelValue: { start: "2026-03-10", end: "2026-03-20" }, ...props },
    });
    await wrapper.find(".cui-popover > div").trigger("click");
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    return wrapper;
  }

  const focusedCell = () => (document.activeElement as HTMLElement | null)?.dataset.cuiCell;

  async function key(k: string, init: KeyboardEventInit = {}) {
    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, ...init }),
    );
    await wrapper!.vm.$nextTick();
    await wrapper!.vm.$nextTick();
  }

it("opens the calendar from the start field with ArrowDown", async () => {
    wrapper = mount(CuiDateRangePicker, {
      attachTo: document.body,
      props: { modelValue: { start: "2026-03-10", end: "2026-03-20" } },
    });
    expect(document.querySelector('[role="grid"]')).toBeNull();

    await wrapper.find("input").trigger("keydown", { key: "ArrowDown" });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(document.querySelector('[role="grid"]')).toBeTruthy();
    expect(focusedCell()).toBe("d:2026-2-10");
  });

  it("opens onto a grid focused at the range start", async () => {
    await open();
    expect(document.querySelector('[role="grid"]')).toBeTruthy();
    expect(focusedCell()).toBe("d:2026-2-10");
  });

  it("navigates the grid like the single picker", async () => {
    await open();
    await key("ArrowDown");
    expect(focusedCell()).toBe("d:2026-2-17");
    await key("PageDown");
    expect(focusedCell()).toBe("d:2026-3-17");
  });

  it("picks a whole range with two presses, as two clicks would", async () => {
    await open({ modelValue: { start: null, end: null } });
    const first = focusedCell();
    expect(first).toBeTruthy();

    await key("Enter");           // sets the start
    await key("ArrowRight");
    await key("ArrowRight");
    await key("Enter");           // sets the end

    const emitted = wrapper!.emitted("update:modelValue")!;
    const last = emitted[emitted.length - 1][0] as { start: string | null; end: string | null };
    expect(last.start).toBeTruthy();
    expect(last.end).toBeTruthy();
    expect(new Date(last.end!).getTime()).toBeGreaterThan(new Date(last.start!).getTime());
  });

  it("previews the range against the focused cell while picking the end", async () => {
    // The preview normally follows the pointer. Without this it simply stops
    // moving for anyone not using a mouse.
    await open({ modelValue: { start: null, end: null } });
    await key("Enter");
    await key("ArrowRight");
    await wrapper!.vm.$nextTick();

    // Cells between the start and the focused cell are part of the previewed
    // range, so more than just the start is highlighted.
    const highlighted = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')].filter(
      (c) => c.style.background && c.style.background !== "transparent",
    );
    expect(highlighted.length).toBeGreaterThan(1);
  });

  it("Escape closes without completing a range", async () => {
    await open({ modelValue: { start: null, end: null } });
    await key("Enter");
    await key("Escape");

    expect(document.querySelector('[role="grid"]')).toBeNull();
    const emitted = wrapper!.emitted("update:modelValue") ?? [];
    const completed = emitted.some((e) => {
      const v = e[0] as { start: string | null; end: string | null };
      return v.start && v.end;
    });
    expect(completed).toBe(false);
  });
});
