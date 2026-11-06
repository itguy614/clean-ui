import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { h, nextTick, type Component } from "vue";
import main from "../../styles/main.css?inline";
import CuiInput from "../../components/CuiInput.vue";
import CuiSelect from "../../components/CuiSelect.vue";
import CuiTextarea from "../../components/CuiTextarea.vue";
import CuiCheckbox from "../../components/CuiCheckbox.vue";
import CuiRadio from "../../components/CuiRadio.vue";
import CuiRadioGroup from "../../components/CuiRadioGroup.vue";
import CuiToggle from "../../components/CuiToggle.vue";
import CuiCombobox from "../../components/CuiCombobox.vue";
import CuiProgress from "../../components/CuiProgress.vue";
import CuiButton from "../../components/CuiButton.vue";
import baseline from "./form-control-identity.baseline.json";

/**
 * #454 — the form controls' stylesheets now read every private `--_<c>-<slot>` token through
 * its public `--cui-<c>-<slot>` layer, inside zero-specificity rules. Nothing about how they
 * look may change. `form-control-identity.baseline.json` holds the computed styles of each
 * part, recorded from develop at 1.9.0 BEFORE the conversion: every size in light, plus the
 * dark, focus, hover, error, disabled, checked and density states that move paint. Real
 * browser: jsdom computes none of this.
 *
 * To re-record, empty the baseline: each missing scenario prints its snapshot before failing.
 */

/** [selector within the control's host, computed properties recorded for it] */
type Part = [string, string[]];
const PAD = ["padding-top", "padding-right", "padding-bottom", "padding-left"];
const FRAME = ["border-top-width", "border-top-style", "border-top-color", "border-top-left-radius"];
const RING = ["box-shadow", "outline-style", "outline-width", "outline-color", "outline-offset"];
const FIELD: string[] = ["height", "min-height", "width", ...PAD, ...FRAME, ...RING, "background-color", "color", "font-size", "opacity"];
const SEGMENT: string[] = ["height", ...PAD, ...FRAME, "border-bottom-right-radius", "background-color", "color", "font-size", ...RING, "opacity"];

const PARTS: Record<string, Record<string, Part>> = {
  input: {
    root: [".cui-input", FIELD],
    inner: [".cui-input__inner", ["height", ...PAD, "column-gap"]],
    native: [".cui-input__native", ["height", "font-size", "color", "padding-top", "padding-left"]],
    prefix: [".cui-input__prefix", ["font-size", "color"]],
    "prefix-button": [".cui-input__prefix-button", ["border-right-width", "border-right-style", "border-right-color", "border-left-width"]],
    "suffix-button": [".cui-input__suffix-button", ["border-left-width", "border-left-style", "border-left-color", "border-right-width"]],
  },
  select: {
    trigger: [".cui-select__trigger", FIELD],
    value: [".cui-select__value", ["min-height", "height"]],
    "group-header": [".cui-select__group-header", [...PAD, "font-size"]],
  },
  textarea: {
    root: [".cui-textarea", [...FRAME, "background-color", "box-shadow", "opacity", "height"]],
    native: [".cui-textarea__native", [...PAD, "font-size", "color", "line-height"]],
  },
  checkbox: {
    root: [".cui-checkbox", [...RING, "border-top-left-radius", "opacity"]],
    indicator: [".cui-checkbox__indicator", ["height", "width", ...FRAME, "background-color"]],
  },
  radio: {
    root: [".cui-radio", [...RING, "border-top-left-radius", "opacity"]],
    indicator: [".cui-radio__indicator", ["height", "width", ...FRAME, "background-color"]],
    dot: [".cui-radio__dot", ["height", "width", "background-color"]],
  },
  "radio-button": {
    first: [".cui-radio-button:first-of-type", SEGMENT],
    last: [".cui-radio-button:last-of-type", SEGMENT],
  },
  toggle: {
    root: [".cui-toggle", [...RING, "opacity"]],
    track: [".cui-toggle__track", ["height", "width", ...FRAME, "padding-top", "background-color"]],
    knob: [".cui-toggle__knob", ["height", "width", "background-color", "transform", "box-shadow"]],
    labels: [".cui-toggle__labels", ["font-size"]],
    "on-label": [".cui-toggle__on-label", ["color"]],
  },
  combobox: {
    control: [".cui-combobox__control", ["min-height", ...PAD, ...FRAME, "background-color", "font-size", "box-shadow", "opacity"]],
    input: [".cui-combobox__input", ["font-size", "color"]],
  },
  "progress-bar": {
    track: [".cui-progress-bar__track", ["height", "background-color", "border-top-left-radius"]],
    fill: [".cui-progress-bar__fill", ["background-color", "transform", "height"]],
  },
  "progress-circle": {
    root: [".cui-progress-circle", ["width", "height"]],
    track: [".cui-progress-circle__track", ["stroke"]],
    fill: [".cui-progress-circle__fill", ["stroke"]],
    label: [".cui-progress-circle__label", ["font-size"]],
  },
};

