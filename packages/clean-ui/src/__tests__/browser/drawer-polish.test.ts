import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { defineComponent, h, nextTick, reactive } from "vue";
import { mount, type VueWrapper } from "@vue/test-utils";
import { cdp, page } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import { installTokens, frames } from "../../../../../config/test/browser-helpers";
import { motionDuration } from "../../utils/motion";
import CuiDrawer from "../../components/CuiDrawer.vue";
import CuiSlideover from "../../components/CuiSlideover.vue";
import CuiSlideoverStack from "../../components/CuiSlideoverStack.vue";

/**
 * #526 and #527 — the backdrop follows a drawer's drag, and reduced motion neither jumps on a
 * dismissal after a drag nor lets a consumer's transform through on an open panel. Real
 * frames; where a painted frame is the claim, a CDP screencast of the real pixels (computed
 * styles said everything was fine before, in the stack's own suite). Driven the way
 * `drawer-gesture.test.ts` drives the gesture: pointer events dispatched on the panel.
 */
describe("drag polish: backdrop fade and reduced motion (real browser)", () => {
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
    await reduce(false);
  });
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const open = () => wait(motionDuration("slow") * 2 + 150);
  const reduce = async (on: boolean) => void (await cdp().send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: on ? "reduce" : "" }] }));

  const panel = () => document.querySelector<HTMLElement>(".cui-drawer__panel")!;
  const slidePanel = () => document.querySelector<HTMLElement>(".cui-slideover__panel")!;
  const backdrop = () => document.querySelector<HTMLElement>(".cui-backdrop")!;
  const header = () => document.querySelector<HTMLElement>(".cui-drawer__panel .cui-modal-header")!;
  const opacityOf = (el: Element) => parseFloat(getComputedStyle(el).opacity);

  function pointer(el: Element, type: string, x: number, y: number) {
    el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 1, isPrimary: true, pointerType: "touch", clientX: x, clientY: y, button: 0 }));
  }
  /** A touch drag by `dy` down from a press at (100, 100): the commit move, a pause of `over` ms, the rest. Returns the release. */
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

  const PROBE = `<div class="probe" style="height:300px;background:rgb(255,0,0)">tall</div>`;
  async function mountDrawer(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
    const w = mount(CuiDrawer, { props: { visible: true, title: "Sheet", ...props }, attrs, slots: { default: PROBE }, attachTo: document.body });
    mounted.push(w);
    await open();
    return w;
  }
  async function mountSlideover(attrs: Record<string, unknown> = {}) {
    const w = mount(CuiSlideover, { props: { visible: true, title: "Panel", side: "right" }, attrs, slots: { default: "Body" }, attachTo: document.body });
    mounted.push(w);
    await wait(motionDuration("slow") + 150);
    return w;
  }

  /** Painted pixels: the frames of a CDP screencast, decoded. */
  async function screencast(run: () => Promise<void> | void, ms: number) {
    const c = cdp();
    const shots: string[] = [];
    const handler = (e: { data: string; sessionId: number }) => {
      shots.push(e.data);
      void c.send("Page.screencastFrameAck", { sessionId: e.sessionId });
    };
    c.on("Page.screencastFrame", handler);
    await c.send("Page.startScreencast", { format: "png", everyNthFrame: 1 });
    await wait(150);
    await run();
    await wait(ms);
    await c.send("Page.stopScreencast");
    c.off("Page.screencastFrame", handler);
    return Promise.all(
      shots.map(async (data) => {
        const img = new Image();
        img.src = "data:image/png;base64," + data;
        await img.decode();
        const cv = document.createElement("canvas");
        cv.width = img.width;
        cv.height = img.height;
        const cx = cv.getContext("2d")!;
        cx.drawImage(img, 0, 0);
        // The tester's page is a viewport-sized iframe at the frame's origin, at scale 1 (the frame itself is larger).
        const k = 1;
        return {
          /** Luminance (0-255) of the page's top-left corner, where only the backdrop is. */
          corner: cx.getImageData(2, 2, 1, 1).data[0],
          /** The y (CSS px) of the first reddish pixel (it fades, so not pure red) down the probe's column, or Infinity. */
          redTop(x: number) {
            const col = cx.getImageData(Math.round(x * k), 0, 1, img.height).data;
            for (let y = 0; y < img.height; y++) if (col[y * 4] > 150 && col[y * 4] - col[y * 4 + 1] > 30 && col[y * 4] - col[y * 4 + 2] > 30) return y / k;
            return Infinity;
          },
        };
      }),
    );
  }

  describe("#526 the backdrop follows the drag", () => {
    it("fades with the sheet, written on the backdrop and nowhere above it", async () => {
      await mountDrawer();
      const full = opacityOf(backdrop());
      expect(full).toBeCloseTo(0.5, 2);
      const release = await drag(header(), panel().offsetHeight / 2, 500);
      await frames(2);
      expect(opacityOf(backdrop())).toBeGreaterThan(full * 0.35);
      expect(opacityOf(backdrop())).toBeLessThan(full * 0.65);
      expect(document.querySelector(".cui-drawer-overlay")!.getAttribute("style")).not.toMatch(/opacity|--_backdrop/);
      release();
      await wait(motionDuration("fast") + 250);
    });

    it("settles back to full on spring-back, as a ramp, leaving no inline style", async () => {
      const w = await mountDrawer();
      const full = opacityOf(backdrop());
      const release = await drag(header(), 40, 500);
      await frames(2);
      expect(opacityOf(backdrop())).toBeLessThan(full - 0.01);
      release();
      const seen = await sample(motionDuration("slow") + 200, () => opacityOf(backdrop()));
      expect(w.emitted("update:visible")).toBeUndefined();
      expect(seen.at(-1)).toBeCloseTo(full, 2);
      for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1] - 0.005);
      expect(backdrop().style.opacity).toBe("");
      expect(backdrop().style.transition).toBe("");
    });

    it("goes to zero on dismiss from where the drag left it, never back to full first", async () => {
      const w = await mountDrawer();
      const release = await drag(header(), panel().offsetHeight * 0.6, 1500);
      await frames(2);
      const dragged = opacityOf(backdrop());
      expect(dragged).toBeLessThan(0.3);
      release();
      const seen = await sample(motionDuration("fast") + 100, () => (backdrop() ? opacityOf(backdrop()) : null));
      expect(w.emitted("update:visible")?.at(-1)).toEqual([false]);
      // It ramps down over the exit's frames: the leave must not be cut short (it waits on the
      // animations running when it starts, so the drag's `transition: none` must be gone by then).
      const shown = seen.filter((v): v is number => v !== null);
      expect(shown.length, `frames with the backdrop: ${seen}`).toBeGreaterThan(3);
      expect(Math.max(...shown)).toBeLessThanOrEqual(dragged + 0.01);
      expect(shown.at(-1)!).toBeLessThan(dragged / 2);
    });

    it("the sheet leaves from where it was let go, over the exit's frames, without a jump", async () => {
      await mountDrawer();
      const release = await drag(header(), panel().offsetHeight * 0.6, 1500);
      await frames(2);
      const left = panel().getBoundingClientRect().top;
      release();
      const tops = (await sample(motionDuration("fast") + 100, () => panel()?.getBoundingClientRect().top)).filter((t): t is number => t !== undefined);
      expect(tops.length, `tops: ${tops}`).toBeGreaterThan(3);
      expect(Math.min(...tops), `tops: ${tops}`).toBeGreaterThanOrEqual(left - 1);
      expect(tops.at(-1)!).toBeGreaterThan(left + 20);
    });

    it("multiplies the configured opacity, with a blur too, rather than replacing it", async () => {
      await mountDrawer({ backdropOpacity: 0.8, backdropBlur: "sm" });
      const full = opacityOf(backdrop());
      const release = await drag(header(), panel().offsetHeight / 2, 500);
      await frames(2);
      expect(opacityOf(backdrop())).toBeGreaterThan(full * 0.3);
      expect(opacityOf(backdrop())).toBeLessThan(full * 0.7);
      release();
      await wait(motionDuration("fast") + 250);
    });

    it("a sheet resting at a lower snap point has the full backdrop and fades only below it", async () => {
      await mountDrawer({ snapPoints: [0.4, 1] });
      const full = opacityOf(backdrop());
      const release = await drag(header(), 20, 500);
      await frames(2);
      expect(opacityOf(backdrop())).toBeGreaterThan(full * 0.9);
      release();
      await wait(motionDuration("slow") * 2 + 150);
    });

    it("paints it: the page behind brightens as the sheet is dragged away (screencast)", async () => {
      await mountDrawer();
      const size = panel().offsetHeight;
      let release = () => {};
      const shots = await screencast(async () => {
        release = await drag(header(), size * 0.5, 300);
      }, 400);
      expect(shots.length).toBeGreaterThan(1);
      // 0.5 black over white is about 128; half way down it is about 192.
      expect(shots[0].corner).toBeLessThan(150);
      expect(shots.at(-1)!.corner).toBeGreaterThan(shots[0].corner + 30);
      release();
    });

    it("paints the dismissal as a ramp that never darkens again (screencast)", async () => {
      await mountDrawer();
      const release = await drag(header(), panel().offsetHeight * 0.6, 1500);
      await frames(3);
      const lum = (await screencast(() => release(), 450)).map((s) => s.corner);
      expect(lum.length).toBeGreaterThan(1);
      for (let i = 1; i < lum.length; i++) expect(lum[i], `frame ${i}: ${lum}`).toBeGreaterThanOrEqual(lum[i - 1] - 2);
      // It starts from the dimming the drag left (about 0.2 black, ~204), not from full strength (~128).
      expect(lum[0]).toBeGreaterThan(170);
      expect(lum.at(-1)).toBeGreaterThan(250);
    });

    describe("in a stack the backdrop is the stack's: only a lone sheet dims it", () => {
      function stackOf(n: number) {
        const st = reactive(Array.from({ length: n }, () => false));
        mounted.push(
          mount(
            defineComponent({
              render: () =>
                h(CuiSlideoverStack, null, {
                  default: () =>
                    st.map((v, i) =>
                      h(CuiDrawer, { key: i, visible: v, "onUpdate:visible": (x: boolean) => (st[i] = x), title: `S${i}`, "data-testid": `d${i}` }, { default: () => h("div", { style: "height:200px" }, "x") }),
                    ),
                }),
            }),
            { attachTo: document.body },
          ),
        );
        return st;
      }
      const shared = () => document.querySelector<HTMLElement>(".cui-slideover-stack__backdrop")!;
      const head = (i: number) => document.querySelector<HTMLElement>(`[data-testid="d${i}"] .cui-modal-header`)!;

      it("a lone drawer fades the shared backdrop and restores it on spring-back", async () => {
        const st = stackOf(1);
        st[0] = true;
        await open();
        const full = opacityOf(shared());
        const release = await drag(head(0), 40, 500);
        await frames(2);
        expect(opacityOf(shared())).toBeLessThan(full - 0.01);
        release();
        await wait(motionDuration("slow") * 2 + 150);
        expect(opacityOf(shared())).toBeCloseTo(full, 2);
        expect(shared().style.opacity).toBe("");
      });

      it("a drawer open with another leaves the shared backdrop alone", async () => {
        const st = stackOf(2);
        st[0] = true;
        await open();
        st[1] = true;
        await open();
        const full = opacityOf(shared());
        const release = await drag(head(1), 60, 500);
        await frames(2);
        expect(opacityOf(shared())).toBeCloseTo(full, 2);
        expect(shared().style.opacity).toBe("");
        release();
        await wait(motionDuration("slow") * 2 + 150);
        expect(opacityOf(shared())).toBeCloseTo(full, 2);
      });
    });
  });

  describe("#527 reduced motion", () => {
    it("A: a drawer dismissed after a drag fades out where the finger left it (frames)", async () => {
      await reduce(true);
      await mountDrawer();
      const size = panel().offsetHeight;
      const release = await drag(header(), size * 0.6, 1500);
      await frames(2);
      const left = panel().getBoundingClientRect().top;
      expect(left).toBeGreaterThan(window.innerHeight - size + size * 0.4);
      release();
      const seen = await sample(motionDuration("fast") + 100, () => ({ top: panel()?.getBoundingClientRect().top, alpha: panel() ? opacityOf(panel()) : 0 }));
      // It does fade, on the frames it is still there: in place, dimming.
      const shown = seen.filter((s) => s.top !== undefined);
      expect(shown.length, `frames with the sheet: ${JSON.stringify(seen)}`).toBeGreaterThan(3);
      expect(Math.min(...shown.map((s) => s.top!)), `tops: ${shown.map((s) => s.top)}`).toBeGreaterThanOrEqual(left - 1);
      expect(shown.at(-1)!.alpha).toBeLessThan(shown[0].alpha);
    });

    it("A: and the painted frames agree (screencast)", async () => {
      await reduce(true);
      await mountDrawer();
      const release = await drag(header(), panel().offsetHeight * 0.6, 1500);
      await frames(3);
      const probe = document.querySelector<HTMLElement>(".probe")!.getBoundingClientRect();
      const shots = await screencast(() => release(), 400);
      const tops = shots.map((s) => s.redTop(probe.left + probe.width / 2)).filter((y) => Number.isFinite(y));
      expect(tops.length, "the screencast saw the sheet").toBeGreaterThan(0);
      expect(Math.min(...tops), `painted tops: ${tops}`).toBeGreaterThanOrEqual(probe.top - 3);
    });

    it("A: a slideover dismissed after a touch drag fades out in place too", async () => {
      await reduce(true);
      const w = await mountSlideover();
      const el = slidePanel().querySelector(".cui-modal-header")!;
      const before = slidePanel().getBoundingClientRect().left;
      pointer(el, "pointerdown", 100, 100);
      await nextTick();
      pointer(el, "pointermove", 110, 100);
      await wait(20);
      pointer(el, "pointermove", 200, 100);
      await frames(2);
      const left = slidePanel().getBoundingClientRect().left;
      expect(left).toBeGreaterThan(before + 50);
      pointer(el, "pointerup", 200, 100);
      const seen = await sample(motionDuration("fast") + 100, () => ({ left: slidePanel()?.getBoundingClientRect().left, alpha: slidePanel() ? opacityOf(slidePanel()) : 0 }));
      expect(w.emitted("update:visible")?.at(-1)).toEqual([false]);
      const shown = seen.filter((s) => s.left !== undefined);
      expect(shown.length, `frames with the panel: ${JSON.stringify(seen)}`).toBeGreaterThan(3);
      expect(Math.min(...shown.map((s) => s.left!)), `lefts: ${shown.map((s) => s.left)}`).toBeGreaterThanOrEqual(left - 1);
      expect(shown.at(-1)!.alpha).toBeLessThan(shown[0].alpha);
    });

    it("A: reopened mid-exit, the sheet is back at rest with nothing held", async () => {
      await reduce(true);
      const w = await mountDrawer();
      const rest = panel().getBoundingClientRect().top;
      const release = await drag(header(), panel().offsetHeight * 0.6, 1500);
      release();
      await frames(2);
      // The parent follows the close (the emit comes at the end of the exit) and then reopens.
      await w.setProps({ visible: false });
      await w.setProps({ visible: true });
      await open();
      expect(panel().getBoundingClientRect().top).toBeCloseTo(rest, 0);
      expect(panel().style.transform).toBe("");
      expect(panel().hasAttribute("data-cui-dragging")).toBe(false);
    });

    it("B: a consumer's transform on an open drawer is neutralized when no drag is active", async () => {
      await reduce(true);
      await mountDrawer({}, { style: "transform: translateX(37px)" });
      expect(getComputedStyle(panel()).transform).toBe("none");
    });

    it("B: and on an open slideover", async () => {
      await reduce(true);
      await mountSlideover({ style: "transform: translateX(37px)" });
      expect(getComputedStyle(slidePanel()).transform).toBe("none");
    });

    it("B: a drag still follows the finger, and a snap point is still a resting place", async () => {
      await reduce(true);
      await mountDrawer({ snapPoints: [0.4, 1] });
      const shown = () => window.innerHeight - panel().getBoundingClientRect().top;
      expect(shown()).toBeCloseTo(window.innerHeight * 0.4, 0);
      const release = await drag(header(), 30, 500);
      await frames(2);
      expect(shown()).toBeCloseTo(window.innerHeight * 0.4 - 30, 0);
      release();
      await frames(3);
      expect(shown()).toBeCloseTo(window.innerHeight * 0.4, 0);
    });
  });
});
