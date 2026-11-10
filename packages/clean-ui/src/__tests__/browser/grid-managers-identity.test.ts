import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import CuiDataGrid from "../../components/CuiDataGrid.vue";
import type { DataGridColumnDef, DataGridSavedView, DataGridViewAdapter } from "../../types/data-grid";
import baseline from "./grid-managers-identity.baseline.json";
import { frames, installTokens } from "../../../../../config/test/browser-helpers";

/**
 * #489 — CuiDataGridColumnManager and CuiDataGridViewManager's paint moved from static style
 * attributes and style bindings to a stylesheet. Nothing about how they look may change.
 * `grid-managers-identity.baseline.json` holds the computed styles of every part, recorded from
 * the inline-style implementation (the tip of the #484 branch) BEFORE the conversion: a flat
 * list, a group with indented leaves, a frozen row, a row being dragged and the row it is over,
 * compact density and dark mode; the view manager's trigger, its menu, an active view and the
 * save-as row. Real browser: jsdom computes none of this.
 */

const ROW = [
  "display", "align-items", "column-gap", "padding-top", "padding-bottom", "padding-left", "padding-right",
  "border-top-width", "border-top-style", "border-top-color", "border-top-left-radius", "cursor", "opacity", "flex-grow",
];
const LIST = ["display", "flex-direction", "row-gap"];
const ICON = ["color", "flex-shrink", "width", "height"];
const TEXT = ["flex-grow", "font-weight", "color", "font-size"];
const BOX = ["display", "flex-shrink", "flex-grow"];
const VM_ROW = ["display", "align-items", "justify-content", "width", "column-gap"];
const VM_DELETE = ["border-top-style", "border-top-width", "background-color", "cursor", "padding-top", "padding-left", "color", "opacity"];
const VM_SAVE = ["display", "column-gap", "padding-top", "padding-left"];

const FLAT: DataGridColumnDef[] = [
  { key: "a", label: "Alpha" },
  { key: "b", label: "Beta" },
  { key: "c", label: "Gamma" },
];
const GROUPED: DataGridColumnDef[] = [
  { key: "a", label: "Alpha" },
  { label: "Reads", children: [{ key: "r1", label: "R1" }, { key: "r2", label: "R2" }] },
  { key: "c", label: "Gamma" },
];
const FROZEN: DataGridColumnDef[] = [
  { key: "f", label: "Frozen", sticky: true, width: "100px" },
  { key: "b", label: "Beta" },
  { key: "c", label: "Gamma" },
];
const DATA = [{ id: "1", a: 1, b: 2, c: 3, f: 4, r1: 5, r2: 6 }];

interface Scenario { columns?: DataGridColumnDef[]; dark?: boolean; density?: string; drag?: [string, string] }
const SCENARIOS: Record<string, Scenario> = {
  "cm-flat-light": { columns: FLAT },
  "cm-flat-dark": { columns: FLAT, dark: true },
  "cm-flat-density": { columns: FLAT, density: "0.75" },
  "cm-grouped-light": { columns: GROUPED },
  "cm-grouped-dark": { columns: GROUPED, dark: true },
  "cm-frozen-light": { columns: FROZEN },
  "cm-frozen-dark": { columns: FROZEN, dark: true },
  "cm-dragging-light": { columns: FLAT, drag: ["Alpha", "Gamma"] },
  "cm-dragging-dark": { columns: FLAT, drag: ["Alpha", "Gamma"], dark: true },
  "cm-dragging-grouped": { columns: GROUPED, drag: ["Reads", "Gamma"] },
};

type Located = Record<string, [Element | null, string[]]>;

const rows = () => [...document.body.querySelectorAll<HTMLElement>(".cui-data-grid-column-manager__row")];
const rowOf = (text: string) => rows().find((r) => r.textContent?.includes(text))!;

function locateCm(): Located {
  const out: Located = { list: [document.querySelector(".cui-data-grid-column-manager__list"), LIST] };
  rows().forEach((r, i) => {
    Object.assign(out, {
      [`row${i}`]: [r, ROW],
      [`row${i}-handle`]: [r.querySelector(".cui-icon"), ICON],
      [`row${i}-group-label`]: [r.querySelector(".cui-data-grid-column-manager__group"), TEXT],
      [`row${i}-checkbox`]: [r.querySelector(".cui-checkbox"), ["flex-grow"]],
      [`row${i}-buttons`]: [r.querySelector(":scope > span:last-child"), BOX],
    });
  });
  return out;
}

function snapshot(located: Located) {
  const out: Record<string, Record<string, string>> = {};
  for (const [part, [el, props]] of Object.entries(located)) {
    if (!el) continue;
    const cs = getComputedStyle(el);
    out[part] = Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
  }
  return out;
}

// The columns of FLAT, all visible: choosing a view loads this.
const CONFIG = {
  columns: FLAT.map((c) => ({ key: (c as { key: string }).key, visible: true, width: undefined })),
  sort: null,
  filters: [],
  perPage: 10,
  viewMode: "grid" as const,
  filterPanelPinned: false,
};
const VIEWS: DataGridSavedView[] = [
  { id: "v1", name: "Mine", config: CONFIG as never },
  { id: "v2", name: "Theirs", config: CONFIG as never },
];
const adapter = (): DataGridViewAdapter => ({
  load: async () => VIEWS.map((v) => ({ ...v })),
  save: async () => {},
  remove: async () => {},
});