type Scenario = {
  kind: keyof typeof PARTS;
  make: () => Component;
  mode?: "dark";
  density?: string;
  /** Pointer or keyboard state applied before measuring, on the element matching `at`. */
  state?: "hover" | "focus";
  at?: string;
  /** Click this to open a teleported panel, whose parts are then found on the document. */
  open?: string;
  /** [selector, property] that must be set in this state, so a state that never took cannot pass. */
  ring?: [string, string];
};
const SCENARIOS: Record<string, Scenario> = {};
const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;

const opts = [{ value: "a", label: "Apple" }, { value: "b", label: "Banana", group: "Fruit" }, { value: "c", label: "Cherry", group: "Fruit" }];
const wrap = (component: Component, props: Record<string, unknown>, slots?: Record<string, () => unknown>): Component => ({
  render: () => h(component, props, slots as never),
});
const withButton = (label: string) => () => h(CuiButton, { size: "sm" }, () => label);

function add(name: string, s: Scenario) {
  SCENARIOS[name] = s;
}

// --- CuiInput ---
const inputSlots = { prefix: () => "$", suffix: () => "kg", "prefix-button": withButton("A"), "suffix-button": withButton("Go") };
for (const size of SIZES) add(`input-${size}`, { kind: "input", make: () => wrap(CuiInput, { modelValue: "x", size }, inputSlots) });
add("input-lg-rounded", { kind: "input", make: () => wrap(CuiInput, { modelValue: "x", size: "lg", rounded: "full", color: "success" }, inputSlots) });
add("input-md-dark", { kind: "input", mode: "dark", make: () => wrap(CuiInput, { modelValue: "x" }, inputSlots) });
add("input-md-focus", { kind: "input", state: "focus", at: "input", ring: [".cui-input", "box-shadow"], make: () => wrap(CuiInput, { modelValue: "x" }, inputSlots) });
add("input-md-focus-dark", { kind: "input", mode: "dark", state: "focus", at: "input", ring: [".cui-input", "box-shadow"], make: () => wrap(CuiInput, { modelValue: "x", color: "info" }) });
add("input-md-error", { kind: "input", make: () => wrap(CuiInput, { modelValue: "x", error: true, errorMessage: "No" }, inputSlots) });
add("input-md-error-focus", { kind: "input", state: "focus", at: "input", ring: [".cui-input", "box-shadow"], make: () => wrap(CuiInput, { modelValue: "x", error: true }) });
add("input-md-disabled", { kind: "input", make: () => wrap(CuiInput, { modelValue: "x", disabled: true }) });
add("input-md-density", { kind: "input", density: "0.75", make: () => wrap(CuiInput, { modelValue: "x" }, inputSlots) });

// --- CuiSelect ---
for (const size of SIZES) add(`select-${size}`, { kind: "select", make: () => wrap(CuiSelect, { modelValue: "a", options: opts, size }) });
add("select-md-rounded", { kind: "select", make: () => wrap(CuiSelect, { modelValue: "a", options: opts, rounded: "lg", color: "success" }) });
add("select-md-dark", { kind: "select", mode: "dark", make: () => wrap(CuiSelect, { modelValue: "a", options: opts }) });
add("select-md-focus", { kind: "select", state: "focus", at: ".cui-select__trigger", ring: [".cui-select__trigger", "box-shadow"], make: () => wrap(CuiSelect, { modelValue: "a", options: opts }) });
add("select-md-error", { kind: "select", make: () => wrap(CuiSelect, { modelValue: "a", options: opts, error: true }) });
add("select-md-error-dark", { kind: "select", mode: "dark", make: () => wrap(CuiSelect, { modelValue: "a", options: opts, error: true }) });
add("select-md-disabled", { kind: "select", make: () => wrap(CuiSelect, { modelValue: "a", options: opts, disabled: true }) });
add("select-md-density", { kind: "select", density: "0.75", make: () => wrap(CuiSelect, { modelValue: "a", options: opts }) });
add("select-lg-open", { kind: "select", open: ".cui-select__trigger", ring: [".cui-select__trigger", "box-shadow"], make: () => wrap(CuiSelect, { modelValue: "a", options: opts, size: "lg" }) });
add("select-sm-multiple", { kind: "select", make: () => wrap(CuiSelect, { modelValue: ["a", "b"], multiple: true, options: opts, size: "sm" }) });

