import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import main from "../../styles/main.css?inline";
import { installTokens } from "./helpers";
import CuiBanner from "../../components/CuiBanner.vue";

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
    const el = banner({ inline: true });

    expect(sides(el)).toEqual(["1px", "1px", "1px", "1px"]);
    expect(parseFloat(css(el).borderTopLeftRadius)).toBeGreaterThan(0);
  });

  it("leaves the sticky flow when inline, so position no longer applies", () => {
    const el = banner({ inline: true, position: "bottom" });

    expect(css(el).position).toBe("static");
    // A sticky banner sets the named edge to 0; an inline one leaves it alone.
    expect(css(el).bottom).toBe("auto");
  });

  it("composes with the colour treatment rather than replacing it", () => {
    // The reason `inline` is a boolean and not a `variant` value: an inline banner must
    // still be able to be solid.
    const solid = banner({ inline: true, variant: "solid", color: "error" });
    const subtle = banner({ inline: true, variant: "subtle", color: "error" });

    expect(css(solid).backgroundColor).not.toBe(css(subtle).backgroundColor);
  });

  it("lets a plain consumer rule restyle it, with no !important", () => {
    // #120's actual complaint: the banner wrote its box inline, so a card-local restyle
    // needed `!important` on every declaration.
    const consumer = document.createElement("style");
    consumer.textContent = ".cui-banner { background: rgb(1, 2, 3); border-radius: 10px; }";
    document.head.append(consumer);

    const el = banner({ inline: true });
    expect(css(el).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(css(el).borderTopLeftRadius).toBe("10px");

    consumer.remove();
  });
});
