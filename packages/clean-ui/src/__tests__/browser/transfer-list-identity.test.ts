import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import main from "../../styles/main.css?inline";
import CuiTransferList from "../../components/CuiTransferList.vue";
import baseline from "./transfer-list-identity.baseline.json";

/**
 * #469 — CuiTransferList's paint moved from inline style objects to a stylesheet. Nothing
 * about how it looks may change. `transfer-list-identity.baseline.json` holds the computed
 * styles of every part, recorded from the inline-style implementation (develop at 1.9.0)
 * BEFORE the conversion: each size in light and dark, plus disabled, compact-density,
 * unfiltered, empty and mid-drag variants. Real browser: jsdom computes none of this.
 */

const BOX = ["display", "flex-direction", "flex-grow", "flex-shrink", "align-items", "justify-content", "column-gap", "row-gap", "min-width"];
const PAD = ["padding-top", "padding-right", "padding-bottom", "padding-left"];
const TEXT = ["font-size", "font-weight", "line-height", "color", "text-transform", "letter-spacing", "text-align", "opacity"];
const FRAME = ["border-top-width", "border-top-style", "border-top-color", "border-bottom-width", "border-bottom-color", "border-top-left-radius", "border-bottom-left-radius", "background-color", "outline-style", "outline-width", "outline-color", "outline-offset"];
const OPTION = [...BOX, ...PAD, ...TEXT, ...FRAME, "cursor", "user-select"];
const PARTS: Record<string, string[]> = {
  root: [...BOX, "opacity"],
  panel: [...BOX, ...FRAME, "overflow-x", "overflow-y"],
  header: [...BOX, ...PAD],
  title: [...TEXT],
  count: [...TEXT],
  "filter-wrap": [...PAD],
  scroller: [...BOX, ...PAD, "overflow-y", "max-height", "border-bottom-left-radius", "border-top-left-radius", "outline-style", "outline-color", "outline-width", "outline-offset"],
  "scroller-target": ["outline-style", "outline-color", "outline-width", "outline-offset", "border-bottom-left-radius"],
  listbox: ["display"],
  "option-normal": OPTION,
  "option-selected": OPTION,
  "option-disabled": OPTION,
  "option-focused": FRAME,
  "option-drop": FRAME,
  grip: ["flex-shrink", "color", "cursor", "opacity", "width"],
  "item-icon": ["flex-shrink", "color", "width"],
  "item-body": ["flex-grow", "min-width"],
  label: ["line-height", "font-size"],
  description: ["font-size", "color", "line-height"],
  empty: [...PAD, "text-align", "font-size", "color"],
  actions: [...BOX, ...PAD],
  button: ["height", "width"],
  gap: ["height"],
};

type Scenario = { props: Record<string, unknown>; mode: "light" | "dark"; density?: string; drag?: boolean };
const ITEMS = [
  { value: 1, label: "Alpha", description: "First item", icon: "caret-right" },
  { value: 2, label: "Beta" },
  { value: 3, label: "Gamma", disabled: true },
  { value: 4, label: "Delta" },
  { value: 5, label: "Epsilon" },
];
const BASE = { items: ITEMS, modelValue: [5] };
const SCENARIOS: Record<string, Scenario> = {};
for (const size of ["xs", "sm", "md", "lg", "xl"]) {
  for (const mode of ["light", "dark"] as const) SCENARIOS[`${size}-${mode}`] = { props: { ...BASE, size }, mode };
}
SCENARIOS["disabled-md-light"] = { props: { ...BASE, disabled: true }, mode: "light" };
SCENARIOS["density-md-light"] = { props: { ...BASE }, mode: "light", density: "0.75" };
SCENARIOS["unfiltered-md-light"] = { props: { ...BASE, filterable: false, height: "200px" }, mode: "light" };
SCENARIOS["empty-md-dark"] = { props: { items: [], modelValue: [] }, mode: "dark" };
SCENARIOS["drag-md-light"] = { props: { ...BASE }, mode: "light", drag: true };
SCENARIOS["drag-md-dark"] = { props: { ...BASE }, mode: "dark", drag: true };

