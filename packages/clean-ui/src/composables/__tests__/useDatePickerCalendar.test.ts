import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiDatePicker from "../../components/CuiDatePicker.vue";
import CuiDateRangePicker from "../../components/CuiDateRangePicker.vue";
import { buildMonthGrid } from "../../utils/date";

/**
 * #219 — the two pickers' calendar (view, grids, paging, keyboard wiring, focus handover)
 * lives once, in useDatePickerCalendar. The keyboard suites cover the day grid; these cover
 * the grid builder and the month and year grids both pickers render from it.
 */
describe("buildMonthGrid", () => {
  const none = () => false;

  it("pads a month to six full weeks, Sunday first", () => {
    // 1 October 2026 is a Thursday: four days of September lead in.
    const cells = buildMonthGrid(2026, 9, none);
    expect(cells).toHaveLength(42);
    expect(cells[0].date.toDateString()).toBe(new Date(2026, 8, 27).toDateString());
    expect(cells.slice(0, 4).every((c) => !c.inMonth)).toBe(true);
    expect(cells[4]).toMatchObject({ inMonth: true });
    expect(cells[4].date.getDate()).toBe(1);
    expect(cells.filter((c) => c.inMonth)).toHaveLength(31);
    expect(cells[41].date.toDateString()).toBe(new Date(2026, 10, 7).toDateString());
  });

  it("needs no lead-in for a month starting on a Sunday, and crosses the year", () => {
    // 1 February 2026 is a Sunday; December 2026's tail runs into January 2027.
    expect(buildMonthGrid(2026, 1, none)[0].date.getDate()).toBe(1);
    expect(buildMonthGrid(2026, 11, none)[41].date.getFullYear()).toBe(2027);
  });

  it("marks the disabled days", () => {
    const cells = buildMonthGrid(2026, 9, (d) => d.getDay() === 0);
    expect(cells.filter((c) => c.disabled)).toHaveLength(6);
  });
});

describe.each([
  { name: "CuiDatePicker", component: CuiDatePicker, modelValue: "2026-03-15" },
  { name: "CuiDateRangePicker", component: CuiDateRangePicker, modelValue: { start: "2026-03-15", end: null } },
])("$name's month and year grids", ({ component, modelValue }) => {
  let w: VueWrapper | undefined;
  afterEach(() => {
    w?.unmount();
    w = undefined;
  });

  async function open() {
    w = mount(component as never, { attachTo: document.body, props: { modelValue } });
    await w.find(".cui-popover > div").trigger("click");
    await w.vm.$nextTick();
    await w.vm.$nextTick();
  }
  const button = (text: string) =>
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.trim() === text)!;
  const cells = () => [...document.querySelectorAll<HTMLElement>("[data-cui-cell]")].map((c) => c.dataset.cuiCell);
  async function click(el: HTMLElement) {
    el.click();
    await w!.vm.$nextTick();
    await w!.vm.$nextTick();
  }

  it("opens the months grid from the month header, and goes back to that month's days", async () => {
    await open();
    await click(button("Mar"));
    expect(cells()).toHaveLength(12);
    expect(cells()[0]).toBe("m:0");
    await click(document.querySelector<HTMLElement>('[data-cui-cell="m:6"]')!);
    expect(cells()).toContain("d:2026-6-1");
  });

  it("pages the years grid twelve at a time", async () => {
    await open();
    await click(button("2026"));
    expect(cells()[0]).toBe("y:2016");
    expect(cells()).toHaveLength(12);
    // The page arrows flank the "2016 – 2027" title.
    const title = [...document.querySelectorAll("span")].find((el) => el.textContent?.trim() === "2016 – 2027")!;
    const [prev, next] = [title.previousElementSibling, title.nextElementSibling] as HTMLElement[];
    await click(next);
    expect(cells()[0]).toBe("y:2028");
    await click(prev);
    await click(prev);
    expect(cells()[0]).toBe("y:2004");
  });
});
