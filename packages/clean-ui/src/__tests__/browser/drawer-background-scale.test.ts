import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { nextTick } from "vue";
import { mount, type VueWrapper } from "@vue/test-utils";
import { cdp, page } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import { installTokens, frames } from "../../../../../config/test/browser-helpers";
import { motionDuration } from "../../utils/motion";
import CuiDrawer from "../../components/CuiDrawer.vue";

/**
 * #534 — the page behind a drawer scales back and rounds its corners, following the drag like
 * the backdrop. Real frames and real layout: what the wrapper measures at every frame of the
 * open, of a drag, of the exit and of a reduced-motion open, and that its own inline styles come
 * back. Driven like `drawer-polish.test.ts`: pointer events dispatched on the panel.
 */
describe("CuiDrawer scaleBackground (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(async () => {
    removeTokens = installTokens(main);
    await page.viewport(800, 600);
  });
  afterAll(() => removeTokens());

  const mounted: VueWrapper[] = [];
  afterEach(async () => {
    mounted.splice(0).forEach((w) => w.unmount());
    document.body.innerHTML = "";
    window.scrollTo(0, 0);
    await reduce(false);
  });
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const open = () => wait(motionDuration("slow") * 2 + 150);
  const reduce = async (on: boolean) => void (await cdp().send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: on ? "reduce" : "" }] }));

  const INLINE = "opacity: 0.99; width: 600px;";
  function addPage(height = 400) {
    const el = document.createElement("main");
    el.setAttribute("data-cui-drawer-wrapper", "");
    el.innerHTML = `<div class="top" style="height:20px;background:rgb(0,0,255)"></div><div class="spacer" style="height:${height}px"></div><div class="marker" style="height:20px;background:rgb(0,255,0)"></div><div class="fixed" style="position:fixed;top:0;left:0;height:10px;width:10px"></div>`;
    el.setAttribute("style", INLINE);
    document.body.append(el);
    return el;
  }
  /** The wrapper's drawn width over its layout width: its scale. */
  const scaleOf = (el: HTMLElement) => el.getBoundingClientRect().width / el.offsetWidth;

  const panel = () => document.querySelector<HTMLElement>(".cui-drawer__panel")!;
  const header = () => document.querySelector<HTMLElement>(".cui-drawer__panel .cui-modal-header")!;

  function pointer(el: Element, type: string, x: number, y: number) {
    el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 1, isPrimary: true, pointerType: "touch", clientX: x, clientY: y, button: 0 }));
  }
  async function drag(el: Element, dy: number, over: number) {
    pointer(el, "pointerdown", 100, 100);
    await nextTick();
    pointer(el, "pointermove", 100, 110);
    await wait(over);
    pointer(el, "pointermove", 100, 110 + dy);
    return () => pointer(el, "pointerup", 100, 110 + dy);
  }
  async function sample<T>(ms: number, read: () => T): Promise<T[]> {
    const out: T[] = [];
    const t0 = performance.now();
    while (performance.now() - t0 < ms) {
      await frames(1);
      out.push(read());
    }
    return out;
  }

  async function mountDrawer(props: Record<string, unknown> = {}, wait_ = true) {
    const w = mount(CuiDrawer, {
      props: { visible: true, title: "Sheet", scaleBackground: true, ...props },
      slots: { default: `<div style="height:300px">tall</div>` },
      attachTo: document.body,
    });
    mounted.push(w);
    if (wait_) await open();
    return w;
  }

  it("scales the page to 95% with rounded corners over the open, frame by frame, and the sheet arrives with it", async () => {
    const el = addPage();
    expect(scaleOf(el)).toBeCloseTo(1, 3);
    const w = await mountDrawer({ visible: false }, false);
    await w.setProps({ visible: true });
    const scales = await sample(motionDuration("slow") * 2 + 200, () => scaleOf(el));
    expect(scales.at(-1)!).toBeCloseTo(0.95, 2);
    // A transition, not a jump: it takes several frames, and only ever shrinks.
    expect(new Set(scales.map((s) => s.toFixed(3))).size).toBeGreaterThan(4);
    for (let i = 1; i < scales.length; i++) expect(scales[i]!, `frame ${i}`).toBeLessThanOrEqual(scales[i - 1]! + 0.0005);
    expect(parseFloat(getComputedStyle(el).borderTopLeftRadius)).toBeGreaterThan(4);
    // The sheet's own entry is untouched by it.
    expect(panel().getBoundingClientRect().bottom).toBeCloseTo(window.innerHeight, 0);
  });

  it("only writes transform and border-radius (plus the origin, clip and transition they need)", async () => {
    const el = addPage();
    await mountDrawer();
    const set = Array.from({ length: el.style.length }, (_, i) => el.style.item(i));
    expect(set.filter((p) => !/^(transform|transform-origin|border|overflow|transition|opacity|width)/.test(p))).toEqual([]);
    expect(document.querySelector(".cui-drawer-overlay")!.getAttribute("style")).not.toMatch(/scale|radius/);
  });

  it("follows the drag, in step with the backdrop", async () => {
    const el = addPage();
    await mountDrawer();
    const backdrop = document.querySelector<HTMLElement>(".cui-backdrop")!;
    const fullOpacity = parseFloat(getComputedStyle(backdrop).opacity);
    const release = await drag(header(), panel().offsetHeight / 2, 500);
    await frames(2);
    // Half way to closed: half way from 0.95 back to 1, as the backdrop is half faded.
    expect(scaleOf(el)).toBeGreaterThan(0.968);
    expect(scaleOf(el)).toBeLessThan(0.982);
    expect(parseFloat(getComputedStyle(backdrop).opacity) / fullOpacity).toBeCloseTo(0.5, 1);
    expect(el.style.transition).toBe("none");
    release();
    await wait(motionDuration("slow") * 2 + 150);
  });

  it("goes back to 95% on a spring-back, and to its own styles after a dismissal", async () => {
    const el = addPage();
    const w = await mountDrawer();
    let release = await drag(header(), 30, 600);
    release();
    await wait(motionDuration("slow") * 2 + 150);
    expect(scaleOf(el)).toBeCloseTo(0.95, 2);
    expect(w.emitted("update:visible")).toBeUndefined();

    release = await drag(header(), panel().offsetHeight * 0.7, 1500);
    release();
    const scales = await sample(motionDuration("fast") + 300, () => scaleOf(el));
    // Carried on from where the drag left it, never back down to 95% first.
    expect(Math.min(...scales.slice(0, 3))).toBeGreaterThan(0.96);
    expect(scaleOf(el)).toBeCloseTo(1, 3);
    expect(el.getAttribute("style")).toBe(INLINE);
  });

  it("keeps the top of what is on screen put when the page is scrolled", async () => {
    const el = addPage(3000);
    window.scrollTo(0, 800);
    await frames(2);
    const probe = document.createElement("div");
    probe.style.cssText = `position:absolute;left:0;width:10px;height:10px;top:${window.scrollY + 40}px`;
    el.style.position = "relative";
    el.append(probe);
    const y0 = probe.getBoundingClientRect().top;
    await mountDrawer();
    const y1 = probe.getBoundingClientRect().top;
    // 40px below the viewport top: scaled about the viewport top, so it moves by the 14px offset
    // less 5% of 40px (+12), not by 5% of 800px (a wrapper scaled about its own top lands 28px up).
    expect(Math.abs(y1 - (y0 + 12))).toBeLessThan(3);
  });

  it("does not scale the scaled: nested drawers share one scale, and the page is restored once", async () => {
    const el = addPage();
    const a = await mountDrawer();
    const b = await mountDrawer({ title: "Inner" });
    expect(scaleOf(el)).toBeCloseTo(0.95, 2);
    await b.setProps({ visible: false });
    await wait(motionDuration("fast") + 200);
    expect(scaleOf(el)).toBeCloseTo(0.95, 2);
    await a.setProps({ visible: false });
    await wait(motionDuration("fast") + 200);
    expect(scaleOf(el)).toBeCloseTo(1, 3);
    expect(el.getAttribute("style")).toBe(INLINE);
  });

  it("gives a fixed child back its place in the viewport once the page is restored", async () => {
    const el = addPage();
    const fixed = el.querySelector<HTMLElement>(".fixed")!;
    const w = await mountDrawer();
    // A transformed ancestor becomes the containing block of a fixed child: documented.
    await w.setProps({ visible: false });
    await wait(motionDuration("fast") + 250);
    expect(fixed.getBoundingClientRect().top).toBeCloseTo(0, 0);
    expect(fixed.getBoundingClientRect().left).toBeCloseTo(0, 0);
  });

  it("restores the page when the drawer unmounts mid-drag", async () => {
    const el = addPage();
    const w = await mountDrawer();
    await drag(header(), 100, 300);
    await frames(2);
    expect(scaleOf(el)).toBeGreaterThan(0.95);
    w.unmount();
    mounted.length = 0;
    expect(el.getAttribute("style")).toBe(INLINE);
    expect(scaleOf(el)).toBeCloseTo(1, 3);
  });

  it("does nothing by default", async () => {
    const el = addPage();
    await mountDrawer({ scaleBackground: false });
    expect(el.getAttribute("style")).toBe(INLINE);
  });

  it("does nothing under reduced motion: a scale is movement", async () => {
    await reduce(true);
    const el = addPage();
    await mountDrawer({}, false);
    await wait(500);
    expect(el.getAttribute("style")).toBe(INLINE);
    expect(scaleOf(el)).toBeCloseTo(1, 3);
  });
});
