import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { cdp, userEvent } from "@vitest/browser/context";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens, frames } from "../../../../../config/test/browser-helpers";
import { motionDuration } from "../../utils/motion";
import CuiAccordion from "../../components/CuiAccordion.vue";
import CuiAccordionItem from "../../components/CuiAccordionItem.vue";
import CuiFieldset from "../../components/CuiFieldset.vue";
import CuiTreeView from "../../components/CuiTreeView.vue";

/**
 * #270 / #176 / #162 — Accordion, Fieldset and TreeNode collapse with
 * `grid-template-rows: 0fr → 1fr`, and the content of a shut one is hidden
 * (`hidden="until-found"`) so it is out of the tab order and the accessibility tree. The old
 * `max-height: 0` left every field and link inside a closed section tabbable and announced.
 *
 * Real browser: tab order, the accessibility tree and a running transition are none of them
 * things jsdom has.
 */

type FrameTree = { frame: { id: string; url: string }; childFrames?: FrameTree[] };
const flatten = (t: FrameTree): Array<{ id: string; url: string }> => [t.frame, ...(t.childFrames ?? []).flatMap(flatten)];

const SECRET = "Collapsed-content-marker";

type Case = {
  name: string;
  /** Mounts the component shut, with a button holding SECRET inside it. */
  mount: (host: HTMLElement) => VueWrapper;
  /** Opens it, the way a user does. */
  open: (w: VueWrapper) => Promise<void>;
  /** Shuts it again, the way a user does. */
  close: (w: VueWrapper) => Promise<void>;
  /** Brings it to the shut state with its content mounted (a tree branch renders on first open). */
  shut?: (w: VueWrapper) => Promise<void>;
  /** The element that is hidden once shut, and the one whose transition animates. */
  panel: (w: VueWrapper) => HTMLElement;
};

const inner = () => h("button", { type: "button", class: "inside" }, SECRET);

