import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import CuiButton from "../../components/CuiButton.vue";

/**
 * #114 — the two override routes CuiButton now promises.
 *
 * Real browser, because every assertion here is about the cascade and about what
 * `getComputedStyle` resolves. jsdom models neither: it does not apply stylesheets by
 * specificity, and it does not resolve `var()`.
 */
describe("CuiButton themeable properties (real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens";
    // The `--color-*` scale normally comes from the Tailwind `@theme` in theme.css, which
    // only exists after the engine has processed it. This injects raw CSS, so the at-rule
    // is inert and every `--cui-primary: var(--color-primary-500)` would resolve to
    // nothing. Stubbing the two steps the solid variant reads is enough.
    style.textContent = `${main}
      :root {
        --color-primary-500: rgb(10, 20, 30);
        --color-primary-600: rgb(11, 21, 31);
        --color-primary-700: rgb(12, 22, 32);
      }
      /* CuiButton transitions background over 0.15s, so the computed value immediately
         after a hover is the start of the interpolation, not the target. */
      .cui-button { transition: none !important; }`;
    document.head.append(style);
  });

  afterAll(() => document.getElementById("cui-tokens")?.remove());

  const fixtures: HTMLElement[] = [];
  afterEach(() => {
    fixtures.splice(0).forEach((el) => el.remove());
  });

  /** Mount a button into a host div carrying `hostStyle`, so ancestor overrides are testable. */
  function render(props: Record<string, unknown> = {}, hostStyle = "") {
    const host = document.createElement("div");
    host.setAttribute("style", hostStyle);
    document.body.append(host);
    fixtures.push(host);
    const wrapper = mount(CuiButton, { props, slots: { default: "Go" }, attachTo: host });
    return wrapper.element as HTMLElement;
  }

  const paint = (el: Element, prop: string) => getComputedStyle(el).getPropertyValue(prop);

  it("resolves the computed variant value when nothing overrides it", () => {
    const solid = render({ variant: "solid", color: "primary" });
    const ghost = render({ variant: "ghost", color: "primary" });

    expect(paint(solid, "background-color")).not.toBe("rgba(0, 0, 0, 0)");
    expect(paint(ghost, "background-color")).toBe("rgba(0, 0, 0, 0)");
  });

  it("lets a token set on an ancestor win over the computed value", () => {
    // The reason the component emits PRIVATE properties inline: an inline custom property
    // would beat this inherited one, and the container override would silently do nothing.
    const el = render({ variant: "solid" }, "--cui-button-bg: rgb(1, 2, 3)");
    expect(paint(el, "background-color")).toBe("rgb(1, 2, 3)");
  });

  it("lets a plain consumer rule win, with no !important", () => {
    // The second half of #114: the component's themeable rules are inside `:where()`, so
    // they are (0,0,0) despite the scoped `[data-v-…]` attribute, and this (0,1,0) rule
    // beats them. Before, an inline declaration made this unreachable at any specificity.
    const consumer = document.createElement("style");
    consumer.textContent = ".cui-button { background: rgb(4, 5, 6); }";
    document.head.append(consumer);

    const el = render({ variant: "solid" });
    expect(paint(el, "background-color")).toBe("rgb(4, 5, 6)");

    consumer.remove();
  });

  it("applies the hover token, which used to need !important", async () => {
    const el = render({ variant: "solid" }, "--cui-button-hover-bg: rgb(7, 8, 9)");
    await userEvent.hover(el);
    expect(paint(el, "background-color")).toBe("rgb(7, 8, 9)");
  });

  describe("inside a .cui-typography scope", () => {
    // Zero-specificity rules lose to any *other* rule that matches the element, and the
    // typography layer styles bare `a`. A solid link button drew its label in exactly its
    // own background colour until the link rule learned to skip `cui-*` elements.
    function proseHost(html: string) {
      const host = document.createElement("div");
      host.className = "cui-typography";
      host.innerHTML = html;
      document.body.append(host);
      fixtures.push(host);
      return host;
    }

    it("a link button keeps its own colour and no underline", () => {
      const host = proseHost("");
      const wrapper = mount(CuiButton, {
        props: { href: "/x", variant: "solid" },
        slots: { default: "Go" },
        attachTo: host,
      });
      const el = wrapper.element as HTMLElement;

      expect(paint(el, "color")).toBe("rgb(255, 255, 255)");
      expect(paint(el, "color")).not.toBe(paint(el, "background-color"));
      expect(getComputedStyle(el).textDecorationLine).toBe("none");
    });

    it("but an ordinary prose link is still styled", () => {
      const host = proseHost('<a href="/x" id="prose">Read more</a>');
      const link = host.querySelector("#prose")!;

      expect(getComputedStyle(link).textDecorationLine).toBe("underline");
      expect(paint(link, "color")).toBe("rgb(10, 20, 30)"); // --cui-text-link → primary-500
    });
  });

  describe("the target-size floor", () => {
    // `max(var(--cui-control-min-target, 24px), calc(…))` only binds at xs + compact.
    const COMPACT_XS = "--cui-density-scale: 0.8";

    it("holds an xs button at 24px under compact density", () => {
      const el = render({ size: "xs" }, COMPACT_XS);
      expect(paint(el, "height")).toBe("24px");
    });

    it("relaxes when a container lowers the minimum", () => {
      const el = render({ size: "xs" }, `${COMPACT_XS}; --cui-control-min-target: 0px`);
      expect(parseFloat(paint(el, "height"))).toBeCloseTo(22.4, 1);
    });

    it("relaxes for an icon button, which opts out on its own", () => {
      const el = render({ size: "xs", icon: true }, COMPACT_XS);
      expect(parseFloat(paint(el, "height"))).toBeCloseTo(22.4, 1);
      expect(paint(el, "padding-left")).toBe("0px");
    });
  });
});
