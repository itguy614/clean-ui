/**
 * Shared by `modal-family-identity.test.ts` and the throwaway that recorded
 * `modal-family-identity.baseline.json` (#489). Every element of each component's subtree is
 * read by structure (tag path), never by class, so the same capture reads the inline-style
 * build the baseline came from and the stylesheet build that has to match it.
 */
import { mount } from "@vue/test-utils";
import { h, nextTick } from "vue";
import CuiModalHeader from "../../components/CuiModalHeader.vue";
import CuiModalBody from "../../components/CuiModalBody.vue";
import CuiModalFooter from "../../components/CuiModalFooter.vue";
import CuiConfirmDialog from "../../components/CuiConfirmDialog.vue";

const round = (n: number) => Math.round(n * 100) / 100;

const PROPS = [
  "display", "flex-direction", "align-items", "justify-content", "flex-grow", "flex-shrink", "flex-basis",
  "gap", "padding-top", "padding-right", "padding-bottom", "padding-left",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "background-color", "color", "cursor", "position", "z-index", "min-width", "min-height", "max-height",
  "width", "height", "overflow-x", "overflow-y", "box-sizing",
  "border-top-width", "border-top-style", "border-top-color",
  "border-right-width", "border-right-style", "border-right-color",
  "border-bottom-width", "border-bottom-style", "border-bottom-color",
  "border-left-width", "border-left-style", "border-left-color",
  "border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius",
  "font-size", "font-weight", "font-family", "line-height", "text-transform", "letter-spacing",
  "outline-style", "outline-color", "box-shadow", "opacity", "transform", "animation-name", "animation-duration",
];
const TRANSITION = ["transition-property", "transition-duration", "transition-timing-function"];
const ATTRS = ["tabindex", "role", "aria-label", "aria-hidden", "aria-labelledby", "type", "disabled"];

function describe(el: Element, rootBox: DOMRect, withTransition: boolean) {
  const cs = getComputedStyle(el);
  const b = el.getBoundingClientRect();
  const out: Record<string, string | number | null> = {
    tag: el.tagName.toLowerCase(),
    text: [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent!.trim()).join(" ").slice(0, 24),
    x: round(b.left - rootBox.left),
    y: round(b.top - rootBox.top),
    w: round(b.width),
    h: round(b.height),
  };
  for (const p of PROPS) out[p] = cs.getPropertyValue(p);
  if (withTransition) for (const p of TRANSITION) out[p] = cs.getPropertyValue(p);
  for (const a of ATTRS) out[`@${a}`] = el.getAttribute(a);
  // A running spinner is sampled at a different angle each time: its box and transform are
  // whatever the frame was, so only the animation's own name and duration are recorded.
  if (cs.animationName !== "none") for (const k of ["x", "y", "w", "h", "transform"]) out[k] = "animated";
  return out;
}

function walk(root: Element, withTransition: boolean) {
  const box = root.getBoundingClientRect();
  return [root, ...root.querySelectorAll("*")]
    // SVG internals are the icon's own, unchanged by this conversion.
    .filter((el) => !el.closest("svg") || el.tagName.toLowerCase() === "svg")
    .map((el) => describe(el, box, withTransition));
}

export interface Scenario {
  component: "header" | "body" | "footer" | "confirm";
  props?: Record<string, unknown>;
  slots?: Record<string, string>;
  dark?: boolean;
  density?: string;
  /** Hover the close button before capturing. */
  hover?: boolean;
  /** Host height, for a body that has to scroll. */
  height?: string;
}

const settle = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const TALL = Array.from({ length: 30 }, (_, i) => `<p>Line ${i}</p>`).join("");

export async function capture(scenario: Scenario, hover?: (el: Element) => Promise<void>) {
  const host = document.createElement("div");
  if (scenario.dark) host.className = "dark";
  host.style.width = "480px";
  if (scenario.height) host.style.height = scenario.height;
  if (scenario.density) host.style.setProperty("--cui-density-scale", scenario.density);
  document.body.append(host);
  // A teleported dialog sits in <body>, outside `host`: the mode and density go on <body> too.
  if (scenario.component === "confirm") {
    if (scenario.dark) document.body.classList.add("dark");
    if (scenario.density) document.body.style.setProperty("--cui-density-scale", scenario.density);
  }
  const slots = Object.fromEntries(
    Object.entries(scenario.slots ?? {}).map(([k, v]) => [k, () => h("span", { innerHTML: v })]),
  );
  const component = { header: CuiModalHeader, body: CuiModalBody, footer: CuiModalFooter, confirm: CuiConfirmDialog }[scenario.component];
  const wrapper = mount(component as never, {
    props: { ...(scenario.component === "confirm" ? { visible: true } : {}), ...scenario.props } as never,
    slots,
    attachTo: host,
  });
  // The column the modal body flexes in: `wrapper.element` is the mount node VTU wraps the component in.
  if (scenario.height) Object.assign((wrapper.element as HTMLElement).style, { display: "flex", flexDirection: "column", height: "100%" });
  await nextTick();
  await settle();
  await settle();
  const root = (scenario.component === "confirm" ? document.querySelector(".cui-confirm-dialog") : wrapper.element) as HTMLElement;
  // Wait out the modal's entry transition, which would otherwise be sampled mid-scale.
  if (scenario.component === "confirm") for (const a of root.getAnimations()) await a.finished.catch(() => undefined);
  const transitions = walk(root, true).map((d) => TRANSITION.map((p) => d[p]).join("|"));
  const still = document.createElement("style");
  still.textContent = "*, *::before, *::after { transition: none !important; }";
  document.head.append(still);
  const button = root.querySelector("button");
  if (scenario.hover && button && hover) {
    await hover(button);
    await settle();
  }
  const tree = walk(root, false);
  wrapper.unmount();
  host.remove();
  still.remove();
  document.body.classList.remove("dark");
  document.body.style.removeProperty("--cui-density-scale");
  return JSON.parse(JSON.stringify({ transitions, tree }));
}

