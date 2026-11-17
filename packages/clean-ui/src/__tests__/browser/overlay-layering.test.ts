import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, reactive, ref, type Component } from "vue";
import { userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import { motionDuration } from "../../utils/motion";
import CuiModal from "../../components/CuiModal.vue";
import CuiConfirmDialog from "../../components/CuiConfirmDialog.vue";
import CuiSlideover from "../../components/CuiSlideover.vue";
import CuiDrawer from "../../components/CuiDrawer.vue";
import CuiCommandPalette from "../../components/CuiCommandPalette.vue";
import { useCommandPalette } from "../../composables/useCommandPalette";
import { POPOVER_Z_INDEX, TOOLTIP_Z_INDEX } from "../../utils/position";
import CuiSlideoverStack from "../../components/CuiSlideoverStack.vue";

/**
 * #541 — the newest overlay is on top. Every overlay used to share one z-index, so DOM order
 * decided; an overlay opened over another is checked here by what the browser paints at its
 * own center (`elementFromPoint`), in light and dark.
 */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const settle = () => wait(motionDuration("slow") + 150);

let removeTokens: () => void;
beforeAll(() => (removeTokens = installTokens(main)));
afterAll(() => removeTokens());

let wrapper: VueWrapper | undefined;
afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.documentElement.classList.remove("dark");
  document.body.innerHTML = "";
  document.body.style.overflow = "";
});

type Kind = "modal" | "confirm" | "slideover" | "drawer";
const COMPONENTS: Record<Kind, Component> = { modal: CuiModal, confirm: CuiConfirmDialog, slideover: CuiSlideover, drawer: CuiDrawer };

/**
 * One overlay per entry, each with a marker element in its panel. They are declared in the
 * order given, which is the order their teleported roots are first inserted if opened in that
 * order; `open` flips them in any order.
 */
function host(kinds: Kind[], stacked = false) {
  const open = reactive(kinds.map(() => false));
  const panels = () => kinds.map((kind, i) =>
    h(
      COMPONENTS[kind],
      { key: i, visible: open[i], "onUpdate:visible": (v: boolean) => (open[i] = v), "data-ov": i, ...(kind === "modal" || kind === "confirm" ? { title: `t${i}` } : {}) },
      kind === "confirm" ? {} : { default: () => h("p", { "data-t": `p${i}`, style: "min-width:8rem;min-height:4rem" }, `panel ${i}`) },
    ),
  );
  wrapper = mount(defineComponent({ render: () => (stacked ? h(CuiSlideoverStack, null, { default: panels }) : h("div", panels())) }), { attachTo: document.body });
  return { open };
}

/** The overlay root (the teleported fixed element) painted at the center of `el`. */
function topAt(el: Element): Element | null {
  const r = el.getBoundingClientRect();
  return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
}

async function expectNewestOnTop(kinds: Kind[], order: number[], stacked = false) {
  for (const dark of [false, true]) {
    document.documentElement.classList.toggle("dark", dark);
    const t = host(kinds, stacked);
    for (const i of order) {
      t.open[i] = true;
      await settle();
    }
    const newest = document.querySelector<HTMLElement>(`[data-ov="${order.at(-1)}"]`)!;
    expect(newest, "the newest dialog exists").toBeTruthy();
    const hit = topAt(newest);
    expect(newest.contains(hit), `${kinds.join("+")} opened ${order.join(",")} (${dark ? "dark" : "light"}): newest overlay paints on top`).toBe(true);
    wrapper!.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  }
}

describe("overlay layering (real browser)", () => {
  // Declared A then B; B is opened first, then A: A's root is inserted later and wins by DOM
  // order; the reverse of the bug is covered by "opened later": A first, then B.
  for (const first of ["modal", "slideover", "drawer"] as Kind[]) {
    for (const second of ["modal", "slideover", "drawer"] as Kind[]) {
      it(`${second} opened over a ${first}`, async () => {
        await expectNewestOnTop([second, first], [1, 0]);
      });
    }
  }
  it("a confirm dialog opened over a modal", async () => {
    await expectNewestOnTop(["confirm", "modal"], [1, 0]);
  });
  it("a modal opened over a confirm dialog", async () => {
    await expectNewestOnTop(["modal", "confirm"], [1, 0]);
  });
});

