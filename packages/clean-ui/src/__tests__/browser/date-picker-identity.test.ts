import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import CuiDatePicker from "../../components/CuiDatePicker.vue";
import CuiDateRangePicker from "../../components/CuiDateRangePicker.vue";
import baseline from "./date-picker-identity.baseline.json";
import { frames, installTokens } from "../../../../../config/test/browser-helpers";

/**
 * #466 — CuiDatePicker and CuiDateRangePicker's paint moved from inline style objects to a
 * stylesheet. Nothing about how they look may change. `date-picker-identity.baseline.json`
 * holds the computed styles of every part, recorded from the inline-style implementation
 * (the tip of the #178 branch) BEFORE the conversion: each size in light and dark, the
 * months and years views, a label with compact density, a disabled range picker, and the
 * range's picking state. Real browser: jsdom computes none of this.
 */

const CELL = [
  "display", "align-items", "justify-content", "position", "width", "height",
  "border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius",
  "font-size", "font-weight", "color", "background-color", "opacity", "cursor",
  "outline-style", "outline-width", "outline-color", "padding-top", "padding-left", "text-align",
];
const FLEX = ["display", "align-items", "justify-content", "column-gap", "row-gap", "margin-bottom", "margin-top"];
const GRID = ["display", "grid-template-columns", "column-gap", "row-gap", "margin-bottom"];
const TEXT = ["font-size", "font-weight", "color", "text-align", "text-transform", "padding-top", "padding-bottom", "margin-bottom", "display", "line-height"];
const BTN = ["font-size", "font-weight", "color", "height", "padding-left", "background-color", "border-top-left-radius"];
const BOX = ["display", "padding-top", "padding-left", "min-width", "width"];
const TRIGGER = [
  "display", "align-items", "column-gap", "height", "padding-left", "padding-right", "border-top-width", "border-top-style",
  "border-top-color", "border-top-left-radius", "background-color", "opacity", "cursor",
];
const FIELD = ["border-top-width", "background-color", "outline-style", "color", "padding-left", "width", "cursor", "font-size"];

type Props = Record<string, unknown>;
interface Scenario { picker: "single" | "range"; props: Props; dark?: boolean; density?: string; view?: "days" | "months" | "years"; picking?: boolean }

const DISABLED = (d: Date) => d.getMonth() === 2 && d.getDate() === 20;
const SINGLE: Props = { modelValue: "2026-03-15", disabledDate: DISABLED };
const RANGE: Props = { modelValue: { start: "2026-03-12", end: "2026-03-18" }, disabledDate: DISABLED };

const SCENARIOS: Record<string, Scenario> = {};
for (const size of ["sm", "md", "lg"]) {
  for (const dark of [false, true]) {
    SCENARIOS[`single-${size}-${dark ? "dark" : "light"}`] = { picker: "single", props: { ...SINGLE, size }, dark };
    SCENARIOS[`range-${size}-${dark ? "dark" : "light"}`] = { picker: "range", props: { ...RANGE, size }, dark };
  }
}
for (const view of ["months", "years"] as const) {
  for (const dark of [false, true]) {
    SCENARIOS[`single-${view}-${dark ? "dark" : "light"}`] = { picker: "single", props: SINGLE, dark, view };
    SCENARIOS[`range-${view}-${dark ? "dark" : "light"}`] = { picker: "range", props: RANGE, dark, view };
  }
}
SCENARIOS["single-label-density"] = { picker: "single", props: { ...SINGLE, label: "Start" }, density: "0.75" };
SCENARIOS["range-label-density"] = { picker: "range", props: { ...RANGE, label: "Stay" }, density: "0.75" };
SCENARIOS["range-disabled"] = { picker: "range", props: { ...RANGE, disabled: true } };
SCENARIOS["range-picking"] = { picker: "range", props: RANGE, picking: true };
SCENARIOS["range-picking-dark"] = { picker: "range", props: RANGE, picking: true, dark: true };
SCENARIOS["single-no-today"] = { picker: "single", props: { ...SINGLE, highlightToday: false } };

const cell = (grid: Element, key: string) => grid.querySelector(`[data-cui-cell="${key}"]`);

