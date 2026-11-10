import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import CuiTimePicker from "../../components/CuiTimePicker.vue";
import baseline from "./time-picker-identity.baseline.json";
import { frames, installTokens } from "../../../../../config/test/browser-helpers";

/**
 * #489 — CuiTimePicker's paint moved from inline style objects to a stylesheet. Nothing about
 * how it looks may change. `time-picker-identity.baseline.json` holds the computed styles of
 * every part, recorded from the inline-style implementation (the tip of the #484 branch)
 * BEFORE the conversion: each size in light and dark, both formats, an empty and a disabled
 * trigger, a label under compact density, AM and PM pressed, and the AM/PM buttons disabled by
 * a minTime/maxTime. Real browser: jsdom computes none of this.
 */

const TRIGGER = [
  "display", "align-items", "column-gap", "height", "padding-left", "padding-right", "border-top-width", "border-top-style",
  "border-top-color", "border-top-left-radius", "background-color", "cursor", "opacity", "font-size", "color", "min-width",
];
const TEXT = ["display", "margin-bottom", "font-size", "font-weight", "color", "line-height"];
const ICON = ["color", "flex-shrink", "width"];
const PANEL = ["display", "align-items", "column-gap", "padding-top", "padding-left"];
const SEP = ["font-size", "font-weight", "color", "line-height"];
const PERIODS = ["display", "flex-direction", "row-gap", "margin-left"];
const PERIOD = ["font-weight", "color", "background-color", "border-top-left-radius", "min-width", "opacity", "cursor"];

type Props = Record<string, unknown>;
interface Scenario { props: Props; dark?: boolean; density?: string; open?: boolean }

const SCENARIOS: Record<string, Scenario> = {};
for (const size of ["xs", "sm", "md", "lg", "xl"]) {
  for (const dark of [false, true]) {
    SCENARIOS[`${size}-${dark ? "dark" : "light"}`] = { props: { modelValue: "03:30 PM", size }, dark, open: true };
  }
}
SCENARIOS["24h-open"] = { props: { modelValue: "15:30", format: "24" }, open: true };
SCENARIOS["24h-closed"] = { props: { modelValue: "15:30", format: "24" } };
SCENARIOS["12h-closed"] = { props: { modelValue: "03:30 PM" } };
SCENARIOS["empty-closed"] = { props: { modelValue: "" } };
SCENARIOS["empty-closed-dark"] = { props: { modelValue: "" }, dark: true };
SCENARIOS["disabled"] = { props: { modelValue: "03:30 PM", disabled: true } };
SCENARIOS["label-density"] = { props: { modelValue: "03:30 PM", label: "Start" }, density: "0.75", open: true };
SCENARIOS["am-pressed"] = { props: { modelValue: "09:15 AM" }, open: true };
SCENARIOS["am-pressed-dark"] = { props: { modelValue: "09:15 AM" }, open: true, dark: true };
SCENARIOS["period-disabled"] = { props: { modelValue: "09:15 AM", minTime: "08:00 AM", maxTime: "11:00 AM" }, open: true };
SCENARIOS["period-disabled-dark"] = { props: { modelValue: "09:15 AM", minTime: "08:00 AM", maxTime: "11:00 AM" }, open: true, dark: true };

type Located = Record<string, [Element | null, string[]]>;

function locate(root: HTMLElement): Located {
  const trigger = root.querySelector(".cui-time-picker__trigger");
  const panel = document.querySelector(".cui-time-picker__panel");
  const periods = panel?.querySelectorAll(".cui-time-picker__period");
  return {
    root: [root, ["display"]],
    label: [root.querySelector("label"), TEXT],
    trigger: [trigger, TRIGGER],
    "trigger-icon": [trigger?.querySelector(".cui-icon") ?? null, ICON],
    "trigger-text": [trigger?.querySelector(":scope > span:last-child") ?? null, ["font-size", "color", "line-height"]],
    panel: [panel ?? null, PANEL],
    separator: [panel?.querySelector(":scope > span:not([hidden])") ?? null, SEP],
    "periods-wrap": [periods?.[0]?.parentElement ?? null, PERIODS],
    "period-am": [periods?.[0] ?? null, PERIOD],
    "period-pm": [periods?.[1] ?? null, PERIOD],
  };
}

function snapshot(located: Located) {
  const out: Record<string, Record<string, string>> = {};
  for (const [part, [el, props]] of Object.entries(located)) {
    if (!el) continue;
    const cs = getComputedStyle(el);
    out[part] = Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
  }
  return out;
}

describe("CuiTimePicker looks the same as its inline-style implementation (#489, real browser)", () => {
  let teardown: () => void;
  beforeAll(() => {
    teardown = installTokens(`${main}
      :root { --cui-text-body: #1f2937; --cui-text-secondary: #4b5563; --cui-text-tertiary: #6b7280;
        /* The dark primary reads these steps, which the helper's scale leaves out. */
        --color-primary-200: #c7d2fe; --color-primary-400: #818cf8; --color-primary-800: #312e81; }
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
      if (sc.dark) document.documentElement.classList.add("dark");
      if (sc.density) document.documentElement.style.setProperty("--cui-density-scale", sc.density);
      wrapper = mount(CuiTimePicker, { props: sc.props, attachTo: document.body });
      const root = wrapper.element as HTMLElement;
      if (sc.open) {
        (root.querySelector(".cui-time-picker__trigger") as HTMLElement).focus();
        await userEvent.keyboard("{ArrowDown}");
        await frames(14);
      } else {
        await frames(2);
      }

      const actual = snapshot(locate(root));
      // To re-record, empty the baseline: this prints each scenario's snapshot before failing.
      if (!recorded[name]) console.log(`BASELINE ${JSON.stringify({ [name]: actual })}`);
      expect(recorded[name], `no recorded baseline for ${name}`).toBeDefined();
      expect(actual).toEqual(recorded[name]);
    });
  }
});
