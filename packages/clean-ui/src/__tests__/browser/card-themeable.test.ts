import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import main from "../../styles/main.css?inline";
import CuiCard from "../../components/CuiCard.vue";
import CuiCardHeader from "../../components/CuiCardHeader.vue";
import CuiCardBody from "../../components/CuiCardBody.vue";

/**
 * #115 — Card's sub-components wrote padding, background and border into inline styles,
 * so theming one meant `!important` on every declaration plus a class threaded through
 * every call site. Same two routes as CuiButton now: set the token, or write a plain rule.
 *
 * Real browser — the cascade and `var()` resolution are the subject, and jsdom models
 * neither.
 */
describe("CuiCard themeable properties (real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens";
    style.textContent = main;
    document.head.append(style);
  });

  afterAll(() => document.getElementById("cui-tokens")?.remove());

  const fixtures: HTMLElement[] = [];
  afterEach(() => {
    fixtures.splice(0).forEach((el) => el.remove());
  });

  function host(style = "") {
    const el = document.createElement("div");
    el.setAttribute("style", style);
    document.body.append(el);
    fixtures.push(el);
    return el;
  }

  const paint = (el: Element, prop: string) => getComputedStyle(el).getPropertyValue(prop);

  it("resolves the computed variant values when nothing overrides them", () => {
    const elevated = mount(CuiCard, { props: { variant: "elevated" }, attachTo: host() });
    const ghost = mount(CuiCard, { props: { variant: "ghost" }, attachTo: host() });

    expect(paint(elevated.element, "box-shadow")).not.toBe("none");
    expect(paint(ghost.element, "box-shadow")).toBe("none");
    expect(paint(ghost.element, "background-color")).toBe("rgba(0, 0, 0, 0)");
  });

  it("lets a token on an ancestor win over the computed value", () => {
    const w = mount(CuiCard, { attachTo: host("--cui-card-bg: rgb(1, 2, 3)") });
    expect(paint(w.element, "background-color")).toBe("rgb(1, 2, 3)");
  });

  it("lets a plain consumer rule win, with no !important", () => {
    const consumer = document.createElement("style");
    consumer.textContent = ".cui-card { background: rgb(4, 5, 6); }";
    document.head.append(consumer);

    const w = mount(CuiCard, { attachTo: host() });
    expect(paint(w.element, "background-color")).toBe("rgb(4, 5, 6)");

    consumer.remove();
  });

  describe("sub-component padding", () => {
    // The exact complaint in #115: `.card-header { padding: … !important }`, needed because
    // the padding was inline. It is a stylesheet default now, so a token just replaces it.
    it("is overridable on the header", () => {
      const w = mount(CuiCardHeader, { props: { title: "T" }, attachTo: host("--cui-card-header-padding: 3px 4px") });
      expect(paint(w.element, "padding-top")).toBe("3px");
      expect(paint(w.element, "padding-left")).toBe("4px");
    });

    it("is overridable on the body", () => {
      const w = mount(CuiCardBody, { attachTo: host("--cui-card-body-padding: 7px") });
      expect(paint(w.element, "padding-top")).toBe("7px");
    });

    it("still honours noPadding", () => {
      const w = mount(CuiCardBody, { props: { noPadding: true }, attachTo: host() });
      expect(paint(w.element, "padding-top")).toBe("0px");
    });

    it("applies a real default when no token is set", () => {
      const w = mount(CuiCardBody, { attachTo: host() });
      expect(parseFloat(paint(w.element, "padding-left"))).toBeGreaterThan(0);
    });
  });

  it("gives the header's inner elements their own hooks", () => {
    // They had no classes at all, so there was nothing to select even once the root had one.
    const w = mount(CuiCardHeader, {
      props: { title: "Title", subtitle: "Sub" },
      attachTo: host("--cui-card-title-color: rgb(9, 8, 7)"),
    });

    const title = w.element.querySelector(".cui-card-header__title")!;
    expect(title).not.toBeNull();
    expect(w.element.querySelector(".cui-card-header__subtitle")).not.toBeNull();
    expect(paint(title, "color")).toBe("rgb(9, 8, 7)");
  });
});
