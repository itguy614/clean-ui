import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick, type Component } from "vue";
import main from "../../styles/main.css?inline";
import CuiBadge from "../../components/CuiBadge.vue";
import CuiFieldset from "../../components/CuiFieldset.vue";
import CuiPopover from "../../components/CuiPopover.vue";
import baseline from "./paint-identity.baseline.json";

/**
 * #294 — CuiBadge, CuiFieldset and CuiPopover wrote their paint (background, border, colour,
 * radius, padding, sizes) as bare inline declarations, and now emit private
 * `--_<component>-<slot>` properties read back through public tokens. Nothing about how they
 * look may change. `paint-identity.baseline.json` holds the computed styles of each part,
 * recorded from the branch tip BEFORE the conversion: every variant, colour and size of a
 * badge, a fieldset's variants and states, a popover's panel, arrow on each side, header,
 * close button and footer, light and dark. Real browser: jsdom computes none of this.
 *
 * To re-record, empty the baseline: each missing scenario prints its snapshot before failing.
 */

type Part = [string, string[]];
const PAD = ["padding-top", "padding-right", "padding-bottom", "padding-left"];
const FRAME = ["border-top-width", "border-top-style", "border-top-color", "border-right-width", "border-bottom-width", "border-left-width"];
const RADII = ["border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius"];
const TEXT = ["color", "font-size", "font-weight", "line-height"];
// `opacity` is left to the scenarios that hold still: a pulsing badge and a ping ring animate it.
const BOX = ["display", "height", "gap", "overflow-x", "opacity", "cursor"];

const PARTS: Record<string, Record<string, Part>> = {
  badge: {
    root: [".cui-badge", [...BOX.filter((p) => p !== "opacity"), ...PAD, ...FRAME, ...RADII, "background-color", ...TEXT, "animation-name", "vertical-align"]],
    content: [".cui-badge__content", ["display", "gap", "line-height"]],
    remove: [".cui-badge__remove", ["display", "opacity", "color", "background-color", ...FRAME, "border-top-left-radius", "margin-top", "margin-right"]],
    dot: [".cui-badge__dot", ["display", "width", "height", "background-color", "border-top-left-radius"]],
    ping: [".cui-badge__ping", ["position", "background-color", "border-top-left-radius", "animation-name"]],
  },
  fieldset: {
    root: [".cui-fieldset", [...PAD, ...FRAME, "border-top-color", ...RADII, "background-color", "opacity", "min-width", "margin-top"]],
    legend: [".cui-fieldset__legend", [...PAD, ...TEXT, "gap", "display"]],
    toggle: [".cui-fieldset__toggle", [...PAD, ...TEXT, "background-color", ...FRAME, "border-top-left-radius", "cursor", "margin-top", "margin-left"]],
    chevron: [".cui-fieldset__chevron", ["color", "transform", "flex-shrink"]],
    description: [".cui-fieldset__description", [...PAD, "font-size", "color", "line-height"]],
    body: [".cui-fieldset__body", ["display", "grid-template-rows", "opacity", "visibility"]],
    content: [".cui-fieldset__content", ["display", "gap", "flex-direction"]],
  },
  popover: {
    panel: [".cui-popover__panel", [...BOX, ...FRAME, "border-top-color", ...RADII, "background-color", "box-shadow", "min-width", "max-width", "width", "z-index", "position", "transform-origin"]],
    header: [".cui-popover__header", [...PAD, "display", "align-items", "justify-content", "gap"]],
    title: [".cui-popover__title", ["font-size", "font-weight", "color"]],
    close: [".cui-popover__close", ["display", "width", "height", "color", "background-color", ...FRAME, "border-top-left-radius", "cursor", "flex-shrink", "margin-top", "margin-right"]],
    body: [".cui-popover__body", [...PAD, "font-size", "line-height", "color"]],
    footer: [".cui-popover__footer", [...PAD]],
    arrow: [".cui-popover__arrow", ["width", "height", "background-color", ...FRAME, "border-top-color", "transform", "clip-path", "position"]],
  },
};

