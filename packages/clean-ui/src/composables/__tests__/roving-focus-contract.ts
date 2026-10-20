import { describe, it, expect, afterEach } from "vitest";
import type { VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";

/**
 * The shared roving-focus contract (#144). Every component built on `useRovingFocus` runs
 * it, so a component that hand-rolls its own arrow keys instead fails the same assertions:
 *
 * ```ts
 * describeRovingFocusContract("CuiStepper", {
 *   mount: () => mount(CuiStepper, { props: …, attachTo: document.body }),
 *   items: () => [...document.querySelectorAll<HTMLElement>(".cui-stepper__step")],
 *   orientation: "horizontal",
 * });
 * ```
 */
export interface RovingFocusContractOptions {
  /** Mount the component, attached to document.body, with at least three enabled items. */
  mount: () => VueWrapper;
  /** The component's items, in order. */
  items: () => HTMLElement[];
  orientation: "horizontal" | "vertical";
  /** Whether the component wraps at the ends. Default `false`. */
  wrap?: boolean;
}

/** Dispatch a keydown on the focused element (or `target`); resolves to the event, after a tick. */
export async function press(key: string, target: Element | null = document.activeElement) {
  const e = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  (target ?? document.body).dispatchEvent(e);
  await nextTick();
  return e;
}

export function describeRovingFocusContract(name: string, opts: RovingFocusContractOptions) {
  const forward = opts.orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
  const back = opts.orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
  let wrapper: VueWrapper | undefined;

  describe(`${name}: roving focus contract`, () => {
    afterEach(() => {
      wrapper?.unmount();
      wrapper = undefined;
    });

    it("has exactly one tab stop into the group", async () => {
      wrapper = opts.mount();
      await nextTick();
      expect(opts.items().filter((el) => el.tabIndex === 0)).toHaveLength(1);
      expect(opts.items().filter((el) => el.tabIndex === -1)).toHaveLength(opts.items().length - 1);
    });

    it("moves focus with the arrow keys, and the tab stop follows", async () => {
      wrapper = opts.mount();
      await nextTick();
      const start = opts.items().find((el) => el.tabIndex === 0)!;
      start.focus();
      const at = opts.items().indexOf(start);
      await press(forward);
      expect(document.activeElement).toBe(opts.items()[at + 1]);
      expect(opts.items()[at + 1].tabIndex).toBe(0);
      expect(start.tabIndex).toBe(-1);
      await press(back);
      expect(document.activeElement).toBe(start);
    });

    it("reaches the ends with Home and End", async () => {
      wrapper = opts.mount();
      await nextTick();
      opts.items().find((el) => el.tabIndex === 0)!.focus();
      await press("End");
      expect(document.activeElement).toBe(opts.items().at(-1));
      await press("Home");
      expect(document.activeElement).toBe(opts.items()[0]);
    });

    it(opts.wrap ? "wraps to the start on an arrow at the end" : "stays on the last item on an arrow at the end", async () => {
      wrapper = opts.mount();
      await nextTick();
      opts.items().find((el) => el.tabIndex === 0)!.focus();
      await press("End");
      const e = await press(forward);
      // Swallowed either way, so the page doesn't scroll under the group.
      expect(e.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(opts.wrap ? opts.items()[0] : opts.items().at(-1));
    });
  });
}