describe("the grid managers look the same as their inline-style implementation (#489, real browser)", () => {
  let teardown: () => void;
  beforeAll(() => {
    teardown = installTokens(`${main}
      :root { --cui-text-body: #1f2937; --cui-text-secondary: #4b5563; --cui-text-tertiary: #6b7280;
        /* The dark primary reads these steps, which the helper's scale leaves out. */
        --color-primary-200: #c7d2fe; --color-primary-400: #818cf8; --color-primary-800: #312e81; }
      .dark { --cui-text-body: #e5e7eb; --cui-text-secondary: #9ca3af; --cui-text-tertiary: #6b7280; }
      /* Nothing may be caught mid-transition. */
      .cui-button { transition: none !important; }`);
  });
  afterAll(() => teardown());

  let wrapper: VueWrapper | undefined;
  let host: HTMLElement | undefined;
  afterEach(() => {
    wrapper?.unmount();
    host?.remove();
    wrapper = host = undefined;
    document.documentElement.classList.remove("dark");
    document.documentElement.style.removeProperty("--cui-density-scale");
    vi.useRealTimers();
  });

  const recorded = baseline as Record<string, Record<string, Record<string, string>>>;
  function check(name: string, actual: Record<string, Record<string, string>>) {
    // To re-record, empty the baseline: this prints each scenario's snapshot before failing.
    if (!recorded[name]) console.log(`BASELINE ${JSON.stringify({ [name]: actual })}`);
    expect(recorded[name], `no recorded baseline for ${name}`).toBeDefined();
    expect(actual).toEqual(recorded[name]);
  }

  async function mountGrid(props: Record<string, unknown>, sc: Scenario) {
    if (sc.dark) document.documentElement.classList.add("dark");
    if (sc.density) document.documentElement.style.setProperty("--cui-density-scale", sc.density);
    host = document.createElement("div");
    host.style.width = "700px";
    document.body.append(host);
    wrapper = mount(CuiDataGrid, { attachTo: host, props: { data: DATA, ...props } });
    await frames(3);
  }

  for (const [name, sc] of Object.entries(SCENARIOS)) {
    it(name, async () => {
      await mountGrid({ columns: sc.columns }, sc);
      await userEvent.click(host!.querySelector<HTMLElement>(".cui-data-grid-column-manager button")!);
      await frames(14);
      if (sc.drag) {
        const [from, to] = sc.drag.map(rowOf);
        const dataTransfer = new DataTransfer();
        const fire = (el: HTMLElement, type: string) =>
          el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }));
        fire(from, "dragstart");
        fire(to, "dragover");
        await frames(3);
      }
      check(name, snapshot(locateCm()));
    });
  }

  describe("view manager", () => {
    const triggerOf = () => host!.querySelector<HTMLElement>(".cui-data-grid-view-manager button")!;
    async function openMenu(sc: Scenario) {
      await mountGrid({ columns: FLAT, gridId: "g", viewAdapter: adapter() }, sc);
      await frames(4);
      await userEvent.click(triggerOf());
      await frames(14);
    }
    const locateVm = (): Located => {
      const items = [...document.querySelectorAll('[role="menuitem"]')];
      const out: Located = {
        trigger: [triggerOf(), ["display", "height", "padding-left"]],
        badge: [host!.querySelector(".cui-data-grid-view-manager .cui-badge"), ["margin-left"]],
        menu: [document.querySelector('[role="menu"]'), ["min-width", "display"]],
        "save-row": [document.querySelector('[role="menu"] > div:not([role])'), VM_SAVE],
      };
      items.forEach((it, i) => {
        Object.assign(out, {
          [`item${i}`]: [it, ["display", "align-items", "color", "background-color", "padding-left"]],
          [`item${i}-row`]: [it.querySelector(":scope > div"), VM_ROW],
          [`item${i}-label`]: [it.querySelector(":scope > div > span"), ["display", "align-items", "column-gap"]],
          [`item${i}-check`]: [it.querySelector(":scope > div > span > .cui-icon"), ["color", "width"]],
          [`item${i}-delete`]: [it.querySelector("button"), VM_DELETE],
          [`item${i}-delete-icon`]: [it.querySelector("button .cui-icon"), ["width", "color"]],
          [`item${i}-icon`]: [it.querySelector(":scope > .cui-icon"), ["color", "width"]],
        });
      });
      return out;
    };

    for (const [name, sc, activate] of [
      ["vm-menu-light", {}, false],
      ["vm-menu-dark", { dark: true }, false],
      ["vm-menu-density", { density: "0.75" }, false],
      ["vm-active-light", {}, true],
      ["vm-active-dark", { dark: true }, true],
    ] as Array<[string, Scenario, boolean]>) {
      it(name, async () => {
        await openMenu(sc);
        if (activate) {
          // Choosing a view closes the menu and marks it active; reopen to see the check.
          await userEvent.click(document.querySelectorAll<HTMLElement>('[role="menuitem"]')[0]);
          await frames(8);
          await userEvent.click(triggerOf());
          await frames(14);
        }
        check(name, snapshot(locateVm()));
      });
    }

    it("vm-save-as", async () => {
      await openMenu({});
      const items = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')];
      await userEvent.click(items.find((i) => /save as/i.test(i.textContent ?? ""))!);
      await frames(6);
      check("vm-save-as", snapshot(locateVm()));
    });
  });
});
