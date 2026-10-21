import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount, flushPromises, type VueWrapper } from "@vue/test-utils";
import { h } from "vue";
import main from "../../styles/main.css?inline";
import CuiTooltip from "../../components/CuiTooltip.vue";

/**
 * #211 — CuiTooltip wrote a coloured tooltip's `background` and `color` inline, so only
 * `!important` could restyle it. Its paint is private `--_tooltip-*` tokens now, read back
 * through `:where()`: a plain `.cui-tooltip` rule wins, and so does a page-level
 * `--cui-tooltip-bg`. (A container's token can't reach it: it teleports to <body>.)
 */
describe("CuiTooltip themeable properties (real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens";
    style.textContent = main;
    document.head.append(style);
  });
  afterAll(() => document.getElementById("cui-tokens")?.remove());

  let w: VueWrapper | undefined;
  afterEach(() => {
    w?.unmount();
    document.getElementById("consumer")?.remove();
    document.documentElement.style.removeProperty("--cui-tooltip-bg");
  });

  async function tooltip(props: Record<string, unknown> = {}) {
    w = mount(CuiTooltip, {
      props: { text: "Tip", visible: true, ...props },
      slots: { default: () => h("button", "Trigger") },
      attachTo: document.body,
    });
    await flushPromises();
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    return document.querySelector<HTMLElement>(".cui-tooltip")!;
  }
  const probe = (value: string) => {
    const el = document.createElement("div");
    el.style.background = value;
    document.body.append(el);
    const out = getComputedStyle(el).backgroundColor;
    el.remove();
    return out;
  };

  it("paints the default tooltip as the inverted surface, and the arrow with it", async () => {
    const tip = await tooltip();
    expect(getComputedStyle(tip).backgroundColor).toBe(probe("var(--color-surface-900)"));
    const arrow = tip.querySelector(".cui-tooltip__arrow")!;
    expect(arrow).not.toBeNull();
    expect(getComputedStyle(arrow).backgroundColor).toBe(probe("var(--color-surface-900)"));
  });

  it("uses the dark inverted surface in dark mode", async () => {
    document.documentElement.classList.add("dark");
    try {
      const tip = await tooltip();
      expect(getComputedStyle(tip).backgroundColor).toBe(probe("var(--color-surface-700)"));
    } finally {
      document.documentElement.classList.remove("dark");
    }
  });

  it("paints a coloured tooltip in its role", async () => {
    const tip = await tooltip({ color: "error" });
    expect(getComputedStyle(tip).backgroundColor).toBe(probe("var(--cui-error)"));
  });

  it("yields to a plain consumer rule, without !important", async () => {
    const style = document.createElement("style");
    style.id = "consumer";
    style.textContent = ".cui-tooltip { background: rgb(1, 2, 3); }";
    document.head.append(style);
    const tip = await tooltip({ color: "error" });
    expect(getComputedStyle(tip).backgroundColor).toBe("rgb(1, 2, 3)");
  });

  it("takes a page-level --cui-tooltip-bg", async () => {
    document.documentElement.style.setProperty("--cui-tooltip-bg", "rgb(4, 5, 6)");
    const tip = await tooltip();
    expect(getComputedStyle(tip).backgroundColor).toBe("rgb(4, 5, 6)");
    // The arrow follows the tooltip's background, override included.
    expect(getComputedStyle(tip.querySelector(".cui-tooltip__arrow")!).backgroundColor).toBe("rgb(4, 5, 6)");
  });
});
