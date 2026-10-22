import { describe, it, expect, afterEach } from "vitest";
import type { VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { mountPanels as mountShared } from "./resizable-panels";

/**
 * #156 — the drag handle was a bare div: nothing to focus or announce, and no keys. It is
 * now the WAI-ARIA window splitter, a focusable role="separator".
 */

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
});

function mountPanels(props: Record<string, unknown> = {}) {
  w = mountShared(props);
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

  it("leaves a collapsed panel collapsed on shrink and Home, and opens it on grow", async () => {
    mountPanels({ collapseThreshold: 50 });
    await press("Enter");
    await press("ArrowLeft");
    await press("Home");
    expect(w!.emitted("collapse")).toEqual([[true]]);
    expect(handle().attributes("aria-valuenow")).toBe("0");
    await press("ArrowRight");
    expect(w!.emitted("collapse")).toEqual([[true], [false]]);
    expect(lastResize()).toBe(25); // the smallest open size the minimum allows
  });

  it("drags a collapsed panel out from its edge, not from the size it had", async () => {
    mountPanels({ collapseThreshold: 50 });
    await press("Enter"); // collapsed, the stored 50% still there
    await handle().trigger("pointerdown", { clientX: 0, clientY: 10 });
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: 120, clientY: 10 }));
    expect(lastResize()).toBe(30);
    document.dispatchEvent(new MouseEvent("pointerup"));
    await nextTick();
  });

  it("restores to at least the threshold, without collapsing again", async () => {
    // initialSize 30% = 120px of 400, under a 160px threshold.
    mountPanels({ collapseThreshold: 160, initialSize: 30, minFirst: 0 });
    await handle().trigger("pointerdown", { clientX: 120, clientY: 10 });
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: 40, clientY: 10 }));
    document.dispatchEvent(new MouseEvent("pointerup"));
    await nextTick();
    await press("Enter");
    expect(w!.emitted("collapse")).toEqual([[true], [false]]);
    expect(lastResize()).toBe(40);
  });

  it("takes a collapsed panel's content out of the tab order", async () => {
    mountPanels({ collapseThreshold: 50 });
    const first = w!.find(`#${handle().attributes("aria-controls")}`);
    expect(first.attributes("inert")).toBeUndefined();
    await press("Enter");
    expect(first.attributes("inert")).toBeDefined();
  });

  it("clamps a double-click reset to the minimums, and emits collapse only if it was collapsed", async () => {
    mountPanels({ initialSize: 90 }); // max 75% with minSecond 100px of 400
    await handle().trigger("dblclick");
    expect(lastResize()).toBe(75);
    expect(w!.emitted("collapse")).toBeUndefined();
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
