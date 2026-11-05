import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { cdp } from "@vitest/browser/context";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, ref, Transition, withDirectives, vShow, type PropType } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import { motionDuration, type TransitionDuration, type TransitionPreset, type TransitionSide } from "../../utils/motion";
import CuiTransition from "../../components/CuiTransition.vue";

/**
 * #397 — CuiTransition: presets that enter over `base`, leave over `fast`, move by transform
 * and opacity only, fade in place under reduced motion, and turn straight back when the
 * content returns mid-exit. Measured in a real browser: jsdom has no transitions.
 */
describe("CuiTransition (real browser)", () => {
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

  /** The content is a `v-show` (the same element throughout) or a `v-if` (re-created). */
  const Demo = defineComponent({
    props: {
      preset: { type: String as PropType<TransitionPreset>, default: "fade" },
      side: { type: String as PropType<TransitionSide>, default: "bottom" },
      duration: { type: String as PropType<TransitionDuration | undefined>, default: undefined },
      kind: { type: String as PropType<"show" | "if">, default: "show" },
    },
    setup(props, { expose }) {
      const open = ref(true);
      expose({ open });
      return () =>
        h(CuiTransition, { preset: props.preset, side: props.side, duration: props.duration }, () =>
          props.kind === "show"
            ? withDirectives(h("div", { class: "target" }, [h("div", "Content")]), [[vShow, open.value]])
            : open.value
              ? h("div", { class: "target" }, [h("div", "Content")])
              : null,
        );
    },
  });
  function demo(props: Record<string, unknown> = {}) {
    const w = mount(Demo, { props, attachTo: host() });
    mounted.push(w);
    return w;
  }
  const target = () => document.querySelector<HTMLElement>(".target");
  const toggle = async (w: VueWrapper) => {
    (w.vm as unknown as { open: boolean }).open = !(w.vm as unknown as { open: boolean }).open;
    await w.vm.$nextTick();
  };
  const settled = () => wait(motionDuration("slow") + 100);

  it("enters over the base duration and leaves over the fast one, on the ease-out curve", async () => {
    const w = demo({ preset: "fade-slide", kind: "if" });
    await settled();
    await toggle(w);
    const el = target()!;
    const leave = getComputedStyle(el);
    expect(el.getAttribute("data-cui-transition-state")).toBe("hidden");
    expect(leave.transitionDuration.split(", ")[0]).toBe("0.15s");
    expect(leave.transitionProperty).toBe("opacity, transform");
    expect(leave.transitionTimingFunction).toContain("cubic-bezier(0.23, 1, 0.32, 1)");
    await wait(motionDuration("fast") + 100);
    expect(target(), "unmounted once the exit has played").toBeNull();

    await toggle(w);
    await frame();
    await frame();
    expect(getComputedStyle(target()!).transitionDuration.split(", ")[0]).toBe("0.2s");
    await settled();
    expect(Number(getComputedStyle(target()!).opacity)).toBe(1);
  });

  it("reads the enter's duration from a token: a container's override, or the duration prop", async () => {
    const container = host();
    container.style.setProperty("--cui-duration-base", "500ms");
    const w = mount(Demo, { props: { duration: undefined }, attachTo: container });
    mounted.push(w);
    await settled();
    const el = target()!;
    await toggle(w);
    await toggle(w);
    await frame();
    expect(getComputedStyle(el).transitionDuration.split(", ")[0]).toBe("0.5s");
    await w.setProps({ duration: "slow" });
    await toggle(w);
    await toggle(w);
    await frame();
    expect(el.getAttribute("data-cui-transition-duration")).toBe("slow");
    expect(getComputedStyle(el).transitionDuration.split(", ")[0]).toBe("0.25s");
  });

  it.each([
    ["fade-slide", "bottom", (t: DOMMatrix) => t.m42 > 0 && t.m41 === 0],
    ["fade-slide", "top", (t: DOMMatrix) => t.m42 < 0 && t.m41 === 0],
    ["fade-slide", "start", (t: DOMMatrix) => t.m41 < 0 && t.m42 === 0],
    ["fade-slide", "end", (t: DOMMatrix) => t.m41 > 0 && t.m42 === 0],
    ["grow", "bottom", (t: DOMMatrix) => t.a < 1 && t.a > 0.9 && t.m41 === 0 && t.m42 === 0],
  ] as const)("moves a %s from the %s edge by transform", async (preset, side, check) => {
    const w = demo({ preset, side, kind: "if" });
    await settled();
    await toggle(w);
    await wait(motionDuration("fast") / 2);
    const style = getComputedStyle(target()!);
    expect(style.transform, "moving").not.toBe("none");
    expect(check(new DOMMatrix(style.transform))).toBe(true);
    expect(Number(style.opacity)).toBeLessThan(1);
  });

  it("doesn't let a nested transition inherit its parent's side", async () => {
    const open = ref(true);
    const w = mount(
      () =>
        h("div", { class: "cui-transition-side-start" }, [
          h(CuiTransition, { preset: "fade-slide" }, () => (open.value ? h("div", { class: "target" }, "Inner") : null)),
        ]),
      { attachTo: host() },
    );
    mounted.push(w);
    await settled();
    open.value = false;
    await w.vm.$nextTick();
    await wait(motionDuration("fast") / 2);
    const t = new DOMMatrix(getComputedStyle(target()!).transform);
    expect(t.m42, "rises from the bottom").toBeGreaterThan(0);
    expect(t.m41).toBe(0);
  });

  it("keeps a fade's own transform under reduced motion", async () => {
    await setReduced(true);
    const open = ref(true);
    const w = mount(
      () =>
        h(CuiTransition, { preset: "fade" }, () =>
          open.value ? h("div", { class: "target", style: "transform: translateX(10px)" }, "x") : null,
        ),
      { attachTo: host() },
    );
    mounted.push(w);
    await settled();
    open.value = false;
    await w.vm.$nextTick();
    await wait(motionDuration("fast") / 2);
    expect(new DOMMatrix(getComputedStyle(target()!).transform).m41).toBe(10);
  });

  it("collapses the grid's row, not the element's height, and its child clips", async () => {
    const w = demo({ preset: "collapse", kind: "if" });
    await settled();
    const el = target()!;
    const full = el.getBoundingClientRect().height;
    await toggle(w);
    await wait(motionDuration("fast") / 2);
    expect(getComputedStyle(el).display).toBe("grid");
    expect(getComputedStyle(el.firstElementChild!).overflow).toBe("hidden");
    const mid = el.getBoundingClientRect().height;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(full);
    expect(getComputedStyle(el).transitionProperty).toBe("grid-template-rows, opacity");
  });

  it("fades in place under reduced motion: no transform, still an opacity transition", async () => {
    await setReduced(true);
    for (const preset of ["fade-slide", "grow", "collapse"] as const) {
      const w = demo({ preset, kind: "if" });
      await settled();
      const el = target()!;
      const full = el.getBoundingClientRect().height;
      await toggle(w);
      await wait(motionDuration("fast") / 2);
      const style = getComputedStyle(el);
      expect(style.transform, `${preset}: standing still`).toBe("none");
      expect(style.transitionProperty, preset).toBe("opacity");
      expect(Number(style.opacity), `${preset}: fading`).toBeGreaterThan(0);
      expect(Number(style.opacity)).toBeLessThan(1);
      expect(el.getBoundingClientRect().height, `${preset}: not collapsing`).toBe(full);
      await settled();
      expect(target(), `${preset}: gone once faded`).toBeNull();
      w.unmount();
      mounted.pop();
    }
  });

  it("turns straight back when the content returns mid-exit, on the same element", async () => {
    const w = demo({ preset: "fade-slide" });
    await settled();
    const el = target()!;
    await toggle(w);
    await wait(motionDuration("fast") / 2);
    const mid = Number(getComputedStyle(el).opacity);
    const midY = new DOMMatrix(getComputedStyle(el).transform).m42;
    expect(mid).toBeLessThan(1);
    expect(midY).toBeGreaterThan(0);
    await toggle(w);
    const opacities: number[] = [];
    const offsets: number[] = [];
    for (let i = 0; i < 6; i++) {
      await frame();
      opacities.push(Number(getComputedStyle(el).opacity));
      offsets.push(new DOMMatrix(getComputedStyle(el).transform).m42);
    }
    expect(target(), "the same element").toBe(el);
    expect(el.getAttribute("data-cui-transition-state")).toBe("shown");
    // Never further out than where it was: no dip towards invisible first (Vue's CSS mode
    // re-applies enter-from), and no restart from zero.
    expect(Math.min(...opacities)).toBeGreaterThanOrEqual(mid - 0.02);
    expect(Math.max(...offsets)).toBeLessThanOrEqual(midY + 0.5);
    await settled();
    expect(Number(getComputedStyle(el).opacity)).toBe(1);
    expect(getComputedStyle(el).transform).toBe("none");
  });

  it("animates content rendered open at mount when it first leaves", async () => {
    const w = demo({ preset: "fade-slide", kind: "if" });
    const el = target()!;
    expect(el.hasAttribute("data-cui-transition-state"), "rendered, not entered").toBe(false);
    await toggle(w);
    await wait(motionDuration("fast") / 2);
    const opacity = Number(getComputedStyle(el).opacity);
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  });

  it("passes appear, mode and Vue's transition events through", async () => {
    const events: string[] = [];
    const show = ref(true);
    const w = mount(
      () =>
        h(
          CuiTransition,
          { appear: true, mode: "out-in", preset: "fade", onAfterEnter: () => events.push("after-enter"), onAfterLeave: () => events.push("after-leave") },
          () => h("div", { class: "target", key: show.value ? "a" : "b" }, show.value ? "A" : "B"),
        ),
      { attachTo: host() },
    );
    mounted.push(w);
    await settled();
    expect(events, "appear").toEqual(["after-enter"]);
    show.value = false;
    await settled();
    await settled();
    expect(events).toEqual(["after-enter", "after-leave", "after-enter"]);
    expect(target()!.textContent).toBe("B");
  });

  it("gives a raw <Transition> the same look through the exported classes", async () => {
    const open = ref(true);
    const w = mount(
      () =>
        h(Transition, { name: "cui-transition-fade-slide" }, () =>
          open.value ? h("div", { class: "target cui-transition-side-top" }, "Content") : null,
        ),
      { attachTo: host() },
    );
    mounted.push(w);
    await settled();
    open.value = false;
    await w.vm.$nextTick();
    await wait(motionDuration("fast") / 2);
    const style = getComputedStyle(target()!);
    expect(new DOMMatrix(style.transform).m42).toBeLessThan(0);
    expect(style.transitionDuration.split(", ")[0]).toBe("0.15s");
    expect(Number(style.opacity)).toBeLessThan(1);
  });
});
