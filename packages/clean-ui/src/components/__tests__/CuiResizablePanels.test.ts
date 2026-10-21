import { describe, it, expect, afterEach, vi } from "vitest";
import { nextTick } from "vue";
import { mountPanels } from "./resizable-panels";
import { pointer, recordDocumentListeners } from "../../__tests__/pointer";

const at = (clientX: number) => ({ clientX, clientY: 10 });
const handleOf = (w: ReturnType<typeof mountPanels>) => w.get(".cui-resizable-panels__handle");

describe("CuiResizablePanels drag", () => {
  afterEach(() => vi.restoreAllMocks());

  // Review of #203: only pointerup ended a drag. When the browser takes the gesture over
  // (a touch scroll), pointercancel fires instead, and the panels kept following the pointer.
  it("ends on pointercancel", async () => {
    const w = mountPanels();
    await handleOf(w).trigger("pointerdown", at(200));
    await nextTick();
    document.dispatchEvent(new MouseEvent("pointermove", at(220)));
    expect(w.emitted("resize")).toHaveLength(1);

    document.dispatchEvent(new MouseEvent("pointercancel"));
    await nextTick();
    document.dispatchEvent(new MouseEvent("pointermove", at(300)));
    expect(w.emitted("resize")).toHaveLength(1);
    w.unmount();
  });

  // #275: the drag moved to usePointerDrag, which ColorPicker shares.
  it("follows only the pointer that pressed", async () => {
    const w = mountPanels();
    await handleOf(w).trigger("pointerdown", { ...at(200), pointerId: 1 });
    await nextTick();
    document.dispatchEvent(pointer("pointermove", 2, at(300)));
    document.dispatchEvent(pointer("pointerup", 2));
    expect(w.emitted("resize")).toBeUndefined();

    document.dispatchEvent(pointer("pointermove", 1, at(220)));
    expect(w.emitted("resize")).toHaveLength(1);
    document.dispatchEvent(pointer("pointerup", 1));
    document.dispatchEvent(pointer("pointermove", 1, at(260)));
    expect(w.emitted("resize")).toHaveLength(1);
    w.unmount();
  });

  it("unmounting mid-drag removes the document listeners", async () => {
    const unremoved = recordDocumentListeners();
    const w = mountPanels();
    await handleOf(w).trigger("pointerdown", at(200));
    await nextTick();
    expect(unremoved()).toEqual(expect.arrayContaining(["pointermove", "pointerup", "pointercancel"]));

    w.unmount();
    expect(unremoved()).toEqual([]);
  });

  it("sets touch-action: none on the handle, so a touch drag resizes rather than pans", () => {
    const w = mountPanels();
    expect((handleOf(w).element as HTMLElement).style.touchAction).toBe("none");
    w.unmount();
  });
});
