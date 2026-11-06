import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import main from "../../styles/main.css?inline";
import CuiColorPicker from "../../components/CuiColorPicker.vue";
import baseline from "./color-picker-identity.baseline.json";

/**
 * #467 — CuiColorPicker's paint moved from inline style objects to a stylesheet. Nothing
 * about how it looks may change. `color-picker-identity.baseline.json` holds the computed
 * styles of every part, recorded from the inline-style implementation (develop at 1.9.0)
 * BEFORE the conversion: for each size in light and dark, plus the swatch-only, disabled
 * and compact-density variants. Real browser: jsdom computes none of this.
 */

const BOX = ["width", "height", "padding-top", "padding-left", "row-gap", "column-gap"];
const FRAME = ["border-top-width", "border-top-style", "border-top-color", "border-top-left-radius", "border-bottom-left-radius", "background-color"];
/** Part -> the computed properties that matter for it. */
const PARTS: Record<string, string[]> = {
  root: [...BOX, ...FRAME, "opacity", "pointer-events", "user-select", "display"],
  gradient: ["position", "width", "height", "overflow", "cursor", "touch-action", "background-color", "border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius"],
  "overlay-white": ["position", "top", "right", "bottom", "left", "background-image"],
  "overlay-black": ["position", "top", "right", "bottom", "left", "background-image"],
  "thumb-sat": [...BOX, ...FRAME, "position", "left", "top", "transform", "pointer-events", "box-shadow", "border-top-left-radius"],
  "thumb-val": [...BOX, ...FRAME, "position", "left", "top", "transform", "pointer-events", "box-shadow", "border-top-left-radius"],
  body: [...BOX, "display", "flex-direction"],
  row: ["display", "align-items", "column-gap", "row-gap"],
  preview: [...BOX, ...FRAME, "flex-shrink", "position", "overflow", "background-image", "border-top-left-radius"],
  "preview-fill": ["position", "top", "left", "right", "bottom", "background-color", "border-top-left-radius"],
  sliders: ["flex-grow", "display", "flex-direction", "row-gap"],
  hue: ["position", "height", "cursor", "touch-action", "background-image", "border-top-left-radius"],
  "thumb-hue": [...BOX, ...FRAME, "position", "left", "top", "transform", "pointer-events", "box-shadow", "background-color", "border-top-left-radius"],
  alpha: ["position", "height", "cursor", "touch-action", "overflow", "background-image", "border-top-left-radius"],
  "alpha-fill": ["position", "top", "left", "right", "bottom", "background-image", "border-top-left-radius"],
  "thumb-alpha": [...BOX, ...FRAME, "position", "left", "top", "transform", "pointer-events", "box-shadow", "background-color", "border-top-left-radius"],
  "input-row": ["display", "align-items", "column-gap"],
  "swatch-preview": [...BOX, ...FRAME, "flex-shrink", "border-top-left-radius"],
  input: ["flex-grow", "padding-top", "padding-right", "padding-bottom", "padding-left", "font-size", "font-family", "border-top-width", "border-top-style", "border-top-color", "border-top-left-radius", "background-color", "color", "outline-style", "min-width"],
  format: ["flex-shrink", "font-family", "font-size", "font-weight", "min-width", "height"],
  swatches: ["display", "flex-wrap", "column-gap", "row-gap"],
  "swatch-first": [...BOX, "border-top-left-radius", "background-color", "cursor", "border-top-width", "border-top-color", "box-shadow", "padding-top"],
  "swatch-selected": [...BOX, "border-top-left-radius", "background-color", "cursor", "border-top-width", "border-top-color", "box-shadow", "padding-top"],
};

type Scenario = { props: Record<string, unknown>; mode: "light" | "dark"; density?: string };
const FULL = { modelValue: "#ff0000", showAlpha: true, presetPalette: "basic" };
const SCENARIOS: Record<string, Scenario> = {};
for (const size of ["sm", "md", "lg"]) {
  for (const mode of ["light", "dark"] as const) SCENARIOS[`${size}-${mode}`] = { props: { ...FULL, size }, mode };
}
SCENARIOS["swatch-only-md-light"] = { props: { ...FULL, swatchOnly: true }, mode: "light" };
SCENARIOS["swatch-only-lg-dark"] = { props: { ...FULL, swatchOnly: true, size: "lg" }, mode: "dark" };
SCENARIOS["disabled-md-light"] = { props: { ...FULL, disabled: true }, mode: "light" };
SCENARIOS["density-md-light"] = { props: { ...FULL }, mode: "light", density: "0.75" };
SCENARIOS["half-alpha-md-light"] = { props: { ...FULL, modelValue: "#336699" + "80" }, mode: "light" };

