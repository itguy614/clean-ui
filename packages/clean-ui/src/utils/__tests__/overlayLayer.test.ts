import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, reactive, ref, shallowRef, Transition, vShow, withDirectives } from "vue";
import { renderToString } from "@vue/server-renderer";
import { createSSRApp } from "vue";
import { dismissPanels, giveBackStep, inChildLayer, MAX_LAYER_STEP, overlayZIndex, takeLayerStep, type LayerToken } from "../overlayLayer";
import { TOAST_Z_INDEX, TOOLTIP_Z_INDEX } from "../position";
import { useOverlay } from "../../composables/useOverlay";
import { useLayerStep } from "../../composables/useLayerStep";
import { subtreeTransition } from "../motion";

/**
 * #541 — the counter behind "the newest layer is on top": overlays and anchored panels share one
 * sequence, each takes the next step above the newest open one, gives it back on close, and the
 * base resets when none is open.
 */
const held: LayerToken[] = [];
const take = (panel = false, dismiss?: () => void) => {
  const t = takeLayerStep(panel ? dismiss : undefined);
  held.push(t);
  return t;
};
const give = (t: LayerToken) => {
  giveBackStep(t);
  held.splice(held.indexOf(t), 1);
};
afterEach(() => held.splice(0).forEach(giveBackStep));

describe("takeLayerStep / giveBackStep", () => {
  it("starts at 0 and takes the next step above the newest, overlays and panels alike", () => {
    expect([take().step, take(true).step, take().step]).toEqual([0, 1, 2]);
  });

  it("resets once none is open, so z-index does not climb", () => {
    for (let n = 0; n < 5; n++) {
      const a = takeLayerStep();
      const b = takeLayerStep();
      expect([a.step, b.step]).toEqual([0, 1]);
      giveBackStep(b);
      giveBackStep(a);
    }
  });

  it("closing the newest gives its step to the next one", () => {
    take();
    give(take());
    expect(take().step).toBe(1);
  });

  it("an out-of-order close removes only its own: the others keep theirs, the next is above the newest", () => {
    const a = take();
    const b = take();
    const c = take(true);
    give(b);
    expect([a.step, c.step]).toEqual([0, 2]);
    expect(take().step).toBe(3);
  });

  it("closing the bottom one first leaves the others in order", () => {
    const a = take();
    take();
    give(a);
    expect(take().step).toBe(2);
  });

  it("holds 40 layers in order; past the last step they share it", () => {
    const steps = Array.from({ length: 45 }, () => take().step);
    expect(steps.slice(0, 40)).toEqual(Array.from({ length: 40 }, (_, i) => i));
    expect(new Set(steps.slice(39))).toEqual(new Set([MAX_LAYER_STEP]));
  });

  it("giving a token back twice does nothing", () => {
    const a = take();
    const b = take();
    giveBackStep(a);
    giveBackStep(a);
    held.splice(held.indexOf(a), 1);
    expect(take().step).toBe(b.step + 1);
  });
});

describe("inChildLayer: a press in a panel the host opened", () => {
  const within = () => {
    const inner = document.createElement("span");
    const el = document.createElement("div");
    el.append(inner);
    return { inner, el };
  };

  it("is true inside a nested panel and false inside an unrelated one or outside any", () => {
    const nested = within();
    const unrelated = within();
    const host = take(true);
    held.push(takeLayerStep(undefined, host, () => nested.el), takeLayerStep(undefined, null, () => unrelated.el));
    expect(inChildLayer(host, nested.inner)).toBe(true);
    expect(inChildLayer(host, unrelated.inner)).toBe(false);
    expect(inChildLayer(host, document.body)).toBe(false);
    expect(inChildLayer(undefined, nested.inner)).toBe(false);
  });

  it("reaches through a chain of hosts, and ends with the nested panel", () => {
    const deep = within();
    const a = take(true);
    const b = takeLayerStep(undefined, a);
    const c = takeLayerStep(undefined, b, () => deep.el);
    held.push(b, c);
    expect(inChildLayer(a, deep.inner)).toBe(true);
    give(c);
    expect(inChildLayer(a, deep.inner)).toBe(false);
  });
});

describe("dismissPanels: an overlay opening light-dismisses the panels beneath it", () => {
  it("calls the dismiss of every panel older than the overlay, and nothing else", () => {
    const calls: string[] = [];
    take(true, () => calls.push("a"));
    take(true); // a sub-menu: no dismiss of its own
    const overlay = take();
    take(true, () => calls.push("opened after"));
    dismissPanels(overlay);
    expect(calls).toEqual(["a"]);
  });

  it("the panel an overlay is declared in, and the panels holding that one, stay open", () => {
    const calls: string[] = [];
    const outer = takeLayerStep(() => calls.push("outer"));
    held.push(outer);
    const host = takeLayerStep(() => calls.push("host"), outer);
    held.push(host);
    take(true, () => calls.push("other"));
    const overlay = take();
    dismissPanels(overlay, host);
    expect(calls).toEqual(["other"]);
  });

  it("an overlay beneath a panel is not dismissed, and a panel opened over an overlay is left", () => {
    const calls: string[] = [];
    const first = take();
    take(true, () => calls.push("inside first"));
    dismissPanels(first);
    expect(calls).toEqual([]);
  });
});

