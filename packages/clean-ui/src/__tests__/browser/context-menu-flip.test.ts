import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h } from "vue";
import CuiContextMenu from "../../components/CuiContextMenu.vue";
import CuiDropdownItem from "../../components/CuiDropdownItem.vue";
import preflight from "../../styles/preflight.css?inline";

// #95 — `positionAtCursor` clamped maxHeight to the space *below* the cursor
// before measuring, so `rect.bottom > vh - padding` could never be true and the
// flip-up branch was dead code. Right-clicking near the bottom squashed the menu
// into the remaining sliver and scrolled it instead of flipping up.
//
// Real Chromium (see vitest.config.ts): the whole bug is a layout measurement,
// and jsdom reports 0 for every offset and rect, so it cannot fail this.
describe("CuiContextMenu flip-up (real browser)", () => {
  let wrapper: VueWrapper | undefined;

  beforeAll(() => {
    // The panel's `max-height` has to bound its border box for the positioning
    // math to land on the cursor, and no component sets `box-sizing` itself —
    // they all inherit `border-box` from the scoped base. Without it here the
    // panel overshoots by its own padding and border, which is a real bug in a
    // consumer's app too, just not this component's to fix.
    const style = document.createElement("style");
    style.textContent = `@layer theme, base, components, utilities;\n@layer base {\n${preflight}\n}`;
    document.head.append(style);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  const PADDING = 16;
  const MAX_PANEL_HEIGHT = 400;

  /** Mount a menu with `count` items and right-click at (x, y). */
  async function openAt(count: number, x: number, y: number) {
    wrapper = mount(CuiContextMenu, {
      attachTo: document.body,
      slots: {
        default: () => h("div", { style: "width: 200px; height: 40px" }, "target"),
        menu: () =>
          Array.from({ length: count }, (_, i) =>
            h(CuiDropdownItem, { key: i }, () => `Item ${i + 1}`),
          ),
      },
    });

    await wrapper.find(".cui-context-menu").trigger("contextmenu", { clientX: x, clientY: y });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const panel = document.querySelector<HTMLElement>(".cui-context-menu__panel")!;
    expect(panel, "panel should be open").toBeTruthy();
    return panel;
  }

  const box = (panel: HTMLElement) => ({
    top: parseFloat(panel.style.top),
    left: parseFloat(panel.style.left),
    maxHeight: parseFloat(panel.style.maxHeight),
    height: panel.offsetHeight,
  });

  it("opens downward from the cursor when there is room", async () => {
    const panel = await openAt(4, 100, 50);
    const { top, height } = box(panel);

    expect(top).toBe(50);
    expect(top + height).toBeLessThanOrEqual(window.innerHeight - PADDING);
  });

  it("flips up when the menu does not fit below", async () => {
    // Right-click 80px from the bottom with a menu far taller than that.
    const y = window.innerHeight - 80;
    const panel = await openAt(8, 100, y);
    const { top, height } = box(panel);

    // The bug: it stayed at `top === y` and squashed into the sliver below.
    expect(top).toBeLessThan(y);
    // Bottom anchored to the cursor, so the first item is still by the pointer.
    expect(top + height).toBeCloseTo(y, 0);
    expect(top).toBeGreaterThanOrEqual(PADDING);
  });

  it("does not squash the menu when it flips", async () => {
    const y = window.innerHeight - 80;
    const flipped = await openAt(8, 100, y);
    const flippedHeight = flipped.offsetHeight;
    wrapper!.unmount();

    const roomy = await openAt(8, 100, 50);
    expect(flippedHeight).toBe(roomy.offsetHeight);
    // ...and it is genuinely taller than the space that was below the cursor.
    expect(flippedHeight).toBeGreaterThan(80);
  });

  it("stays visible and within the viewport at the very bottom edge", async () => {
    const panel = await openAt(8, 100, window.innerHeight - 4);
    const { top, height } = box(panel);

    expect(getComputedStyle(panel).visibility).toBe("visible");
    expect(top).toBeGreaterThanOrEqual(PADDING);
    expect(top + height).toBeLessThanOrEqual(window.innerHeight);
  });

  it("scrolls on the roomier side when it fits neither, still anchored to the cursor", async () => {
    // Enough items to exceed the cap, clicked just past the middle so "above"
    // is the roomier side.
    const y = Math.round(window.innerHeight * 0.6);
    const panel = await openAt(60, 100, y);
    const { top, maxHeight, height } = box(panel);

    expect(maxHeight).toBeLessThanOrEqual(MAX_PANEL_HEIGHT);
    expect(panel.scrollHeight).toBeGreaterThan(height);
    expect(top + height).toBeCloseTo(y, 0);
    expect(top).toBeGreaterThanOrEqual(PADDING);
  });

  it("never exceeds the height cap even with room to spare", async () => {
    const panel = await openAt(60, 100, 20);
    expect(box(panel).maxHeight).toBe(MAX_PANEL_HEIGHT);
  });

  it("flips left far enough to keep the viewport padding", async () => {
    // Also the guard on measuring with layout offsets rather than a rect: the
    // panel animates in from `transform: scale(0.95)`, and a rect reports the
    // transformed box, so measuring the width on the first tick reads ~5%
    // narrow. Flipping by that short width leaves the panel hanging over the
    // right edge — by less than the padding, which is why it looks almost right.
    const x = window.innerWidth - 20;
    const panel = await openAt(4, x, 50);
    const { left } = box(panel);

    expect(left).toBeLessThan(x);
    expect(left + panel.offsetWidth).toBeLessThanOrEqual(window.innerWidth - PADDING);
  });

  it("settles where it was placed once the animation finishes", async () => {
    const y = window.innerHeight - 80;
    const panel = await openAt(8, 100, y);
    const { top, left } = box(panel);

    await new Promise((resolve) => setTimeout(resolve, 200));
    const rect = panel.getBoundingClientRect();
    expect(rect.top).toBeCloseTo(top, 0);
    expect(rect.left).toBeCloseTo(left, 0);
    expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
  });
});