function locate(root: HTMLElement): Record<string, Element | null> {
  const body = root.lastElementChild as HTMLElement;
  const gradient = root.querySelector(".cui-color-picker__gradient");
  const row = [...body.children].find((c) => c.querySelector(".cui-color-picker__hue")) ?? null;
  const inputRow = [...body.children].find((c) => c.querySelector("input")) ?? null;
  const thumbs = (parent: Element | null) => [...(parent?.querySelectorAll(".cui-color-picker__thumb") ?? [])];
  const alpha = root.querySelector(".cui-color-picker__alpha");
  const hue = root.querySelector(".cui-color-picker__hue");
  const swatches = root.querySelector("[role=radiogroup]");
  const preview = row?.firstElementChild ?? null;
  return {
    root,
    gradient,
    "overlay-white": gradient?.children[0] ?? null,
    "overlay-black": gradient?.children[1] ?? null,
    "thumb-sat": thumbs(gradient)[0] ?? null,
    "thumb-val": thumbs(gradient)[1] ?? null,
    body,
    row,
    preview,
    "preview-fill": preview?.firstElementChild ?? null,
    sliders: row?.children[1] ?? null,
    hue,
    "thumb-hue": thumbs(hue)[0] ?? null,
    alpha,
    "alpha-fill": alpha?.children[0] ?? null,
    "thumb-alpha": thumbs(alpha)[0] ?? null,
    "input-row": inputRow,
    "swatch-preview": inputRow && inputRow.firstElementChild?.tagName === "DIV" ? inputRow.firstElementChild : null,
    input: root.querySelector("input"),
    format: root.querySelector(".cui-button"),
    swatches,
    "swatch-first": swatches?.children[0] ?? null,
    "swatch-selected": swatches?.querySelector("[aria-checked=true]") ?? null,
  };
}

function snapshot(root: HTMLElement) {
  const out: Record<string, Record<string, string>> = {};
  for (const [part, el] of Object.entries(locate(root))) {
    if (!el) continue;
    const cs = getComputedStyle(el);
    out[part] = Object.fromEntries(PARTS[part].map((p) => [p, cs.getPropertyValue(p)]));
  }
  return out;
}

describe("CuiColorPicker looks the same as its inline-style implementation (#467, real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens-467";
    // Tailwind emits only the theme variables a build uses, so the raw stylesheet leaves the light
    // scale undefined and every `var(--color-…)` invalid: give the steps these tokens read. Dark
    // takes its own from main.css's `.dark` blocks. `--cui-text-body` is a typography token.
    style.textContent = `${main}
      :root { --color-surface-500: oklch(0.7 0.01 270); --color-surface-600: oklch(0.6 0.012 270);
        --color-primary-500: oklch(0.5 0.2 270); --color-primary-300: oklch(0.75 0.12 270); --cui-text-body: #1f2937; }
      .dark { --cui-text-body: #e5e7eb; }`;
    document.head.append(style);
  });
  afterAll(() => document.getElementById("cui-tokens-467")?.remove());

  const wrappers: VueWrapper[] = [];
  const hosts: HTMLElement[] = [];
  afterEach(() => {
    wrappers.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((h) => h.remove());
  });

  const recorded = baseline as Record<string, Record<string, Record<string, string>>>;
  const dump: Record<string, unknown> = {};

  for (const [name, { props, mode, density }] of Object.entries(SCENARIOS)) {
    it(name, async () => {
      const host = document.createElement("div");
      if (mode === "dark") host.className = "dark";
      if (density) host.style.setProperty("--cui-density-scale", density);
      document.body.append(host);
      hosts.push(host);
      const wrapper = mount(CuiColorPicker, { props, attachTo: host });
      wrappers.push(wrapper);
      await nextTick();
      const actual = snapshot(host.querySelector<HTMLElement>(".cui-color-picker")!);
      if (!recorded[name]) {
        // Recording mode: an empty baseline prints what the current implementation computes.
        dump[name] = actual;
        console.log(`BASELINE ${JSON.stringify({ [name]: actual })}`);
        return;
      }
      expect(actual).toEqual(recorded[name]);
    });
  }
});
