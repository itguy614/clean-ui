import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { h, defineComponent } from "vue";
import CuiDatePicker from "../../components/CuiDatePicker.vue";
import CuiTimePicker from "../../components/CuiTimePicker.vue";
import { frames } from "./helpers";

/**
 * Two pickers on one page. Opening the second closes the first, and a close
 * hands focus back to its own field — so without a guard the first picker
 * reclaims focus *after* the second has taken it, leaving the focus ring on the
 * previous field while a different picker's panel is open.
 *
 * Real browser: this is entirely about which element ends up as
 * `document.activeElement` after a real click, and about the ordering of a
 * click-outside close against another component's open.
 */
describe("focus hand-over between pickers (real browser)", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  // Spaced apart so the first panel does not physically cover the second field.
  const TwoDatePickers = defineComponent({
    setup: () => () =>
      h("div", { style: "display: flex; gap: 420px; padding: 20px" }, [
        h(CuiDatePicker, { id: "a", modelValue: "2026-03-15" }),
        h(CuiDatePicker, { id: "b", modelValue: "2026-05-20" }),
      ]),
  });

  const DatePickerThenTimePicker = defineComponent({
    setup: () => () =>
      h("div", { style: "display: flex; gap: 420px; padding: 20px" }, [
        h(CuiDatePicker, { id: "a", modelValue: "2026-03-15" }),
        h(CuiTimePicker, { id: "t", modelValue: "09:30", format: "24" }),
      ]),
  });

  const activeCell = () => (document.activeElement as HTMLElement | null)?.dataset.cuiCell;
  const field = (id: string) => document.querySelector<HTMLInputElement>(`#${id}`)!;

  it("moves the focus ring to the picker that is actually open", async () => {
    wrapper = mount(TwoDatePickers, { attachTo: document.body });
    await frames(2);

    await userEvent.click(field("a"));
    await frames(14);
    expect(activeCell(), "first picker takes focus").toBe("d:2026-2-15");

    await userEvent.click(field("b"));
    await frames(14);

    // Exactly one panel, and focus inside it — not left behind on field A.
    expect(document.querySelectorAll('[role="grid"]')).toHaveLength(1);
    expect(activeCell(), "focus must follow the panel that is open").toBe("d:2026-4-20");
    expect(document.activeElement).not.toBe(field("a"));
  });

  it("does not steal focus across component types either", async () => {
    wrapper = mount(DatePickerThenTimePicker, { attachTo: document.body });
    await frames(2);

    await userEvent.click(field("a"));
    await frames(14);
    expect(activeCell()).toBe("d:2026-2-15");

    await userEvent.click(document.querySelector<HTMLElement>(".cui-time-picker__trigger")!);
    await frames(14);

    const active = document.activeElement as HTMLElement;
    expect(document.querySelector('[role="grid"]'), "the calendar should have closed").toBeNull();
    expect(active, "focus must not have snapped back to the date field").not.toBe(field("a"));
    expect(
      document.querySelector(".cui-time-picker__panel")?.contains(active) ||
        active.classList.contains("cui-time-picker__trigger"),
      "focus should be on the time picker",
    ).toBe(true);
  });

  it("still hands focus back when the close orphaned it", async () => {
    // The guard must not break the normal case: Escape closes the panel, focus
    // falls to <body>, and nothing else has claimed it — so it is ours to take.
    wrapper = mount(TwoDatePickers, { attachTo: document.body });
    await frames(2);

    await userEvent.click(field("a"));
    await frames(14);
    await userEvent.keyboard("{Escape}");
    await frames(10);

    expect(document.activeElement).toBe(field("a"));
  });
});
