import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { nextTick } from "vue";
import { mount, type VueWrapper } from "@vue/test-utils";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import { motionDuration } from "../../utils/motion";
import CuiDrawer from "../../components/CuiDrawer.vue";
import CuiSlideover from "../../components/CuiSlideover.vue";

/**
 * #268 — the drag-to-dismiss gesture in a real browser, where layout, the transform the drag
 * writes and the stylesheet's own transition are all real; jsdom has none of them. Driven by
 * pointer events dispatched on the panel, since a synthetic touch is the only portable way to
 * make a finger.
 */
describe("CuiDrawer and CuiSlideover drag-to-dismiss (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => (removeTokens = installTokens(main)));
  afterAll(() => removeTokens());

  const mounted: VueWrapper[] = [];
  afterEach(() => mounted.splice(0).forEach((w) => w.unmount()));
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const open = () => wait(motionDuration("slow") * 2 + 150);

  const panel = () => document.querySelector<HTMLElement>(".cui-drawer__panel")!;
  const slidePanel = () => document.querySelector<HTMLElement>(".cui-slideover__panel")!;

  function pointer(el: Element, type: string, x: number, y: number, init: PointerEventInit = {}) {
    el.dispatchEvent(
      new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 1, isPrimary: true, pointerType: "touch", clientX: x, clientY: y, button: 0, ...init }),
    );
  }

  /** A press. The drag follows the pointer on the document from Vue's next flush, as it does for a real finger's next event. */
  async function down(el: Element, x: number, y: number, init: PointerEventInit = {}) {
    pointer(el, "pointerdown", x, y, init);
    await nextTick();
  }

  const content = Array.from({ length: 40 }, (_, i) => `<p style="margin:0;height:24px">Row ${i}</p>`).join("");
  async function mountDrawer(props: Record<string, unknown> = {}) {
    const w = mount(CuiDrawer, { props: { visible: true, title: "Sheet", ...props }, slots: { default: `<div style="height:300px">tall</div>` } });
    mounted.push(w);
    await open();
    return w;
  }
  const header = () => document.querySelector<HTMLElement>(".cui-modal-header")!;
  const closed = (w: VueWrapper) => w.emitted("update:visible")?.at(-1)?.[0] === false;

  /** A touch drag down by `dy`: the commit move, a pause, then the rest, then release. */
  async function dragDown(el: Element, dy: number, over: number, init: PointerEventInit = {}) {
    const x = 100;
    await down(el, x, 100, init);
    pointer(el, "pointermove", x, 110, init);
    await wait(over);
    pointer(el, "pointermove", x, 110 + dy, init);
    return () => pointer(el, "pointerup", x, 110 + dy, init);
  }

  it("a fast flick closes it, even over a short distance", async () => {
    const w = await mountDrawer();
    const release = await dragDown(header(), 40, 20);
    expect(panel().style.transform).toMatch(/translateY\(4\dpx\)/);
    release();
    await wait(motionDuration("fast") + 250);
    expect(closed(w)).toBe(true);
    expect(document.querySelector(".cui-drawer__panel")).toBeNull();
  });

  it("a slow, short drag springs back and stays open", async () => {
    const w = await mountDrawer();
    const top = panel().getBoundingClientRect().top;
    const release = await dragDown(header(), 30, 500);
    expect(panel().getBoundingClientRect().top).toBeGreaterThan(top + 20);
    release();
    await wait(motionDuration("slow") * 2 + 150);
    expect(closed(w)).toBe(false);
    expect(panel().style.transform).toBe("");
    expect(panel().getBoundingClientRect().top).toBeCloseTo(top, 0);
  });

  it("a slow drag past the closing point closes it", async () => {
    const w = await mountDrawer();
    const release = await dragDown(header(), panel().offsetHeight * 0.6, 3000);
    release();
    await wait(motionDuration("fast") + 250);
    expect(closed(w)).toBe(true);
  });

  it("writes the transform onto the panel and never an inline custom property", async () => {
    await mountDrawer();
    const before = panel().getAttribute("style");
    const release = await dragDown(header(), 60, 300);
    expect(panel().style.transform).not.toBe("");
    expect(panel().hasAttribute("data-cui-dragging")).toBe(true);
    // Only the transform and the transition moved: every custom property is as it was.
    const props = (s: string | null) => (s ?? "").split(";").filter((d) => d.trim().startsWith("--")).sort();
    expect(props(panel().getAttribute("style"))).toEqual(props(before));
    release();
  });

  it("damps a pull past fully open: it follows less and less", async () => {
    await mountDrawer();
    // Not at a snap point with room above: an upward pull from fully open is refused at the start.
    // A drag that went down first and then back up past the origin is the pull past the top.
    await down(header(), 100, 300);
    pointer(header(), "pointermove", 100, 320);
    pointer(header(), "pointermove", 100, 0);
    expect(panel().style.transform).toMatch(/translateY\(-/);
    const lifted = Math.abs(parseFloat(/-?[\d.]+/.exec(panel().style.transform.replace("translateY(", ""))![0]));
    expect(lifted).toBeGreaterThan(0);
    // 320px of pull moved it under the damping limit, far short of 1:1.
    expect(lifted).toBeLessThan(80);
    pointer(header(), "pointerup", 100, 0);
  });

  it("leaves a drag that starts in scrolled content to the scroll", async () => {
    const w = mount(CuiDrawer, {
      props: { visible: true, title: "List" },
      slots: { default: `<div id="scroller" style="height:120px;overflow:auto">${content}</div>` },
    });
    mounted.push(w);
    await open();
    const scroller = document.querySelector<HTMLElement>("#scroller")!;
    scroller.scrollTop = 80;
    await wait(150);
    // Mid-scroll: a pull down is a scroll back up, not a close.
    await down(scroller, 100, 100);
    pointer(scroller, "pointermove", 100, 130);
    pointer(scroller, "pointermove", 100, 200);
    expect(panel().hasAttribute("data-cui-dragging")).toBe(false);
    pointer(scroller, "pointerup", 100, 200);
    // At the top, it is the sheet's.
    scroller.scrollTop = 0;
    await wait(150);
    await down(scroller, 100, 100);
    pointer(scroller, "pointermove", 100, 110);
    pointer(scroller, "pointermove", 100, 150);
    expect(panel().hasAttribute("data-cui-dragging")).toBe(true);
    pointer(scroller, "pointerup", 100, 150);
  });

  it("blocks a drag for 100ms after the content scrolled", async () => {
    const w = mount(CuiDrawer, {
      props: { visible: true, title: "List" },
      slots: { default: `<div id="scroller" style="height:120px;overflow:auto">${content}</div>` },
    });
    mounted.push(w);
    await open();
    const scroller = document.querySelector<HTMLElement>("#scroller")!;
    scroller.scrollTop = 80;
    scroller.scrollTop = 0;
    await wait(30);
    await down(header(), 100, 100);
    pointer(header(), "pointermove", 100, 110);
    pointer(header(), "pointermove", 100, 150);
    expect(panel().hasAttribute("data-cui-dragging")).toBe(false);
    pointer(header(), "pointerup", 100, 150);
    await wait(150);
    await down(header(), 100, 100);
    pointer(header(), "pointermove", 100, 110);
    pointer(header(), "pointermove", 100, 150);
    expect(panel().hasAttribute("data-cui-dragging")).toBe(true);
    pointer(header(), "pointerup", 100, 150);
  });

  it("ignores a second finger once a drag has started", async () => {
    await mountDrawer();
    await down(header(), 100, 100);
    pointer(header(), "pointermove", 100, 110);
    pointer(header(), "pointermove", 100, 150);
    const at = panel().style.transform;
    await down(header(), 200, 400, { pointerId: 2, isPrimary: false });
    pointer(header(), "pointermove", 200, 600, { pointerId: 2, isPrimary: false });
    pointer(header(), "pointerup", 200, 600, { pointerId: 2, isPrimary: false });
    expect(panel().style.transform).toBe(at);
    expect(panel().hasAttribute("data-cui-dragging")).toBe(true);
    pointer(header(), "pointerup", 100, 150);
  });

  it("drags with a mouse only from the handle", async () => {
    await mountDrawer();
    const mouse = { pointerType: "mouse" };
    await down(header(), 100, 100, mouse);
    pointer(header(), "pointermove", 100, 110, mouse);
    pointer(header(), "pointermove", 100, 150, mouse);
    expect(panel().hasAttribute("data-cui-dragging")).toBe(false);
    pointer(header(), "pointerup", 100, 150, mouse);

    const handle = document.querySelector<HTMLElement>(".cui-drawer__handle")!;
    await down(handle, 100, 100, mouse);
    pointer(handle, "pointermove", 100, 110, mouse);
    pointer(handle, "pointermove", 100, 150, mouse);
    expect(panel().hasAttribute("data-cui-dragging")).toBe(true);
    pointer(handle, "pointerup", 100, 150, mouse);
  });

  it("does not start on a text field", async () => {
    await mountDrawer();
    const input = document.createElement("input");
    document.querySelector(".cui-modal-body")!.append(input);
    await down(input, 100, 100);
    pointer(input, "pointermove", 100, 110);
    pointer(input, "pointermove", 100, 150);
    expect(panel().hasAttribute("data-cui-dragging")).toBe(false);
    pointer(input, "pointerup", 100, 150);
  });

  it("does not drag while persistent or with noDrag", async () => {
    for (const props of [{ persistent: true }, { noDrag: true }]) {
      const w = await mountDrawer(props);
      await down(header(), 100, 100);
      pointer(header(), "pointermove", 100, 110);
      pointer(header(), "pointermove", 100, 150);
      expect(panel().hasAttribute("data-cui-dragging"), JSON.stringify(props)).toBe(false);
      pointer(header(), "pointerup", 100, 150);
      w.unmount();
      mounted.pop();
    }
  });

  it("swallows the click that ends a drag", async () => {
    await mountDrawer();
    let clicked = false;
    header().addEventListener("click", () => (clicked = true));
    const release = await dragDown(header(), 30, 500);
    release();
    header().click();
    expect(clicked).toBe(false);
  });

  describe("snap points", () => {
    it("rests at the first point, and a flick up settles on the next", async () => {
      const w = await mountDrawer({ snapPoints: [0.4, 1] });
      expect(w.emitted("update:activeSnapPoint")).toBeUndefined();
      const shown = () => window.innerHeight - panel().getBoundingClientRect().top;
      expect(shown()).toBeCloseTo(window.innerHeight * 0.4, 0);
      // Up: commit a small drag down first, then back up fast past the rest position.
      await down(header(), 100, 400);
      pointer(header(), "pointermove", 100, 410);
      await wait(20);
      pointer(header(), "pointermove", 100, 300);
      pointer(header(), "pointerup", 100, 300);
      await wait(motionDuration("slow") * 2 + 150);
      expect(w.emitted("update:activeSnapPoint")?.at(-1)).toEqual([1]);
      expect(shown()).toBeCloseTo(window.innerHeight, 0);
    });

    it("a flick down from the lowest point closes it", async () => {
      const w = await mountDrawer({ snapPoints: [0.4, 1] });
      const release = await dragDown(header(), 60, 20);
      release();
      await wait(motionDuration("fast") + 250);
      expect(closed(w)).toBe(true);
    });
  });

  describe("CuiSlideover", () => {
    async function mountSlideover(props: Record<string, unknown> = {}) {
      const w = mount(CuiSlideover, { props: { visible: true, title: "Panel", side: "right", ...props }, slots: { default: "Body" } });
      mounted.push(w);
      await wait(motionDuration("slow") + 150);
      return w;
    }

    it("a touch flick toward its edge closes it", async () => {
      const w = await mountSlideover();
      const el = slidePanel().querySelector(".cui-modal-header")!;
      await down(el, 100, 100);
      pointer(el, "pointermove", 110, 100);
      await wait(20);
      pointer(el, "pointermove", 170, 100);
      expect(slidePanel().style.transform).toMatch(/translateX\(/);
      pointer(el, "pointerup", 170, 100);
      await wait(motionDuration("fast") + 250);
      expect(closed(w)).toBe(true);
    });

    it("a mouse drag does nothing, so selection and clicks are untouched", async () => {
      await mountSlideover();
      const el = slidePanel().querySelector(".cui-modal-header")!;
      const mouse = { pointerType: "mouse" };
      await down(el, 100, 100, mouse);
      pointer(el, "pointermove", 110, 100, mouse);
      pointer(el, "pointermove", 200, 100, mouse);
      expect(slidePanel().hasAttribute("data-cui-dragging")).toBe(false);
      pointer(el, "pointerup", 200, 100, mouse);
    });

    it("each side drags toward its own edge, and noDrag turns it off", async () => {
      const w = await mountSlideover({ side: "left" });
      const el = slidePanel().querySelector(".cui-modal-header")!;
      await down(el, 300, 100);
      pointer(el, "pointermove", 290, 100);
      pointer(el, "pointermove", 250, 100);
      expect(slidePanel().style.transform).toMatch(/translateX\(-/);
      pointer(el, "pointerup", 250, 100);
      w.unmount();
      mounted.pop();

      await mountSlideover({ noDrag: true });
      const el2 = slidePanel().querySelector(".cui-modal-header")!;
      await down(el2, 100, 100);
      pointer(el2, "pointermove", 110, 100);
      pointer(el2, "pointermove", 180, 100);
      expect(slidePanel().hasAttribute("data-cui-dragging")).toBe(false);
      pointer(el2, "pointerup", 180, 100);
    });
  });
});
