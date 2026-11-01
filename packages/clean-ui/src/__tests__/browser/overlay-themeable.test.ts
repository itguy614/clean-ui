import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import main from "../../styles/main.css?inline";
import { frames, injectStyle, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";
import CuiModal from "../../components/CuiModal.vue";
import CuiSlideover from "../../components/CuiSlideover.vue";

/**
 * #407 — CuiModal and CuiSlideover forward a class onto their panel (#404), but wrote its
 * width and radius as bare inline declarations, which outrank any stylesheet rule: the
 * forwarded class could not restyle them without `!important`. They now emit private
 * `--_modal-*` / `--_slideover-*` properties, read back through public tokens in
 * zero-specificity rules.
 *
 * Real browser, because every assertion is about the cascade and what `getComputedStyle`
 * resolves. Both overlays teleport to `<body>`, so `<body>` is the container a token is
 * inherited from.
 */
describe("CuiModal and CuiSlideover themeable properties (real browser)", () => {
  let removeTokens: () => void;
  let removeConsumer: () => void;

  beforeAll(() => {
    removeTokens = installTokens(main);
    removeConsumer = injectStyle(`
      .my-panel { width: 300px; max-width: none; border-radius: 7px; }
      .my-tall { height: 123px; border-radius: 7px; }`);
  });
  afterAll(() => {
    removeConsumer();
    removeTokens();
  });

  const PANEL = new Map<unknown, string>([
    [CuiModal, ".cui-modal"],
    [CuiSlideover, ".cui-slideover__panel"],
  ]);
  const fixtures = mountHosts();
  afterEach(() => {
    fixtures.cleanup();
    document.body.removeAttribute("style");
  });

  /** Mount open, and wait for the overlay to render its panel into `<body>`. */
  async function open(component: typeof CuiModal | typeof CuiSlideover, props: Record<string, unknown>, attrs = {}) {
    fixtures.track(mount(component, { props: { visible: true, ...props }, attrs, slots: { default: "Body" } }));
    await frames(2);
    return document.querySelector<HTMLElement>(PANEL.get(component)!)!;
  }

  const css = (el: Element, prop: string) => getComputedStyle(el).getPropertyValue(prop);

  describe("CuiModal", () => {
    it("resolves the size and rounded props when nothing overrides them", async () => {
      // A custom size: the test viewport is narrower than the named presets.
      const el = await open(CuiModal, { size: "250px", rounded: "lg" });
      expect(css(el, "width")).toBe("250px");
      expect(css(el, "border-top-left-radius")).toBe("8px"); // --cui-radius-lg fallback
    });

    it("lets a forwarded class restyle width and radius, with no !important", async () => {
      const el = await open(CuiModal, { size: "lg", rounded: "md" }, { class: "my-panel" });
      expect(el.classList.contains("my-panel")).toBe(true);
      expect(css(el, "width")).toBe("300px");
      expect(css(el, "border-top-left-radius")).toBe("7px");
    });

    it("lets a token set on a container win over the props", async () => {
      document.body.style.cssText = "--cui-modal-size: 310px; --cui-modal-radius: 9px";
      const el = await open(CuiModal, { size: "lg", rounded: "md" });
      expect(css(el, "width")).toBe("310px");
      expect(css(el, "border-top-left-radius")).toBe("9px");
    });

    it("still caps a large size at the viewport", async () => {
      const el = await open(CuiModal, { size: "5000px" });
      expect(el.getBoundingClientRect().width).toBeLessThan(window.innerWidth);
    });
  });

  describe("CuiSlideover", () => {
    it("resolves the size prop as a left or right panel's width", async () => {
      expect(css(await open(CuiSlideover, { size: "sm" }), "width")).toBe("320px"); // 20rem
    });

    it("resolves the size prop as a top or bottom panel's height", async () => {
      const top = await open(CuiSlideover, { side: "top", size: "200px" });
      expect(css(top, "height")).toBe("200px");
      expect(top.getBoundingClientRect().width).toBe(window.innerWidth);
    });

    it("lets a forwarded class restyle width and radius, with no !important", async () => {
      const el = await open(CuiSlideover, { size: "lg" }, { class: "my-panel" });
      expect(css(el, "width")).toBe("300px");
      expect(css(el, "border-top-left-radius")).toBe("7px");
    });

    it("lets a forwarded class restyle a top panel's height", async () => {
      const el = await open(CuiSlideover, { side: "top", size: "lg" }, { class: "my-tall" });
      expect(css(el, "height")).toBe("123px");
    });

    it("lets a token set on a container win over the size prop", async () => {
      document.body.style.cssText = "--cui-slideover-size: 310px; --cui-slideover-radius: 9px";
      const el = await open(CuiSlideover, { size: "lg" });
      expect(css(el, "width")).toBe("310px");
      expect(css(el, "border-top-left-radius")).toBe("9px");
    });
  });
});
