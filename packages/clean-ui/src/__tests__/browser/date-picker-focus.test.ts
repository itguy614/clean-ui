import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import CuiDatePicker from "../../components/CuiDatePicker.vue";
import preflight from "../../styles/preflight.css?inline";

/**
 * #74 — opening the calendar has to actually move focus into the grid.
 *
 * This only fails in a real browser. CuiPopover renders its panel with
 * `visibility: hidden` until Floating UI positions it (#88), and `focus()` on a
 * `visibility: hidden` element is a silent no-op — so focus stayed in the input
 * and ArrowDown moved the text caret instead of the selected day. jsdom has no
 * such rule: it will happily focus a hidden element, so every jsdom test here
 * passed while the component was broken for real users.
 */
describe("CuiDatePicker focus hand-off (real browser)", () => {
  let wrapper: VueWrapper | undefined;

  beforeAll(() => {
    const style = document.createElement("style");
    style.textContent = `@layer theme, base, components, utilities;\n@layer base { ${preflight} }`;
    document.head.append(style);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  function mountPicker() {
    wrapper = mount(CuiDatePicker, {
      attachTo: document.body,
      props: { modelValue: "2026-03-15" },
    });
    return wrapper;
  }

  const frames = async (n: number) => {
    for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(() => r(null)));
  };
  const focusedCell = () => (document.activeElement as HTMLElement | null)?.dataset.cuiCell;

  it("moves focus into the grid when opened from the keyboard", async () => {
    mountPicker();
    const input = wrapper!.find("input").element as HTMLInputElement;
    input.focus();

    await userEvent.keyboard("{ArrowDown}");
    await frames(12);

    expect(document.querySelector('[role="grid"]')).toBeTruthy();
    expect(focusedCell(), "focus must leave the input for the grid").toBe("d:2026-2-15");
    expect(document.activeElement).not.toBe(input);
  });

  it("arrow keys then move the day, not the text caret", async () => {
    mountPicker();
    (wrapper!.find("input").element as HTMLInputElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    await frames(12);

    await userEvent.keyboard("{ArrowRight}");
    await frames(4);
    expect(focusedCell()).toBe("d:2026-2-16");

    await userEvent.keyboard("{ArrowDown}");
    await frames(4);
    expect(focusedCell()).toBe("d:2026-2-23");
  });

  it("moves focus into the grid when opened by click too", async () => {
    mountPicker();
    await userEvent.click(wrapper!.find("input").element);
    await frames(12);

    expect(focusedCell()).toBe("d:2026-2-15");
  });

  it("the focused cell is genuinely visible, not a hidden one", async () => {
    mountPicker();
    (wrapper!.find("input").element as HTMLInputElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    await frames(12);

    const cell = document.activeElement as HTMLElement;
    expect(getComputedStyle(cell).visibility).toBe("visible");
    expect(cell.getBoundingClientRect().width).toBeGreaterThan(0);
  });

  it("returns focus to the field on Escape", async () => {
    mountPicker();
    const input = wrapper!.find("input").element as HTMLInputElement;
    input.focus();
    await userEvent.keyboard("{ArrowDown}");
    await frames(12);
    expect(document.activeElement).not.toBe(input);

    await userEvent.keyboard("{Escape}");
    await frames(6);
    expect(document.activeElement).toBe(input);
  });
});
