import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import main from "../../styles/main.css?inline";
import { frames, injectStyle, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";
import CuiModal from "../../components/CuiModal.vue";
import CuiSlideover from "../../components/CuiSlideover.vue";

/**
 * #407 — CuiModal and CuiSlideover forward a class onto their panel (#228), but wrote its
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
      .my-cap { max-width: 280px; }
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

  /** Mount open, wait for the overlay to render its panel into `<body>`, and return the panel. */
  async function open(component: typeof CuiModal | typeof CuiSlideover, props: Record<string, unknown>, attrs = {}) {
    fixtures.track(mount(component, { props: { visible: true, ...props }, attrs, slots: { default: "Body" } }));
    await frames(2);
    return [...document.querySelectorAll<HTMLElement>(PANEL.get(component)!)].at(-1)!; // the newest
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

    it("lets a forwarded max-width move the cap either way, as it could before", async () => {
      // The preset caps a full-width panel. A consumer who restyled the width through
      // max-width — the one override that worked while it was inline — must keep working.
      const wider = await open(CuiModal, { size: "200px" }, { style: "max-width: 300px" });
      expect(css(wider, "width")).toBe("300px");
      fixtures.cleanup();
      const narrower = await open(CuiModal, { size: "lg" }, { class: "my-cap" });
      expect(css(narrower, "width")).toBe("280px");
    });

    it("lets a token set on a container win over the props", async () => {
      document.body.style.cssText = "--cui-modal-width: 310px; --cui-modal-radius: 9px";
      const el = await open(CuiModal, { size: "lg", rounded: "md" });
      expect(css(el, "width")).toBe("310px");
      expect(css(el, "border-top-left-radius")).toBe("9px");
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
      document.body.style.cssText = "--cui-slideover-width: 310px; --cui-slideover-radius: 9px";
      const el = await open(CuiSlideover, { size: "lg" });
      expect(css(el, "width")).toBe("310px");
      expect(css(el, "border-top-left-radius")).toBe("9px");
    });

    it("keeps a width token off a top or bottom panel's height, and the reverse", async () => {
      // One token for both axes would turn a page-wide drawer width into every sheet's height.
      document.body.style.cssText = "--cui-slideover-width: 310px; --cui-slideover-height: 111px";
      const right = await open(CuiSlideover, { size: "lg" });
      const top = await open(CuiSlideover, { side: "top", size: "200px" });
      expect(css(right, "width")).toBe("310px");
      expect(css(right, "height")).not.toBe("111px");
      expect(css(top, "height")).toBe("111px");
    });
  });
});