// --- CuiTextarea ---
for (const size of SIZES) add(`textarea-${size}`, { kind: "textarea", make: () => wrap(CuiTextarea, { modelValue: "x", size }) });
add("textarea-md-rounded", { kind: "textarea", make: () => wrap(CuiTextarea, { modelValue: "x", rounded: "none", color: "success" }) });
add("textarea-md-dark", { kind: "textarea", mode: "dark", make: () => wrap(CuiTextarea, { modelValue: "x" }) });
add("textarea-md-focus", { kind: "textarea", state: "focus", at: "textarea", ring: [".cui-textarea", "box-shadow"], make: () => wrap(CuiTextarea, { modelValue: "x" }) });
add("textarea-md-focus-dark", { kind: "textarea", mode: "dark", state: "focus", at: "textarea", ring: [".cui-textarea", "box-shadow"], make: () => wrap(CuiTextarea, { modelValue: "x", color: "warning" }) });
add("textarea-md-error", { kind: "textarea", make: () => wrap(CuiTextarea, { modelValue: "x", error: true }) });
add("textarea-md-disabled", { kind: "textarea", make: () => wrap(CuiTextarea, { modelValue: "x", disabled: true }) });
add("textarea-md-density", { kind: "textarea", density: "0.75", make: () => wrap(CuiTextarea, { modelValue: "x" }) });

// --- CuiCheckbox ---
for (const mode of [undefined, "dark"] as const) {
  const m = mode ? "-dark" : "";
  add(`checkbox-off${m}`, { kind: "checkbox", mode, make: () => wrap(CuiCheckbox, { modelValue: false, label: "L" }) });
  add(`checkbox-on${m}`, { kind: "checkbox", mode, make: () => wrap(CuiCheckbox, { modelValue: true, label: "L", color: "success" }) });
  add(`checkbox-indeterminate${m}`, { kind: "checkbox", mode, make: () => wrap(CuiCheckbox, { modelValue: false, indeterminate: true, label: "L" }) });
  add(`checkbox-off-hover${m}`, { kind: "checkbox", mode, state: "hover", at: ".cui-checkbox", make: () => wrap(CuiCheckbox, { modelValue: false, label: "L", color: "error" }) });
  add(`checkbox-on-focus${m}`, { kind: "checkbox", mode, state: "focus", at: ".cui-checkbox", ring: [".cui-checkbox", "outline-style"], make: () => wrap(CuiCheckbox, { modelValue: true, label: "L" }) });
}
add("checkbox-off-disabled", { kind: "checkbox", make: () => wrap(CuiCheckbox, { modelValue: false, label: "L", disabled: true }) });

// --- CuiRadio (classic) ---
for (const mode of [undefined, "dark"] as const) {
  const m = mode ? "-dark" : "";
  add(`radio-off${m}`, { kind: "radio", mode, make: () => wrap(CuiRadio, { modelValue: "b", value: "a", label: "L" }) });
  add(`radio-on${m}`, { kind: "radio", mode, make: () => wrap(CuiRadio, { modelValue: "a", value: "a", label: "L", color: "success" }) });
  add(`radio-off-hover${m}`, { kind: "radio", mode, state: "hover", at: ".cui-radio", make: () => wrap(CuiRadio, { modelValue: "b", value: "a", label: "L", color: "error" }) });
  add(`radio-on-focus${m}`, { kind: "radio", mode, state: "focus", at: ".cui-radio", ring: [".cui-radio", "outline-style"], make: () => wrap(CuiRadio, { modelValue: "a", value: "a", label: "L" }) });
}
add("radio-off-disabled", { kind: "radio", make: () => wrap(CuiRadio, { modelValue: "b", value: "a", label: "L", disabled: true }) });

// --- CuiRadio (button variant, in a group) ---
const group = (props: Record<string, unknown>): Component =>
  wrap(CuiRadioGroup, { modelValue: "a", variant: "buttons", ...props }, () => [h(CuiRadio, { value: "a", label: "A" }), h(CuiRadio, { value: "b", label: "B" })]);
