import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiDatePicker from "../CuiDatePicker.vue";
import CuiDateRangePicker from "../CuiDateRangePicker.vue";
import CuiTimePicker from "../CuiTimePicker.vue";

/**
 * #391 — the pickers' `label` prop rendered a <label> with no `for`, naming nothing; the
 * TimePicker's steppers were unnamed spinbuttons; and the DateRangePicker's end input was
 * an unnamed tab stop that ignored every key.
 */
let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  document.body.innerHTML = "";
});

/** The accessible name aria-labelledby gives `el`: its ids' text, in order. */
const nameOf = (el: Element) =>
  (el.getAttribute("aria-labelledby") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent?.trim())
    .join(" ");

describe("picker labels name their controls", () => {
  it("CuiDatePicker's input is named by its label, and keeps a consumer's labelledby", () => {
    document.body.insertAdjacentHTML("beforeend", '<span id="extra">(optional)</span>');
    w = mount(CuiDatePicker, { props: { label: "Due date", ariaLabelledby: "extra" }, attachTo: document.body });
    expect(nameOf(w.find("input").element)).toBe("Due date (optional)");
  });

  it("CuiDateRangePicker's inputs are each named, and the end input takes keys", async () => {
    w = mount(CuiDateRangePicker, { props: { label: "Stay" }, attachTo: document.body });
    const [start, end] = w.findAll("input");
    expect(nameOf(start.element)).toBe("Stay Start date");
    expect(nameOf(end.element)).toBe("Stay End date");
    await end.trigger("keydown", { key: "ArrowDown" });
    expect(document.querySelector(".cui-popover__panel, [role='dialog']"), "the end input opens the calendar too").not.toBeNull();
  });

  it("CuiDateRangePicker returns focus to the end field when it opened the calendar", async () => {
    w = mount(CuiDateRangePicker, { props: { label: "Stay" }, attachTo: document.body });
    const end = w.findAll("input")[1];
    (end.element as HTMLInputElement).focus();
    await end.trigger("focus");
    await end.trigger("keydown", { key: "ArrowDown" });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    for (let i = 0; i < 3; i++) await new Promise((r) => requestAnimationFrame(r));
    expect(document.activeElement).toBe(end.element);
  });

  it("CuiTimePicker's trigger is named by its label, and its steppers are hours and minutes", async () => {
    w = mount(CuiTimePicker, { props: { label: "Start time" }, attachTo: document.body });
    const trigger = w.find('[role="combobox"]');
    expect(nameOf(trigger.element)).toBe("Start time");
    await trigger.trigger("keydown", { key: "ArrowDown" });
    const spinners = [...document.querySelectorAll('[role="spinbutton"]')];
    expect(spinners.map(nameOf)).toEqual(["Hours", "Minutes"]);
  });

  it("adds no labelledby when there's no label", () => {
    w = mount(CuiDatePicker, { attachTo: document.body });
    expect(w.find("input").attributes("aria-labelledby")).toBeUndefined();
  });
});
