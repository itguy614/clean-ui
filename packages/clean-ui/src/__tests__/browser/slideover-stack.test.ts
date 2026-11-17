import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, reactive } from "vue";
import { cdp, page, userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import { installTokens, frames } from "../../../../../config/test/browser-helpers";
import { motionDuration } from "../../utils/motion";
import CuiSlideover from "../../components/CuiSlideover.vue";
import CuiSlideoverStack from "../../components/CuiSlideoverStack.vue";
import CuiInput from "../../components/CuiInput.vue";
import CuiTextarea from "../../components/CuiTextarea.vue";

/**
 * #41 — the stack's layout, measured: panels attach edge to edge from the docked side, narrow
 * together to exactly fill the viewport minus the gap, fall back to peeking at the floor, cap
 * the peek, animate at depth, and trap focus only in modal mode. Layout is real here; jsdom
 * has none.
 */
describe("CuiSlideoverStack (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => (removeTokens = installTokens(main)));
  afterAll(() => removeTokens());

  const mounted: VueWrapper[] = [];
  afterEach(() => {
    mounted.splice(0).forEach((w) => w.unmount());
    document.body.innerHTML = "";
    document.body.style.overflow = "";
  });
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const settle = () => wait(motionDuration("slow") + 150);

  interface Spec {
    size?: string;
    modal?: boolean;
    side?: string;
    /** Starts `hidden` (the consumer's prop); flip it through `hid[i]`. */
    hidden?: boolean;
  }
  let hid: boolean[] = [];
  function stack(specs: Spec[], props: Record<string, unknown> = {}, panelProps: Record<string, unknown> = {}) {
    const open = reactive(specs.map(() => false));
    hid = reactive(specs.map((s) => !!s.hidden));
    const w = mount(
      defineComponent({
        render: () =>
          h(CuiSlideoverStack, props, {
            default: () =>
              specs.map((s, i) =>
                h(
                  CuiSlideover,
                  {
                    key: i,
                    visible: open[i],
                    "onUpdate:visible": (v: boolean) => (open[i] = v),
                    size: s.size ?? "md",
                    ...(s.modal === undefined ? {} : { modal: s.modal }),
                    side: s.side ?? "right",
                    hidden: hid[i],
                    ...panelProps,
                    "data-testid": `p${i}`,
                  },
                  { default: () => [h("button", { id: `a${i}` }, "a"), h("button", { id: `b${i}` }, "b")] },
                ),
              ),
          }),
      }),
    );
    mounted.push(w);
    return open;
  }
  const panel = (i: number) => document.querySelector<HTMLElement>(`[data-testid="p${i}"]`)!;
  const rect = (i: number) => panel(i).getBoundingClientRect();

  async function openN(open: boolean[], n: number) {
    for (let i = 0; i < n; i++) {
      open[i] = true;
      await settle();
    }
  }

  describe("wide viewport", () => {
    beforeAll(() => page.viewport(1400, 800));

    it("inward (the default): the newest panel enters at the dock edge and the older ones move inward", async () => {
      const open = stack([{ size: "lg" }, { size: "md" }]);
      await openN(open, 2);
      // Newest (md, 448) at the right edge; the first (lg, 576) slid in beside it.
      expect(rect(1).right).toBeCloseTo(1400, 0);
      expect(rect(1).width).toBeCloseTo(448, 0);
      expect(rect(0).right).toBeCloseTo(rect(1).left, 0);
      expect(rect(0).width).toBeCloseTo(576, 0);
      // The lone-slideover gap is intact.
      expect(rect(0).left).toBeGreaterThan(32);
    });

    it("inward: sliding without narrowing is a pure translate, no scale", async () => {
      const open = stack([{ size: "lg" }, { size: "md" }]);
      await openN(open, 1);
      const before = rect(0).right;
      open[1] = true;
      await frames(2);
      const flip = panel(0).getAnimations().find((a) => a.id === "cui-stack-flip")!;
      expect(flip, "the first panel slides").toBeDefined();
      const frames_ = (flip.effect as KeyframeEffect).getKeyframes();
      expect(String(frames_[0].translate)).toMatch(/^-?[\d.]+px( 0(px)?)?$/);
      expect(String(frames_[0].scale)).toMatch(/^1( 1)?$/);
      await settle();
      expect(rect(0).right).toBeCloseTo(before - 448, 0);
      expect(rect(0).width).toBeCloseTo(576, 0);
    });

    it("inward: closing the newest reverses it, the older panels slide back to the edge", async () => {
      const open = stack([{ size: "lg" }, { size: "md" }]);
      await openN(open, 2);
      open[1] = false;
      await frames(2);
      expect(panel(0).getAnimations().some((a) => a.id === "cui-stack-flip"), "the older panel animates back").toBe(true);
      await settle();
      expect(rect(0).right).toBeCloseTo(1400, 0);
    });

    it("outward: the newest attaches on the inner side and the older panels stay put", async () => {
      const open = stack([{ size: "lg" }, { size: "md" }], { push: "outward" });
      await openN(open, 2);
      expect(rect(0).right).toBeCloseTo(1400, 0);
      expect(rect(0).width).toBeCloseTo(576, 0);
      expect(rect(1).right).toBeCloseTo(rect(0).left, 0);
      expect(rect(1).width).toBeCloseTo(448, 0);
      expect(rect(1).left).toBeGreaterThan(32);
    });

    it("outward: opening another panel does not move the first", async () => {
      const open = stack([{ size: "lg" }, { size: "md" }], { push: "outward" });
      await openN(open, 1);
      open[1] = true;
      await frames(2);
      expect(panel(0).getAnimations().some((a) => a.id === "cui-stack-flip")).toBe(false);
    });

    it("a panel that closes exits through the dock edge as it stood, not re-laid-out first", async () => {
      const open = stack([{ size: "lg" }, { size: "lg" }, { size: "lg" }]);
      await openN(open, 3);
      const { left, width } = rect(2);
      expect(width).toBeLessThan(576);
      open[2] = false;
      await frames(2);
      // Still the narrowed width, and not moved back toward the screen's inside.
      expect(rect(2).width).toBeCloseTo(width, 0);
      expect(rect(2).left).toBeGreaterThanOrEqual(left - 1);
    });

    it("narrows together, newest at the edge, so the group exactly fills the viewport minus the gap", async () => {
      const open = stack([{ size: "lg" }, { size: "lg" }, { size: "lg" }]);
      await openN(open, 3);
      const left = Math.min(rect(0).left, rect(1).left, rect(2).left);
      expect(left).toBeCloseTo(32, 0);
      // Newest at the right edge, oldest innermost, edge to edge, equal widths.
      expect(rect(2).right).toBeCloseTo(1400, 0);
      expect(rect(1).right).toBeCloseTo(rect(2).left, 0);
      expect(rect(0).right).toBeCloseTo(rect(1).left, 0);
      expect(rect(0).width).toBeCloseTo(rect(2).width, 0);
      expect(rect(0).width).toBeLessThan(576);
    });

    it("mirrors on the left: the newest at the left edge, older panels moved inward", async () => {
      const open = stack([{ size: "lg", side: "left" }, { size: "md", side: "left" }]);
      await openN(open, 2);
      expect(rect(1).left).toBeCloseTo(0, 0);
      expect(rect(0).left).toBeCloseTo(rect(1).right, 0);
    });

    it("widens back when a panel closes", async () => {
      const open = stack([{ size: "lg" }, { size: "lg" }, { size: "lg" }]);
      await openN(open, 3);
      open[2] = false;
      await settle();
      expect(rect(0).width).toBeCloseTo(576, 0);
      expect(rect(1).right).toBeCloseTo(1400, 0);
      expect(rect(0).right).toBeCloseTo(rect(1).left, 0);
    });

    it("plays the re-flow on transform alone: a panel that narrows animates, and ends in place", async () => {
      const open = stack([{ size: "lg" }, { size: "lg" }, { size: "lg" }]);
      await openN(open, 2);
      const before = rect(0).width;
      open[2] = true;
      await frames(2);
      const flips = panel(0).getAnimations().filter((a) => a.id === "cui-stack-flip");
      expect(flips.length, "the first panel is animating its narrowing").toBe(1);
      const mid = rect(0).width;
      await settle();
      expect(panel(0).getAnimations().filter((a) => a.id === "cui-stack-flip")).toHaveLength(0);
      const after = rect(0).width;
      // Drawn wider than its final width while it plays, and narrower than it began.
      expect(mid).toBeGreaterThan(after + 1);
      expect(after).toBeLessThan(before);
    });

    it("never animates width or left/right: the panel's own box is laid out at once", async () => {
      const open = stack([{ size: "lg" }, { size: "lg" }, { size: "lg" }]);
      await openN(open, 2);
      open[2] = true;
      await frames(2);
      const transitions = getComputedStyle(panel(0)).transitionProperty;
      expect(transitions).not.toMatch(/width|right|left/);
    });
  });

  describe("narrow viewport", () => {
    it("peeks when the viewport is under peekBelow", async () => {
      await page.viewport(600, 800);
      const open = stack([{ size: "md" }, { size: "md" }], { peekBelow: "md" });
      await openN(open, 2);
      // The lower panel's edge shows beside the top one's.
      expect(rect(0).left).toBeLessThan(rect(1).left);
      // The top panel is docked; the lower one sits further out, its edge showing.
      expect(rect(1).right).toBeCloseTo(600, 0);
      expect(rect(0).right).toBeCloseTo(568, 0);
      expect(rect(1).left - rect(0).left).toBeCloseTo(32, 0);
    });

    it("falls back to peek at the floor, wide enough to attach otherwise", async () => {
      await page.viewport(900, 800);
      const open = stack([{ size: "md" }, { size: "md" }, { size: "md" }], { peekBelow: "sm" });
      await openN(open, 3);
      // 3 x 448 would squeeze to 289 each, under the 320 floor: peeking.
      const lefts = [0, 1, 2].map((i) => rect(i).left);
      expect(lefts[0]).toBeLessThan(lefts[1]);
      expect(lefts[1]).toBeLessThan(lefts[2]);
      expect(rect(2).width).toBeCloseTo(448, 0);
    });

    it("caps the peek: layers past maxPeek share the last edge", async () => {
      await page.viewport(1000, 800);
      const open = stack([{}, {}, {}, {}, {}], { mode: "peek", maxPeek: 2 });
      await openN(open, 5);
      const lefts = [0, 1, 2, 3, 4].map((i) => Math.round(rect(i).left));
      // top (4) to bottom (0): +32 twice, then the same.
      expect(lefts[3] - lefts[4]).toBe(-32);
      expect(lefts[2] - lefts[3]).toBe(-32);
      expect(lefts[1]).toBe(lefts[2]);
      expect(lefts[0]).toBe(lefts[2]);
      // Nothing past the gap.
      expect(Math.min(...lefts)).toBeGreaterThanOrEqual(32);
    });
  });

  /**
   * The user-visible rule: while any panel of a stack is open the page is dimmed by one
   * continuous backdrop. Sampled on every real frame, the effective dimming (the product of
   * what every backdrop element lets through) never leaves the steady value, and there is
   * never a frame without a backdrop.
   */
  describe("one continuous backdrop", () => {
    beforeAll(() => page.viewport(1400, 800));

    function sampler() {
      const samples: { dim: number; count: number; filter: string; foreign: number }[] = [];
      // Marks the backdrop that is on screen now: a later frame showing one without the mark is a
      // different node, so a remount (even one frame long) is caught.
      document.querySelectorAll<HTMLElement>(".cui-backdrop").forEach((e) => (e.dataset.probe = "1"));
      let running = true;
      const tick = () => {
        const els = [...document.querySelectorAll<HTMLElement>(".cui-backdrop")].filter((e) => getComputedStyle(e).display !== "none");
        const through = els.reduce((acc, e) => acc * (1 - Number(getComputedStyle(e).opacity)), 1);
        samples.push({ dim: 1 - through, count: els.length, filter: els.map((e) => getComputedStyle(e).backdropFilter).join("|"), foreign: els.filter((e) => e.dataset.probe !== "1").length });
        if (running) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      return { samples, stop: () => (running = false) };
    }

    async function expectSteady(run: () => Promise<void>, props?: { blur: boolean }) {
      const steady = props?.blur ? 1 : 0.5;
      const rec = sampler();
      await run();
      rec.stop();
      await frames(2);
      expect(rec.samples.length).toBeGreaterThan(20);
      const dims = rec.samples.map((x) => x.dim);
      expect(Math.min(...dims), "never dips").toBeGreaterThan(steady - 0.002);
      expect(Math.max(...dims), "never doubles up").toBeLessThan(steady + 0.002);
      expect(Math.min(...rec.samples.map((x) => x.count)), "a backdrop on every frame").toBe(1);
      expect(new Set(rec.samples.map((x) => x.filter)).size, "blur never restarts").toBe(1);
      expect(Math.max(...rec.samples.map((x) => x.foreign)), "the same backdrop node throughout: never remounted").toBe(0);
    }

    it("opening panels 2 and 3 and closing back down never dips or doubles the dimming", async () => {
      const open = stack([{}, {}, {}]);
      open[0] = true;
      await settle();
      await expectSteady(async () => {
        open[1] = true;
        await settle();
        open[2] = true;
        await settle();
        open[2] = false;
        await settle();
        open[1] = false;
        await settle();
      });
    });

    it("holds with a blurred backdrop too", async () => {
      const open = stack([{}, {}, {}], {}, { backdropBlur: "sm" });
      open[0] = true;
      await settle();
      await expectSteady(async () => {
        open[1] = true;
        await settle();
        open[2] = true;
        await settle();
        open[2] = false;
        await settle();
      }, { blur: true });
    });

    it("holds when a modal panel opens above a co-active group, and when the active set changes", async () => {
      const open = stack([{}, { modal: false }, { modal: true }]);
      open[0] = true;
      await settle();
      await expectSteady(async () => {
        open[1] = true;
        await settle();
        open[2] = true;
        await settle();
        open[2] = false;
        await settle();
      });
    });

    describe("closing, with at least one panel staying open", () => {
      const closeButton = (i: number) => panel(i).querySelector<HTMLElement>("button")!;

      async function steadyWhile(open: boolean[], close: () => Promise<void> | void, props?: { blur: boolean }) {
        await expectSteady(async () => {
          await close();
          await settle();
        }, props);
        expect(open.some(Boolean), "a panel is still open").toBe(true);
      }

      it("the top of two, by Escape", async () => {
        const open = stack([{}, {}]);
        await openN(open, 2);
        await steadyWhile(open, () => {
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        });
        expect(open).toEqual([true, false]);
      });

      it("the top of three, by its X button", async () => {
        const open = stack([{}, {}, {}], {}, { title: "T" });
        await openN(open, 3);
        await steadyWhile(open, () => closeButton(2).click());
        expect(open).toEqual([true, true, false]);
      });

      it("the top, by a click on the backdrop", async () => {
        const open = stack([{}, {}, {}]);
        await openN(open, 3);
        await steadyWhile(open, () => document.querySelector<HTMLElement>(".cui-backdrop")!.click());
        expect(open).toEqual([true, true, false]);
      });

      it("the top, from code", async () => {
        const open = stack([{}, {}, {}]);
        await openN(open, 3);
        await steadyWhile(open, () => void (open[2] = false));
      });

      it("the first panel of a modal stack, from code, while others stay", async () => {
        const open = stack([{}, {}, {}]);
        await openN(open, 3);
        await steadyWhile(open, () => void (open[0] = false));
        expect(open).toEqual([false, true, true]);
      });

      it("a middle panel of a co-active stack", async () => {
        const open = stack([{ modal: false }, { modal: false }, { modal: false }]);
        await openN(open, 3);
        await steadyWhile(open, () => void (open[1] = false));
        expect(open).toEqual([true, false, true]);
      });

      it("a modal panel closing, so the layers beneath become active again", async () => {
        const open = stack([{}, { modal: false }, { modal: true }]);
        await openN(open, 3);
        await steadyWhile(open, () => void (open[2] = false));
        expect(open).toEqual([true, true, false]);
      });

      it("the active set growing and shrinking: a co-active panel closing under a modal one", async () => {
        const open = stack([{}, { modal: false }, { modal: true }, { modal: false }]);
        await openN(open, 4);
        await steadyWhile(open, async () => {
          open[3] = false;
          await settle();
          open[2] = false;
        });
      });

      it("a blurred backdrop, closing the top", async () => {
        const open = stack([{}, {}], {}, { backdropBlur: "sm" });
        await openN(open, 2);
        await steadyWhile(open, () => void (open[1] = false), { blur: true });
      });

      it("a parent whose child closes with it, while another panel stays open", async () => {
        const st = reactive({ base: false, parent: false, child: false });
        const w = mount(
          defineComponent({
            render: () =>
              h(CuiSlideoverStack, null, {
                default: () => [
                  h(CuiSlideover, { visible: st.base, "onUpdate:visible": (v: boolean) => (st.base = v), size: "sm", "data-testid": "base" }, { default: () => h("button", "b") }),
                  h(CuiSlideover, { visible: st.parent, "onUpdate:visible": (v: boolean) => (st.parent = v), size: "sm", "data-testid": "parent" }, {
                    default: () => h(CuiSlideover, { visible: st.child, "onUpdate:visible": (v: boolean) => (st.child = v), size: "sm", modal: false, "data-testid": "child" }, { default: () => h("button", "c") }),
                  }),
                ],
              }),
          }),
        );
        mounted.push(w);
        st.base = true;
        await settle();
        st.parent = true;
        await settle();
        st.child = true;
        await settle();
        await expectSteady(async () => {
          st.parent = false;
          await settle();
        });
        expect(st.child).toBe(false);
        expect(st.base).toBe(true);
      });
    });

    it("holds under prefers-reduced-motion: fades are kept, movement is not, and still no dip or remount", async () => {
      const set = (reduce: boolean) =>
        cdp().send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "" }] });
      await set(true);
      try {
        expect(matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
        const open = stack([{}, {}, {}]);
        open[0] = true;
        await settle();
        await expectSteady(async () => {
          open[1] = true;
          await settle();
          open[2] = true;
          await settle();
          open[2] = false;
          await settle();
          open[1] = false;
          await settle();
        });
        // And the one fade out, with the last panel: it is a fade, not a snap.
        const rec = sampler();
        open[0] = false;
        await settle();
        rec.stop();
        const dims = rec.samples.map((x) => x.dim).filter((d) => d > 0.001);
        expect(dims.length, "faded over several frames rather than snapping").toBeGreaterThan(2);
      } finally {
        await set(false);
      }
    });

    /**
     * The dimming a panel sits under, per frame: its own scrim, plus the backdrop when that is
     * layered above it. A step from none to full in one frame is the flash; a ramp is not.
     */
    describe("a covered panel's dimming is a ramp, never a step", () => {
      const layer = (el: HTMLElement) => Number(/\+ (\d+)\)/.exec(el.style.zIndex)?.[1] ?? 0);
      const dimOf = (i: number) => {
        const root = panel(i).parentElement!;
        const bd = document.querySelector<HTMLElement>(".cui-backdrop");
        const above = bd && layer(bd) > layer(root) ? Number(getComputedStyle(bd).opacity) : 0;
        const scrim = panel(i).querySelector<HTMLElement>(".cui-slideover__scrim");
        const s = scrim ? Number(getComputedStyle(scrim).opacity) : 0;
        return 1 - (1 - above) * (1 - s);
      };
      function track(i: number) {
        const dims: number[] = [];
        let running = true;
        const tick = () => {
          if (panel(i)) dims.push(dimOf(i));
          if (running) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        return { dims, stop: () => (running = false) };
      }
      const steps = (d: number[]) => d.slice(1).map((v, k) => v - d[k]);
      function expectRamp(dims: number[], dir: 1 | -1, to: number) {
        const st = steps(dims);
        expect(Math.max(...st.map(Math.abs)), "no frame jumps by more than a fraction of the whole").toBeLessThan(0.3);
        expect(Math.min(...st.map((x) => x * dir)), "monotone").toBeGreaterThan(-0.0005);
        expect(st.filter((x) => Math.abs(x) > 0.001).length, "spread over several frames").toBeGreaterThan(4);
        expect(dims.at(-1)).toBeCloseTo(to, 2);
      }

      it("covered by a second panel, then uncovered when it closes", async () => {
        const open = stack([{}, {}]);
        open[0] = true;
        await settle();
        expect(dimOf(0)).toBeCloseTo(0, 2);
        const up = track(0);
        open[1] = true;
        await settle();
        up.stop();
        expectRamp(up.dims, 1, 0.5);
        const down = track(0);
        open[1] = false;
        await settle();
        down.stop();
        expectRamp(down.dims, -1, 0);
      });

      it("the settled look is the old one: a covered panel is dimmed by exactly the backdrop's 0.5", async () => {
        const open = stack([{}, {}, {}]);
        await openN(open, 3);
        expect(dimOf(0)).toBeCloseTo(0.5, 2);
        expect(dimOf(1)).toBeCloseTo(0.5, 2);
        expect(dimOf(2)).toBeCloseTo(0, 2);
      });

      it("3 deep: panel 2 is covered by 3 on a ramp, panel 1 stays steady", async () => {
        const open = stack([{}, {}, {}]);
        await openN(open, 2);
        const first = track(0);
        const second = track(1);
        open[2] = true;
        await settle();
        first.stop();
        second.stop();
        expect(Math.max(...first.dims) - Math.min(...first.dims), "panel 1 was already covered").toBeLessThan(0.001);
        expectRamp(second.dims, 1, 0.5);
      });

      it("closing the middle panel leaves the first covered, with no change", async () => {
        const open = stack([{}, {}, {}]);
        await openN(open, 3);
        const t = track(0);
        open[1] = false;
        await settle();
        t.stop();
        expect(Math.max(...t.dims) - Math.min(...t.dims)).toBeLessThan(0.001);
      });

      it("a co-active group has nothing covered: no dimming, no ramp", async () => {
        const open = stack([{ modal: false }, { modal: false }, { modal: false }]);
        await openN(open, 1);
        const t = track(0);
        open[1] = true;
        await settle();
        open[2] = true;
        await settle();
        t.stop();
        expect(Math.max(...t.dims)).toBeLessThan(0.001);
      });

      it("a modal panel above a co-active group covers both on a ramp", async () => {
        const open = stack([{ modal: false }, { modal: false }, { modal: true }]);
        await openN(open, 2);
        const a = track(0);
        const b = track(1);
        open[2] = true;
        await settle();
        a.stop();
        b.stop();
        expectRamp(a.dims, 1, 0.5);
        expectRamp(b.dims, 1, 0.5);
      });

      it("the child cascade: the base panel ramps back up out of the dimming as parent and child leave", async () => {
        const st = reactive({ base: false, parent: false, child: false });
        const w = mount(
          defineComponent({
            render: () =>
              h(CuiSlideoverStack, null, {
                default: () => [
                  h(CuiSlideover, { visible: st.base, "onUpdate:visible": (v: boolean) => (st.base = v), size: "sm", "data-testid": "p0" }, { default: () => h("button", "b") }),
                  h(CuiSlideover, { visible: st.parent, "onUpdate:visible": (v: boolean) => (st.parent = v), size: "sm", "data-testid": "p1" }, {
                    default: () => h(CuiSlideover, { visible: st.child, "onUpdate:visible": (v: boolean) => (st.child = v), size: "sm", modal: false }, { default: () => h("button", "c") }),
                  }),
                ],
              }),
          }),
        );
        mounted.push(w);
        st.base = true;
        await settle();
        st.parent = true;
        await settle();
        st.child = true;
        await settle();
        expect(dimOf(0)).toBeCloseTo(0.5, 2);
        const t = track(0);
        st.parent = false;
        await settle();
        t.stop();
        expectRamp(t.dims, -1, 0);
      });

      it("push outward, and peek mode, ramp the same way", async () => {
        for (const props of [{ push: "outward" }, { mode: "peek" }]) {
          const open = stack([{}, {}], props);
          open[0] = true;
          await settle();
          const t = track(0);
          open[1] = true;
          await settle();
          t.stop();
          expectRamp(t.dims, 1, 0.5);
          mounted.pop()!.unmount();
          document.body.innerHTML = "";
        }
      });

      it("a lone panel and a panel outside any stack carry no scrim", async () => {
        const open = reactive([false]);
        const w = mount(defineComponent({ render: () => h(CuiSlideover, { visible: open[0], "data-testid": "p0" }, { default: () => h("button", "x") }) }));
        mounted.push(w);
        open[0] = true;
        await settle();
        expect(panel(0).querySelector(".cui-slideover__scrim")).toBeNull();
      });
    });

    /**
     * Closing a panel while others stay: the closing one slides off through the dock edge at full
     * opacity, the one that becomes active again un-dims over the same close, and nothing else
     * changes in a single frame.
     */
    describe("closing a panel in a stack is one slide, not a fade and a flash", () => {
      const durationOf = () => motionDuration("fast");
      interface Frame { t: number; left: number; opacity: number; scrim: number; shadow: number; seam: number; present: boolean }

      function record(leaver: number, stays: number) {
        const frames_: Frame[] = [];
        const t0 = performance.now();
        let running = true;
        const tick = () => {
          const el = panel(leaver);
          const keep = panel(stays);
          const scrim = keep?.querySelector<HTMLElement>(".cui-slideover__scrim");
          frames_.push({
            t: performance.now() - t0,
            present: !!el,
            left: el ? el.getBoundingClientRect().left : Infinity,
            opacity: el ? Number(getComputedStyle(el).opacity) : 0,
            scrim: scrim ? Number(getComputedStyle(scrim).opacity) : 0,
            shadow: el ? Number(getComputedStyle(el, "::after").opacity) : 0,
            seam: el ? Number(getComputedStyle(el, "::before").opacity) : 0,
          });
          if (running) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        return { frames: frames_, stop: () => (running = false) };
      }

      function expectOneMotion(fr: Frame[], opts: { scrimFrom: number }) {
        const live = fr.filter((f) => f.present);
        expect(live.length).toBeGreaterThan(4);
        // The panel leaves at full opacity, never fades out.
        expect(Math.min(...live.map((f) => f.opacity)), "leaver stays opaque").toBe(1);
        // Toward the dock edge, never back.
        const lefts = live.map((f) => f.left);
        expect(lefts.slice(1).every((l, i) => l >= lefts[i] - 0.5), "moves monotonically to the edge").toBe(true);
        expect(lefts.at(-1)!, "reaches the edge").toBeGreaterThan(1300);
        // Its shadow and seam travel with it: neither pops at the first frame.
        expect(new Set(live.map((f) => f.shadow)).size, "leaver's shadow does not change").toBe(1);
        expect(new Set(live.map((f) => f.seam)).size, "leaver's seam does not change").toBe(1);
        // The one that becomes active again un-dims as a ramp spread over the exit.
        const sc = fr.map((f) => f.scrim);
        const steps = sc.slice(1).map((v, i) => v - sc[i]);
        expect(Math.max(...steps), "monotone").toBeLessThan(0.0005);
        expect(Math.min(...steps), "no big jump in a frame").toBeGreaterThan(-0.3);
        const hi = opts.scrimFrom * 0.9;
        const lo = opts.scrimFrom * 0.1;
        const tHi = fr.find((f) => f.scrim <= hi)?.t ?? 0;
        const tLo = fr.find((f) => f.scrim <= lo)?.t ?? 0;
        expect(tLo - tHi, "the visible fade takes a good share of the exit, not a few frames").toBeGreaterThan(durationOf() * 0.4);
        // And it is done when the leaver is, give or take a frame or two.
        const gone = fr.find((f) => !f.present || f.left >= 1399)?.t ?? Infinity;
        expect(tLo, "scrim has cleared by the time the leaver is gone").toBeLessThan(gone + 40);
      }

      async function run(open: boolean[], leaver: number, stays: number, trigger: () => void | Promise<void>) {
        const rec = record(leaver, stays);
        await trigger();
        await wait(durationOf() + 250);
        rec.stop();
        expectOneMotion(rec.frames, { scrimFrom: 0.5 });
      }

      it("by programmatic close", async () => {
        const open = stack([{}, {}]);
        await openN(open, 2);
        await run(open, 1, 0, () => void (open[1] = false));
      });

      it("by Escape", async () => {
        const open = stack([{}, {}]);
        await openN(open, 2);
        await run(open, 1, 0, () => void document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
      });

      it("by the X button", async () => {
        const open = stack([{}, {}], {}, { title: "T" });
        await openN(open, 2);
        await run(open, 1, 0, () => panel(1).querySelector<HTMLElement>("button")!.click());
      });

      it("by a click on the backdrop", async () => {
        const open = stack([{}, {}]);
        await openN(open, 2);
        await run(open, 1, 0, () => document.querySelector<HTMLElement>(".cui-backdrop")!.click());
      });

      it("closing the top of three: the middle one becomes active", async () => {
        const open = stack([{}, {}, {}]);
        await openN(open, 3);
        await run(open, 2, 1, () => void (open[2] = false));
      });

      it("with push outward, the group's outer shadow passes to the remaining panel", async () => {
        const open = stack([{}, {}], { push: "outward" });
        await openN(open, 2);
        const rec = record(1, 0);
        open[1] = false;
        await wait(durationOf() + 250);
        rec.stop();
        const live = rec.frames.filter((f) => f.present);
        expect(Math.min(...live.map((f) => f.opacity))).toBe(1);
        expect(new Set(live.map((f) => f.shadow)).size).toBe(1);
      });

      it("the remaining panels' reflow takes the exit's duration, not the entry's", async () => {
        const open = stack([{ size: "lg" }, { size: "md" }]);
        await openN(open, 2);
        open[1] = false;
        await frames(2);
        const flip = panel(0).getAnimations().find((a) => a.id === "cui-stack-flip")!;
        expect(flip).toBeDefined();
        expect(Number(flip.effect!.getTiming().duration)).toBe(durationOf());
      });

      it("the remaining panel's z-order and inert state do not change mid-close", async () => {
        const open = stack([{}, {}]);
        await openN(open, 2);
        const z = panel(0).parentElement!.style.zIndex;
        open[1] = false;
        await frames(3);
        expect(panel(0).parentElement!.style.zIndex).toBe(z);
        expect(panel(0).parentElement!.hasAttribute("inert")).toBe(false);
      });

      it("under reduced motion nothing moves, the fade stays, and the un-dimming is still a ramp", async () => {
        const set = (reduce: boolean) =>
          cdp().send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "" }] });
        await set(true);
        try {
          const open = stack([{}, {}]);
          await openN(open, 2);
          const rec = record(1, 0);
          open[1] = false;
          await wait(durationOf() + 250);
          rec.stop();
          const live = rec.frames.filter((f) => f.present);
          // No sliding: it fades where it stands.
          expect(new Set(live.map((f) => Math.round(f.left))).size).toBe(1);
          expect(Math.min(...live.map((f) => f.opacity))).toBeLessThan(0.5);
          const sc = rec.frames.map((f) => f.scrim);
          const steps = sc.slice(1).map((v, i) => v - sc[i]);
          expect(Math.min(...steps)).toBeGreaterThan(-0.3);
          expect(sc.at(-1)).toBeCloseTo(0, 2);
        } finally {
          await set(false);
        }
      });
    });

    /**
     * Real pixels (a CDP screencast), not computed styles: styles said everything was in step while
     * a one-frame lag on the compositor opened a dim gap between the panels that remain and the one
     * leaving, which reads as a flash. On every painted frame, the white of the panels along a row
     * through their blank middle must be one unbroken run: nothing between them but a hairline.
     */
    describe("no gap opens between the panels while one closes (painted frames)", () => {
      async function screencast(run: () => void, ms: number) {
        const c = cdp();
        const frames_: string[] = [];
        const handler = (e: { data: string; sessionId: number }) => {
          frames_.push(e.data);
          void c.send("Page.screencastFrameAck", { sessionId: e.sessionId });
        };
        c.on("Page.screencastFrame", handler);
        await c.send("Page.startScreencast", { format: "png", everyNthFrame: 1 });
        // No decoy painting: an idle page is what a user closes a panel on, and the compositor's
        // wake-up is part of what is being measured.
        await wait(150);
        run();
        await wait(ms);
        await c.send("Page.stopScreencast");
        return frames_;
      }

      /** Separate runs of near-white along a row, ignoring gaps of a hairline or two. */
      async function whiteRuns(data: string) {
        const img = new Image();
        img.src = "data:image/png;base64," + data;
        await img.decode();
        const cv = document.createElement("canvas");
        cv.width = img.width;
        cv.height = img.height;
        const cx = cv.getContext("2d")!;
        cx.drawImage(img, 0, 0);
        const w = Math.min(img.width, window.innerWidth);
        const row = cx.getImageData(0, 300, w, 1).data;
        const runs: [number, number][] = [];
        let start = -1;
        let gap = 0;
        for (let x = 0; x < w; x++) {
          const white = row[x * 4] > 240 && row[x * 4 + 1] > 240 && row[x * 4 + 2] > 240;
          if (white) {
            if (start < 0) start = x;
            gap = 0;
          } else if (start >= 0 && ++gap > 3) {
            runs.push([start, x - gap]);
            start = -1;
          }
        }
        if (start >= 0) runs.push([start, w]);
        return runs.filter(([a, b]) => b - a > 30);
      }

      /** Closes the panel under test over several cycles, so a one-frame gap has several chances to show. */
      async function expectNoGap(reopen: () => Promise<void>, close: () => void, minFrames = 20) {
        const bad: [number, number][] = [];
        let total = 0;
        for (let cycle = 0; cycle < 5 && total < minFrames + 10; cycle++) {
          const frames_ = await screencast(close, 400);
          total += frames_.length;
          const counts = await Promise.all(frames_.map(async (f) => (await whiteRuns(f)).length));
          counts.forEach((n, i) => n > 1 && bad.push([cycle * 1000 + i, n]));
          await reopen();
        }
        expect(total, "the screencast delivered frames").toBeGreaterThan(minFrames);
        expect(bad, `frames showing the page between the panels (cycle*1000+frame, runs): ${JSON.stringify(bad)}`).toEqual([]);
      }

      beforeAll(() => page.viewport(1100, 600));
      afterEach(() => page.viewport(1100, 600));

      it("a child panel closing alone, declared inside its parent", async () => {
        const st = reactive({ edit: false, hist: false });
        const hist = () => h(CuiSlideover, { visible: st.hist, "onUpdate:visible": (v: boolean) => (st.hist = v), modal: false, title: "History", size: "sm", "data-testid": "p1" }, { default: () => h("p", "h") });
        mounted.push(
          mount(defineComponent({ render: () => h(CuiSlideoverStack, null, { default: () => h(CuiSlideover, { visible: st.edit, "onUpdate:visible": (v: boolean) => (st.edit = v), title: "Edit report", size: "md", "data-testid": "p0" }, { default: () => [h("div", { style: "padding:1rem" }, [h(CuiInput, { modelValue: "x" }), h(CuiTextarea, { modelValue: "y" })]), hist()] }) }) }), { attachTo: document.body }),
        );
        st.edit = true;
        await settle();
        st.hist = true;
        await settle();
        await expectNoGap(async () => { st.hist = true; await settle(); }, () => void (st.hist = false));
      });

      // #529: `hidden` is the other way a panel leaves the layout; no hole may show while it does.
      it("a middle panel being hidden, and shown again", async () => {
        // Wide enough to stay attached throughout: a peek-to-attach change fades a shadow, which is not a gap.
        await page.viewport(1400, 600);
        const open = stack([{ size: "md" }, { size: "sm", modal: false }, { size: "sm", modal: false }], {}, { title: "T" });
        await openN(open, 3);
        // The panel vanishes at once and the rest snap, so there are few frames to see: a hole would show in them.
        await expectNoGap(async () => { hid[1] = false; await settle(); }, () => void (hid[1] = true), 4);
      });

      it("a panel being revealed", async () => {
        await page.viewport(1400, 600);
        const open = stack([{ size: "md" }, { size: "sm", modal: false, hidden: true }], {}, { title: "T" });
        await openN(open, 2);
        await expectNoGap(async () => { hid[1] = true; await settle(); }, () => void (hid[1] = false));
      });

      it("a sibling panel closing alone", async () => {
        const open = stack([{ size: "md" }, { size: "sm", modal: false }], {}, { title: "T" });
        await openN(open, 2);
        await expectNoGap(async () => { open[1] = true; await settle(); }, () => void (open[1] = false));
      });

      it("the top of a modal stack of three", async () => {
        const open = stack([{ size: "sm" }, { size: "sm" }, { size: "sm" }]);
        await openN(open, 3);
        await expectNoGap(async () => { open[2] = true; await settle(); }, () => void (open[2] = false));
      });
    });

    it("fades in once with the first panel and out once with the last", async () => {
      const open = stack([{}, {}]);
      const rec = sampler();
      open[0] = true;
      await settle();
      open[1] = true;
      await settle();
      open[1] = false;
      await settle();
      open[0] = false;
      await settle();
      rec.stop();
      const dims = rec.samples.map((x) => x.dim);
      // Up to steady, hold, down to nothing: exactly one rise and one fall.
      let turns = 0;
      for (let i = 2; i < dims.length; i++) {
        const a = Math.sign(Math.round((dims[i - 1] - dims[i - 2]) * 1000));
        const b = Math.sign(Math.round((dims[i] - dims[i - 1]) * 1000));
        if (a !== 0 && b !== 0 && a !== b) turns++;
      }
      expect(turns).toBeLessThanOrEqual(1);
      expect(dims.at(-1)).toBeLessThan(0.01);
    });
  });

  describe("focus", () => {
    beforeAll(() => page.viewport(1400, 800));

    it("a modal top panel traps Tab", async () => {
      const open = stack([{}, {}]);
      await openN(open, 2);
      (document.getElementById("b1") as HTMLElement).focus();
      await userEvent.tab();
      expect(panel(1).contains(document.activeElement)).toBe(true);
      await userEvent.tab({ shift: true });
      await userEvent.tab({ shift: true });
      expect(panel(1).contains(document.activeElement)).toBe(true);
    });

    it("a panel beneath a co-active one can be clicked: the upper overlay root lets pointers through", async () => {
      const open = stack([{ size: "lg" }, { size: "sm", modal: false }]);
      await openN(open, 2);
      const r = rect(0);
      const hit = document.elementFromPoint(r.left + 40, r.top + 40);
      expect(panel(0).contains(hit)).toBe(true);
      // The shared backdrop is still what the rest of the page hits.
      const away = document.elementFromPoint(8, 8);
      expect(away?.closest(".cui-backdrop, [class*='backdrop']")).not.toBeNull();
    });

    it("co-active panels let focus move freely between them", async () => {
      const open = stack([{}, { modal: false }]);
      await openN(open, 2);
      (document.getElementById("a1") as HTMLElement).focus();
      await userEvent.tab({ shift: true });
      expect(panel(0).contains(document.activeElement), "Shift+Tab leaves the top panel for the one beneath").toBe(true);
    });
  });

  /**
   * Attached panels read as one surface (#41): no shadow between them, a hairline at each seam,
   * and the soft shadow only on the group's outer edge. Peeking panels overlap and each casts a
   * small one on the next. A lone slideover looks as it always did.
   */
  describe("shadows and seams", () => {
    beforeAll(() => page.viewport(1400, 800));
    afterEach(() => document.documentElement.classList.remove("dark"));

    const shadowOf = (i: number) => {
      const after = getComputedStyle(panel(i), "::after");
      const before = getComputedStyle(panel(i), "::before");
      return {
        own: getComputedStyle(panel(i)).boxShadow,
        cast: Number(after.opacity),
        castShadow: after.boxShadow,
        seam: Number(before.opacity),
        seamColor: before.backgroundColor,
      };
    };

    it("inward: only the oldest, outermost panel casts the shadow; the others carry a seam hairline", async () => {
      const open = stack([{ size: "lg" }, { size: "md" }, { size: "md" }]);
      await openN(open, 3);
      const [oldest, middle, newest] = [0, 1, 2].map(shadowOf);
      expect(oldest.cast).toBe(1);
      expect(oldest.seam).toBe(0);
      expect(oldest.castShadow).toContain("48px");
      for (const p of [middle, newest]) {
        expect(p.cast).toBe(0);
        expect(p.seam).toBe(1);
      }
      // No panel paints a shadow of its own in a stack: only the pseudo-element does.
      for (const i of [0, 1, 2]) expect(shadowOf(i).own).toBe("none");
      expect(oldest.seamColor).not.toBe("rgba(0, 0, 0, 0)");
    });

    it("outward: the newest, outermost panel casts the shadow", async () => {
      const open = stack([{ size: "lg" }, { size: "md" }, { size: "md" }], { push: "outward" });
      await openN(open, 3);
      expect([0, 1, 2].map((i) => shadowOf(i).cast)).toEqual([0, 0, 1]);
      expect([0, 1, 2].map((i) => shadowOf(i).seam)).toEqual([1, 1, 0]);
    });

    it("the edge changing hands fades by opacity, never jumps", async () => {
      const open = stack([{ size: "lg" }, { size: "md" }], { push: "outward" });
      await openN(open, 1);
      expect(shadowOf(0).cast).toBe(1);
      open[1] = true;
      await frames(3);
      const running = panel(0).getAnimations({ subtree: true }).filter((a) => (a as CSSTransition).transitionProperty === "opacity");
      expect(running.length, "the old edge's shadow is fading out").toBeGreaterThan(0);
      await settle();
      expect(shadowOf(0).cast).toBe(0);
      expect(shadowOf(1).cast).toBe(1);
    });

    it("a mirrored (left) stack puts the hairline on the right edge", async () => {
      const open = stack([{ size: "md", side: "left" }, { size: "md", side: "left" }]);
      await openN(open, 2);
      const seam = getComputedStyle(panel(1), "::before");
      expect(seam.opacity).toBe("1");
      expect(seam.right).toBe("0px");
    });

    it("peek: every panel casts a smaller shadow onto the one beneath, with no hairline", async () => {
      const open = stack([{}, {}, {}], { mode: "peek" });
      await openN(open, 3);
      for (const i of [0, 1, 2]) {
        const p = shadowOf(i);
        expect(p.cast).toBe(1);
        expect(p.seam).toBe(0);
        expect(p.castShadow).toContain("16px");
        expect(p.castShadow).not.toContain("48px");
      }
    });

    it("a lone slideover outside any stack keeps its own shadow and has no pseudo-elements", async () => {
      const open = reactive([false]);
      const w = mount(
        defineComponent({
          render: () => h(CuiSlideover, { visible: open[0], "data-testid": "p0" }, { default: () => h("button", "x") }),
        }),
      );
      mounted.push(w);
      open[0] = true;
      await settle();
      expect(getComputedStyle(panel(0)).boxShadow).toContain("48px");
      expect(getComputedStyle(panel(0), "::after").content).toBe("none");
      expect(getComputedStyle(panel(0)).overflow).toBe("hidden");
    });

    it("dark mode: the hairline and the shadow are still drawn, in the dark tokens", async () => {
      document.documentElement.classList.add("dark");
      const open = stack([{ size: "lg" }, { size: "md" }]);
      await openN(open, 2);
      const outer = shadowOf(0);
      const inner = shadowOf(1);
      expect(outer.castShadow).toContain("0.4");
      expect(inner.seam).toBe(1);
      expect(inner.seamColor).not.toBe("rgba(0, 0, 0, 0)");
      // The seam color follows the theme: it differs from the light mode's.
      document.documentElement.classList.remove("dark");
      await frames(2);
      expect(shadowOf(1).seamColor).not.toBe(inner.seamColor);
    });
  });

  /**
   * A panel declared in another's content is its child: closing the parent takes it along, as one
   * motion, and focus lands on the parent's opener.
   */
  describe("nested panels", () => {
    beforeAll(() => page.viewport(1400, 800));

    function nested(childStyle?: Record<string, string>) {
      const st = reactive({ parent: false, child: false, grand: false });
      const log: string[] = [];
      const bind = (k: "parent" | "child" | "grand", extra: Record<string, unknown> = {}) => ({
        visible: st[k],
        "onUpdate:visible": (v: boolean) => (st[k] = v),
        onClose: () => log.push(k),
        "data-testid": k,
        size: "sm",
        ...extra,
      });
      const w = mount(
        defineComponent({
          render: () =>
            h("div", [
              h("button", { id: "opener" }, "opener"),
              h(CuiSlideoverStack, null, {
                default: () =>
                  h(CuiSlideover, bind("parent"), {
                    default: () => [
                      h("button", { id: "in-parent" }, "p"),
                      h(CuiSlideover, bind("child", { style: childStyle }), {
                        default: () => [h("button", { id: "in-child" }, "c"), h(CuiSlideover, bind("grand", { style: childStyle }), { default: () => h("button", { id: "in-grand" }, "g") })],
                      }),
                    ],
                  }),
              }),
            ]),
        }),
        { attachTo: document.body },
      );
      mounted.push(w);
      return { st, log };
    }
    const byId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);

    it("real focus returns to the parent's opener after the whole cascade", async () => {
      const { st } = nested();
      const opener = document.getElementById("opener")!;
      opener.focus();
      st.parent = true;
      await settle();
      document.getElementById("in-parent")!.focus();
      st.child = true;
      await settle();
      document.getElementById("in-child")!.focus();
      expect(document.activeElement?.id).toBe("in-child");
      st.parent = false;
      await settle();
      expect(byId("parent")).toBeNull();
      expect(byId("child")).toBeNull();
      expect(document.activeElement).toBe(opener);
    });

    it("the child leaves with the parent: both are animating on the same frame", async () => {
      const { st } = nested();
      st.parent = true;
      await settle();
      st.child = true;
      await settle();
      st.parent = false;
      await frames(2);
      expect(byId("parent")!.getAnimations().length, "the parent is leaving").toBeGreaterThan(0);
      expect(byId("child")!.getAnimations().length, "so is the child, not already gone, not waiting").toBeGreaterThan(0);
      await settle();
      expect(byId("child")).toBeNull();
    });

    it("reports children first even when a child's exit outlasts its parent's", async () => {
      const slow = { transitionDuration: "600ms" };
      const { st, log } = nested(slow);
      st.parent = true;
      await settle();
      st.child = true;
      await settle();
      st.grand = true;
      await settle();
      st.parent = false;
      await wait(motionDuration("slow") + 800);
      expect(log).toEqual(["grand", "child", "parent"]);
      expect(st.child).toBe(false);
      expect(st.grand).toBe(false);
    });
  });

  /**
   * #529 - `hidden` on a stacked panel. A hidden panel sits out of the layout, so clearing it
   * must put the panel in its place with nothing else prompting a re-layout, and setting it
   * must close the gap, without the shared backdrop noticing either.
   */
  describe("hidden panels", () => {
    beforeAll(() => page.viewport(1400, 800));

    it("clearing `hidden` on an open panel attaches it in its place, with no other trigger", async () => {
      const open = stack([{ size: "lg" }, { size: "md", hidden: true }]);
      await openN(open, 2);
      // Alone in the layout: the hidden one is not part of it.
      expect(rect(0).right).toBeCloseTo(1400, 0);
      hid[1] = false;
      await settle();
      expect(rect(1).right).toBeCloseTo(1400, 0);
      expect(rect(1).width).toBeCloseTo(448, 0);
      expect(rect(0).right).toBeCloseTo(rect(1).left, 0);
      expect(rect(0).width).toBeCloseTo(576, 0);
    });

    it("the revealed panel obeys the fit rules: three large panels narrow to fill the viewport minus the gap", async () => {
      const open = stack([{ size: "lg" }, { size: "lg" }, { size: "lg", hidden: true }]);
      await openN(open, 3);
      hid[2] = false;
      await settle();
      expect(rect(2).right).toBeCloseTo(1400, 0);
      expect(rect(1).right).toBeCloseTo(rect(2).left, 0);
      expect(rect(0).right).toBeCloseTo(rect(1).left, 0);
      expect(rect(0).left).toBeCloseTo(32, 0);
      expect(rect(0).width).toBeGreaterThanOrEqual(320);
    });

    it("re-flows the others as an ordinary move: the transform-only FLIP, not a snap", async () => {
      const open = stack([{ size: "lg" }, { size: "md", hidden: true }]);
      await openN(open, 2);
      hid[1] = false;
      await frames(2);
      const flip = panel(0).getAnimations().find((a) => a.id === "cui-stack-flip");
      expect(flip, "the first panel slides").toBeDefined();
      const kf = (flip!.effect as KeyframeEffect).getKeyframes();
      expect(kf[0].translate).toBeDefined();
      await settle();
    });

    it("setting `hidden` takes the panel out and the rest re-flow, with no FLIP trail", async () => {
      const open = stack([{ size: "lg" }, { size: "md" }, { size: "md" }]);
      await openN(open, 3);
      hid[1] = true;
      await frames(2);
      // The vanished panel does not slide out, so the others snap rather than leave a gap.
      expect(panel(0).getAnimations().filter((a) => a.id === "cui-stack-flip")).toHaveLength(0);
      await settle();
      expect(rect(2).right).toBeCloseTo(1400, 0);
      expect(rect(0).right).toBeCloseTo(rect(2).left, 0);
      hid[1] = false;
      await settle();
      expect(rect(1).right).toBeCloseTo(rect(2).left, 0);
      expect(rect(0).right).toBeCloseTo(rect(1).left, 0);
    });

    it("hiding the top modal panel hands the active set back: nothing beneath is inert or covered", async () => {
      const open = stack([{}, {}]);
      await openN(open, 2);
      const covered = () => panel(0).hasAttribute("data-cui-covered");
      const inert = () => panel(0).closest(".cui-slideover-overlay")!.hasAttribute("inert");
      expect(covered() && inert()).toBe(true);
      hid[1] = true;
      await settle();
      expect(covered(), "not covered by a hidden panel").toBe(false);
      expect(inert(), "not inert beneath a hidden panel").toBe(false);
      hid[1] = false;
      await settle();
      expect(covered() && inert()).toBe(true);
    });

    it("a hidden panel beneath the active one is not dimmed as covered, and is again once shown", async () => {
      const open = stack([{}, {}]);
      await openN(open, 2);
      hid[0] = true;
      await settle();
      expect(panel(0).hasAttribute("data-cui-covered"), "a hidden panel is not covered").toBe(false);
      hid[0] = false;
      await settle();
      expect(panel(0).hasAttribute("data-cui-covered")).toBe(true);
    });

    it("Escape closes the topmost panel that is shown, not a hidden one above it", async () => {
      const open = stack([{}, {}]);
      await openN(open, 2);
      hid[1] = true;
      await settle();
      await userEvent.keyboard("{Escape}");
      await settle();
      expect(open[0], "the visible panel closed").toBe(false);
      expect(open[1], "the hidden one stayed").toBe(true);
    });

    it("the side the stack arranges comes from a panel that is shown", async () => {
      const open = stack([{ side: "left", hidden: true }, { size: "lg" }, { size: "md" }]);
      await openN(open, 3);
      expect(rect(2).right).toBeCloseTo(1400, 0);
      expect(rect(1).right).toBeCloseTo(rect(2).left, 0);
    });

    it("the shared backdrop never dips or remounts while a panel is hidden and revealed, even the last one", async () => {
      const open = stack([{}, {}]);
      await openN(open, 2);
      document.querySelectorAll<HTMLElement>(".cui-backdrop").forEach((e) => (e.dataset.probe = "1"));
      const bad: string[] = [];
      let running = true;
      const tick = () => {
        const els = [...document.querySelectorAll<HTMLElement>(".cui-backdrop")].filter((e) => getComputedStyle(e).display !== "none");
        const dim = 1 - els.reduce((acc, e) => acc * (1 - Number(getComputedStyle(e).opacity)), 1);
        if (els.length !== 1 || els[0].dataset.probe !== "1" || Math.abs(dim - 0.5) > 0.002) bad.push(`${els.length}:${dim.toFixed(3)}`);
        if (running) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      for (const [a, b] of [[false, true], [true, false], [true, true]]) {
        hid[0] = a;
        hid[1] = b;
        await settle();
        hid[0] = false;
        hid[1] = false;
        await settle();
      }
      running = false;
      expect(bad).toEqual([]);
    });
  });
});
