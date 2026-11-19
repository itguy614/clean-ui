import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import CuiDataGrid from "../../components/CuiDataGrid.vue";
import type { DataGridColumnDef, DataGridViewAdapter } from "../../types/data-grid";
import { frames, installTokens, injectStyle } from "../../../../../config/test/browser-helpers";

/**
 * #489 — the override routes the grid's column manager and saved-views menu now promise: a
 * plain consumer rule, and a `--cui-data-grid-*-manager-*` token. Both panels are teleported,
 * so a container's token never reaches them: the token goes on <body> (or :root). Real
 * browser, because both are claims about the cascade.
 */
describe("the grid managers' themeable properties (real browser)", () => {
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(`${main} .cui-button { transition: none !important; }`)));
  afterAll(() => teardown());

  let wrapper: VueWrapper | undefined;
  let host: HTMLElement | undefined;
  let extra: (() => void) | undefined;
  const TOKENS = ["gap", "px", "radius", "border", "pressed-color"];
  afterEach(() => {
    wrapper?.unmount();
    host?.remove();
    extra?.();
    wrapper = host = extra = undefined;
    for (const t of TOKENS) {
      document.body.style.removeProperty(`--cui-data-grid-column-manager-${t}`);
      document.body.style.removeProperty(`--cui-data-grid-view-manager-${t}`);
    }
  });

  const columns: DataGridColumnDef[] = [
    { key: "a", label: "Alpha" },
    { label: "Reads", children: [{ key: "r1", label: "R1" }, { key: "r2", label: "R2" }] },
    { key: "c", label: "Gamma" },
  ];
  const adapter: DataGridViewAdapter = {
    load: async () => [{ id: "v1", name: "Mine", config: { columns: [{ key: "a", visible: true }], sort: null, filters: [], perPage: 10, viewMode: "grid", filterPanelPinned: false } }],
    save: async () => {},
    remove: async () => {},
  };

  async function mountGrid() {
    host = document.createElement("div");
    host.style.width = "700px";
    document.body.append(host);
    wrapper = mount(CuiDataGrid, {
      attachTo: host,
      props: { columns, data: [{ id: "1", a: 1, c: 3, r1: 4, r2: 5 }], gridId: "g", viewAdapter: adapter },
    });
    await frames(4);
  }
  async function openColumns() {
    await mountGrid();
    await userEvent.click(host!.querySelector<HTMLElement>(".cui-data-grid-column-manager button")!);
    await frames(12);
  }
  const rows = () => [...document.querySelectorAll<HTMLElement>(".cui-data-grid-column-manager__row")];
  const paint = (el: Element | null, prop: string) => getComputedStyle(el!).getPropertyValue(prop);

  describe("CuiDataGridColumnManager", () => {
    it("lets a plain consumer rule win, with no !important", async () => {
      extra = injectStyle(`.cui-data-grid-column-manager__row { border-radius: 9px; padding-block: 11px; column-gap: 13px; }
        .cui-data-grid-column-manager__handle { color: rgb(1, 2, 3); }
        .cui-data-grid-column-manager__group { font-weight: 300; }
        .cui-data-grid-column-manager__row--leaf { padding-inline-start: 31px; }
        .cui-data-grid-column-manager__list { row-gap: 7px; }`);
      await openColumns();
      const [first, group, leaf] = rows();
      expect(paint(first, "border-top-left-radius")).toBe("9px");
      expect(paint(first, "padding-top")).toBe("11px");
      expect(paint(first, "column-gap")).toBe("13px");
      expect(paint(first.querySelector(".cui-data-grid-column-manager__handle"), "color")).toBe("rgb(1, 2, 3)");
      expect(paint(group.querySelector(".cui-data-grid-column-manager__group"), "font-weight")).toBe("300");
      expect(paint(leaf, "padding-left")).toBe("31px");
      expect(paint(document.querySelector(".cui-data-grid-column-manager__list"), "row-gap")).toBe("7px");
    });

    it("lets a plain rule restyle the dragging row and the drop target", async () => {
      extra = injectStyle(`.cui-data-grid-column-manager__row--dragging { opacity: 0.2; }
        .cui-data-grid-column-manager__row--drop { border-top-color: rgb(4, 5, 6); }`);
      await openColumns();
      // A loose column drops among the units: onto the last one, not into the group's leaves.
      const from = rows()[0];
      const to = rows().at(-1)!;
      const dataTransfer = new DataTransfer();
      const fire = (el: HTMLElement, type: string) => el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }));
      fire(from, "dragstart");
      fire(to, "dragover");
      await frames(3);
      expect(paint(from, "opacity")).toBe("0.2");
      expect(paint(to, "border-top-color")).toBe("rgb(4, 5, 6)");
    });

    it("lets a token on <body> win", async () => {
      document.body.style.setProperty("--cui-data-grid-column-manager-gap", "17px");
      document.body.style.setProperty("--cui-data-grid-column-manager-radius", "10px");
      document.body.style.setProperty("--cui-data-grid-column-manager-px", "27px");
      document.body.style.setProperty("--cui-data-grid-column-manager-border", "rgb(7, 8, 9)");
      await openColumns();
      const [first, , leaf, , ] = rows();
      expect(paint(first, "column-gap")).toBe("17px");
      expect(paint(first, "border-top-left-radius")).toBe("10px");
      // The token is the row's indent, over the leaf's own.
      expect(paint(first, "padding-left")).toBe("27px");
      expect(paint(leaf, "padding-left")).toBe("27px");

      const dataTransfer = new DataTransfer();
      const fire = (el: HTMLElement, type: string) => el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }));
      const last = rows().at(-1)!;
      fire(first, "dragstart");
      fire(last, "dragover");
      await frames(3);
      expect(paint(last, "border-top-color")).toBe("rgb(7, 8, 9)");
    });
  });

  describe("CuiDataGridViewManager", () => {
    async function openViews(activate = false) {
      await mountGrid();
      const trigger = () => host!.querySelector<HTMLElement>(".cui-data-grid-view-manager button")!;
      await userEvent.click(trigger());
      await frames(12);
      if (activate) {
        await userEvent.click(document.querySelector<HTMLElement>('[role="menuitem"]')!);
        await frames(8);
        await userEvent.click(trigger());
        await frames(12);
      }
    }

    it("lets a plain consumer rule win, with no !important", async () => {
      extra = injectStyle(`.cui-data-grid-view-manager__delete { opacity: 1; color: rgb(1, 2, 3); padding: 5px; }
        .cui-data-grid-view-manager__active { color: rgb(4, 5, 6); }
        .cui-data-grid-view-manager__action-icon { color: rgb(7, 8, 9); }`);
      await openViews(true);
      expect(paint(document.querySelector(".cui-data-grid-view-manager__delete"), "opacity")).toBe("1");
      expect(paint(document.querySelector(".cui-data-grid-view-manager__delete"), "color")).toBe("rgb(1, 2, 3)");
      expect(paint(document.querySelector(".cui-data-grid-view-manager__delete"), "padding-top")).toBe("5px");
      expect(paint(document.querySelector(".cui-data-grid-view-manager__active"), "color")).toBe("rgb(4, 5, 6)");
      expect(paint(document.querySelector(".cui-data-grid-view-manager__action-icon"), "color")).toBe("rgb(7, 8, 9)");
    });

    it("lets a token on <body> win on the loaded view's check", async () => {
      document.body.style.setProperty("--cui-data-grid-view-manager-pressed-color", "rgb(10, 20, 30)");
      await openViews(true);
      expect(paint(document.querySelector(".cui-data-grid-view-manager__active"), "color")).toBe("rgb(10, 20, 30)");
    });
  });
});