function locate(root: HTMLElement, view: "days" | "months" | "years"): Record<string, [Element | null, string[]]> {
  const grid = document.querySelector('[role="grid"]');
  const out: Record<string, [Element | null, string[]]> = {
    root: [root, ["display", "opacity"]],
    label: [root.querySelector("label"), TEXT],
    trigger: [root.querySelector(".cui-date-range-picker__trigger"), TRIGGER],
    "field-start": [root.querySelector(".cui-date-range-picker__field"), FIELD],
    "field-end": [root.querySelectorAll(".cui-date-range-picker__field")[1] ?? null, FIELD],
    separator: [root.querySelector(".cui-date-range-picker__field")?.nextElementSibling ?? null, TEXT],
    "trigger-icon": [root.querySelector(".cui-date-range-picker__trigger > .cui-icon"), ["color", "flex-shrink", "width"]],
    "single-icon": [root.querySelector(".cui-masked-input .cui-icon, .cui-input .cui-icon"), ["color", "width"]],
  };
  // A disabled picker never opens: its trigger is all there is to measure.
  if (!grid) return out;
  Object.assign(out, { "panel-body": [grid.parentElement, BOX], grid: [grid, GRID], "cell-first": [grid.children[0], CELL] });
  if (view === "days") {
    const weekdays = grid.previousElementSibling!;
    const header = weekdays.previousElementSibling!;
    const before = header.previousElementSibling;
    Object.assign(out, {
      status: [before, TEXT],
      header: [header, FLEX],
      "header-nav": [header.children[0], BTN],
      "header-title": [header.children[1], FLEX],
      "header-title-btn": [header.children[1].children[0], BTN],
      weekdays: [weekdays, GRID],
      weekday: [weekdays.children[0], TEXT],
      "today-wrap": [grid.nextElementSibling, ["margin-top", "text-align"]],
      "today-btn": [grid.nextElementSibling?.firstElementChild ?? null, BTN],
      normal: [cell(grid, "d:2026-2-5"), CELL],
      today: [cell(grid, "d:2026-2-10"), CELL],
      selected: [cell(grid, "d:2026-2-15"), CELL],
      "range-start": [cell(grid, "d:2026-2-12"), CELL],
      "range-mid": [cell(grid, "d:2026-2-14"), CELL],
      "range-end": [cell(grid, "d:2026-2-18"), CELL],
      disabled: [cell(grid, "d:2026-2-20"), CELL],
      outside: [grid.children[grid.children.length - 1], CELL],
    });
  } else if (view === "months") {
    const header = grid.previousElementSibling!;
    Object.assign(out, {
      header: [header, FLEX],
      "header-title-btn": [header.children[1], BTN],
      "month-other": [grid.children[5], CELL],
      "month-current": [grid.children[2], CELL],
    });
  } else {
    const header = grid.previousElementSibling!;
    Object.assign(out, {
      header: [header, FLEX],
      "header-range": [header.children[1], TEXT],
      "year-other": [grid.children[0], CELL],
      "year-current": [grid.querySelector('[data-cui-cell$=":2026"]'), CELL],
      "year-selected-or-other": [grid.children[4], CELL],
    });
  }
  return out;
}

function snapshot(root: HTMLElement, view: "days" | "months" | "years") {
  const out: Record<string, Record<string, string>> = {};
  for (const [part, [el, props]] of Object.entries(locate(root, view))) {
    if (!el) continue;
    const cs = getComputedStyle(el);
    out[part] = Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
  }
  return out;
}

describe("CuiDatePicker and CuiDateRangePicker look the same as their inline-style implementation (#466, real browser)", () => {
  let teardown: () => void;
  beforeAll(() => {
    // `--cui-text-body` and friends are typography tokens, which main.css does not define.
    teardown = installTokens(`${main}
      :root { --cui-text-body: #1f2937; --cui-text-secondary: #4b5563; --cui-text-tertiary: #6b7280; }
      .dark { --cui-text-body: #e5e7eb; --cui-text-secondary: #9ca3af; --cui-text-tertiary: #6b7280; }
      /* Nothing may be caught mid-transition. */
      .cui-button { transition: none !important; }`);
  });
  afterAll(() => teardown());

  let wrapper: VueWrapper | undefined;
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.documentElement.classList.remove("dark");
    document.documentElement.style.removeProperty("--cui-density-scale");
    vi.useRealTimers();
  });

  const recorded = baseline as Record<string, Record<string, Record<string, string>>>;

  for (const [name, sc] of Object.entries(SCENARIOS)) {
    it(name, async () => {
      // Only Date: the browser's own animation frames must keep running.
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 2, 10, 12));
      if (sc.dark) document.documentElement.classList.add("dark");
      if (sc.density) document.documentElement.style.setProperty("--cui-density-scale", sc.density);

      wrapper = mount(sc.picker === "single" ? CuiDatePicker : CuiDateRangePicker, { props: sc.props, attachTo: document.body });
      const root = wrapper.element as HTMLElement;
      if (!sc.props.disabled) {
        (root.querySelector("input") as HTMLInputElement).focus();
        await userEvent.keyboard("{ArrowDown}");
        await frames(14);
      }

      const view = sc.view ?? "days";
      if (view !== "days") {
        const header = document.querySelector('[role="grid"]')!.previousElementSibling!.previousElementSibling!;
        const buttons = header.querySelectorAll<HTMLElement>(".cui-button");
        buttons[view === "months" ? 1 : 2].click();
        await frames(4);
      }
      if (sc.picking) {
        const grid = document.querySelector('[role="grid"]')!;
        await userEvent.click(cell(grid, "d:2026-2-12") as HTMLElement);
        await userEvent.hover(cell(grid, "d:2026-2-18") as HTMLElement);
        await frames(4);
      }

      const actual = snapshot(root, view);
      // To re-record, empty the baseline: this prints each scenario's snapshot before failing.
      if (!recorded[name]) console.log(`BASELINE ${JSON.stringify({ [name]: actual })}`);
      expect(recorded[name], `no recorded baseline for ${name}`).toBeDefined();
      expect(actual).toEqual(recorded[name]);
    });
  }
});
