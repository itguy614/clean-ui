import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { effectScope, nextTick, shallowRef } from "vue";
import { useDragDismiss, type DragEdge } from "../useDragDismiss";
import { pointer } from "../../__tests__/pointer";

/**
 * #268 — the gesture's decisions, with the clock and the geometry under test's control: when a
 * release closes (distance or velocity), when a drag is not ours (scrolled content, a field,
 * a mouse off the handle, a second finger), and that a drag only ever writes `transform`.
 * jsdom has no layout, so the panel's size is given; real layout is in the browser test.
 */
function setup(opts: { edge?: DragEdge; stops?: number[]; stop?: number; enabled?: boolean } = {}) {
  const el = document.createElement("div");
  el.innerHTML = `<div class="handle"></div><div class="body"><input /></div>`;
  document.body.append(el);
  Object.defineProperty(el, "offsetHeight", { value: 400 });
  Object.defineProperty(el, "offsetWidth", { value: 400 });
  const panel = shallowRef<HTMLElement | null>(el);
  const onDismiss = vi.fn();
  const onSettle = vi.fn();
  const scope = effectScope();
  const gesture = scope.run(() =>
    useDragDismiss({
      panel,
      edge: () => opts.edge ?? "bottom",
      enabled: () => opts.enabled ?? true,
      handle: () => el.querySelector<HTMLElement>(".handle"),
      stops: () => opts.stops ?? [0],
      stop: () => opts.stop ?? 0,
      onDismiss,
      onSettle,
    }),
  )!;
  el.addEventListener("pointerdown", gesture.onPointerdown as EventListener);
  const send = (target: Element, type: string, id: number, x: number, y: number, extra: Record<string, unknown> = {}) => {
    const ev = pointer(type, id, { clientX: x, clientY: y, bubbles: true }) as PointerEvent & Record<string, unknown>;
    for (const [k, v] of Object.entries({ isPrimary: true, pointerType: "touch", ...extra })) Object.defineProperty(ev, k, { value: v });
    target.dispatchEvent(ev);
  };
  /** Press, commit, then move to `y` after `ms` and release. */
  async function swipe(target: Element, y: number, ms: number, id = 1) {
    send(target, "pointerdown", id, 100, 100);
    await nextTick();
    send(target, "pointermove", id, 100, 110);
    vi.advanceTimersByTime(ms);
    send(target, "pointermove", id, 100, y);
    send(target, "pointerup", id, 100, y);
    await nextTick();
  }
  return { el, onDismiss, onSettle, send, swipe, scope, gesture };
}