for (const size of SIZES) add(`radio-button-${size}`, { kind: "radio-button", make: () => group({ size }) });
add("radio-button-md-dark", { kind: "radio-button", mode: "dark", make: () => group({}) });
add("radio-button-md-success", { kind: "radio-button", make: () => group({ color: "success" }) });
add("radio-button-md-hover-off", { kind: "radio-button", state: "hover", at: ".cui-radio-button:last-of-type", make: () => group({}) });
add("radio-button-md-hover-on", { kind: "radio-button", state: "hover", at: ".cui-radio-button:first-of-type", make: () => group({}) });
add("radio-button-md-hover-off-dark", { kind: "radio-button", mode: "dark", state: "hover", at: ".cui-radio-button:last-of-type", make: () => group({ color: "info" }) });
add("radio-button-md-hover-on-dark", { kind: "radio-button", mode: "dark", state: "hover", at: ".cui-radio-button:first-of-type", make: () => group({ color: "info" }) });
add("radio-button-md-focus", { kind: "radio-button", state: "focus", at: ".cui-radio-button:last-of-type", ring: [".cui-radio-button:last-of-type", "outline-style"], make: () => group({}) });
add("radio-button-md-disabled", { kind: "radio-button", make: () => group({ disabled: true }) });
add("radio-button-md-density", { kind: "radio-button", density: "0.75", make: () => group({}) });

// --- CuiToggle ---
for (const size of ["sm", "md", "lg"] as const) {
  add(`toggle-off-${size}`, { kind: "toggle", make: () => wrap(CuiToggle, { modelValue: false, label: "L", size }) });
  add(`toggle-on-${size}`, { kind: "toggle", make: () => wrap(CuiToggle, { modelValue: true, label: "L", size, showLabels: true }) });
}
for (const mode of [undefined, "dark"] as const) {
  const m = mode ? "-dark" : "";
  add(`toggle-off${m}`, { kind: "toggle", mode, make: () => wrap(CuiToggle, { modelValue: false, label: "L", color: "success" }) });
  add(`toggle-on${m}`, { kind: "toggle", mode, make: () => wrap(CuiToggle, { modelValue: true, label: "L", showLabels: true, color: "success" }) });
  add(`toggle-off-hover${m}`, { kind: "toggle", mode, state: "hover", at: ".cui-toggle", make: () => wrap(CuiToggle, { modelValue: false, label: "L", color: "error" }) });
  add(`toggle-on-hover${m}`, { kind: "toggle", mode, state: "hover", at: ".cui-toggle", make: () => wrap(CuiToggle, { modelValue: true, label: "L", color: "error" }) });
  add(`toggle-on-focus${m}`, { kind: "toggle", mode, state: "focus", at: ".cui-toggle", ring: [".cui-toggle", "outline-style"], make: () => wrap(CuiToggle, { modelValue: true, label: "L" }) });
}
add("toggle-off-disabled", { kind: "toggle", make: () => wrap(CuiToggle, { modelValue: false, label: "L", disabled: true }) });

// --- CuiCombobox ---
const comboOpts = [{ value: "a", label: "Apple" }, { value: "b", label: "Banana" }];
for (const size of SIZES) add(`combobox-${size}`, { kind: "combobox", make: () => wrap(CuiCombobox, { modelValue: "a", options: comboOpts, size }) });
add("combobox-md-rounded", { kind: "combobox", make: () => wrap(CuiCombobox, { modelValue: "a", options: comboOpts, rounded: "full", color: "success" }) });
add("combobox-md-dark", { kind: "combobox", mode: "dark", make: () => wrap(CuiCombobox, { modelValue: "a", options: comboOpts }) });
add("combobox-md-focus", { kind: "combobox", state: "focus", at: "input", ring: [".cui-combobox__control", "box-shadow"], make: () => wrap(CuiCombobox, { modelValue: "a", options: comboOpts }) });
add("combobox-md-focus-dark", { kind: "combobox", mode: "dark", state: "focus", at: "input", ring: [".cui-combobox__control", "box-shadow"], make: () => wrap(CuiCombobox, { modelValue: "a", options: comboOpts, color: "warning" }) });
add("combobox-md-error", { kind: "combobox", make: () => wrap(CuiCombobox, { modelValue: "a", options: comboOpts, error: true }) });
add("combobox-md-error-focus", { kind: "combobox", state: "focus", at: "input", ring: [".cui-combobox__control", "box-shadow"], make: () => wrap(CuiCombobox, { modelValue: "a", options: comboOpts, error: true }) });
add("combobox-md-disabled", { kind: "combobox", make: () => wrap(CuiCombobox, { modelValue: "a", options: comboOpts, disabled: true }) });
add("combobox-md-multiple", { kind: "combobox", make: () => wrap(CuiCombobox, { modelValue: ["a", "b"], multiple: true, options: comboOpts }) });
add("combobox-md-density", { kind: "combobox", density: "0.75", make: () => wrap(CuiCombobox, { modelValue: "a", options: comboOpts }) });