function locate(root: HTMLElement): Record<string, Element | null> {
  const [source, actions, target] = [...root.children] as HTMLElement[];
  const header = source.children[0];
  const scroller = source.lastElementChild!;
  const listbox = scroller.querySelector("[role=listbox]")!;
  const options = [...listbox.querySelectorAll("[role=option]")];
  const targetScroller = target.lastElementChild!;
  const hasFilter = source.children.length === 3;
  const withIcon = options[0] ?? null;
  return {
    root,
    panel: source,
    header,
    title: header.children[0],
    count: header.children[1],
    "filter-wrap": hasFilter ? source.children[1] : null,
    scroller,
    "scroller-target": targetScroller,
    listbox,
    "option-normal": options.find((o) => o.getAttribute("aria-selected") === "false" && o.getAttribute("aria-disabled") !== "true" && o !== options[0]) ?? null,
    "option-selected": options.find((o) => o.getAttribute("aria-selected") === "true") ?? null,
    "option-disabled": options.find((o) => o.getAttribute("aria-disabled") === "true") ?? null,
    "option-focused": options[0] ?? null,
    "option-drop": targetScroller.querySelector("[role=option]"),
    grip: withIcon?.children[0] ?? null,
    "item-icon": withIcon && withIcon.children.length > 2 ? withIcon.children[1] : null,
    "item-body": withIcon?.lastElementChild ?? null,
    label: withIcon?.lastElementChild?.children[0] ?? null,
    description: withIcon?.lastElementChild?.children[1] ?? null,
    empty: [...scroller.children].find((c) => c !== listbox) ?? null,
    actions,
    button: actions.querySelector("button"),
    gap: [...actions.children].find((c) => c.tagName === "DIV" && c.getAttribute("aria-hidden") === "true") ?? null,
  };
}

function snapshot(root: HTMLElement) {
  const out: Record<string, Record<string, string>> = {};
  for (const [part, el] of Object.entries(locate(root))) {
    if (!el || !PARTS[part]) continue;
    const cs = getComputedStyle(el);
    out[part] = Object.fromEntries(PARTS[part].map((p) => [p, cs.getPropertyValue(p)]));
  }
  return out;
}

describe("CuiTransferList looks the same as its inline-style implementation (#469, real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens-469";
    // Tailwind emits only the theme variables a build uses, so the raw stylesheet leaves the scale
    // undefined: give the steps these tokens read. Dark takes its own from main.css's `.dark`
    // blocks. The text tokens are typography tokens. No transitions, so a computed value is the target.
    style.textContent = `${main}
      :root { --color-surface-500: oklch(0.7 0.01 270); --color-surface-600: oklch(0.6 0.012 270);
        --color-primary-500: oklch(0.5 0.2 270); --color-primary-300: oklch(0.75 0.12 270); --color-primary-100: oklch(0.93 0.04 270);
        --cui-text-body: #1f2937; --cui-text-secondary: #4b5563; --cui-text-tertiary: #6b7280; }
      .dark { --cui-text-body: #e5e7eb; --cui-text-secondary: #9ca3af; --cui-text-tertiary: #6b7280; }
      * { transition: none !important; }`;
    document.head.append(style);
  });
  afterAll(() => document.getElementById("cui-tokens-469")?.remove());

  const wrappers: VueWrapper[] = [];
  const hosts: HTMLElement[] = [];
  afterEach(() => {
    wrappers.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((h) => h.remove());
  });

  const recorded = baseline as Record<string, Record<string, Record<string, string>>>;

  for (const [name, { props, mode, density, drag }] of Object.entries(SCENARIOS)) {
    it(name, async () => {
      const host = document.createElement("div");
      if (mode === "dark") host.className = "dark";
      if (density) host.style.setProperty("--cui-density-scale", density);
      document.body.append(host);
      hosts.push(host);
      const wrapper = mount(CuiTransferList, { props, attachTo: host });
      wrappers.push(wrapper);
      await nextTick();
      const root = host.querySelector<HTMLElement>(".cui-transfer-list")!;
      const [source, , target] = [...root.children] as HTMLElement[];
      const sourceOptions = () => [...source.querySelectorAll<HTMLElement>("[role=option]")];
      if (!drag && !props.disabled && sourceOptions().length) {
        // Beta (the second option) marked for transfer; Alpha takes keyboard focus.
        sourceOptions()[1].click();
        await nextTick();
        sourceOptions()[0].focus();
        await nextTick();
      }
      if (drag) {
        const dt = new DataTransfer();
        sourceOptions()[1].dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: dt }));
        await nextTick();
        const targetScroller = target.lastElementChild!;
        targetScroller.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt }));
        const targetOption = targetScroller.querySelector<HTMLElement>("[role=option]")!;
        const r = targetOption.getBoundingClientRect();
        targetOption.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt, clientY: r.top + 1 }));
        await nextTick();
      }
      const actual = snapshot(root);
      // To re-record, empty the baseline: this prints each scenario's snapshot before failing.
      if (!recorded[name]) console.log(`BASELINE ${JSON.stringify({ [name]: actual })}`);
      expect(recorded[name], `no recorded baseline for ${name}`).toBeDefined();
      expect(actual).toEqual(recorded[name]);
    });
  }
});
