import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, reactive } from "vue";
import { page, userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import { installTokens, frames } from "../../../../../config/test/browser-helpers";
import { motionDuration } from "../../utils/motion";
import CuiSlideover from "../../components/CuiSlideover.vue";
import CuiSlideoverStack from "../../components/CuiSlideoverStack.vue";

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
  }
  function stack(specs: Spec[], props: Record<string, unknown> = {}, panelProps: Record<string, unknown> = {}) {
    const open = reactive(specs.map(() => false));
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
      expect(String(frames_[0].transform)).toMatch(/translateX\(-?[\d.]+px\) scaleX\(1\)/);
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
      const samples: { dim: number; count: number; filter: string }[] = [];
      let running = true;
      const tick = () => {
        const els = [...document.querySelectorAll<HTMLElement>(".cui-backdrop")].filter((e) => getComputedStyle(e).display !== "none");
        const through = els.reduce((acc, e) => acc * (1 - Number(getComputedStyle(e).opacity)), 1);
        samples.push({ dim: 1 - through, count: els.length, filter: els.map((e) => getComputedStyle(e).backdropFilter).join("|") });
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
});
