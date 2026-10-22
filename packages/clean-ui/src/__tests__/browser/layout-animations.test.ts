import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import main from "../../styles/main.css?inline";
import { installTokens } from "./helpers";
import { motionDuration } from "../../utils/motion";
import CuiSlider from "../../components/CuiSlider.vue";
import CuiProgress from "../../components/CuiProgress.vue";
import CuiToast from "../../components/CuiToast.vue";

/**
 * #266 — Slider, Progress and the toast's progress bar animated `width` and `left`, which
 * lay the page out and repaint on every frame. They now move by `transform`, on the
 * compositor. Each running transition is checked by the property it animates, and the
 * moved parts still land where they did.
 */
describe("value displays move by transform (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => (removeTokens = installTokens(main)));
  afterAll(() => removeTokens());

  const mounted: VueWrapper[] = [];
  const hosts: HTMLElement[] = [];
  afterEach(() => {
    mounted.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((el) => el.remove());
  });
  const host = () => {
    const el = document.createElement("div");
    el.style.cssText = "width: 300px; padding: 20px;";
    document.body.append(el);
    hosts.push(el);
    return el;
  };
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  /** Two frames: the first value is styled before the next one replaces it. */
  const settled = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  /** The properties of every transition running on `el` or under it, element by element. */
  const animated = (el: Element) =>
    [el, ...el.querySelectorAll("*")]
      .flatMap((node) => node.getAnimations())
      .map((a) => (a as CSSTransition).transitionProperty ?? (a as CSSAnimation).animationName);

  it("moves a slider's thumb and fill by transform, and puts them at the value", async () => {
    const w = mount(CuiSlider, { props: { modelValue: 20, min: 0, max: 100 }, attachTo: host() });
    mounted.push(w);
    // Styled at the first value before it changes, or there is nothing to transition from.
    await settled();
    await w.setProps({ modelValue: 70 });
    expect(animated(w.element).length, "it animates").toBeGreaterThan(0);
    expect(animated(w.element).every((p) => p === "transform")).toBe(true);

    await wait(motionDuration("press") + 80);
    const root = w.element as HTMLElement;
    const track = root.querySelector<HTMLElement>(".cui-slider__input")!.getBoundingClientRect();
    const thumb = root.querySelector<HTMLElement>(".cui-slider__thumb")!.getBoundingClientRect();
    const fill = root.querySelector<HTMLElement>(".cui-slider__fill")!.getBoundingClientRect();
    const at = track.left + track.width * 0.7;
    expect(thumb.left + thumb.width / 2).toBeCloseTo(at, 0);
    expect(fill.right).toBeCloseTo(at, 0);
  });

  it("moves a progress bar's fill by transform, and ends it at the value", async () => {
    const w = mount(CuiProgress, { props: { value: 10 }, attachTo: host() });
    mounted.push(w);
    await settled();
    await w.setProps({ value: 60 });
    expect(animated(w.element).length, "it animates").toBeGreaterThan(0);
    expect(animated(w.element).every((p) => p === "transform")).toBe(true);

    await wait(motionDuration("slow") + 80);
    const root = w.element as HTMLElement;
    const track = root.querySelector<HTMLElement>(".cui-progress-bar__track")!.getBoundingClientRect();
    const fill = root.querySelector<HTMLElement>(".cui-progress-bar__fill")!.getBoundingClientRect();
    expect(fill.right).toBeCloseTo(track.left + track.width * 0.6, 0);
  });

  it("runs a toast's countdown by transform", async () => {
    const w = mount(CuiToast, { props: { toastId: "t", title: "Saved", autoDismiss: 4000, showProgress: true, active: true }, attachTo: host() });
    mounted.push(w);
    await wait(200);
    const bar = (w.element as HTMLElement).querySelector<HTMLElement>(".cui-toast__progress-bar")!;
    expect(bar.style.transform).toMatch(/^translateX\(-\d/);
    expect(getComputedStyle(bar).transitionProperty).toBe("transform");
  });

  it("glows by fading a still shadow, not by animating box-shadow", () => {
    const w = mount(CuiToast, { props: { toastId: "g", title: "Glow", animation: "glow", autoDismiss: 0 }, attachTo: host() });
    mounted.push(w);
    const toast = (w.element as HTMLElement).classList.contains("cui-toast") ? (w.element as HTMLElement) : (w.element as HTMLElement).querySelector<HTMLElement>(".cui-toast")!;
    expect(getComputedStyle(toast).animationName).toBe("none");
    expect(getComputedStyle(toast, "::after").animationName).toContain("cui-glow-fade");
    // Not clipped by its own toast: nothing on the toast hides overflow.
    expect(getComputedStyle(toast).overflow).toBe("visible");
  });

  it("doesn't make its container scroll sideways at the far end", async () => {
    const box = host();
    box.style.overflow = "auto";
    const w = mount(CuiSlider, { props: { modelValue: 100, min: 0, max: 100 }, attachTo: box });
    mounted.push(w);
    await settled();
    expect(box.scrollWidth).toBe(box.clientWidth);
  });

  it("sweeps a shimmer across the visible part of the bar only", async () => {
    const w = mount(CuiProgress, { props: { value: 30, animation: "shimmer" }, attachTo: host() });
    mounted.push(w);
    await settled();
    const fill = (w.element as HTMLElement).querySelector<HTMLElement>(".cui-progress-bar__fill")!;
    const after = getComputedStyle(fill, "::after");
    const fillWidth = fill.getBoundingClientRect().width;
    expect(parseFloat(after.left)).toBeCloseTo(fillWidth * 0.7, 0);
  });
});
