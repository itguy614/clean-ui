import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiResizablePanels from "../CuiResizablePanels.vue";

/**
 * #156 — the drag handle was a bare div: nothing to focus or announce, and no keys. It is
 * now the WAI-ARIA window splitter, a focusable role="separator".
 */

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
});

/** A 400×200 container: minFirst/minSecond 100px are 25% each side by side. */
function mountPanels(props: Record<string, unknown> = {}) {
  w = mount(CuiResizablePanels, { props, attachTo: document.body });
  const container = w.find(".cui-resizable-panels").element as HTMLElement;
  container.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 400, height: 200, right: 400, bottom: 200, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  return w;
}

const handle = () => w!.find('[role="separator"]');
const press = (key: string, init: KeyboardEventInit = {}) => handle().trigger("keydown", { key, ...init });
const lastResize = () => (w!.emitted("resize") as number[][]).at(-1)![0];

describe("CuiResizablePanels as a window splitter", () => {
  it("is a focusable, named separator controlling the first panel", () => {
    mountPanels();
    const h = handle();
    expect(h.attributes("tabindex")).toBe("0");
    expect(h.attributes("aria-label")).toBe("Resize panels");
    expect(h.attributes("aria-orientation")).toBe("vertical"); // panels side by side
    expect(h.attributes("aria-valuenow")).toBe("50");
    expect(w!.find(`#${h.attributes("aria-controls")}`).exists()).toBe(true);
  });

  it("is a horizontal separator when the panels are stacked", () => {
    mountPanels({ orientation: "vertical" });
    expect(handle().attributes("aria-orientation")).toBe("horizontal");
  });

  it("moves with the arrows along the split, Shift for bigger steps", async () => {
    mountPanels();
    await press("ArrowRight");
    expect(lastResize()).toBe(52);
    await press("ArrowLeft", { shiftKey: true });
    expect(lastResize()).toBe(42);
    await press("ArrowUp"); // across the split: not ours
    expect(w!.emitted("resize")).toHaveLength(2);
    expect(handle().attributes("aria-valuenow")).toBe("42");
  });

  it("uses Up/Down when stacked", async () => {
    mountPanels({ orientation: "vertical", minFirst: 20, minSecond: 20 });
    await press("ArrowDown");
    expect(lastResize()).toBe(52);
    await press("ArrowUp");
    expect(lastResize()).toBe(50);
  });

  it("goes to the extremes the minimums allow with Home and End", async () => {
    mountPanels();
    await press("Home");
    expect(lastResize()).toBe(25);
    await press("End");
    expect(lastResize()).toBe(75);
  });

  it("collapses and restores with Enter when collapsing is on", async () => {
    mountPanels({ collapseThreshold: 50 });
    await press("ArrowRight");
    await press("Enter");
    expect(w!.emitted("collapse")).toEqual([[true]]);
    expect(handle().attributes("aria-valuenow")).toBe("0");
    await press("Enter");
    expect(w!.emitted("collapse")).toEqual([[true], [false]]);
    expect(lastResize()).toBe(52);
  });

  it("restores to initialSize after a collapse by dragging", async () => {
    mountPanels({ collapseThreshold: 150, initialSize: 60 });
    await handle().trigger("pointerdown", { clientX: 240, clientY: 10 });
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: 100, clientY: 10 })); // 25%: 100px, under 150
    document.dispatchEvent(new MouseEvent("pointerup"));
    await nextTick();
    expect(w!.emitted("collapse")).toEqual([[true]]);
    await press("Enter");
    expect(w!.emitted("collapse")).toEqual([[true], [false]]);
    expect(lastResize()).toBe(60);
  });

  it("focus() focuses the handle", () => {
    mountPanels();
    (w!.vm as unknown as { focus: () => void }).focus();
    expect(document.activeElement).toBe(handle().element);
  });

  it("ignores Enter when collapsing is off", async () => {
    mountPanels();
    await press("Enter");
    expect(w!.emitted("collapse")).toBeUndefined();
  });

  it("mirrors the horizontal arrows, and the drag, in a right-to-left page", async () => {
    mountPanels();
    (w!.find(".cui-resizable-panels").element as HTMLElement).style.direction = "rtl";
    await press("ArrowLeft");
    expect(lastResize()).toBe(52);
    await handle().trigger("pointerdown", { clientX: 200, clientY: 10 });
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: 160, clientY: 10 }));
    expect(lastResize()).toBe(62); // 52 + 10%: leftward grows the right-hand first panel
    document.dispatchEvent(new MouseEvent("pointerup"));
    await nextTick();
  });
});