const CASES: Case[] = [
  {
    name: "CuiAccordionItem",
    mount: (host) =>
      mount(
        { render: () => h(CuiAccordion, null, () => h(CuiAccordionItem, { value: "a", label: "Section" }, inner)) },
        { attachTo: host },
      ),
    open: async (w) => void (await w.find(".cui-accordion-item__trigger").trigger("click")),
    close: async (w) => void (await w.find(".cui-accordion-item__trigger").trigger("click")),
    panel: (w) => w.element.querySelector<HTMLElement>(".cui-accordion-item__panel")!,
  },
  {
    name: "CuiFieldset",
    mount: (host) =>
      mount(
        { render: () => h(CuiFieldset, { legend: "Details", collapsible: true, expanded: false }, inner) },
        { attachTo: host },
      ),
    open: async (w) => void (await w.find(".cui-fieldset__toggle").trigger("click")),
    close: async (w) => void (await w.find(".cui-fieldset__toggle").trigger("click")),
    panel: (w) => w.element.querySelector<HTMLElement>(".cui-fieldset__body")!,
  },
  {
    name: "CuiTreeNode",
    mount: (host) =>
      mount(
        {
          render: () =>
            h(CuiTreeView, { nodes: [{ id: "a", label: "Alpha", children: [{ id: "a1", label: "Alpha one" }] }] }, {
              node: ({ node }: { node: { id: string } }) => (node.id === "a1" ? inner() : "Alpha"),
            }),
        },
        { attachTo: host },
      ),
    // The chevron's own click (its box is the toggle target).
    open: async (w) => void (await w.find(".cui-tree-node__chevron").trigger("click")),
    close: async (w) => void (await w.find(".cui-tree-node__chevron").trigger("click")),
    panel: (w) => w.element.querySelector<HTMLElement>(".cui-tree-node__group")!,
    shut: async (w) => {
      await w.find(".cui-tree-node__chevron").trigger("click");
      await wait(motionDuration("slow") + 100);
      await w.find(".cui-tree-node__chevron").trigger("click");
      await wait(motionDuration("slow") + 100);
    },
  },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("collapsible content (real browser)", () => {
  let removeTokens: () => void;
  const setReduced = (reduce: boolean) =>
    cdp().send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "" }] });

  beforeAll(() => {
    removeTokens = installTokens(main);
  });
  afterAll(() => removeTokens());

  const mounted: VueWrapper[] = [];
  const hosts: HTMLElement[] = [];
  afterEach(async () => {
    mounted.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((el) => el.remove());
    await setReduced(false);
  });

  /** A host with a focusable before and after, so Tab has somewhere to start and end. */
  function host() {
    const el = document.createElement("div");
    el.innerHTML = '<button id="before">before</button><div class="slot"></div><button id="after">after</button>';
    el.style.width = "320px";
    document.body.append(el);
    hosts.push(el);
    return el;
  }

  const settle = () => wait(motionDuration("slow") + 100);

  /** Whether the accessibility tree exposes a node for SECRET. */
  async function exposed(): Promise<boolean> {
    // The tests run in an iframe, and the tree CDP returns by default is the outer page's.
    const { frameTree } = (await cdp().send("Page.getFrameTree")) as { frameTree: FrameTree };
    const frame = flatten(frameTree).find((f) => f.url === location.href);
    expect(frame, "this test's frame").toBeTruthy();
    const { nodes } = (await cdp().send("Accessibility.getFullAXTree", { frameId: frame!.id })) as {
      nodes: Array<{ ignored?: boolean; name?: { value?: string } }>;
    };
    return nodes.some((n) => !n.ignored && n.name?.value?.includes(SECRET));
  }

  /** Every element Tab lands on between #before and #after. */
  async function tabStops(): Promise<Element[]> {
    (document.getElementById("before") as HTMLElement).focus();
    const stops: Element[] = [];
    for (let i = 0; i < 12 && document.activeElement?.id !== "after"; i++) {
      await userEvent.tab();
      stops.push(document.activeElement!);
    }
    return stops;
  }

  for (const c of CASES) {
    describe(c.name, () => {
      function setup() {
        const el = host();
        const w = c.mount(el.querySelector<HTMLElement>(".slot")!);
        mounted.push(w);
        return w;
      }

      it("keeps shut content out of the tab order and the accessibility tree", async () => {
        const w = setup();
        await nextTick();
        const stops = await tabStops();
        expect(stops.some((s) => s.classList.contains("inside")), "Tab reached shut content").toBe(false);
        expect(await exposed(), "shut content in the accessibility tree").toBe(false);
      });

      it("exposes the content once it opens", async () => {
        const w = setup();
        await c.open(w);
        await settle();
        const stops = await tabStops();
        expect(stops.some((s) => s.classList.contains("inside")), "Tab reaches open content").toBe(true);
        expect(await exposed(), "open content in the accessibility tree").toBe(true);
      });

      it("hides it again after the collapse ends, not before", async () => {
        const w = setup();
        await c.open(w);
        await settle();
        const panel = c.panel(w);
        expect(panel.matches("[hidden], [inert]")).toBe(false);

        await c.close(w);
        await frames(2);
        // Mid-collapse: still shown, so the content shrinks away rather than vanishing.
        expect(panel.matches("[hidden], [inert]"), "hidden at the start of the collapse").toBe(false);
        expect(panel.getAnimations().length, "a transition is running").toBeGreaterThan(0);

        await settle();
        expect(panel.matches("[hidden], [inert]"), "hidden after the collapse").toBe(true);
        expect(await exposed()).toBe(false);
      });

      it("reveals the content, as a transition from shut, when it opens", async () => {
        const w = setup();
        // Drawn once while shut: a transition needs a before-change style to start from.
        await c.shut?.(w);
        await frames(2);
        await c.open(w);
        await frames(1);
        const panel = c.panel(w);
        expect(panel.matches("[hidden], [inert]"), "still hidden when the open began").toBe(false);
        const rows = panel.getAnimations().filter((a) => (a as CSSTransition).transitionProperty === "grid-template-rows");
        expect(rows, "grid-template-rows transitions").toHaveLength(1);
      });

      it("opens when find-in-page matches inside it (beforematch)", async () => {
        const w = setup();
        await c.shut?.(w);
        const panel = c.panel(w);
        // Browsers fire this on the hidden="until-found" element, then drop the attribute.
        // Chromium (the test browser) supports it; other engines fall back to inert.
        expect("onbeforematch" in HTMLElement.prototype).toBe(true);
        expect(panel.getAttribute("hidden")).toBe("until-found");
        panel.dispatchEvent(new Event("beforematch", { bubbles: true }));
        await nextTick();
        await settle();
        expect(await exposed()).toBe(true);
      });

      it("snaps under reduced motion: no height transition runs", async () => {
        await setReduced(true);
        const w = setup();
        // Drawn once while shut: a transition needs a before-change style to start from.
        await c.shut?.(w);
        await frames(2);
        await c.open(w);
        await frames(1);
        const panel = c.panel(w);
        const rows = panel.getAnimations().filter((a) => (a as CSSTransition).transitionProperty === "grid-template-rows");
        expect(rows, "no grid-template-rows transition").toHaveLength(0);
        expect(panel.matches("[hidden], [inert]")).toBe(false);

        await c.close(w);
        await frames(2);
        const closing = panel.getAnimations().filter((a) => (a as CSSTransition).transitionProperty === "grid-template-rows");
        expect(closing, "no grid-template-rows transition on close").toHaveLength(0);
        // Nothing to wait for, bar a fade: hidden within the fade, not the (longer) height.
        await wait(motionDuration("base") + 100);
        expect(panel.matches("[hidden], [inert]")).toBe(true);
      });
    });
  }

  it("gives two accordions sharing item values unique ids (#162)", async () => {
    const el = host();
    const w = mount(
      {
        render: () => [
          h(CuiAccordion, null, () => h(CuiAccordionItem, { value: "1", label: "One" }, () => "x")),
          h(CuiAccordion, null, () => h(CuiAccordionItem, { value: "1", label: "One" }, () => "y")),
        ],
      },
      { attachTo: el.querySelector<HTMLElement>(".slot")! },
    );
    mounted.push(w);
    const ids = [...el.querySelectorAll("[id]")].map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