export const SCENARIOS: Record<string, Scenario> = {};
const buttons = `<button type="button">A</button>`;
for (const dark of [false, true]) {
  const m = dark ? "dark" : "light";
  SCENARIOS[`header-title-${m}`] = { component: "header", dark, props: { title: "Dialog title" } };
  SCENARIOS[`header-actions-${m}`] = { component: "header", dark, props: { title: "Dialog title" }, slots: { actions: buttons } };
  SCENARIOS[`header-hover-${m}`] = { component: "header", dark, hover: true, props: { title: "Dialog title" } };
  SCENARIOS[`body-${m}`] = { component: "body", dark, slots: { default: "<p>Body text</p>" } };
  SCENARIOS[`body-scroll-${m}`] = { component: "body", dark, height: "120px", slots: { default: TALL } };
  for (const align of ["left", "right", "center", "between"]) {
    SCENARIOS[`footer-${align}-${m}`] = { component: "footer", dark, props: { align }, slots: { default: `${buttons}${buttons}` } };
  }
  for (const variant of ["danger", "warning", "info", "primary"]) {
    SCENARIOS[`confirm-${variant}-${m}`] = { component: "confirm", dark, props: { variant, title: "Delete it?", message: "This cannot be undone." } };
  }
  SCENARIOS[`confirm-word-${m}`] = { component: "confirm", dark, props: { title: "Delete it?", message: "This cannot be undone.", confirmWord: "delete" } };
}
SCENARIOS["header-no-close"] = { component: "header", props: { title: "Dialog title", noCloseButton: true } };
SCENARIOS["header-slot"] = { component: "header", slots: { default: "<em>Custom</em>" } };
SCENARIOS["header-empty"] = { component: "header" };
SCENARIOS["header-hidden"] = { component: "header", props: { title: "Dialog title", hidden: true } };
SCENARIOS["header-compact"] = { component: "header", density: "0.75", props: { title: "Dialog title" }, slots: { actions: buttons } };
SCENARIOS["header-spacious"] = { component: "header", density: "1.25", props: { title: "Dialog title" }, slots: { actions: buttons } };
SCENARIOS["body-no-padding"] = { component: "body", props: { noPadding: true }, slots: { default: "<p>Body text</p>" } };
SCENARIOS["body-hidden"] = { component: "body", props: { hidden: true }, slots: { default: "<p>Body text</p>" } };
SCENARIOS["body-compact"] = { component: "body", density: "0.75", slots: { default: "<p>Body text</p>" } };
SCENARIOS["body-spacious"] = { component: "body", density: "1.25", slots: { default: "<p>Body text</p>" } };
SCENARIOS["footer-hidden"] = { component: "footer", props: { hidden: true }, slots: { default: buttons } };
SCENARIOS["footer-compact"] = { component: "footer", density: "0.75", slots: { default: `${buttons}${buttons}` } };
SCENARIOS["footer-spacious"] = { component: "footer", density: "1.25", slots: { default: `${buttons}${buttons}` } };
SCENARIOS["confirm-confirm-color"] = { component: "confirm", props: { title: "T", message: "M", confirmColor: "success" } };
SCENARIOS["confirm-no-icon"] = { component: "confirm", props: { title: "T", message: "M", icon: false } };
SCENARIOS["confirm-no-message"] = { component: "confirm", props: { title: "T" } };
SCENARIOS["confirm-slot"] = { component: "confirm", props: { title: "T" }, slots: { default: "<b>Rich</b> message" } };
SCENARIOS["confirm-loading"] = { component: "confirm", props: { title: "T", message: "M", loading: true } };
SCENARIOS["confirm-word-prompt"] = { component: "confirm", props: { title: "T", confirmWord: "x", confirmPrompt: "Type x to go" } };
SCENARIOS["confirm-compact"] = { component: "confirm", density: "0.75", props: { title: "T", message: "M", confirmWord: "x" } };
SCENARIOS["confirm-spacious"] = { component: "confirm", density: "1.25", props: { title: "T", message: "M", confirmWord: "x" } };
SCENARIOS["confirm-hidden"] = { component: "confirm", props: { title: "T", message: "M", hidden: true } };
