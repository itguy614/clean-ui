import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { h, nextTick, type Component } from "vue";
import main from "../../styles/main.css?inline";
import CuiAlert from "../../components/CuiAlert.vue";
import CuiBanner from "../../components/CuiBanner.vue";
import CuiToast from "../../components/CuiToast.vue";
import CuiTabs from "../../components/CuiTabs.vue";
import CuiTab from "../../components/CuiTab.vue";
import CuiList from "../../components/CuiList.vue";
import CuiListItem from "../../components/CuiListItem.vue";
import CuiTagInput from "../../components/CuiTagInput.vue";
import baseline from "./token-layer-identity.baseline.json";

/**
 * #454 (part 2) — Alert, Banner, Toast, Tabs, ListItem and TagInput now read every private
 * `--_<c>-<slot>` token through its public `--cui-<c>-<slot>` layer, inside zero-specificity
 * rules. Nothing about how they look may change. `token-layer-identity.baseline.json` holds
 * the computed styles of each part, recorded from develop BEFORE the conversion: each size,
 * variant and colour role that exists, plus the dark, hover, focus, error and glow states
 * that move paint. Real browser: jsdom computes none of this.
 *
 * To re-record, empty the baseline: each missing scenario prints its snapshot before failing.
 */

/** [selector within the host (`|::after` for a pseudo-element), computed properties recorded] */
type Part = [string, string[]];
const FRAME = ["border-top-width", "border-top-style", "border-top-color", "border-top-left-radius"];
const BOX: string[] = ["background-color", "color", ...FRAME, "border-bottom-width", "border-bottom-color", "opacity", "padding-top", "padding-left"];
const RING = ["outline-style", "outline-width", "outline-color", "outline-offset"];

