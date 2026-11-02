import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { cdp } from "@vitest/browser/context";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref, type Component } from "vue";
import main from "../../styles/main.css?inline";
import { frames, installTokens } from "../../../../../config/test/browser-helpers";
import { motionDuration } from "../../utils/motion";
import { RESTORE_FOCUS_ATTR, RESTORE_FOCUS_EVENT } from "../../utils/focusRestore";
import type { OverlayFocusProps } from "../../types/common";
import CuiModal from "../../components/CuiModal.vue";
import CuiSlideover from "../../components/CuiSlideover.vue";

/**
 * #374 — an app wanting focus somewhere other than the panel on open, or the opener on
 * close, had no hook: no event when the entry had finished, and focus moved in a `close`
 * handler was taken straight back to the opener. CuiModal and CuiSlideover now emit
 * `after-enter` / `after-leave` and take `initialFocus` / `returnFocus`. Real browser, real
 * transitions: the events are only worth anything if they wait for the animation.
 */
const OVERLAYS: [string, Component, string][] = [
  ["CuiModal", CuiModal, ".cui-modal"],
  ["CuiSlideover", CuiSlideover, ".cui-slideover__panel"],
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Long enough for any entry or exit here to have finished, the slow backdrop included. */
const settle = () => wait(motionDuration("slow") + 150);

/** Running, finite animations on what `afterAnimations` (utils/motion.ts) waits on. */
function runningAnimations(root: Element | null) {
  if (!root) return 0;
  return [root, ...root.querySelectorAll("[data-cui-exit]")]
    .flatMap((el) => el.getAnimations())
    .filter((a) => a.playState === "running" && a.effect?.getTiming().iterations !== Infinity).length;
}

let removeTokens: () => void;
beforeAll(() => (removeTokens = installTokens(main)));
afterAll(() => removeTokens());

let wrapper: VueWrapper | undefined;
afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = "";
});

interface Recorded {
  name: string;
  /** document.activeElement when it fired */
  focus: Element | null;
  /** animations still running on the overlay when it fired */
  running: number;
}

function setup(
  Overlay: Component,
  panelSelector: string,
  {
    onClose,
    focusFieldOnMount = false,
    initialFocusHeadingEl = false,
    ...props
  }: OverlayFocusProps & {
    onClose?: () => void;
    /** Content that focuses its own field a tick after mounting, as the editor's URL dialog does (#420). */
    focusFieldOnMount?: boolean;
    /** Pass the content's heading element itself as initialFocus, once it has rendered. */
    initialFocusHeadingEl?: boolean;
  } = {},
) {
  const visible = ref(false);
  const headingEl = ref<HTMLElement>();
  const events: Recorded[] = [];
  const root = () => document.querySelector(".cui-modal-overlay, .cui-slideover-overlay");
  const record = (name: string) => () =>
    events.push({ name, focus: document.activeElement, running: runningAnimations(root()) });
  const Host = defineComponent({
    setup() {
      return () => [
        h("button", { "data-t": "opener", onClick: () => (visible.value = true) }, "Open"),
        h("button", { "data-t": "elsewhere" }, "Elsewhere"),
        h(
          Overlay,
          {
            visible: visible.value,
            title: "Panel",
            ...props,
            ...(initialFocusHeadingEl ? { initialFocus: headingEl.value } : {}),
            "onUpdate:visible": (v: boolean) => (visible.value = v),
            onClose: () => {
              record("close")();
              onClose?.();
            },
            onAfterEnter: record("after-enter"),
            onAfterLeave: record("after-leave"),
          },
          () => [
            h("h3", { "data-t": "heading", tabindex: -1, ref: headingEl }, "Heading"),
            h("h4", { "data-t": "plain" }, "Not focusable"),
            h("input", {
              "data-t": "field",
              onVnodeMounted: focusFieldOnMount
                ? ({ el }: { el: HTMLElement | null }) => nextTick(() => el?.focus())
                : undefined,
            }),
          ],
        ),
      ];
    },
  });
  wrapper = mount(Host, { attachTo: document.body });
  const byT = (t: string) => document.querySelector<HTMLElement>(`[data-t="${t}"]`)!;
  return {
    visible,
    events,
    names: () => events.map((e) => e.name),
    byT,
    panel: () => document.querySelector<HTMLElement>(panelSelector),
    async open() {
      byT("opener").focus();
      byT("opener").click();
      await nextTick();
    },
  };
}

