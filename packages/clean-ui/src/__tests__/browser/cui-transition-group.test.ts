import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { cdp } from "@vitest/browser/context";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, ref, type PropType } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import { motionDuration, type TransitionDuration, type TransitionPreset, type TransitionSide } from "../../utils/motion";
import CuiTransitionGroup from "../../components/CuiTransitionGroup.vue";

/**
 * #447 — CuiTransitionGroup: the CuiTransition presets for lists, a move transition for the
 * items that stay, and leavers pinned out of the flow. Measured in a real browser.
 */
describe("CuiTransitionGroup (real browser)", () => {
  let removeTokens: () => void;
  const setReduced = (reduce: boolean) =>
    cdp().send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "" }] });
  beforeAll(() => (removeTokens = installTokens(main)));
  afterAll(() => removeTokens());

  const mounted: VueWrapper[] = [];
  const hosts: HTMLElement[] = [];
  afterEach(async () => {
    mounted.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((el) => el.remove());
    await setReduced(false);
  });
  const host = () => {
    const el = document.createElement("div");
    el.style.cssText = "position: fixed; left: 40px; top: 40px; width: 300px;";
    document.body.append(el);
    hosts.push(el);
    return el;
  };
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const frame = () => new Promise((r) => requestAnimationFrame(r));
  const settled = () => wait(motionDuration("slow") + 100);

  const Demo = defineComponent({
    props: {
      preset: { type: String as PropType<TransitionPreset>, default: "fade" },
      side: { type: String as PropType<TransitionSide>, default: "bottom" },
      duration: { type: String as PropType<TransitionDuration | undefined>, default: undefined },
      tag: { type: String, default: "ul" },
    },
    setup(props, { expose }) {
      const items = ref([1, 2, 3]);
      expose({ items });
      return () =>
        h(
          CuiTransitionGroup,
          { preset: props.preset, side: props.side, duration: props.duration, tag: props.tag, style: "list-style: none; margin: 0; padding: 0" },
          () =>
            items.value.map((n) =>
              h("li", { key: n, class: "row", "data-n": n, style: "height: 30px; margin: 0 0 4px; padding: 0 8px; box-sizing: border-box" }, [h("span", `Row ${n}`)]),
            ),
        );
    },
  });
  function demo(props: Record<string, unknown> = {}) {
    const w = mount(Demo, { props, attachTo: host() });
    mounted.push(w);
    return w;
  }
  const items = (w: VueWrapper) => (w.vm as unknown as { items: number[] }).items;
  const row = (n: number) => document.querySelector<HTMLElement>(`.row[data-n="${n}"]`)!;
  const rows = () => [...document.querySelectorAll<HTMLElement>(".row")];

  it("carries a cui-* class on the element a tag renders", async () => {
    demo();
    await settled();
    expect(document.querySelector("ul")!.classList.contains("cui-transition-group")).toBe(true);
    expect(getComputedStyle(document.querySelector("ul")!).position).toBe("relative");
  });

  it("enters over the base duration and leaves over the fast one, on the ease-out curve", async () => {
    const w = demo({ preset: "fade-slide" });
    await settled();
    items(w).push(4);
    await w.vm.$nextTick();
    await frame();
    const entering = getComputedStyle(row(4));
    expect(entering.transitionDuration.split(", ")[0]).toBe("0.2s");
    expect(entering.transitionTimingFunction).toContain("cubic-bezier(0.23, 1, 0.32, 1)");
    expect(entering.transitionProperty).toBe("opacity, transform");
    await settled();
    expect(Number(getComputedStyle(row(4)).opacity)).toBe(1);

    items(w).splice(items(w).indexOf(4), 1);
    await w.vm.$nextTick();
    const leaving = getComputedStyle(row(4));
    expect(leaving.transitionDuration.split(", ")[0]).toBe("0.15s");
    expect(leaving.transitionTimingFunction).toContain("cubic-bezier(0.23, 1, 0.32, 1)");
    await wait(motionDuration("fast") + 100);
    expect(document.querySelector('.row[data-n="4"]'), "removed once the exit has played").toBeNull();
  });

  it("takes the enter's duration from the duration prop", async () => {
    const w = demo({ duration: "slow" });
    await settled();
    items(w).push(4);
    await w.vm.$nextTick();
    await frame();
    expect(getComputedStyle(row(4)).transitionDuration.split(", ")[0]).toBe("0.25s");
  });

  it.each([
    ["fade-slide", "bottom", (t: DOMMatrix) => t.m42 > 0 && t.m41 === 0],
    ["fade-slide", "top", (t: DOMMatrix) => t.m42 < 0 && t.m41 === 0],
    ["fade-slide", "end", (t: DOMMatrix) => t.m41 > 0 && t.m42 === 0],
    ["grow", "bottom", (t: DOMMatrix) => t.a < 1 && t.a > 0.9],
  ] as const)("a %s leaver goes towards the %s edge by transform", async (preset, side, check) => {
    const w = demo({ preset, side });
    await settled();
    items(w).splice(1, 1);
    await w.vm.$nextTick();
    await wait(motionDuration("fast") / 2);
    const style = getComputedStyle(row(2));
    expect(check(new DOMMatrix(style.transform))).toBe(true);
    expect(Number(style.opacity)).toBeLessThan(1);
  });

  it("pins a leaver out of the flow, where it stood, while the rest move up", async () => {
    const w = demo();
    await settled();
    const before = row(2).getBoundingClientRect();
    const thirdBefore = row(3).getBoundingClientRect();
    items(w).splice(1, 1);
    await w.vm.$nextTick();
    const leaver = row(2);
    const after = leaver.getBoundingClientRect();
    expect(getComputedStyle(leaver).position).toBe("absolute");
    expect([after.top, after.left, after.width, after.height], "keeps its box").toEqual([before.top, before.left, before.width, before.height]);
    // The third row's layout position is already its final one, and it is moving there.
    await wait(motionDuration("base") + 100);
    const thirdAfter = row(3).getBoundingClientRect();
    expect(thirdAfter.top).toBeLessThan(thirdBefore.top);
    expect(thirdAfter.top, "took the leaver's place").toBe(before.top);
    expect(document.querySelector('.row[data-n="2"]')).toBeNull();
  });

  it("slides the rest into place by transform, over base on the in-out curve", async () => {
    const w = demo();
    await settled();
    const top = row(3).getBoundingClientRect().top;
    items(w).splice(0, 1);
    await w.vm.$nextTick();
    await frame();
    const style = getComputedStyle(row(3));
    expect(style.transitionProperty).toBe("transform");
    expect(style.transitionDuration).toBe("0.2s");
    expect(style.transitionTimingFunction).toContain("cubic-bezier(0.77, 0, 0.175, 1)");
    await wait(motionDuration("base") / 2);
    const mid = row(3).getBoundingClientRect().top;
    expect(mid, "part-way").toBeLessThan(top);
    expect(mid).toBeGreaterThan(top - 34);
    // FLIP: it is laid out in its final place and the transform carries it back from the old one.
    const offset = new DOMMatrix(getComputedStyle(row(3)).transform).m42;
    expect(offset, "moved by transform").toBeGreaterThan(0);
    expect(offset).toBeLessThan(34);
    await settled();
    expect(row(3).getBoundingClientRect().top).toBe(top - 34);
  });

  it("removes the movement under reduced motion: no transform, the leaver still fades", async () => {
    await setReduced(true);
    const w = demo({ preset: "fade-slide" });
    await settled();
    const top = row(3).getBoundingClientRect().top;
    items(w).splice(0, 1);
    await w.vm.$nextTick();
    await frame();
    expect(getComputedStyle(row(3)).transitionProperty, "no transform transition").toBe("opacity");
    await wait(motionDuration("fast") / 2);
    expect(row(3).getBoundingClientRect().top, "already in place").toBe(top - 34);
    const leaver = getComputedStyle(row(1));
    expect(leaver.transform, "stands still").toBe("none");
    expect(Number(leaver.opacity)).toBeGreaterThan(0);
    expect(Number(leaver.opacity)).toBeLessThan(1);
  });

  it("removes the movement under reduced motion with no tag too, outside any cui-* element", async () => {
    await setReduced(true);
    const list = ref([1, 2, 3]);
    const w = mount(
      () =>
        h("div", { class: "outer" }, [
          h(CuiTransitionGroup, { preset: "fade-slide" }, () =>
            list.value.map((n) => h("p", { key: n, class: "row", "data-n": n, style: "height: 30px; margin: 0" }, `Row ${n}`)),
          ),
        ]),
      { attachTo: host() },
    );
    mounted.push(w);
    await settled();
    const top = row(3).getBoundingClientRect().top;
    list.value = [2, 3];
    await w.vm.$nextTick();
    await frame();
    expect(row(3).className, "never given the move class").toBe("row");
    expect(row(3).getBoundingClientRect().top, "already in place").toBe(top - 30);
  });

  it("leaves no orphan when an item is added back mid-leave", async () => {
    const w = demo();
    await settled();
    items(w).splice(1, 1);
    await w.vm.$nextTick();
    await wait(motionDuration("fast") / 2);
    items(w).splice(1, 0, 2);
    await w.vm.$nextTick();
    await settled();
    await settled();
    expect(rows().map((r) => r.dataset.n)).toEqual(["1", "2", "3"]);
    expect(rows().every((r) => getComputedStyle(r).position !== "absolute" && Number(getComputedStyle(r).opacity) === 1)).toBe(true);
    expect(rows().map((r) => r.getBoundingClientRect().top)).toEqual([40, 74, 108]);
  });

  it("passes the group's events through, and renders no element without a tag", async () => {
    const events: string[] = [];
    const list = ref([1]);
    const w = mount(
      () =>
        h("div", { class: "outer" }, [
          h(CuiTransitionGroup, { onAfterLeave: () => events.push("after-leave") }, () =>
            list.value.map((n) => h("p", { key: n, class: "row", "data-n": n }, String(n))),
          ),
        ]),
      { attachTo: host() },
    );
    mounted.push(w);
    await settled();
    expect(document.querySelector(".outer")!.children[0].className).toBe("row");
    list.value = [];
    await w.vm.$nextTick();
    await settled();
    expect(events).toEqual(["after-leave"]);
  });
});