const PARTS: Record<string, Record<string, Part>> = {
  alert: {
    root: [".cui-alert", BOX],
    icon: [".cui-alert__icon", ["color"]],
    dismiss: [".cui-alert__dismiss", ["color", "opacity", "background-color"]],
    glow: [".cui-alert|::after", ["box-shadow", "content"]],
  },
  banner: {
    root: [".cui-banner", [...BOX, "border-right-width", "border-left-width", "column-gap"]],
    content: [".cui-banner__content", ["font-size", "text-align"]],
  },
  toast: {
    root: [".cui-toast", [...BOX, "box-shadow"]],
    icon: [".cui-toast__icon", ["color"]],
    dismiss: [".cui-toast__dismiss", ["color", "opacity"]],
    progress: [".cui-toast__progress", ["background-color", "height"]],
    bar: [".cui-toast__progress-bar", ["background-color"]],
    glow: [".cui-toast|::after", ["box-shadow", "content"]],
  },
  tabs: {
    active: [".cui-tabs__tab--active", ["color", "background-color", "box-shadow", ...RING, "border-top-left-radius"]],
    inactive: [".cui-tabs__tab:not(.cui-tabs__tab--active):not(.cui-tabs__tab--disabled)", ["color", "background-color", "box-shadow", ...RING, "border-top-left-radius"]],
    disabled: [".cui-tabs__tab--disabled", ["color", "opacity", "box-shadow"]],
    button: [".cui-tabs__tab-button", ["color", "background-color", "padding-left", ...RING]],
    close: [".cui-tabs__tab-close", ["color", "background-color"]],
  },
  list: {
    first: [".cui-list-item:first-child", ["border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "background-color", "border-top-width", "border-top-color", "border-bottom-width"]],
    last: [".cui-list-item:last-child", ["border-top-left-radius", "border-bottom-left-radius", "border-bottom-right-radius", "background-color", "border-bottom-width", "border-bottom-color"]],
    row: [".cui-list-item__row", ["background-color", "border-top-left-radius", ...RING]],
  },
  "tag-input": {
    control: [".cui-tag-input__control", ["min-height", "padding-top", "padding-left", ...FRAME, "background-color", "font-size", "opacity", "box-shadow"]],
    input: [".cui-tag-input__input", ["font-size", "color"]],
  },
};

type Scenario = {
  kind: keyof typeof PARTS;
  make: () => Component;
  mode?: "dark";
  state?: "hover" | "focus";
  at?: string;
  /** [selector, property] that must be set in this state, so a state that never took cannot pass. */
  ring?: [string, string];
};
const SCENARIOS: Record<string, Scenario> = {};
const add = (name: string, s: Scenario) => (SCENARIOS[name] = s);
const wrap = (component: Component, props: Record<string, unknown>, slots?: Record<string, () => unknown>): Component => ({
  render: () => h(component, props, slots as never),
});

// --- CuiAlert ---
const ALERT = { dismissible: true, entrance: "none", title: "T" };
const alert = (props: Record<string, unknown>) => () => wrap(CuiAlert, { ...ALERT, ...props }, { default: () => "Body" });
for (const variant of ["solid", "subtle", "outline"] as const) {
  for (const color of ["info", "error", "surface"] as const) add(`alert-${variant}-${color}`, { kind: "alert", make: alert({ variant, color }) });
  add(`alert-${variant}-dark`, { kind: "alert", mode: "dark", make: alert({ variant, color: "success" }) });
  add(`alert-${variant}-glow`, { kind: "alert", make: alert({ variant, color: "warning", animation: "glow" }) });
}
add("alert-subtle-glow-dark", { kind: "alert", mode: "dark", make: alert({ color: "warning", animation: "glow" }) });
add("alert-subtle-rounded-none", { kind: "alert", make: alert({ rounded: "none" }) });
add("alert-subtle-rounded-full", { kind: "alert", make: alert({ rounded: "full", color: "success" }) });
add("alert-subtle-hover-dismiss", { kind: "alert", state: "hover", at: ".cui-alert__dismiss", make: alert({}) });

// --- CuiBanner ---
const banner = (props: Record<string, unknown>) => () => wrap(CuiBanner, props, { default: () => "Notice" });
for (const variant of ["solid", "subtle"] as const) {
  for (const position of ["top", "bottom", "inline"] as const) add(`banner-${variant}-${position}`, { kind: "banner", make: banner({ variant, position, color: "info" }) });
  add(`banner-${variant}-dark`, { kind: "banner", mode: "dark", make: banner({ variant, color: "error", position: "inline" }) });
  add(`banner-${variant}-dark-top`, { kind: "banner", mode: "dark", make: banner({ variant, color: "warning", position: "top" }) });
}
add("banner-subtle-bottom-success", { kind: "banner", make: banner({ position: "bottom", color: "success" }) });

// --- CuiToast ---
const toast = (props: Record<string, unknown>) => () => wrap(CuiToast, { title: "T", autoDismiss: 60000, ...props }, { default: () => "Body" });
for (const variant of ["solid", "subtle", "outline"] as const) {
  for (const color of ["primary", "error", "surface"] as const) add(`toast-${variant}-${color}`, { kind: "toast", make: toast({ variant, color }) });
  add(`toast-${variant}-dark`, { kind: "toast", mode: "dark", make: toast({ variant, color: "success" }) });
  add(`toast-${variant}-glow`, { kind: "toast", make: toast({ variant, color: "warning", animation: "glow" }) });
}
add("toast-subtle-glow-dark", { kind: "toast", mode: "dark", make: toast({ color: "warning", animation: "glow" }) });

// --- CuiTabs ---
const tabs = (props: Record<string, unknown>, closeable = false) => () =>
  wrap(CuiTabs, { modelValue: "a", ...props }, {
    default: () => [
      h(CuiTab, { value: "a", label: "A", closeable }, () => "a"),
      h(CuiTab, { value: "b", label: "B", closeable }, () => "b"),
      h(CuiTab, { value: "c", label: "C", disabled: true }, () => "c"),
    ],
  });
const INACTIVE = ".cui-tabs__tab:not(.cui-tabs__tab--active):not(.cui-tabs__tab--disabled)";
const FOCUSED = ".cui-tabs__tab:has(.cui-tabs__tab-button:focus-visible)";
for (const variant of ["underline", "segmented"] as const) {
  for (const orientation of ["horizontal", "vertical"] as const) {
    add(`tabs-${variant}-${orientation}`, { kind: "tabs", make: tabs({ variant, orientation }, true) });
    add(`tabs-${variant}-${orientation}-dark`, { kind: "tabs", mode: "dark", make: tabs({ variant, orientation, color: "success" }) });
  }
  add(`tabs-${variant}-error`, { kind: "tabs", make: tabs({ variant, color: "error" }) });
  add(`tabs-${variant}-hover-active`, { kind: "tabs", state: "hover", at: ".cui-tabs__tab--active", make: tabs({ variant }) });
  add(`tabs-${variant}-hover-inactive`, { kind: "tabs", state: "hover", at: INACTIVE, make: tabs({ variant }) });
  add(`tabs-${variant}-focus`, { kind: "tabs", state: "focus", at: ".cui-tabs__tab-button", ring: [FOCUSED, "outline-style"], make: tabs({ variant, color: "info" }) });
  add(`tabs-${variant}-focus-dark`, { kind: "tabs", mode: "dark", state: "focus", at: ".cui-tabs__tab-button", ring: [FOCUSED, "outline-style"], make: tabs({ variant }) });
}

// --- CuiList / CuiListItem ---
const list = (props: Record<string, unknown>) => () =>
  wrap(CuiList, props, { default: () => [h(CuiListItem, { title: "One", chevron: true, onClick: () => {} }), h(CuiListItem, { title: "Two" }), h(CuiListItem, { title: "Three" })] });
add("list-plain", { kind: "list", make: list({}) });
add("list-plain-rounded", { kind: "list", make: list({ rounded: "lg" }) });
add("list-plain-rounded-full", { kind: "list", make: list({ rounded: "full" }) });
add("list-inset", { kind: "list", make: list({ variant: "inset" }) });
add("list-inset-dark", { kind: "list", mode: "dark", make: list({ variant: "inset" }) });
for (const rounded of ["none", "sm", "md", "lg", "full"] as const) add(`list-inset-${rounded}`, { kind: "list", make: list({ variant: "inset", rounded }) });
add("list-inset-hover", { kind: "list", state: "hover", at: ".cui-list-item__row--interactive", make: list({ variant: "inset", rounded: "lg" }) });
add("list-plain-hover-dark", { kind: "list", mode: "dark", state: "hover", at: ".cui-list-item__row--interactive", make: list({ rounded: "md" }) });
add("list-inset-focus", { kind: "list", state: "focus", at: ".cui-list-item__row--interactive", ring: [".cui-list-item__row--interactive", "outline-style"], make: list({ variant: "inset" }) });

// --- CuiTagInput ---
const tagInput = (props: Record<string, unknown>) => () => wrap(CuiTagInput, { modelValue: ["x", "y"], ...props });
for (const size of ["xs", "sm", "md", "lg", "xl"] as const) add(`tag-input-${size}`, { kind: "tag-input", make: tagInput({ size }) });
add("tag-input-rounded-full", { kind: "tag-input", make: tagInput({ rounded: "full" }) });
add("tag-input-rounded-none", { kind: "tag-input", make: tagInput({ rounded: "none", color: "success" }) });
add("tag-input-dark", { kind: "tag-input", mode: "dark", make: tagInput({}) });
add("tag-input-error", { kind: "tag-input", make: tagInput({ error: true }) });
add("tag-input-error-dark", { kind: "tag-input", mode: "dark", make: tagInput({ error: true }) });
add("tag-input-disabled", { kind: "tag-input", make: tagInput({ disabled: true }) });

/** Finite animations and transitions finish at once; loops are left running. */
function settle(root: Element) {
  for (const a of root.getAnimations({ subtree: true })) {
    if (a.effect?.getComputedTiming().iterations !== Infinity) a.finish();
  }
}

function snapshot(kind: string, host: ParentNode) {
  const out: Record<string, string[]> = {};
  for (const [part, [spec, props]] of Object.entries(PARTS[kind])) {
    const [sel, pseudo] = spec.split("|");
    const el = host.querySelector(sel);
    if (!el) continue;
    const cs = getComputedStyle(el, pseudo);
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

describe("Alert, Banner, Toast, Tabs, ListItem and TagInput look the same as before the token layer (#454, real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens-454b";
    style.textContent = `${main}\n${colourScale()}`;
    document.head.append(style);
  });
  afterAll(() => document.getElementById("cui-tokens-454b")?.remove());

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
      host.style.width = "500px";
      document.body.append(host);
      hosts.push(host);
      wrappers.push(mount(scenario.make(), { attachTo: host }));
      await nextTick();
      await new Promise((r) => requestAnimationFrame(() => r(null)));

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
        const target = host.querySelector(sel);
        expect(target, `${name}: no ${sel}`).toBeTruthy();
        expect(getComputedStyle(target!).getPropertyValue(prop), `${name}: the ${scenario.state} state never took`).not.toMatch(/^(none|)$/);
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
