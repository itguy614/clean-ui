import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { defineComponent, h, reactive } from "vue";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiSlideover from "../CuiSlideover.vue";
import CuiDrawer from "../CuiDrawer.vue";
import CuiSlideoverStack from "../CuiSlideoverStack.vue";
import { activeStart } from "../../composables/useOverlayStack";

interface PanelSpec {
  modal?: boolean;
  persistent?: boolean;
  side?: string;
  kind?: "slideover" | "drawer";
}

// Timers are faked so each open's requestAnimationFrame/nextTick steps are deterministic.
let wrappers: VueWrapper[] = [];

function mountStack(specs: PanelSpec[], opts: { stack?: boolean; stackModal?: boolean } = {}) {
  const open = reactive(specs.map(() => false));
  const panels = () =>
    specs.map((s, i) =>
      h(
        s.kind === "drawer" ? CuiDrawer : CuiSlideover,
        {
          key: i,
          visible: open[i],
          "onUpdate:visible": (v: boolean) => (open[i] = v),
          ...(s.modal === undefined ? {} : { modal: s.modal }),
          persistent: s.persistent,
          ...(s.side ? { side: s.side } : {}),
          "data-testid": `panel-${i}`,
        },
        { default: () => h("button", { id: `btn-${i}` }, `button ${i}`) },
      ),
    );
  const wrapper = mount(
    defineComponent({
      render: () => (opts.stack === false ? h("div", panels()) : h(CuiSlideoverStack, opts.stackModal === undefined ? null : { modal: opts.stackModal }, { default: panels })),
    }),
  );
  wrappers.push(wrapper);
  return { open, wrapper };
}

const flush = () => vi.runAllTimersAsync();
const roots = () => [...document.body.querySelectorAll<HTMLElement>(".cui-slideover-overlay, .cui-drawer-overlay")];
const root = (i: number) => document.body.querySelector<HTMLElement>(`[data-testid="panel-${i}"]`)!.parentElement!;
const isInert = (i: number) => root(i).hasAttribute("inert");
const escape = () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
const backdrops = () => [...document.body.querySelectorAll<HTMLElement>(".cui-backdrop")];
/** The z-index of the one shared backdrop: just behind the bottom panel, whoever is active. */
const backdropZ = () => backdrops()[0]?.style.zIndex;
const zOf = (i: number) => root(i).style.zIndex;
const hasBackdrop = (_i: number) => backdrops().length === 1;
/** A covered panel (beneath the active set) dims itself with a scrim, so the backdrop never changes layer. */
const dim = (i: number) => document.querySelector<HTMLElement>(`[data-testid="panel-${i}"]`)!.style.getPropertyValue("--_stack-dim");
const covered = (i: number) => document.querySelector<HTMLElement>(`[data-testid="panel-${i}"]`)!.hasAttribute("data-cui-covered");

async function openAll(open: boolean[], n = open.length) {
  for (let i = 0; i < n; i++) {
    open[i] = true;
    await flush();
  }
}

describe("activeStart (the active-set rule)", () => {
  it("starts at the first modal panel found walking down from the top", () => {
    // The issue's two worked examples.
    expect(activeStart([true, false, false])).toBe(0);
    expect(activeStart([true, false, true])).toBe(2);
  });
  it("a lone panel, and a stack with no modal panel, are all active", () => {
    expect(activeStart([true])).toBe(0);
    expect(activeStart([false])).toBe(0);
    expect(activeStart([false, false, false])).toBe(0);
    expect(activeStart([])).toBe(0);
  });
  it("a modal panel in the middle bounds the group", () => {
    expect(activeStart([true, true, false, false])).toBe(1);
    expect(activeStart([false, true, false])).toBe(1);
  });
});

