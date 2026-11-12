/**
 * Shared by `divider-kbd-timeline-identity.test.ts` and the throwaway that recorded
 * `divider-kbd-timeline-identity.baseline.json` (#489). It walks every element of a mounted
 * component and records its computed style and geometry, so the same capture reads the
 * inline-style build the baseline came from and the stylesheet build that has to match it.
 */
import { mount } from "@vue/test-utils";
import { h, nextTick } from "vue";
import CuiDivider from "../../components/CuiDivider.vue";
import CuiKbd from "../../components/CuiKbd.vue";
import CuiTimeline from "../../components/CuiTimeline.vue";
import CuiTimelineItem from "../../components/CuiTimelineItem.vue";

const round = (n: number) => Math.round(n * 100) / 100;

const PROPS = [
  "display", "flex-direction", "align-items", "align-self", "justify-content", "flex-grow", "flex-shrink", "flex-basis", "gap",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "background-color", "color",
  "border-top-width", "border-top-style", "border-top-color",
  "border-right-width", "border-right-style", "border-right-color",
  "border-bottom-width", "border-bottom-style", "border-bottom-color",
  "border-left-width", "border-left-style", "border-left-color",
  "border-top-left-radius", "border-bottom-right-radius",
  "font-size", "font-weight", "font-family", "line-height", "letter-spacing", "text-transform",
  "white-space", "vertical-align", "position", "z-index", "min-width", "min-height", "box-sizing", "box-shadow", "opacity",
];

function describe(el: Element, rootBox: DOMRect) {
  const cs = getComputedStyle(el);
  const b = el.getBoundingClientRect();
  const out: Record<string, string | number> = {
    tag: el.tagName.toLowerCase(),
    x: round(b.left - rootBox.left),
    y: round(b.top - rootBox.top),
    w: round(b.width),
    h: round(b.height),
  };
  for (const p of PROPS) out[p] = cs.getPropertyValue(p);
  return out;
}

export interface Scenario {
  component: "divider" | "kbd" | "timeline-item";
  props?: Record<string, unknown>;
  /** Default-slot text. */
  slot?: string;
  dark?: boolean;
  density?: string;
  /** Wrap the host in `.cui-typography`. */
  typography?: boolean;
  /** Host inline style (a vertical divider needs a row with a height). */
  hostStyle?: string;
}

const LEGACY_CLASSES = ["cui-divider", "cui-kbd", "cui-timeline-item", "cui-timeline"];

const settle =() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

export async function capture(scenario: Scenario) {
  const outer = document.createElement("div");
  if (scenario.typography) outer.className = "cui-typography";
  if (scenario.dark) outer.classList.add("dark");
  const host = document.createElement("div");
  host.style.cssText = `width: 360px; ${scenario.hostStyle ?? ""}`;
  if (scenario.density) host.style.setProperty("--cui-density-scale", scenario.density);
  outer.append(host);
  document.body.append(outer);
  const slot = scenario.slot ? () => scenario.slot : undefined;
  const wrapper =
    scenario.component === "divider"
      ? mount(CuiDivider, { props: scenario.props as never, slots: slot ? { default: slot } : {}, attachTo: host })
      : scenario.component === "kbd"
        ? mount(
            { render: () => h("p", { style: "margin:0;font-size:16px" }, ["Press ", h(CuiKbd, scenario.props as never, { default: () => scenario.slot ?? "Esc" }), " now"]) },
            { attachTo: host },
          )
        : mount(
            {
              render: () =>
                h(CuiTimeline, null, {
                  default: () => [
                    h(CuiTimelineItem, scenario.props as never, slot ? { default: slot } : {}),
                    h(CuiTimelineItem, { title: "Next", timestamp: "later", last: true }),
                  ],
                }),
            },
            { attachTo: host },
          );
  await nextTick();
  await settle();
  const root = wrapper.element as HTMLElement;
  const box = root.getBoundingClientRect();
  const out = [root, ...root.querySelectorAll("*")].map((el) => ({
    ...describe(el, box),
    // The classes the components carried before the conversion (it adds modifier and part classes).
    cls: [...el.classList].filter((c) => LEGACY_CLASSES.includes(c)),
    attrs: [...el.attributes].filter((a) => !a.name.startsWith("data-v") && !["style", "id", "class"].includes(a.name)).map((a) => `${a.name}=${a.value}`),
    text: el.children.length ? "" : el.textContent?.trim(),
  }));
  wrapper.unmount();
  outer.remove();
  return JSON.parse(JSON.stringify(out));
}

const ROLES = ["primary", "secondary", "success", "error", "warning", "info", "surface", "surface-light", "surface-dark"];
const ROW = "display:flex;height:80px;align-items:stretch;";