describe("overlayZIndex", () => {
  const n = (css: string) => Number(/\+ (\d+)\)$/.exec(css)?.[1] ?? 0);

  it("derives from --cui-z-overlay, never a bare number", () => {
    expect(overlayZIndex(0)).toBe("var(--cui-z-overlay, 9990)");
    expect(overlayZIndex(3)).toBe("calc(var(--cui-z-overlay, 9990) + 3)");
    expect(TOAST_Z_INDEX).toMatch(/var\(--cui-z-overlay/);
    expect(TOOLTIP_Z_INDEX).toMatch(/var\(--cui-z-overlay/);
  });

  it("the toast region sits above the whole sequence, and a tooltip above the toast region", () => {
    expect(n(TOAST_Z_INDEX)).toBeGreaterThan(n(overlayZIndex(MAX_LAYER_STEP)));
    expect(n(TOOLTIP_Z_INDEX)).toBeGreaterThan(n(TOAST_Z_INDEX));
  });
});

describe("useLayerStep", () => {
  let w: VueWrapper | undefined;
  afterEach(() => {
    w?.unmount();
    w = undefined;
  });

  function mountPanel(dismissed: string[] = []) {
    const open = ref(false);
    const present = ref(false);
    let step!: ReturnType<typeof useLayerStep>;
    w = mount(
      defineComponent({
        setup() {
          step = useLayerStep(() => open.value, present, () => dismissed.push("closed"), () => null);
          return () => h("div");
        },
      }),
    );
    return { open, present, step: () => step.value };
  }

  it("takes a step on open and keeps it through the exit, giving it back when no longer present", () => {
    const a = mountPanel();
    a.open.value = true;
    a.present.value = true;
    expect(a.step()).toBe(0);
    const overlay = take();
    a.open.value = false; // closing: still present, still holding its step
    expect(take().step).toBe(overlay.step + 1);
    a.present.value = false;
    give(overlay);
  });

  it("gives its step back once its exit has finished: the next layer reuses it", async () => {
    const a = mountPanel();
    a.open.value = true;
    a.present.value = true;
    a.open.value = false;
    a.present.value = false;
    expect(take().step).toBe(0);
  });

  it("an unmounted panel gives its step back", () => {
    const a = mountPanel();
    a.open.value = true;
    a.present.value = true;
    w!.unmount();
    w = undefined;
    expect(take().step).toBe(0);
  });

  it("opened and closed in one tick, it never took a step it cannot give back", async () => {
    const a = mountPanel();
    a.open.value = true;
    a.open.value = false;
    await nextTick();
    expect(take().step).toBe(0);
  });

  it("its dismiss does not run for a panel that is already leaving", () => {
    const dismissed: string[] = [];
    const a = mountPanel(dismissed);
    a.open.value = true;
    a.present.value = true;
    a.open.value = false; // exiting: still present, still holding its step
    dismissPanels(take());
    expect(dismissed).toEqual([]);
  });

  it("its dismiss runs when an overlay opens over it", () => {
    const dismissed: string[] = [];
    const a = mountPanel(dismissed);
    a.open.value = true;
    a.present.value = true;
    dismissPanels(take());
    expect(dismissed).toEqual(["closed"]);
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
            overlay.mounted.value ? withDirectives(h("div", { ref: dialogRef, tabindex: -1, role: "dialog" }), [[vShow, overlay.isVisible.value]]) : null,
          );
      },
    });
    w = mount(defineComponent({ render: () => h("div", open.map((_, i) => h(One, { index: i, key: i }))) }), { attachTo: document.body });
    return { open, steps: () => exposed.map((o) => o.zStep.value), overlay: (i: number) => exposed[i] };
  }

  const flush = async () => {
    for (let i = 0; i < 4; i++) await nextTick();
    await new Promise((r) => setTimeout(r, 30));
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

  it("an overlay opened and closed in one tick gives its step back", async () => {
    const t = mountOverlays(1);
    t.overlay(0).openOverlay();
    t.overlay(0).closeOverlay();
    await flush();
    const probe = takeLayerStep();
    expect(probe.step).toBe(0);
    giveBackStep(probe);
  });

  it("an overlay unmounted while open gives its step back", async () => {
    const t = mountOverlays(1);
    t.open[0] = true;
    await flush();
    w!.unmount();
    w = undefined;
    const probe = takeLayerStep();
    expect(probe.step).toBe(0);
    giveBackStep(probe);
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
    const probe = takeLayerStep();
    expect(probe.step).toBe(0);
    giveBackStep(probe);
  });
});