type Scenario = {
  kind: keyof typeof PARTS;
  make: () => Component;
  mode?: "dark";
  /** Pointer or keyboard state is not needed: paint only. A closed fieldset is clicked first. */
  click?: string;
};
const SCENARIOS: Record<string, Scenario> = {};
const add = (name: string, s: Scenario) => {
  SCENARIOS[name] = s;
};
const wrap = (component: Component, props: Record<string, unknown>, slots?: Record<string, () => unknown>): Component => ({
  render: () => h(component, props, slots as never),
});
const text = (s: string) => () => s;

const COLORS = ["primary", "secondary", "success", "error", "warning", "info", "surface", "surface-light", "surface-dark"] as const;
const MODES = [undefined, "dark"] as const;

// --- CuiBadge ---
for (const mode of MODES) {
  const m = mode ? "-dark" : "";
  for (const variant of ["solid", "subtle", "outline"] as const) {
    for (const color of COLORS) {
      for (const size of ["sm", "md"] as const) {
        add(`badge-${variant}-${color}-${size}${m}`, { kind: "badge", mode, make: () => wrap(CuiBadge, { variant, color, size }, { default: text("New") }) });
      }
    }
  }
  for (const color of ["primary", "error", "surface"] as const) {
    for (const size of ["sm", "md"] as const) {
      add(`badge-dot-${color}-${size}${m}`, { kind: "badge", mode, make: () => wrap(CuiBadge, { dot: true, color, size }) });
    }
  }
  add(`badge-dot-ping${m}`, { kind: "badge", mode, make: () => wrap(CuiBadge, { dot: true, color: "success", animation: "ping" }) });
  add(`badge-removable${m}`, { kind: "badge", mode, make: () => wrap(CuiBadge, { removable: true, color: "info", variant: "outline" }, { default: text("Tag") }) });
  add(`badge-removable-md${m}`, { kind: "badge", mode, make: () => wrap(CuiBadge, { removable: true, size: "md" }, { default: text("Tag") }) });
  add(`badge-pulse${m}`, { kind: "badge", mode, make: () => wrap(CuiBadge, { animation: "pulse", variant: "solid", color: "warning" }, { default: text("Live") }) });
}
for (const rounded of ["none", "sm", "md", "lg", "full"] as const) {
  add(`badge-rounded-${rounded}`, { kind: "badge", make: () => wrap(CuiBadge, { rounded }, { default: text("New") }) });
}

// --- CuiFieldset ---
for (const mode of MODES) {
  const m = mode ? "-dark" : "";
  for (const variant of ["outline", "subtle", "ghost"] as const) {
    for (const color of ["surface", "primary", "error", "success"] as const) {
      add(`fieldset-${variant}-${color}${m}`, { kind: "fieldset", mode, make: () => wrap(CuiFieldset, { legend: "L", variant, color, description: "Help" }, { default: text("Body") }) });
    }
    add(`fieldset-${variant}-collapsible-open${m}`, { kind: "fieldset", mode, make: () => wrap(CuiFieldset, { legend: "L", variant, collapsible: true }, { default: text("Body") }) });
    add(`fieldset-${variant}-collapsible-closed${m}`, { kind: "fieldset", mode, make: () => wrap(CuiFieldset, { legend: "L", variant, collapsible: true, expanded: false }, { default: text("Body") }) });
    add(`fieldset-${variant}-disabled${m}`, { kind: "fieldset", mode, make: () => wrap(CuiFieldset, { legend: "L", variant, collapsible: true, disabled: true }, { default: text("Body") }) });
  }
}
for (const rounded of ["none", "sm", "md", "lg", "full"] as const) {
  add(`fieldset-rounded-${rounded}`, { kind: "fieldset", make: () => wrap(CuiFieldset, { legend: "L", variant: "subtle", rounded }, { default: text("Body") }) });
}
add("fieldset-toggled-closed", { kind: "fieldset", click: ".cui-fieldset__toggle", make: () => wrap(CuiFieldset, { legend: "L", collapsible: true }, { default: text("Body") }) });