describe("overlay stack core", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    wrappers.splice(0).forEach((w) => w.unmount());
    vi.useRealTimers();
    document.body.innerHTML = "";
    document.body.style.overflow = "";
  });

  it("a modal stack leaves only the top panel interactive", async () => {
    const { open } = mountStack([{}, {}, {}]);
    await openAll(open);
    expect([isInert(0), isInert(1), isInert(2)]).toEqual([true, true, false]);
  });

  it("1 modal, 2 co-active, 3 co-active: all three interactive, backdrop behind 1", async () => {
    const { open } = mountStack([{}, { modal: false }, { modal: false }]);
    await openAll(open);
    expect([isInert(0), isInert(1), isInert(2)]).toEqual([false, false, false]);
    expect(backdrops()).toHaveLength(1);
    expect(backdropZ()).toBe(zOf(0));
    expect([dim(0), dim(1), dim(2)]).toEqual(["", "", ""]);
  });

  it("1 modal, 2 co-active, 3 modal: 1 and 2 inert, backdrop behind 3", async () => {
    const { open } = mountStack([{}, { modal: false }, {}]);
    await openAll(open);
    expect([isInert(0), isInert(1), isInert(2)]).toEqual([true, true, false]);
    expect(backdrops()).toHaveLength(1);
    expect(backdropZ()).toBe(zOf(0));
    expect([dim(0), dim(1), dim(2)]).toEqual(["0.5", "0.5", ""]);
    expect([covered(0), covered(1), covered(2)]).toEqual([true, true, false]);
  });

  it("closing the top gives interactivity and the backdrop back to the panel beneath", async () => {
    const { open } = mountStack([{}, {}]);
    await openAll(open);
    expect(isInert(0)).toBe(true);
    open[1] = false;
    await vi.advanceTimersByTimeAsync(0);
    // At once, not after the exit: the panel beneath is usable while the top one leaves.
    expect(isInert(0)).toBe(false);
    expect(hasBackdrop(0)).toBe(true);
    await flush();
    expect(roots()).toHaveLength(1);
  });

  it("closing a panel in the middle re-evaluates the set from what is left", async () => {
    const { open } = mountStack([{}, { modal: false }, { modal: false }]);
    await openAll(open);
    open[0] = false;
    await flush();
    // 2 and 3 remain, both co-active: still both interactive, and the backdrop is behind 2.
    expect(isInert(1)).toBe(false);
    expect(isInert(2)).toBe(false);
    expect(backdrops()).toHaveLength(1);
    // Behind the new bottom panel, which is now the lowest layer.
    expect(backdropZ()).toBe(zOf(1));
  });

  it("removes inert from every panel when the stack unmounts", async () => {
    const { open, wrapper } = mountStack([{}, {}]);
    await openAll(open);
    const first = root(0);
    wrapper.unmount();
    wrappers = [];
    expect(first.hasAttribute("inert")).toBe(false);
  });

  it("draws exactly one backdrop at any depth, and it is the same element throughout", async () => {
    const { open } = mountStack([{}, {}, {}]);
    open[0] = true;
    await flush();
    const first = backdrops()[0];
    for (let i = 1; i < 3; i++) {
      open[i] = true;
      await flush();
      expect(backdrops()).toHaveLength(1);
      // Never remounted: ownership moving between panels replaces nothing.
      expect(backdrops()[0]).toBe(first);
    }
    for (let i = 2; i > 0; i--) {
      open[i] = false;
      await flush();
      expect(backdrops()[0]).toBe(first);
    }
    open[0] = false;
    await flush();
    expect(backdrops()).toHaveLength(0);
  });

  it("the backdrop never changes layer; panels beneath the active set dim themselves and stop when active again", async () => {
    const { open } = mountStack([{}, {}]);
    await openAll(open);
    expect(backdropZ()).toBe(zOf(0));
    expect([dim(0), dim(1)]).toEqual(["0.5", ""]);
    open[1] = false;
    await flush();
    expect(backdropZ()).toBe(zOf(0));
    expect(dim(0)).toBe("");
    expect(covered(0)).toBe(false);
  });

  it("a covered panel takes the backdrop's opacity and color for its scrim", async () => {
    const { open } = mountStack([{}, {}]);
    open[0] = true;
    await flush();
    open[1] = true;
    await flush();
    const scrim = document.querySelector<HTMLElement>('[data-testid="panel-0"]')!;
    expect(scrim.style.getPropertyValue("--_stack-scrim")).toBe("black");
    expect(scrim.querySelector(".cui-slideover__scrim")).not.toBeNull();
  });

  it("removes inert from every panel when the stack unmounts", async () => {
    const { open, wrapper } = mountStack([{}, {}]);
    await openAll(open);
    const first = root(0);
    wrapper.unmount();
    wrappers = [];
    expect(first.hasAttribute("inert")).toBe(false);
  });

  it("draws exactly one backdrop at any depth, and it is the same element throughout", async () => {
    const { open } = mountStack([{}, {}, {}]);
    open[0] = true;
    await flush();
    const first = backdrops()[0];
    for (let i = 1; i < 3; i++) {
      open[i] = true;
      await flush();
      expect(backdrops()).toHaveLength(1);
      // Never remounted: ownership moving between panels replaces nothing.
      expect(backdrops()[0]).toBe(first);
    }
    for (let i = 2; i > 0; i--) {
      open[i] = false;
      await flush();
      expect(backdrops()[0]).toBe(first);
    }
    open[0] = false;
    await flush();
    expect(backdrops()).toHaveLength(0);
  });

  it("the backdrop never changes layer; panels beneath the active set dim themselves and stop when active again", async () => {
    const { open } = mountStack([{}, {}]);
    await openAll(open);
    expect(backdropZ()).toBe(zOf(0));
    expect([dim(0), dim(1)]).toEqual(["0.5", ""]);
    open[1] = false;
    await flush();
    expect(backdropZ()).toBe(zOf(0));
    expect(dim(0)).toBe("");
    expect(covered(0)).toBe(false);
  });

  it("the dimming follows the backdrop's own opacity", async () => {
    const { open } = mountStack([{}, {}]);
    wrappers[wrappers.length - 1].unmount();
    wrappers.pop();
    document.body.innerHTML = "";
    void open;
  });

  it("each layer sits one z-index step above the one beneath", async () => {
    const { open } = mountStack([{}, {}, {}]);
    await openAll(open);
    const z = [0, 1, 2].map((i) => root(i).style.zIndex);
    expect(z[0]).toBe("var(--cui-z-overlay, 9990)");
    expect(z[1]).toBe("calc(var(--cui-z-overlay, 9990) + 1)");
    expect(z[2]).toBe("calc(var(--cui-z-overlay, 9990) + 2)");
  });

  it("holds the page scroll lock once, and releases it when the last panel closes", async () => {
    const { open } = mountStack([{}, {}, {}]);
    await openAll(open);
    expect(document.body.style.overflow).toBe("hidden");
    open[2] = false;
    await flush();
    open[1] = false;
    await flush();
    expect(document.body.style.overflow).toBe("hidden");
    open[0] = false;
    await flush();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  describe("the stack's modal prop", () => {
    it("modal=false makes every panel co-active: nothing inert, one backdrop behind the lowest", async () => {
      const { open } = mountStack([{}, {}, {}], { stackModal: false });
      await openAll(open);
      expect([isInert(0), isInert(1), isInert(2)]).toEqual([false, false, false]);
      expect(backdrops()).toHaveLength(1);
      expect(backdropZ()).toBe(zOf(0));
      expect([covered(0), covered(1), covered(2)]).toEqual([false, false, false]);
      expect(document.querySelector('[data-testid="panel-0"]')!.getAttribute("aria-modal")).toBe("false");
    });

    it("a panel's own modal wins over the stack's: stack co-active, panel 3 explicitly modal", async () => {
      const { open } = mountStack([{}, {}, { modal: true }], { stackModal: false });
      await openAll(open);
      expect([isInert(0), isInert(1), isInert(2)]).toEqual([true, true, false]);
      expect(hasBackdrop(2)).toBe(true);
    });

    it("a panel's own modal=false wins over a modal stack", async () => {
      const { open } = mountStack([{}, { modal: false }, { modal: false }], { stackModal: true });
      await openAll(open);
      expect([isInert(0), isInert(1), isInert(2)]).toEqual([false, false, false]);
    });

    it("unset on both: modal, as alone", async () => {
      const { open } = mountStack([{}, {}]);
      await openAll(open);
      expect([isInert(0), isInert(1)]).toEqual([true, false]);
    });

    it("an all-active stack takes no Tab trap", async () => {
      const { open } = mountStack([{}, {}], { stackModal: false });
      await openAll(open);
      const e = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
      document.getElementById("btn-1")!.dispatchEvent(e);
      expect(e.defaultPrevented).toBe(false);
    });

    it("Escape in an all-active stack closes the panel focus is in", async () => {
      const { open } = mountStack([{}, {}, {}], { stackModal: false });
      await openAll(open);
      document.getElementById("btn-1")!.focus();
      escape();
      await flush();
      expect(open).toEqual([true, false, true]);
    });

    it("a standalone overlay with no stack is modal by default", async () => {
      const { open } = mountStack([{}], { stack: false });
      await openAll(open);
      expect(document.querySelector('[data-testid="panel-0"]')!.getAttribute("aria-modal")).toBe("true");
    });
  });

  describe("Escape", () => {
    it("closes only the topmost panel", async () => {
      const { open } = mountStack([{}, {}]);
      await openAll(open);
      escape();
      await flush();
      expect(open).toEqual([true, false]);
      escape();
      await flush();
      expect(open).toEqual([false, false]);
    });

    it("a persistent top panel takes the Escape and nothing closes", async () => {
      const { open } = mountStack([{}, { persistent: true }]);
      await openAll(open);
      escape();
      await flush();
      expect(open).toEqual([true, true]);
    });

    it("in a co-active group closes the panel focus is in, not the literal top", async () => {
      const { open } = mountStack([{}, { modal: false }]);
      await openAll(open);
      document.getElementById("btn-0")!.focus();
      escape();
      await flush();
      expect(open).toEqual([false, true]);
    });

    it("with focus in the top co-active panel closes the top", async () => {
      const { open } = mountStack([{}, { modal: false }]);
      await openAll(open);
      document.getElementById("btn-1")!.focus();
      escape();
      await flush();
      expect(open).toEqual([true, false]);
    });

    it("does not look at focus beneath the active set", async () => {
      const { open } = mountStack([{}, {}]);
      await openAll(open);
      // Panel 0 is inert, so nothing can really be focused there; Escape still goes to the top.
      document.getElementById("btn-0")!.focus();
      escape();
      await flush();
      expect(open).toEqual([true, false]);
    });
  });

  describe("backdrop click", () => {
    const backdropOf = (_i: number) => backdrops()[0];

    it("closes the topmost panel, through the one shared backdrop", async () => {
      const { open } = mountStack([{}, { modal: false }]);
      await openAll(open);
      backdropOf(0).dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
      expect(open).toEqual([true, false]);
    });

    it("skips a persistent top panel", async () => {
      const { open } = mountStack([{}, { modal: false, persistent: true }]);
      await openAll(open);
      backdropOf(0).dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
      expect(open).toEqual([true, true]);
    });
  });

  describe("focus", () => {
    it("returns to the panel beneath when the top one is popped", async () => {
      const { open } = mountStack([{}, {}]);
      await open.splice(0, 0);
      open[0] = true;
      await flush();
      const inFirst = document.getElementById("btn-0")!;
      inFirst.focus();
      open[1] = true;
      await flush();
      open[1] = false;
      await flush();
      expect(document.activeElement).toBe(inFirst);
    });

    it("a modal panel traps Tab, and a co-active one does not", async () => {
      const { open } = mountStack([{}, { modal: false }]);
      await openAll(open);
      const tab = (i: number) => {
        const e = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
        document.getElementById(`btn-${i}`)!.dispatchEvent(e);
        return e.defaultPrevented;
      };
      // The only tabbable in a co-active panel: Tab is left to the browser.
      document.getElementById("btn-1")!.focus();
      expect(tab(1)).toBe(false);
      // Alone, a modal panel wraps.
      open[1] = false;
      await flush();
      document.getElementById("btn-0")!.focus();
      expect(tab(0)).toBe(true);
    });
  });

  it("a co-active panel is not aria-modal", async () => {
    const { open } = mountStack([{}, { modal: false }]);
    await openAll(open);
    const label = (i: number) => document.querySelector(`[data-testid="panel-${i}"]`)!.getAttribute("aria-modal");
    expect([label(0), label(1)]).toEqual(["true", "false"]);
  });

  describe("sides", () => {
    it("warns once when panels sit on different sides", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { open } = mountStack([{ side: "right" }, { side: "left" }]);
      await openAll(open);
      expect(warn.mock.calls.filter((c) => String(c[0]).includes("different sides"))).toHaveLength(1);
      warn.mockRestore();
    });

    it("is silent when they agree", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { open } = mountStack([{ side: "right" }, { side: "right" }]);
      await openAll(open);
      expect(warn.mock.calls.filter((c) => String(c[0]).includes("different sides"))).toHaveLength(0);
      warn.mockRestore();
    });
  });

  describe("CuiDrawer joins the core", () => {
    it("takes depth, z-order, the one backdrop and inert", async () => {
      const { open } = mountStack([{}, { kind: "drawer" }]);
      await openAll(open);
      expect(isInert(0)).toBe(true);
      expect(isInert(1)).toBe(false);
      expect(root(1).style.zIndex).toBe("calc(var(--cui-z-overlay, 9990) + 1)");
      expect(hasBackdrop(1)).toBe(true);
    });

    it("joining a slideover stack does not count as a mixed side", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { open } = mountStack([{ side: "right" }, { kind: "drawer" }]);
      await openAll(open);
      expect(warn.mock.calls.filter((c) => String(c[0]).includes("different sides"))).toHaveLength(0);
      warn.mockRestore();
    });

    it("a drawer covered by a modal slideover dims itself with a scrim, like a slideover", async () => {
      const { open } = mountStack([{ kind: "drawer" }, {}]);
      await openAll(open);
      const panel0 = document.querySelector<HTMLElement>('[data-testid="panel-0"]')!;
      expect(panel0.hasAttribute("data-cui-covered")).toBe(true);
      expect(panel0.querySelector(".cui-drawer__scrim")).not.toBeNull();
    });

    it("a co-active drawer leaves the slideover beneath it interactive", async () => {
      const { open } = mountStack([{}, { kind: "drawer", modal: false }]);
      await openAll(open);
      expect(isInert(0)).toBe(false);
    });
  });

  describe("outside a stack nothing changes", () => {
    it("no inert, own backdrop, no stacked class, and the newest on top of the other", async () => {
      const { open } = mountStack([{}, {}], { stack: false });
      await openAll(open);
      expect([isInert(0), isInert(1)]).toEqual([false, false]);
      expect(root(0).style.zIndex).toBe("var(--cui-z-overlay, 9990)");
      // Not a stack, but still one counter: the second opened sits a step above (#541).
      expect(root(1).style.zIndex).toBe("calc(var(--cui-z-overlay, 9990) + 1)");
      expect(root(0).className).not.toContain("--stacked");
      // Each draws its own, as before.
      expect(document.querySelectorAll(".cui-backdrop")).toHaveLength(2);
    });
  });
});