describe("headroom above the overlays (real browser)", () => {
  for (const count of [4, 8]) {
    it(`a popover and a tooltip stay above the newest of ${count} stacked overlays`, async () => {
      const t = host(Array.from({ length: count }, () => "modal" as Kind));
      // Opened newest-first by declaration, so mount order is the reverse of the open order.
      for (let i = count - 1; i >= 0; i--) {
        t.open[i] = true;
        await settle();
      }
      const newest = document.querySelector<HTMLElement>('[data-ov="0"]')!;
      expect(newest.contains(topAt(newest))).toBe(true);
      const r = newest.getBoundingClientRect();
      for (const [name, z] of [["popover", POPOVER_Z_INDEX], ["tooltip", TOOLTIP_Z_INDEX]]) {
        const probe = document.createElement("div");
        probe.setAttribute("style", `position:fixed;left:${r.left + r.width / 2 - 10}px;top:${r.top + r.height / 2 - 10}px;width:20px;height:20px;z-index:${z}`);
        document.body.prepend(probe);
        expect(topAt(newest), `${name} paints over the newest overlay`).toBe(probe);
        probe.remove();
      }
    });
  }

  it("a modal opened over a stack of slideovers paints above every panel in the stack", async () => {
    const open = reactive([false, false, false, false]);
    wrapper = mount(
      defineComponent({
        render: () => [
          h(CuiModal, { visible: open[3], title: "Late", "data-ov": "modal", "onUpdate:visible": (v: boolean) => (open[3] = v) }, { default: () => h("p", "m") }),
          h(CuiSlideoverStack, null, {
            default: () => [0, 1, 2].map((i) => h(CuiSlideover, { key: i, visible: open[i], size: "sm", "onUpdate:visible": (v: boolean) => (open[i] = v) }, { default: () => h("p", `s${i}`) })),
          }),
        ],
      }),
      { attachTo: document.body },
    );
    for (const i of [0, 1, 2, 3]) {
      open[i] = true;
      await settle();
    }
    const modal = document.querySelector<HTMLElement>('[data-ov="modal"]')!;
    expect(modal.contains(topAt(modal))).toBe(true);
  });
});

describe("the command palette over a dialog (real browser)", () => {
  const palette = useCommandPalette();
  afterEach(() => palette.close());

  /** The palette mounted first (early in the shell), a dialog of `kind` after it: opened in that order. */
  function shell(kind: "modal" | "slideover") {
    const open = ref(false);
    const Dialog = COMPONENTS[kind];
    const unregister = palette.register([{ id: "a", label: "Alpha" }]);
    wrapper = mount(
      defineComponent({
        render: () => [
          h(CuiCommandPalette, { "data-ov": "palette" }),
          h(Dialog, { visible: open.value, "onUpdate:visible": (v: boolean) => (open.value = v), "data-ov": "dialog", ...(kind === "modal" ? { title: "Dialog" } : {}) }, {
            default: () => h("button", { "data-t": "opener", onClick: () => palette.open() }, "Palette"),
          }),
        ],
      }),
      { attachTo: document.body },
    );
    return { open, unregister, opener: () => document.querySelector<HTMLElement>('[data-t="opener"]')! };
  }

  for (const kind of ["modal", "slideover"] as const) {
    for (const dark of [false, true]) {
      it(`opens on top of a ${kind} (${dark ? "dark" : "light"}); Escape closes the palette first, then the ${kind}, focus back inside the dialog`, async () => {
        document.documentElement.classList.toggle("dark", dark);
        const t = shell(kind);
        t.open.value = true;
        await settle();
        t.opener().focus();
        palette.open();
        await settle();
        const panel = document.querySelector<HTMLElement>(".cui-command-palette")!;
        expect(panel.contains(topAt(panel)), "the palette paints at its own center").toBe(true);
        expect(document.querySelector<HTMLElement>(".cui-command-palette__input")).toBe(document.activeElement);

        await userEvent.keyboard("{Escape}");
        await settle();
        expect(document.querySelector(".cui-command-palette")).toBeNull();
        expect(t.open.value, "the dialog stays open after the first Escape").toBe(true);
        expect(document.activeElement, "focus returns to the opener inside the dialog").toBe(t.opener());

        await userEvent.keyboard("{Escape}");
        await settle();
        expect(t.open.value, "the second Escape closes the dialog").toBe(false);
        t.unregister();
      });
    }
  }
});
