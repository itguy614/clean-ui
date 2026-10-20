import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiResizablePanels from "../CuiResizablePanels.vue";

// Review of #203: only pointerup ended a drag. When the browser takes the gesture over
// (a touch scroll), pointercancel fires instead, and the panels kept following the pointer.
describe("CuiResizablePanels drag", () => {
  it("ends on pointercancel", async () => {
    const w = mount(CuiResizablePanels, { attachTo: document.body });
    const container = w.find(".cui-resizable-panels").element as HTMLElement;
    container.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 200, right: 400, bottom: 200, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    const handle = w.findAll(".cui-resizable-panels > div")[1];
    await handle.trigger("pointerdown", { clientX: 200, clientY: 10 });
    await nextTick();
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: 220, clientY: 10 }));
    expect(w.emitted("resize")).toHaveLength(1);

    document.dispatchEvent(new MouseEvent("pointercancel"));
    await nextTick();
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: 300, clientY: 10 }));
    expect(w.emitted("resize")).toHaveLength(1);
    w.unmount();
  });
});
