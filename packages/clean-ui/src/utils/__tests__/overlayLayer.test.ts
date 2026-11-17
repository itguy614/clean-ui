import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, reactive, shallowRef, Transition } from "vue";
import { renderToString } from "@vue/server-renderer";
import { createSSRApp } from "vue";
import { giveBackOverlayStep, MAX_OVERLAY_STEP, overlayZIndex, takeOverlayStep } from "../overlayLayer";
import { POPOVER_Z_INDEX, TOOLTIP_Z_INDEX } from "../position";
import { useOverlay } from "../../composables/useOverlay";
import { subtreeTransition } from "../motion";

/**
 * #541 — the counter behind "the newest overlay is on top": each overlay takes the next step
 * above the newest open one, gives it back on close, and the base resets when none is open.
 */
const held: number[] = [];
const take = () => held[held.push(takeOverlayStep()) - 1];
afterEach(() => held.splice(0).forEach(giveBackOverlayStep));

describe("takeOverlayStep / giveBackOverlayStep", () => {
  it("starts at 0 and takes the next step above the newest", () => {
    expect([take(), take(), take()]).toEqual([0, 1, 2]);
  });

  it("resets once none is open, so z-index does not climb", () => {
    for (let n = 0; n < 5; n++) {
      const a = takeOverlayStep();
      const b = takeOverlayStep();
      expect([a, b]).toEqual([0, 1]);
      giveBackOverlayStep(b);
      giveBackOverlayStep(a);
    }
  });

  it("closing the newest gives its step to the next one", () => {
    take();
    const b = take();
    giveBackOverlayStep(b);
    held.pop();
    expect(take()).toBe(1);
  });

  it("an out-of-order close removes only its own: the others keep theirs, the next is above the newest", () => {
    const a = take();
    const b = take();
    const c = take();
    giveBackOverlayStep(b);
    held.splice(held.indexOf(b), 1);
    expect([a, c]).toEqual([0, 2]);
    expect(take()).toBe(3);
  });

  it("closing the bottom one first leaves the others in order", () => {
    const a = take();
    take();
    giveBackOverlayStep(a);
    held.shift();
    expect(take()).toBe(2);
  });

  it("caps at a step that leaves room for popovers and tooltips", () => {
    const steps = Array.from({ length: 20 }, take);
    expect(Math.max(...steps)).toBe(MAX_OVERLAY_STEP);
    expect(steps.slice(0, 8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("giving back a step twice, or one never taken, does nothing", () => {
    const a = take();
    giveBackOverlayStep(a);
    giveBackOverlayStep(a);
    held.pop();
    giveBackOverlayStep(5);
    expect(take()).toBe(0);
  });
});

describe("overlayZIndex", () => {
  const n = (css: string) => Number(/\+ (\d+)\)$/.exec(css)?.[1] ?? 0);

  it("derives from --cui-z-overlay, never a bare number", () => {
    expect(overlayZIndex(0)).toBe("var(--cui-z-overlay, 9990)");
    expect(overlayZIndex(3)).toBe("calc(var(--cui-z-overlay, 9990) + 3)");
  });

  it("leaves popovers (+8) and tooltips (+9) above the deepest overlay", () => {
    const deepest = n(overlayZIndex(MAX_OVERLAY_STEP));
    expect(n(POPOVER_Z_INDEX)).toBeGreaterThan(deepest);
    expect(n(TOOLTIP_Z_INDEX)).toBeGreaterThan(n(POPOVER_Z_INDEX));
  });
});

describe("useOverlay and the counter", () => {
  let w: VueWrapper | undefined;
  afterEach(() => {
    w?.unmount();
    w = undefined;
  });

  /** Overlays on `useOverlay`, opened by flipping `open[i]`; `steps()` reads each one's step. */
  function mountOverlays(n: number) {
    const open = reactive(Array.from({ length: n }, () => false));
    const exposed: Array<ReturnType<typeof useOverlay>> = [];
    const One = defineComponent({
      props: { index: { type: Number, required: true } },
      setup(props) {
        const dialogRef = shallowRef<HTMLElement | null>(null);
        const overlay = useOverlay({
          open: () => open[props.index],
          dialogRef,
          persistent: () => false,
          onUpdateOpen: (v) => (open[props.index] = v),
          onClose: () => {},
        });
        exposed[props.index] = overlay;
        return () =>
          h(Transition, { ...subtreeTransition, onAfterLeave: overlay.onAfterLeave }, () =>
            overlay.mounted.value ? h("div", { ref: dialogRef, tabindex: -1, role: "dialog" }) : null,
          );
      },
    });
    w = mount(defineComponent({ render: () => h("div", open.map((_, i) => h(One, { index: i, key: i }))) }), { attachTo: document.body });
    return { open, steps: () => exposed.map((o) => o.zStep.value) };
  }

  const flush = async () => {
    for (let i = 0; i < 4; i++) await nextTick();
  };

  it("an overlay opened later takes the higher step, whatever order they mounted in", async () => {
    const t = mountOverlays(3);
    t.open[2] = true;
    await flush();
    t.open[0] = true;
    await flush();
    t.open[1] = true;
    await flush();
    const [a, b, c] = t.steps();
    expect([c, a, b]).toEqual([0, 1, 2]);
  });

  it("gives its step back when its exit has finished: the next one reuses it", async () => {
    const t = mountOverlays(2);
    t.open[0] = true;
    await flush();
    t.open[1] = true;
    await flush();
    expect(t.steps()).toEqual([0, 1]);
    t.open[1] = false;
    await flush();
    t.open[1] = true;
    await flush();
    expect(t.steps()[1]).toBe(1);
  });

  it("a step given back is reused by a different overlay, not just by the one that held it", async () => {
    const t = mountOverlays(3);
    t.open[0] = true;
    await flush();
    t.open[1] = true;
    await flush();
    t.open[1] = false;
    await flush();
    t.open[2] = true;
    await flush();
    expect(t.steps()[2]).toBe(1);
  });

  it("an overlay unmounted while open gives its step back", async () => {
    const t = mountOverlays(1);
    t.open[0] = true;
    await flush();
    w!.unmount();
    w = undefined;
    expect(takeOverlayStep()).toBe(0);
    giveBackOverlayStep(0);
  });

  it("an out-of-order close leaves the newest where it was", async () => {
    const t = mountOverlays(3);
    for (const i of [0, 1, 2]) {
      t.open[i] = true;
      await flush();
    }
    t.open[1] = false;
    await flush();
    expect(t.steps()[2]).toBe(2);
  });
});

describe("SSR", () => {
  it("rendering an overlay on the server never touches the counter", async () => {
    const Dialog = defineComponent({
      setup() {
        const dialogRef = shallowRef<HTMLElement | null>(null);
        useOverlay({ open: () => true, dialogRef, persistent: () => false, onUpdateOpen: () => {}, onClose: () => {} });
        return () => h("div");
      },
    });
    await renderToString(createSSRApp(Dialog));
    expect(takeOverlayStep()).toBe(0);
    giveBackOverlayStep(0);
  });
});
