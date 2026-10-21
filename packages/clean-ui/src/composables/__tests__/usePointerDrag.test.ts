import { describe, it, expect, vi, afterEach } from "vitest";
import { effectScope, nextTick } from "vue";
import { usePointerDrag } from "../usePointerDrag";
import { pointer, recordDocumentListeners } from "../../__tests__/pointer";

/**
 * #246 / #275 — a drag followed on the document must follow only its own pointer, end on
 * that pointer's pointerup or pointercancel (a touch the browser takes over for scrolling
 * sends no pointerup), and leave no listener behind when it ends or its owner goes away.
 */
function setup() {
  const scope = effectScope();
  const drag = scope.run(() => usePointerDrag())!;
  const move = vi.fn();
  const start = async (id = 1) => {
    drag.start(pointer("pointerdown", id), move);
    await nextTick();
  };
  return { scope, drag, move, start };
}

describe("usePointerDrag", () => {
  afterEach(() => vi.restoreAllMocks());

  it("holds no document listener until a drag starts", async () => {
    const unremoved = recordDocumentListeners();
    const t = setup();
    expect(unremoved()).toEqual([]);
    await t.start();
    expect(t.drag.active.value).toBe(true);
    expect(unremoved()).toEqual(expect.arrayContaining(["pointermove", "pointerup", "pointercancel"]));
    t.scope.stop();
  });

  it.each(["pointerup", "pointercancel"])("follows moves until a %s, then removes every listener", async (type) => {
    const unremoved = recordDocumentListeners();
    const t = setup();
    await t.start();
    document.dispatchEvent(pointer("pointermove", 1, { clientX: 20 }));
    expect(t.move).toHaveBeenCalledTimes(1);

    document.dispatchEvent(pointer(type, 1));
    expect(t.drag.active.value).toBe(false);
    // Before the listeners come off, a move already reaches no handler.
    document.dispatchEvent(pointer("pointermove", 1, { clientX: 40 }));
    expect(t.move).toHaveBeenCalledTimes(1);
    await nextTick();
    expect(unremoved()).toEqual([]);
    t.scope.stop();
  });

  it("ignores pointers other than the one that started the drag", async () => {
    const t = setup();
    await t.start(1);
    document.dispatchEvent(pointer("pointermove", 2, { clientX: 50 }));
    document.dispatchEvent(pointer("pointerup", 2));
    document.dispatchEvent(pointer("pointercancel", 2));
    expect(t.move).not.toHaveBeenCalled();
    expect(t.drag.active.value).toBe(true);

    document.dispatchEvent(pointer("pointerup", 1));
    expect(t.drag.active.value).toBe(false);
    t.scope.stop();
  });

  it("end() ends the drag", async () => {
    const unremoved = recordDocumentListeners();
    const t = setup();
    await t.start();
    t.drag.end();
    expect(t.drag.active.value).toBe(false);
    document.dispatchEvent(pointer("pointermove", 1));
    expect(t.move).not.toHaveBeenCalled();
    await nextTick();
    expect(unremoved()).toEqual([]);
    t.scope.stop();
  });

  // A right-click opens the context menu, which can swallow the release; a middle-click
  // starts autoscroll.
  it.each([1, 2])("does not start on a press of button %i", async (button) => {
    const unremoved = recordDocumentListeners();
    const t = setup();
    expect(t.drag.start(pointer("pointerdown", 1, { button }), t.move)).toBe(false);
    await nextTick();
    expect(t.drag.active.value).toBe(false);
    expect(unremoved()).toEqual([]);
    t.scope.stop();
  });

  it("starting a drag ends the one in progress", async () => {
    const t = setup();
    await t.start(1);
    const nextMove = vi.fn();
    t.drag.start(pointer("pointerdown", 2), nextMove);
    document.dispatchEvent(pointer("pointermove", 1));
    document.dispatchEvent(pointer("pointermove", 2));
    expect(t.move).not.toHaveBeenCalled();
    expect(nextMove).toHaveBeenCalledTimes(1);
    t.scope.stop();
  });

  it("ends a drag still running when its scope ends (the component unmounts)", async () => {
    const unremoved = recordDocumentListeners();
    const t = setup();
    await t.start();
    t.scope.stop();
    expect(t.drag.active.value).toBe(false);
    expect(unremoved()).toEqual([]);
  });
});
