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
  function stack(specs: Spec[], props: Record<string, unknown> = {}) {
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
});