// --- CuiProgress ---
for (const size of SIZES) {
  add(`progress-bar-${size}`, { kind: "progress-bar", make: () => wrap(CuiProgress, { value: 40, size, showLabel: true }) });
  add(`progress-circle-${size}`, { kind: "progress-circle", make: () => wrap(CuiProgress, { value: 40, size, variant: "circle", showLabel: true }) });
}
for (const mode of [undefined, "dark"] as const) {
  const m = mode ? "-dark" : "";
  add(`progress-bar-success${m}`, { kind: "progress-bar", mode, make: () => wrap(CuiProgress, { value: 70, color: "success" }) });
  add(`progress-circle-error${m}`, { kind: "progress-circle", mode, make: () => wrap(CuiProgress, { value: 70, color: "error", variant: "circle", showLabel: true }) });
}
add("progress-bar-indeterminate", { kind: "progress-bar", make: () => wrap(CuiProgress, { indeterminate: true }) });

/** Finite animations and transitions finish at once; loops are left running. */
function settle(root: Element) {
  for (const a of root.getAnimations({ subtree: true })) {
    if (a.effect?.getComputedTiming().iterations !== Infinity) a.finish();
  }
}

function snapshot(kind: string, host: ParentNode) {
  const out: Record<string, string[]> = {};
  for (const [part, [sel, props]] of Object.entries(PARTS[kind])) {
    // A teleported listbox is in the document, not the host.
    const el = host.querySelector(sel) ?? document.querySelector(sel);
    if (!el) continue;
    const cs = getComputedStyle(el);
    out[part] = props.map((p) => cs.getPropertyValue(p));
  }
  return out;
}

/** Distinct, deterministic colours for every step of the scale, so a wrong slot shows up. */
function colourScale() {
  const full = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const condensed = [100, 300, 500, 700, 900];
  const roles: Record<string, number[]> = { primary: full, surface: full, secondary: condensed, success: condensed, error: condensed, warning: condensed, info: condensed };
  let css = ":root {";
  let i = 0;
  for (const [role, steps] of Object.entries(roles)) {
    for (const step of steps) {
      i++;
      css += `--color-${role}-${step}: rgb(${(i * 53) % 256}, ${(i * 97 + 31) % 256}, ${(i * 29 + 70) % 256});`;
    }
  }
  return `${css} --cui-text-body: #1f2937; --cui-text-secondary: #4b5563; --cui-text-tertiary: #6b7280; }
    .dark { --cui-text-body: #e5e7eb; --cui-text-secondary: #9ca3af; --cui-text-tertiary: #6b7280; }`;
}

describe("the form controls look the same as before the token layer (#454, real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens-454";
    style.textContent = `${main}\n${colourScale()}`;
    document.head.append(style);
  });
  afterAll(() => document.getElementById("cui-tokens-454")?.remove());

  const wrappers: VueWrapper[] = [];
  const hosts: HTMLElement[] = [];
  afterEach(() => {
    wrappers.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((h) => h.remove());
  });

  const recorded = baseline as Record<string, Record<string, string[]>>;

  for (const [name, scenario] of Object.entries(SCENARIOS)) {
    it(name, async () => {
      const host = document.createElement("div");
      if (scenario.mode === "dark") host.className = "dark";
      if (scenario.density) host.style.setProperty("--cui-density-scale", scenario.density);
      document.body.append(host);
      hosts.push(host);
      wrappers.push(mount(scenario.make(), { attachTo: host }));
      await nextTick();

      if (scenario.open) {
        host.querySelector<HTMLElement>(scenario.open)!.click();
        await nextTick();
        await new Promise((r) => setTimeout(r, 50));
      }
      if (scenario.state) {
        const el = host.querySelector<HTMLElement>(scenario.at!)!;
        expect(el, `no element for ${scenario.at}`).toBeTruthy();
        if (scenario.state === "hover") await userEvent.hover(el);
        else el.focus();
        await nextTick();
      }
      settle(document.documentElement);

      const actual = snapshot(scenario.kind, host);
      if (scenario.ring) {
        const [sel, prop] = scenario.ring;
        const value = getComputedStyle(host.querySelector(sel)!).getPropertyValue(prop);
        expect(value, `${name}: the ${scenario.state ?? "open"} state never took`).not.toMatch(/^(none|)$/);
      }
      if (!recorded[name]) console.log(`BASELINE ${JSON.stringify({ [name]: actual })}`);
      expect(recorded[name], `no recorded baseline for ${name}`).toBeDefined();
      expect(actual).toEqual(recorded[name]);
    });
  }

  it("records a baseline for every scenario, and no stale ones", () => {
    expect(Object.keys(recorded).sort()).toEqual(Object.keys(SCENARIOS).sort());
  });
});