// --- CuiPopover ---
const trigger = () => h("button", "Open");
for (const mode of MODES) {
  const m = mode ? "-dark" : "";
  for (const placement of ["top", "bottom", "left", "right"] as const) {
    add(`popover-${placement}${m}`, {
      kind: "popover",
      mode,
      make: () => wrap(CuiPopover, { visible: true, placement, title: "T" }, { default: trigger, content: text("Body"), footer: text("Foot") }),
    });
  }
  add(`popover-no-title${m}`, { kind: "popover", mode, make: () => wrap(CuiPopover, { visible: true }, { default: trigger, content: text("Body") }) });
  add(`popover-not-closable${m}`, { kind: "popover", mode, make: () => wrap(CuiPopover, { visible: true, title: "T", closable: false }, { default: trigger, content: text("Body") }) });
  add(`popover-no-arrow${m}`, { kind: "popover", mode, make: () => wrap(CuiPopover, { visible: true, title: "T", noArrow: true }, { default: trigger, content: text("Body"), footer: text("Foot") }) });
  add(`popover-width${m}`, { kind: "popover", mode, make: () => wrap(CuiPopover, { visible: true, title: "T", width: "320px" }, { default: trigger, content: text("Body") }) });
  add(`popover-header-slot${m}`, { kind: "popover", mode, make: () => wrap(CuiPopover, { visible: true }, { default: trigger, header: () => h("b", "Custom"), content: text("Body") }) });
}
for (const rounded of ["none", "sm", "md", "lg", "full"] as const) {
  add(`popover-rounded-${rounded}`, { kind: "popover", make: () => wrap(CuiPopover, { visible: true, title: "T", rounded }, { default: trigger, content: text("Body") }) });
}

/** Finite animations and transitions finish at once; loops are left running. */
function settle(root: Element) {
  for (const a of root.getAnimations({ subtree: true })) {
    if (a.effect?.getComputedTiming().iterations !== Infinity) a.finish();
  }
}

function snapshot(kind: string, host: ParentNode) {
  const out: Record<string, string[]> = {};
  for (const [part, [sel, props]] of Object.entries(PARTS[kind])) {
    // A teleported panel is in the document, not the host.
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

describe("badge, fieldset and popover look the same as before the token layer (#294, real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens-paint";
    style.textContent = `${main}\n${colourScale()}`;
    document.head.append(style);
  });
  afterAll(() => document.getElementById("cui-tokens-paint")?.remove());

  const wrappers: VueWrapper[] = [];
  const hosts: HTMLElement[] = [];
  afterEach(() => {
    wrappers.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((el) => el.remove());
    document.documentElement.classList.remove("dark");
  });

  const recorded = baseline as Record<string, Record<string, string[]>>;

  for (const [name, scenario] of Object.entries(SCENARIOS)) {
    it(name, async () => {
      // On the root, not the host: a popover's panel is teleported to <body>.
      if (scenario.mode === "dark") document.documentElement.classList.add("dark");
      const host = document.createElement("div");
      document.body.append(host);
      hosts.push(host);
      wrappers.push(mount(scenario.make(), { attachTo: host }));
      await nextTick();
      if (scenario.click) {
        host.querySelector<HTMLElement>(scenario.click)!.click();
        await nextTick();
      }
      // A popover is placed over a frame or two, and enters by a transition.
      await new Promise((r) => setTimeout(r, scenario.kind === "popover" ? 120 : 30));
      settle(document.documentElement);

      const actual = snapshot(scenario.kind, host);
      expect(Object.keys(actual).length, `${name} rendered none of its parts`).toBeGreaterThan(0);
      if (!recorded[name]) console.log(`BASELINE ${JSON.stringify({ [name]: actual })}`);
      expect(recorded[name], `no recorded baseline for ${name}`).toBeDefined();
      expect(actual).toEqual(recorded[name]);
    });
  }

  it("records a baseline for every scenario, and no stale ones", () => {
    expect(Object.keys(recorded).sort()).toEqual(Object.keys(SCENARIOS).sort());
  });
});
