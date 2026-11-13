import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick } from "vue";
import main from "../../styles/main.css?inline";
import CuiBadge from "../../components/CuiBadge.vue";
import CuiFieldset from "../../components/CuiFieldset.vue";
import CuiPopover from "../../components/CuiPopover.vue";
import { installTokens } from "../../../../../config/test/browser-helpers";

/**
 * #294 — Badge, Fieldset and Popover wrote background, border, colour and radius as inline
 * declarations, so restyling one meant `!important`. Same two routes as CuiButton now: set the
 * `--cui-<component>-<slot>` token, or write a plain rule.
 *
 * A popover's panel is teleported to <body>, so its tokens go on :root or <body>: a token on
 * the trigger's container never reaches it (the date picker's panel is the same).
 *
 * Real browser: the cascade and `var()` resolution are the subject.
 */
describe("Badge, Fieldset and Popover themeable properties (real browser)", () => {
  // The colour scale is stubbed: an unresolved `var()` voids a whole `border` shorthand.
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(main)));
  afterAll(() => teardown());

  const wrappers: VueWrapper[] = [];
  const nodes: HTMLElement[] = [];
  afterEach(() => {
    wrappers.splice(0).forEach((w) => w.unmount());
    nodes.splice(0).forEach((n) => n.remove());
    document.documentElement.removeAttribute("style");
  });

  const host = (style = "") => {
    const el = document.createElement("div");
    el.setAttribute("style", style);
    document.body.append(el);
    nodes.push(el);
    return el;
  };
  const plainRule = (css: string) => {
    const el = document.createElement("style");
    el.textContent = css;
    document.head.append(el);
    nodes.push(el);
  };
  const paint = (el: Element, prop: string) => getComputedStyle(el).getPropertyValue(prop);

  const badge = (props: Record<string, unknown>, style = "") => {
    const el = host(style);
    wrappers.push(mount(CuiBadge, { props, slots: { default: () => "New" }, attachTo: el }));
    return el.querySelector<HTMLElement>(".cui-badge")!;
  };
  const fieldset = (props: Record<string, unknown>, style = "") => {
    const el = host(style);
    wrappers.push(mount(CuiFieldset, { props: { legend: "L", ...props }, slots: { default: () => "Body" }, attachTo: el }));
    return el.querySelector<HTMLElement>(".cui-fieldset")!;
  };
  async function popover(props: Record<string, unknown> = {}) {
    const w = mount(CuiPopover, {
      props: { visible: true, title: "T", ...props },
      slots: { default: () => h("button", "Open"), content: () => "Body" },
      attachTo: host(),
    });
    wrappers.push(w);
    await nextTick();
    await new Promise((r) => setTimeout(r, 120));
    const q = (sel: string) => document.querySelector<HTMLElement>(sel)!;
    return { panel: q(".cui-popover__panel"), arrow: q(".cui-popover__arrow"), body: q(".cui-popover__body") };
  }

  describe("CuiBadge", () => {
    it("lets a token on an ancestor win, slot by slot", () => {
      const el = badge({ variant: "solid" }, "--cui-badge-bg: rgb(1, 2, 3); --cui-badge-color: rgb(4, 5, 6); --cui-badge-border: 2px dashed rgb(7, 8, 9); --cui-badge-radius: 3px");
      expect(paint(el, "background-color")).toBe("rgb(1, 2, 3)");
      expect(paint(el, "color")).toBe("rgb(4, 5, 6)");
      expect(paint(el, "border-top-width")).toBe("2px");
      expect(paint(el, "border-top-style")).toBe("dashed");
      expect(paint(el, "border-top-color")).toBe("rgb(7, 8, 9)");
      expect(paint(el, "border-top-left-radius")).toBe("3px");
    });

    it("lets a plain consumer rule win, with no !important", () => {
      plainRule(".cui-badge { background: rgb(4, 5, 6); color: rgb(7, 8, 9); border: 3px solid rgb(1, 1, 1); border-radius: 2px; }");
      const el = badge({ variant: "solid", rounded: "full" });
      expect(paint(el, "background-color")).toBe("rgb(4, 5, 6)");
      expect(paint(el, "color")).toBe("rgb(7, 8, 9)");
      expect(paint(el, "border-top-width")).toBe("3px");
      expect(paint(el, "border-top-left-radius")).toBe("2px");
    });

    it("keeps the variant's own paint when nothing overrides it", () => {
      const solid = badge({ variant: "solid", color: "error" });
      expect(paint(solid, "background-color")).not.toBe("rgba(0, 0, 0, 0)");
      const outline = badge({ variant: "outline" });
      expect(paint(outline, "background-color")).toBe("rgba(0, 0, 0, 0)");
    });

    it("leaves a dot unpainted by the token: it has no fill or border of its own", () => {
      const el = host("--cui-badge-bg: rgb(1, 2, 3); --cui-badge-border: 2px solid red");
      wrappers.push(mount(CuiBadge, { props: { dot: true }, attachTo: el }));
      const dot = el.querySelector(".cui-badge")!;
      expect(paint(dot, "background-color")).toBe("rgba(0, 0, 0, 0)");
      expect(paint(dot, "border-top-width")).toBe("0px");
    });
  });

  describe("CuiFieldset", () => {
    it("lets a token on an ancestor win, slot by slot", () => {
      const el = fieldset({ variant: "subtle" }, "--cui-fieldset-bg: rgb(1, 2, 3); --cui-fieldset-border: 3px dotted rgb(7, 8, 9); --cui-fieldset-radius: 5px");
      expect(paint(el, "background-color")).toBe("rgb(1, 2, 3)");
      expect(paint(el, "border-top-width")).toBe("3px");
      expect(paint(el, "border-top-style")).toBe("dotted");
      expect(paint(el, "border-top-left-radius")).toBe("5px");
    });

    it("lets a plain consumer rule win, with no !important", () => {
      plainRule(".cui-fieldset { background: rgb(4, 5, 6); border: 4px solid rgb(1, 1, 1); border-radius: 2px; }");
      const el = fieldset({ variant: "subtle" });
      expect(paint(el, "background-color")).toBe("rgb(4, 5, 6)");
      expect(paint(el, "border-top-width")).toBe("4px");
      expect(paint(el, "border-top-left-radius")).toBe("2px");
    });

    it("keeps each variant's own paint when nothing overrides it", () => {
      expect(paint(fieldset({ variant: "ghost" }), "border-top-style")).toBe("none");
      expect(paint(fieldset({ variant: "outline" }), "border-top-style")).toBe("solid");
      expect(paint(fieldset({ variant: "outline" }), "background-color")).toBe("rgba(0, 0, 0, 0)");
      expect(paint(fieldset({ variant: "subtle", color: "primary" }), "background-color")).not.toBe("rgba(0, 0, 0, 0)");
    });
  });

  describe("CuiPopover", () => {
    it("lets a token on :root win, and the arrow follows the panel's fill and border", async () => {
      document.documentElement.setAttribute("style", "--cui-popover-bg: rgb(1, 2, 3); --cui-popover-border: 2px solid rgb(7, 8, 9); --cui-popover-radius: 5px; --cui-popover-color: rgb(4, 5, 6)");
      const { panel, arrow, body } = await popover();
      expect(paint(panel, "background-color")).toBe("rgb(1, 2, 3)");
      expect(paint(panel, "border-top-width")).toBe("2px");
      expect(paint(panel, "border-top-color")).toBe("rgb(7, 8, 9)");
      expect(paint(panel, "border-top-left-radius")).toBe("5px");
      expect(paint(arrow, "background-color")).toBe("rgb(1, 2, 3)");
      expect(paint(arrow, "border-top-color")).toBe("rgb(7, 8, 9)");
      expect(paint(body, "color")).toBe("rgb(4, 5, 6)");
    });

    it("does not see a token set on the trigger's container: the panel is teleported", async () => {
      const w = mount(CuiPopover, {
        props: { visible: true },
        slots: { default: () => h("button", "Open"), content: () => "Body" },
        attachTo: host("--cui-popover-bg: rgb(1, 2, 3)"),
      });
      wrappers.push(w);
      await nextTick();
      await new Promise((r) => setTimeout(r, 120));
      expect(paint(document.querySelector(".cui-popover__panel")!, "background-color")).not.toBe("rgb(1, 2, 3)");
    });

    it("takes its width from --cui-popover-width over the width prop's preset", async () => {
      document.documentElement.setAttribute("style", "--cui-popover-width: 15rem");
      const { panel } = await popover({ width: "320px" });
      expect(paint(panel, "width")).toBe("240px");
    });

    it("lets a plain consumer rule win, with no !important", async () => {
      plainRule(".cui-popover__panel { background: rgb(4, 5, 6); border: 3px solid rgb(1, 1, 1); border-radius: 2px; }");
      const { panel } = await popover();
      expect(paint(panel, "background-color")).toBe("rgb(4, 5, 6)");
      expect(paint(panel, "border-top-width")).toBe("3px");
      expect(paint(panel, "border-top-left-radius")).toBe("2px");
    });

    it("keeps the width prop and the default fill when nothing overrides them", async () => {
      const { panel } = await popover({ width: "320px" });
      expect(paint(panel, "width")).toBe("320px");
      expect(paint(panel, "background-color")).not.toBe("rgba(0, 0, 0, 0)");
    });
  });
});