export const SCENARIOS: Record<string, Scenario> = {};
// Divider
for (const dark of [false, true]) {
  const m = dark ? "dark" : "light";
  for (const variant of ["solid", "dashed", "dotted"]) {
    SCENARIOS[`divider-${m}-horizontal-${variant}`] = { component: "divider", dark, props: { variant } };
    SCENARIOS[`divider-${m}-vertical-${variant}`] = { component: "divider", dark, hostStyle: ROW, props: { orientation: "vertical", variant } };
  }
  for (const pos of ["start", "center", "end"]) {
    SCENARIOS[`divider-${m}-label-${pos}`] = { component: "divider", dark, props: { label: "Or", labelPosition: pos } };
    SCENARIOS[`divider-${m}-vertical-label-${pos}`] = { component: "divider", dark, hostStyle: ROW, props: { orientation: "vertical", label: "Or", labelPosition: pos } };
  }
}
for (const role of ROLES) {
  SCENARIOS[`divider-role-${role}`] = { component: "divider", props: { color: role } };
  SCENARIOS[`divider-role-${role}-label`] = { component: "divider", props: { color: role, label: "Section", variant: "dashed" } };
  SCENARIOS[`divider-role-${role}-vertical`] = { component: "divider", hostStyle: ROW, props: { color: role, orientation: "vertical" } };
}
SCENARIOS["divider-css-color"] = { component: "divider", props: { color: "rebeccapurple" } };
SCENARIOS["divider-css-color-label"] = { component: "divider", props: { color: "rgb(10, 200, 30)", label: "Custom" } };
SCENARIOS["divider-css-color-vertical"] = { component: "divider", hostStyle: ROW, props: { color: "#ff8800", orientation: "vertical" } };
SCENARIOS["divider-css-color-vertical-label"] = { component: "divider", hostStyle: ROW, props: { color: "#ff8800", orientation: "vertical", label: "Custom" } };
SCENARIOS["divider-spacing"] = { component: "divider", props: { spacing: "1.5rem" } };
SCENARIOS["divider-spacing-label"] = { component: "divider", props: { spacing: "1.5rem", label: "Spaced" } };
SCENARIOS["divider-spacing-vertical"] = { component: "divider", hostStyle: ROW, props: { spacing: "1.5rem", orientation: "vertical" } };
SCENARIOS["divider-spacing-vertical-label"] = { component: "divider", hostStyle: ROW, props: { spacing: "1.5rem", orientation: "vertical", label: "Spaced" } };
SCENARIOS["divider-slot-label"] = { component: "divider", slot: "From slot" };
SCENARIOS["divider-compact"] = { component: "divider", density: "0.75", props: { label: "Dense" } };
SCENARIOS["divider-compact-vertical"] = { component: "divider", density: "0.75", hostStyle: ROW, props: { label: "Dense", orientation: "vertical" } };
SCENARIOS["divider-spacious"] = { component: "divider", density: "1.25", props: { label: "Roomy" } };
SCENARIOS["divider-hidden"] = { component: "divider", props: { hidden: true } };
SCENARIOS["divider-hidden-label"] = { component: "divider", props: { hidden: true, label: "x" } };
SCENARIOS["divider-hidden-vertical"] = { component: "divider", props: { hidden: true, orientation: "vertical" } };
// Kbd
for (const dark of [false, true]) {
  for (const typography of [false, true]) {
    for (const size of ["xs", "sm", "md", "lg", "xl"]) {
      SCENARIOS[`kbd-${dark ? "dark" : "light"}-${typography ? "typography" : "bare"}-${size}`] = { component: "kbd", dark, typography, props: { size } };
    }
  }
}
SCENARIOS["kbd-glyph"] = { component: "kbd", slot: "⌘" };
SCENARIOS["kbd-long"] = { component: "kbd", slot: "Page Down" };
SCENARIOS["kbd-compact"] = { component: "kbd", density: "0.75", props: { size: "lg" } };
SCENARIOS["kbd-spacious"] = { component: "kbd", density: "1.25", props: { size: "sm" } };
SCENARIOS["kbd-hidden"] = { component: "kbd", props: { hidden: true } };
// TimelineItem
const BODY = "Deployed to production.";
for (const dark of [false, true]) {
  const m = dark ? "dark" : "light";
  for (const role of ROLES) {
    SCENARIOS[`timeline-${m}-${role}-dot`] = { component: "timeline-item", dark, slot: BODY, props: { color: role, title: "Release", timestamp: "2 min ago" } };
    SCENARIOS[`timeline-${m}-${role}-icon`] = { component: "timeline-item", dark, slot: BODY, props: { color: role, icon: "check", title: "Release", timestamp: "2 min ago" } };
  }
}
SCENARIOS["timeline-default"] = { component: "timeline-item", props: { title: "Plain" } };
SCENARIOS["timeline-last"] = { component: "timeline-item", slot: BODY, props: { title: "Done", last: true } };
SCENARIOS["timeline-last-icon"] = { component: "timeline-item", props: { title: "Done", last: true, icon: "check" } };
SCENARIOS["timeline-title-only"] = { component: "timeline-item", props: { title: "Only a title" } };
SCENARIOS["timeline-timestamp-only"] = { component: "timeline-item", props: { timestamp: "yesterday" } };
SCENARIOS["timeline-body-only"] = { component: "timeline-item", slot: BODY };
SCENARIOS["timeline-body-only-icon"] = { component: "timeline-item", slot: BODY, props: { icon: "check" } };
SCENARIOS["timeline-long-title"] = { component: "timeline-item", slot: BODY, props: { title: "A rather long title that should wrap around the narrow column of the host", timestamp: "2 min ago", icon: "check" } };
SCENARIOS["timeline-compact"] = { component: "timeline-item", density: "0.75", slot: BODY, props: { title: "Dense", timestamp: "now", icon: "check" } };
SCENARIOS["timeline-spacious"] = { component: "timeline-item", density: "1.25", slot: BODY, props: { title: "Roomy", timestamp: "now" } };
SCENARIOS["timeline-hidden"] = { component: "timeline-item", props: { title: "Hidden", hidden: true } };
