import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { defineComponent, h } from "vue";
import main from "../../styles/main.css?inline";
import CuiList from "../../components/CuiList.vue";
import CuiListItem from "../../components/CuiListItem.vue";

/**
 * #234 — an inset list's subtitle must hold WCAG AAA (7:1) on the list fill and under the
 * hover fill, in light and dark, in every theme. The hand-rolled version this replaces used
 * a surface-600 grey and measured 3.4:1.
 *
 * Measured from what the browser actually paints — the component's own defaults resolved
 * through each theme's scale — rather than from a copy of the token mapping, so changing the
 * subtitle's default colour, the fill, or the hover fill is caught here.
 */
const THEMES = ["navy", "forest", "amber", "azure", "teal", "violet", "ruby", "mono"];

/** sRGB bytes of any CSS colour the browser understands (oklch included), via a canvas. */
let canvas: CanvasRenderingContext2D | undefined;
function rgb(color: string): [number, number, number] {
  const ctx = (canvas ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true })!);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

function luminance([r, g, b]: [number, number, number]) {
  const lin = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(fg: string, bg: string) {
  const [a, b] = [luminance(rgb(fg)), luminance(rgb(bg))].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

describe("CuiList subtitle contrast (real browser)", () => {
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
    document.documentElement.classList.remove("dark");
  });

  for (const mode of ["light", "dark"] as const) {
    for (const theme of THEMES) {
      it(`holds 7:1 on the fill and under hover: ${theme}, ${mode}`, async () => {
        if (mode === "dark") document.documentElement.classList.add("dark");
        const host = document.createElement("div");
        host.className = `cui-theme-${theme}`;
        document.body.append(host);
        fixtures.push(host);

        const w = mount(
          defineComponent({
            render: () =>
              h(CuiList, { variant: "inset" }, () => h(CuiListItem, { title: "Printer", subtitle: "Ready", onClick: () => {} })),
          }),
          { attachTo: host },
        );
        const item = w.element.querySelector<HTMLElement>(".cui-list-item")!;
        const row = item.querySelector<HTMLElement>(".cui-list-item__row")!;
        const subtitle = getComputedStyle(item.querySelector(".cui-list-item__subtitle")!).color;

        const fill = getComputedStyle(item).backgroundColor;
        expect(contrast(subtitle, fill)).toBeGreaterThanOrEqual(7);

        await userEvent.hover(row);
        const hover = getComputedStyle(row).backgroundColor;
        // The hover fill really is painted, and is not the resting fill.
        expect(rgb(hover)).not.toEqual(rgb(fill));
        expect(contrast(subtitle, hover)).toBeGreaterThanOrEqual(7);
        await userEvent.unhover(row);
      });
    }
  }
});
