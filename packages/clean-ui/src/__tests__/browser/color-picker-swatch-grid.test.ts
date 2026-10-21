import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import CuiColorPicker from "../../components/CuiColorPicker.vue";
import { frames } from "./helpers";

/**
 * #177 review — the swatches wrap into rows, so Up/Down move a row, as they look, rather
 * than one step like Left/Right. Real browser: the row length is measured from layout.
 */
describe("CuiColorPicker swatch grid (real browser)", () => {
  let w: VueWrapper | undefined;
  afterEach(() => {
    w?.unmount();
    w = undefined;
  });

  const PALETTE = Array.from({ length: 24 }, (_, i) => `#${(i * 10).toString(16).padStart(2, "0")}3366`);

  it("moves a row with Up/Down, a step with Left/Right, and stays put past an edge", async () => {
    w = mount(CuiColorPicker, { props: { modelValue: PALETTE[0], palette: PALETTE, swatchOnly: true }, attachTo: document.body });
    await frames(2);
    const swatches = [...document.querySelectorAll<HTMLElement>(".cui-color-picker__swatch")];
    const perRow = swatches.filter((s) => s.offsetTop === swatches[0].offsetTop).length;
    expect(perRow).toBeGreaterThan(1);
    expect(perRow).toBeLessThan(PALETTE.length); // it really wraps

    swatches[0].focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(swatches[perRow]);
    expect(swatches[perRow].getAttribute("aria-checked")).toBe("true"); // and selects it

    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(swatches[perRow + 1]);

    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(swatches[1]);

    await userEvent.keyboard("{ArrowUp}"); // top row: nowhere to go
    expect(document.activeElement).toBe(swatches[1]);
  });
});