describe.each(OVERLAYS)("%s focus and lifecycle events (real browser)", (_, Overlay, panelSelector) => {
  it("fires after-enter once, after the entry has finished, with the panel focused", async () => {
    const t = setup(Overlay, panelSelector);
    await t.open();
    await frames(1);
    await frames(1);
    expect(t.names(), "not while it is still coming in").toEqual([]);
    await settle();
    expect(t.names()).toEqual(["after-enter"]);
    expect(t.events[0].running, "the entry had finished").toBe(0);
    expect(t.events[0].focus).toBe(t.panel());
    await settle();
    expect(t.names(), "once").toEqual(["after-enter"]);
  });

  it("fires after-leave once, after the exit and close, with focus back on the opener", async () => {
    const t = setup(Overlay, panelSelector);
    await t.open();
    await settle();
    t.events.length = 0;
    t.visible.value = false;
    await frames(1);
    expect(t.names(), "not while it is still leaving").toEqual([]);
    await settle();
    expect(t.names()).toEqual(["close", "after-leave"]);
    const leave = t.events[1];
    expect(leave.running, "the exit had finished").toBe(0);
    expect(leave.focus, "focus already returned").toBe(t.byT("opener"));
    await settle();
    expect(t.names(), "once").toEqual(["close", "after-leave"]);
  });

  it("never fires after-enter for an open closed before its entry ended", async () => {
    const t = setup(Overlay, panelSelector);
    await t.open();
    await frames(1);
    await frames(1);
    t.visible.value = false;
    await settle();
    await settle();
    expect(t.names()).toEqual(["close", "after-leave"]);
  });

  it("focuses initialFocus given as a selector, scoped to the panel", async () => {
    const t = setup(Overlay, panelSelector, { initialFocus: "[data-t='heading']" });
    await t.open();
    await settle();
    expect(t.events[0].focus).toBe(t.byT("heading"));
  });

  it("focuses initialFocus given as a function", async () => {
    // The function runs once the content has rendered, so it can reach an element in it.
    const t = setup(Overlay, panelSelector, { initialFocus: () => document.querySelector<HTMLElement>("[data-t='field']") });
    await t.open();
    await settle();
    expect(t.events[0].focus).toBe(t.byT("field"));
  });

  it("focuses initialFocus given as an element in the panel", async () => {
    const t = setup(Overlay, panelSelector, { initialFocusHeadingEl: true });
    await t.open();
    await settle();
    expect(t.events[0].focus).toBe(t.byT("heading"));
  });

  it("ignores an initialFocus outside the panel, or one that can't take focus", async () => {
    const outside = document.createElement("button");
    document.body.append(outside);
    const t = setup(Overlay, panelSelector, { initialFocus: outside });
    await t.open();
    await settle();
    expect(t.events[0].focus, "focus stays in the aria-modal dialog").toBe(t.panel());
    wrapper!.unmount();

    // A heading without tabindex ignores focus(): the panel, not the opener behind it.
    const u = setup(Overlay, panelSelector, { initialFocus: "[data-t='plain']" });
    await u.open();
    await settle();
    expect(u.events[0].focus).toBe(u.panel());
  });

  it("treats an invalid initialFocus or returnFocus selector as naming nothing", async () => {
    const t = setup(Overlay, panelSelector, { initialFocus: "#1-bad", returnFocus: "[data-x=1 2]" });
    await t.open();
    await settle();
    expect(t.events[0].focus).toBe(t.panel());
    t.visible.value = false;
    await settle();
    expect(t.names()).toEqual(["after-enter", "close", "after-leave"]);
    expect(document.activeElement).toBe(t.byT("opener"));
  });

  it("falls back to the panel when initialFocus names nothing in it", async () => {
    // A match outside the panel doesn't count: the selector is scoped to it.
    const outside = document.createElement("button");
    outside.className = "probe";
    document.body.append(outside);
    const t = setup(Overlay, panelSelector, { initialFocus: ".probe" });
    await t.open();
    await settle();
    expect(t.events[0].focus).toBe(t.panel());
  });

  it("lets initialFocus win over a field the content focused on mount", async () => {
    const t = setup(Overlay, panelSelector, { initialFocus: "[data-t='heading']", focusFieldOnMount: true });
    await t.open();
    await settle();
    expect(t.events[0].focus).toBe(t.byT("heading"));
  });

  it("still keeps the content's own field without initialFocus (#420)", async () => {
    const t = setup(Overlay, panelSelector, { focusFieldOnMount: true });
    await t.open();
    await settle();
    expect(t.events[0].focus).toBe(t.byT("field"));
  });

  it("returns focus to returnFocus, an element, in place of the opener", async () => {
    const target = document.createElement("button");
    document.body.append(target);
    const u = setup(Overlay, panelSelector, { returnFocus: target });
    await u.open();
    await settle();
    u.visible.value = false;
    await settle();
    expect(u.events.find((e) => e.name === "after-leave")?.focus).toBe(target);
    expect(document.activeElement).toBe(target);
  });

  it("calls a returnFocus function at close time, after the close handlers", async () => {
    let created: HTMLElement | null = null;
    let calls = 0;
    // The element doesn't exist until the close handler makes it.
    const t = setup(
      Overlay,
      panelSelector,
      {
        returnFocus: () => {
          calls++;
          return created;
        },
        onClose: () => {
          created = document.createElement("button");
          document.body.append(created);
        },
      },
    );
    await t.open();
    await settle();
    expect(calls, "not called at open").toBe(0);
    t.visible.value = false;
    await settle();
    expect(calls).toBe(1);
    expect(created).not.toBeNull();
    expect(document.activeElement).toBe(created);
  });

  it("falls back to the opener when returnFocus names an element that is gone by close time", async () => {
    const gone = document.createElement("button");
    document.body.append(gone);
    const t = setup(Overlay, panelSelector, { returnFocus: () => gone });
    await t.open();
    await settle();
    gone.remove(); // the row was deleted while the overlay was open
    t.visible.value = false;
    await settle();
    expect(document.activeElement).toBe(t.byT("opener"));
  });

  it("doesn't return focus into the closing panel itself", async () => {
    const t = setup(Overlay, panelSelector, { returnFocus: "[data-t='field']" });
    await t.open();
    await settle();
    t.visible.value = false;
    await settle();
    expect(document.activeElement).toBe(t.byT("opener"));
  });

  it("leaves focus alone with returnFocus false: a close handler's move stands", async () => {
    const elsewhere = () => document.querySelector<HTMLElement>("[data-t='elsewhere']")!;
    const t = setup(Overlay, panelSelector, { returnFocus: false, onClose: () => elsewhere().focus() });
    await t.open();
    await settle();
    t.visible.value = false;
    await settle();
    expect(t.names()).toEqual(["after-enter", "close", "after-leave"]);
    expect(document.activeElement).toBe(elsewhere());
  });

  it("still returns to the opener by its restore key when neither prop is set", async () => {
    const t = setup(Overlay, panelSelector);
    const opener = t.byT("opener");
    opener.setAttribute(RESTORE_FOCUS_ATTR, "row:7");
    await t.open();
    await settle();
    const asked: string[] = [];
    const listen = (e: CustomEvent<string>) => asked.push(e.detail);
    document.addEventListener(RESTORE_FOCUS_EVENT, listen);
    opener.remove(); // the row scrolled out of a virtualised grid
    t.visible.value = false;
    await settle();
    document.removeEventListener(RESTORE_FOCUS_EVENT, listen);
    expect(asked).toEqual(["row:7"]);
  });
});

describe.each(OVERLAYS)("%s events under reduced motion (real browser)", (_, Overlay, panelSelector) => {
  const setReduced = (reduce: boolean) =>
    cdp().send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "" }] });
  beforeAll(() => setReduced(true));
  afterAll(() => setReduced(false));

  it("fires after-enter and after-leave once each, promptly, with focus placed", async () => {
    const t = setup(Overlay, panelSelector, { initialFocus: "[data-t='heading']" });
    const opened = performance.now();
    await t.open();
    for (let i = 0; i < 120 && !t.names().includes("after-enter"); i++) await frames(1);
    // Only the fade is left, and it keeps its duration (#265): no longer than the slow backdrop.
    expect(performance.now() - opened).toBeLessThan(motionDuration("slow") + 200);
    expect(t.events[0].focus).toBe(t.byT("heading"));

    const closed = performance.now();
    t.visible.value = false;
    for (let i = 0; i < 120 && !t.names().includes("after-leave"); i++) await frames(1);
    expect(performance.now() - closed).toBeLessThan(motionDuration("slow") + 200);
    await settle();
    expect(t.names()).toEqual(["after-enter", "close", "after-leave"]);
    expect(document.activeElement).toBe(t.byT("opener"));
  });
});
