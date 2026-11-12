/**
 * Shared by `code-block-identity.test.ts` and the throwaway that recorded
 * `code-block-identity.baseline.json` (#484). Parts are found by structure, not by class, so
 * the same capture reads the inline-style build the baseline came from and the stylesheet
 * build that has to match it.
 */
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiCodeBlock from "../../components/CuiCodeBlock.vue";

const round = (n: number) => Math.round(n * 100) / 100;

const PROPS = [
  "display", "flex-direction", "align-items", "justify-content", "flex-grow", "flex-shrink", "flex-basis",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "background-color", "color",
  "border-top-width", "border-top-style", "border-top-color",
  "border-right-width", "border-right-style", "border-right-color",
  "border-bottom-width", "border-bottom-style", "border-bottom-color",
  "border-left-width", "border-left-style", "border-left-color",
  "border-top-left-radius", "border-bottom-right-radius",
  "font-size", "font-weight", "font-family", "font-style", "line-height", "letter-spacing", "text-transform",
  "white-space", "user-select", "overflow-x", "overflow-y", "max-height", "min-width", "position",
  "outline-style", "outline-width", "outline-color", "outline-offset", "box-sizing", "box-shadow", "opacity", "transform",
];

function describe(el: Element | null, rootBox: DOMRect) {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const b = el.getBoundingClientRect();
  const out: Record<string, string | number> = {
    x: round(b.left - rootBox.left),
    y: round(b.top - rootBox.top),
    w: round(b.width),
    h: round(b.height),
  };
  for (const p of PROPS) out[p] = cs.getPropertyValue(p);
  return out;
}

/** Runs of identical rows (every plain line of a block) collapse to `[count, row]`; `y` is dropped, `h` and the count fix it. */
function runs(els: Element[], rootBox: DOMRect) {
  const out: Array<[number, string]> = [];
  for (const el of els) {
    const d = describe(el, rootBox) as Record<string, unknown>;
    delete d.y;
    const key = JSON.stringify(d);
    const last = out[out.length - 1];
    if (last && last[1] === key) last[0]++;
    else out.push([1, key]);
  }
  return out;
}

export interface Scenario {
  props: Record<string, unknown>;
  dark?: boolean;
  density?: string;
  /** Hover the copy button before capturing. */
  hover?: boolean;
  /** Focus the scroller before capturing. */
  focus?: boolean;
}

const settle = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

export async function capture(scenario: Scenario, hover?: (el: Element) => Promise<void>) {
  // A hover colour is a transition: measure where it lands, not partway.
  const still = document.createElement("style");
  still.textContent = "*, *::before, *::after { transition: none !important; }";
  document.head.append(still);
  const host = document.createElement("div");
  if (scenario.dark) host.className = "dark";
  host.style.width = "360px";
  if (scenario.density) host.style.setProperty("--cui-density-scale", scenario.density);
  document.body.append(host);
  const wrapper = mount(CuiCodeBlock, { props: scenario.props as never, attachTo: host });
  await nextTick();
  await settle();
  const root = wrapper.element as HTMLElement;
  const pre = root.querySelector("pre") as HTMLElement;
  const header = pre.previousElementSibling as HTMLElement | null;
  if (scenario.focus) pre.focus();
  const button = root.querySelector("button");
  if (scenario.hover && button && hover) {
    await hover(button);
    await settle();
  }
  const box = root.getBoundingClientRect();
  const gutter = pre.querySelector(":scope > [aria-hidden]");
  const code = pre.querySelector(":scope > code") as HTMLElement;
  const title = header?.firstElementChild;
  const out = {
    hidden: root.style.display,
    root: describe(root, box),
    header: describe(header, box),
    title: describe(title?.textContent?.trim() ? title : null, box),
    copy: describe(header?.lastElementChild?.querySelector("button") ? header.lastElementChild : null, box),
    button: describe(button, box),
    icon: describe(root.querySelector(".cui-icon"), box),
    pre: describe(pre, box),
    preScroll: { sh: pre.scrollHeight, ch: pre.clientHeight, sw: pre.scrollWidth, cw: pre.clientWidth, tabindex: pre.getAttribute("tabindex"), role: pre.getAttribute("role") },
    gutter: describe(gutter, box),
    numbers: gutter ? runs([...gutter.children], box) : [],
    code: describe(code, box),
    lines: runs([...code.children], box),
  };
  wrapper.unmount();
  host.remove();
  still.remove();
  return JSON.parse(JSON.stringify(out));
}

const CODE = ["const a = 1;", "function greet(name) {", '  return "hello " + name;', "}", "", "greet(a);"].join("\n");
const TALL = Array.from({ length: 40 }, (_, i) => `const v${i} = ${i};`).join("\n");

export const SCENARIOS: Record<string, Scenario> = {};
for (const dark of [false, true]) {
  for (const size of ["sm", "md", "lg"]) {
    for (const nums of [true, false]) {
      SCENARIOS[`${dark ? "dark" : "light"}-${size}-${nums ? "numbers" : "plain"}`] = {
        dark,
        props: { code: CODE, language: "ts", size, lineNumbers: nums, highlightLines: [2, 3] },
      };
    }
  }
}
SCENARIOS["filename"] = { props: { code: CODE, filename: "app.ts", language: "ts" } };
SCENARIOS["copy-only"] = { props: { code: CODE } };
SCENARIOS["label-only"] = { props: { code: CODE, language: "ts", copyable: false } };
SCENARIOS["bare"] = { props: { code: CODE, copyable: false } };
SCENARIOS["bare-numbers"] = { props: { code: CODE, copyable: false, lineNumbers: true } };
SCENARIOS["start-line"] = { props: { code: CODE, lineNumbers: true, startLine: 98, highlightLines: [100] } };
SCENARIOS["compact"] = { density: "0.75", props: { code: CODE, language: "ts", lineNumbers: true, highlightLines: [1] } };
SCENARIOS["spacious"] = { density: "1.25", props: { code: CODE, language: "ts", size: "lg", highlightLines: [1] } };
SCENARIOS["max-height"] = { props: { code: TALL, maxHeight: "120px", lineNumbers: true, language: "ts" } };
SCENARIOS["max-height-dark"] = { dark: true, props: { code: TALL, maxHeight: "120px", language: "ts" } };
SCENARIOS["wide"] = { props: { code: `const x = "${"y".repeat(300)}";`, language: "ts" } };
SCENARIOS["hidden"] = { props: { code: CODE, hidden: true } };
SCENARIOS["hover-copy"] = { hover: true, props: { code: CODE, language: "ts" } };
SCENARIOS["hover-copy-dark"] = { hover: true, dark: true, props: { code: CODE, language: "ts" } };
SCENARIOS["focus-scroller"] = { focus: true, props: { code: TALL, maxHeight: "120px" } };