describe("useDragDismiss", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("closes on a flick, however short", async () => {
    const t = setup();
    await t.swipe(t.el, 140, 20); // 30px over 20ms
    expect(t.onDismiss).toHaveBeenCalledTimes(1);
  });

  it("springs back from a slow, short drag", async () => {
    const t = setup();
    await t.swipe(t.el, 140, 600); // 30px over 600ms
    expect(t.onDismiss).not.toHaveBeenCalled();
    expect(t.onSettle).toHaveBeenCalledWith(0);
    expect(t.el.style.transform).toBe("");
  });

  it("closes a slow drag past the closing point", async () => {
    const t = setup();
    await t.swipe(t.el, 110 + 200, 4000); // 200 of 400px
    expect(t.onDismiss).toHaveBeenCalledTimes(1);
  });

  it("writes only a transform while dragging, and hands it back after", async () => {
    const t = setup();
    t.send(t.el, "pointerdown", 1, 100, 100);
    await nextTick();
    t.send(t.el, "pointermove", 1, 100, 110);
    t.send(t.el, "pointermove", 1, 100, 160);
    expect(t.el.style.transform).toBe("translateY(50px)");
    expect(t.el.style.transition).toBe("none");
    expect(t.el.getAttribute("style")).not.toMatch(/--/);
    t.send(t.el, "pointerup", 1, 100, 160);
    await nextTick();
    await nextTick();
    expect(t.el.style.transform).toBe("");
    expect(t.el.style.transition).toBe("");
  });

  it("damps a pull past fully open", async () => {
    const t = setup({ stops: [0, 200], stop: 1 });
    t.send(t.el, "pointerdown", 1, 100, 100);
    await nextTick();
    t.send(t.el, "pointermove", 1, 100, 110);
    t.send(t.el, "pointermove", 1, 100, -400); // 510 past the start, 310 past fully open
    const y = parseFloat(/translateY\((-?[\d.]+)px\)/.exec(t.el.style.transform)![1]);
    expect(y).toBeLessThan(0);
    expect(-y).toBeLessThan(80);
    t.send(t.el, "pointerup", 1, 100, -400);
  });

  it("refuses a pull away from the edge with no higher stop", async () => {
    const t = setup();
    t.send(t.el, "pointerdown", 1, 100, 300);
    await nextTick();
    t.send(t.el, "pointermove", 1, 100, 250);
    expect(t.el.hasAttribute("data-cui-dragging")).toBe(false);
    expect(t.el.style.transform).toBe("");
  });

  it("refuses a swipe across the axis", async () => {
    const t = setup();
    t.send(t.el, "pointerdown", 1, 100, 100);
    await nextTick();
    t.send(t.el, "pointermove", 1, 160, 110);
    expect(t.el.hasAttribute("data-cui-dragging")).toBe(false);
  });

  it("ignores a second finger and keeps following the first", async () => {
    const t = setup();
    t.send(t.el, "pointerdown", 1, 100, 100);
    await nextTick();
    t.send(t.el, "pointermove", 1, 100, 110);
    t.send(t.el, "pointermove", 1, 100, 150);
    const at = t.el.style.transform;
    t.send(t.el, "pointerdown", 2, 100, 100, { isPrimary: false });
    await nextTick();
    t.send(t.el, "pointermove", 2, 100, 380, { isPrimary: false });
    t.send(t.el, "pointerup", 2, 100, 380, { isPrimary: false });
    expect(t.el.style.transform).toBe(at);
    expect(t.el.hasAttribute("data-cui-dragging")).toBe(true);
    expect(t.onSettle).not.toHaveBeenCalled();
    // The first finger is still the one that ends it.
    t.send(t.el, "pointerup", 1, 100, 150);
    await nextTick();
    expect(t.onSettle.mock.calls.length + t.onDismiss.mock.calls.length).toBe(1);
  });

  it("treats a stop index below zero as the fully open stop", async () => {
    // No snap points: an unset stop must not index off the end of the list.
    const t = setup({ stops: [0], stop: -1 });
    await t.swipe(t.el, 140, 20);
    expect(t.onDismiss).toHaveBeenCalledTimes(1);
  });

  it("takes a mouse only from the handle", async () => {
    const t = setup();
    const mouse = { pointerType: "mouse" };
    const body = t.el.querySelector(".body")!;
    t.send(body, "pointerdown", 1, 100, 100, mouse);
    await nextTick();
    t.send(body, "pointermove", 1, 100, 110, mouse);
    t.send(body, "pointermove", 1, 100, 160, mouse);
    expect(t.el.hasAttribute("data-cui-dragging")).toBe(false);
    t.send(body, "pointerup", 1, 100, 160, mouse);
    await nextTick();

    const handle = t.el.querySelector(".handle")!;
    t.send(handle, "pointerdown", 1, 100, 100, mouse);
    await nextTick();
    t.send(handle, "pointermove", 1, 100, 110, mouse);
    t.send(handle, "pointermove", 1, 100, 160, mouse);
    expect(t.el.hasAttribute("data-cui-dragging")).toBe(true);
    t.send(handle, "pointerup", 1, 100, 160, mouse);
  });

  it("never starts on a field", async () => {
    const t = setup();
    const input = t.el.querySelector("input")!;
    t.send(input, "pointerdown", 1, 100, 100);
    await nextTick();
    t.send(input, "pointermove", 1, 100, 110);
    t.send(input, "pointermove", 1, 100, 160);
    expect(t.el.hasAttribute("data-cui-dragging")).toBe(false);
  });

  it("is off when disabled", async () => {
    const t = setup({ enabled: false });
    await t.swipe(t.el, 300, 10);
    expect(t.onDismiss).not.toHaveBeenCalled();
    expect(t.el.hasAttribute("data-cui-dragging")).toBe(false);
  });

  it("leaves a press in content scrolled away from the dismiss end to the scroll", async () => {
    const t = setup();
    const body = t.el.querySelector<HTMLElement>(".body")!;
    body.style.overflowY = "auto";
    Object.defineProperty(body, "scrollHeight", { value: 600 });
    Object.defineProperty(body, "clientHeight", { value: 200 });
    body.scrollTop = 120;
    await t.swipe(body, 400, 10);
    expect(t.onDismiss).not.toHaveBeenCalled();
    expect(t.el.hasAttribute("data-cui-dragging")).toBe(false);
    // Back at the top it is a drag again.
    body.scrollTop = 0;
    await t.swipe(body, 400, 10);
    expect(t.onDismiss).toHaveBeenCalledTimes(1);
  });

  it("blocks a drag for 100ms after the content scrolled", async () => {
    const t = setup();
    t.gesture.onScrollCapture();
    vi.advanceTimersByTime(60);
    await t.swipe(t.el, 400, 10);
    expect(t.onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    await t.swipe(t.el, 400, 10);
    expect(t.onDismiss).toHaveBeenCalledTimes(1);
  });

  it("goes toward the edge for each edge", async () => {
    for (const [edge, down, move, axis, sign] of [
      ["top", [100, 300], [100, 250], "Y", "-"],
      ["left", [300, 100], [250, 100], "X", "-"],
      ["right", [100, 100], [160, 100], "X", ""],
    ] as const) {
      const t = setup({ edge });
      t.send(t.el, "pointerdown", 1, down[0], down[1]);
      await nextTick();
      t.send(t.el, "pointermove", 1, edge === "top" ? 100 : edge === "left" ? 290 : 110, edge === "top" ? 290 : 100);
      t.send(t.el, "pointermove", 1, move[0], move[1]);
      expect(t.el.style.transform, edge).toMatch(new RegExp(`translate${axis}\\(${sign}\\d`));
      t.send(t.el, "pointerup", 1, move[0], move[1]);
      t.scope.stop();
    }
  });

  describe("snap points", () => {
    const stops = [0, 150, 300];
    it("moves one stop on a flick, and out past the last", async () => {
      const up = setup({ stops, stop: 1 });
      await up.swipe(up.el, 0, 20); // a flick up from the middle: 110 → 0
      expect(up.onSettle).toHaveBeenCalledWith(0);

      const down = setup({ stops, stop: 1 });
      await down.swipe(down.el, 150, 20);
      expect(down.onSettle).toHaveBeenCalledWith(2);

      const last = setup({ stops, stop: 2 });
      await last.swipe(last.el, 150, 20);
      expect(last.onDismiss).toHaveBeenCalledTimes(1);
    });

    it("settles on the nearest stop after a slow release", async () => {
      const t = setup({ stops, stop: 0 });
      await t.swipe(t.el, 110 + 140, 5000);
      expect(t.onSettle).toHaveBeenCalledWith(1);
    });

    it("lets a pull away from the edge start when a higher stop exists", async () => {
      const t = setup({ stops, stop: 1 });
      t.send(t.el, "pointerdown", 1, 100, 300);
      await nextTick();
      t.send(t.el, "pointermove", 1, 100, 260);
      expect(t.el.hasAttribute("data-cui-dragging")).toBe(true);
    });
  });

  it("settles back, never closes, when the browser cancels the pointer", async () => {
    const t = setup();
    t.send(t.el, "pointerdown", 1, 100, 100);
    await nextTick();
    t.send(t.el, "pointermove", 1, 100, 110);
    t.send(t.el, "pointermove", 1, 100, 390);
    t.send(t.el, "pointercancel", 1, 100, 390);
    await nextTick();
    expect(t.onDismiss).not.toHaveBeenCalled();
    expect(t.onSettle).toHaveBeenCalledWith(0);
  });

  it("swallows the click that ends a drag, and only that one", async () => {
    const t = setup();
    await t.swipe(t.el, 140, 600);
    const click = new MouseEvent("click", { cancelable: true, bubbles: true });
    const stop = vi.spyOn(click, "stopPropagation");
    t.gesture.onClickCapture(click);
    expect(stop).toHaveBeenCalled();
    expect(click.defaultPrevented).toBe(true);
    vi.advanceTimersByTime(200);
    const later = new MouseEvent("click", { cancelable: true });
    t.gesture.onClickCapture(later);
    expect(later.defaultPrevented).toBe(false);
  });

  it("removes its touchmove guard and capture when its scope ends mid-drag", async () => {
    const t = setup();
    const remove = vi.spyOn(t.el, "removeEventListener");
    t.send(t.el, "pointerdown", 1, 100, 100);
    await nextTick();
    t.send(t.el, "pointermove", 1, 100, 110);
    t.send(t.el, "pointermove", 1, 100, 150);
    t.scope.stop();
    expect(remove).toHaveBeenCalledWith("touchmove", expect.any(Function));
    expect(t.el.style.transform).toBe("");
  });
});
