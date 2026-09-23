import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import main from "../../styles/main.css?inline";
import { installTokens } from "./helpers";
import CuiBanner from "../../components/CuiBanner.vue";
import CuiButton from "../../components/CuiButton.vue";

/**
 * #120 — `CuiBanner` assumed it was pinned to a page edge: a `border-bottom` with no
 * radius, which inside a padded card renders as a stray coloured line with square corners
 * against rounded surroundings. `inline` takes it out of the sticky flow and closes the
 * box instead.
 *
 * Real browser: sticky positioning, a border shorthand built from custom properties, and
 * resolved radii are all things jsdom does not model.
 */
describe("CuiBanner inline (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => {
    removeTokens = installTokens(main);
  });
  afterAll(() => removeTokens());

  const mounted: Array<{ unmount: () => void }> = [];
  const hosts: HTMLElement[] = [];
  afterEach(() => {
    mounted.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((h) => h.remove());
  });

  function banner(props: Record<string, unknown> = {}) {
    const host = document.createElement("div");
    host.style.width = "420px";
    document.body.append(host);
    hosts.push(host);
    const w = mount(CuiBanner, { props, slots: { default: () => "Heads up" }, attachTo: host });
    mounted.push(w);
    return w.element as HTMLElement;
  }

  const css = (el: HTMLElement) => getComputedStyle(el);
  const sides = (el: HTMLElement) => {
    const c = css(el);
    return [c.borderTopWidth, c.borderRightWidth, c.borderBottomWidth, c.borderLeftWidth];
  };

  it("pins to the named edge by default, as it always has", () => {
    // The `top` default is kept deliberately: `inline` is how you say "not pinned", so
    // dropping it would give two ways to express the same thing.
    const top = banner();
    expect(css(top).position).toBe("sticky");
    expect(css(top).top).toBe("0px");
    expect(sides(top)).toEqual(["0px", "0px", "1px", "0px"]);
  });

  it("draws a rule only against the edge it sits on", () => {
    // `top` is the default and is covered above; this is the other edge.
    expect(sides(banner({ position: "bottom" }))).toEqual(["1px", "0px", "0px", "0px"]);
  });

  it("closes the box and rounds the corners when inline", () => {
    const el = banner({ position: "inline" });

    expect(sides(el)).toEqual(["1px", "1px", "1px", "1px"]);
    expect(parseFloat(css(el).borderTopLeftRadius)).toBeGreaterThan(0);
  });

  it("leaves the sticky flow when inline", () => {
    // `inline` is a value of `position`, not a second prop beside it — so there is no
    // `inline + position="bottom"` combination to define, and no offset to clear.
    const el = banner({ position: "inline" });

    expect(css(el).position).toBe("static");
    expect(css(el).top).toBe("auto");
    expect(css(el).bottom).toBe("auto");
  });

  it("composes with the colour treatment rather than replacing it", () => {
    // The reason `inline` is a boolean and not a `variant` value: an inline banner must
    // still be able to be solid.
    const solid = banner({ position: "inline", variant: "solid", color: "error" });
    const subtle = banner({ position: "inline", variant: "subtle", color: "error" });

    expect(css(solid).backgroundColor).not.toBe(css(subtle).backgroundColor);
  });

  it("lets a plain consumer rule restyle it, with no !important", () => {
    // #120's actual complaint: the banner wrote its box inline, so a card-local restyle
    // needed `!important` on every declaration.
    const consumer = document.createElement("style");
    consumer.textContent = ".cui-banner { background: rgb(1, 2, 3); border-radius: 10px; }";
    document.head.append(consumer);

    const el = banner({ position: "inline" });
    expect(css(el).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(css(el).borderTopLeftRadius).toBe("10px");

    consumer.remove();
  });
});

describe("the shared radius scale (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => {
    removeTokens = installTokens(main);
  });
  afterAll(() => removeTokens());

  const hosts: HTMLElement[] = [];
  const mounted: Array<{ unmount: () => void }> = [];
  afterEach(() => {
    mounted.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((h) => h.remove());
  });

  function inlineBanner(hostStyle = "") {
    const host = document.createElement("div");
    host.setAttribute("style", hostStyle);
    document.body.append(host);
    hosts.push(host);
    const w = mount(CuiBanner, { props: { position: "inline" }, slots: { default: () => "x" }, attachTo: host });
    mounted.push(w);
    return w.element as HTMLElement;
  }

  it("moves every component's corners together", () => {
    // Component radius tokens alias the scale rather than each other — a banner used to
    // default to `--cui-card-radius`, so its corners tracked a component it may sit
    // nowhere near (#141).
    const el = inlineBanner("--cui-radius-lg: 13px");
    expect(getComputedStyle(el).borderTopLeftRadius).toBe("13px");
  });

  it("still lets one component be moved on its own", () => {
    const el = inlineBanner("--cui-radius-lg: 13px; --cui-banner-radius: 3px");
    expect(getComputedStyle(el).borderTopLeftRadius).toBe("3px");
  });

  it("reaches components that alias it through their own token", () => {
    // `--cui-button-radius` is now an alias for `--cui-radius-md`, so moving the scale
    // moves buttons too — that is what makes it shared rather than a fourth token.
    const host = document.createElement("div");
    host.setAttribute("style", "--cui-radius-md: 9px");
    document.body.append(host);
    hosts.push(host);
    const w = mount(CuiButton, { props: { rounded: "md" }, slots: { default: () => "Go" }, attachTo: host });
    mounted.push(w);

    expect(getComputedStyle(w.element as HTMLElement).borderTopLeftRadius).toBe("9px");
  });

  it("no longer follows the card's radius", () => {
    const el = inlineBanner("--cui-card-radius: 20px");
    expect(getComputedStyle(el).borderTopLeftRadius).not.toBe("20px");
  });
});
