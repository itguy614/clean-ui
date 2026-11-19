import { describe, it, expect, afterEach } from "vitest";
import { mount, flushPromises, type VueWrapper } from "@vue/test-utils";
import CuiDataGrid from "../CuiDataGrid.vue";
import type { DataGridColumnDef, DataGridViewConfig } from "../../types/data-grid";

/**
 * #552 — the filter panel is a popover from the Filters button unless it is pinned. The state
 * transitions (open, pin, unpin, load a saved view); where the panel lands and how it looks are
 * measured in a browser (browser/data-grid-filter-popover.test.ts).
 */
const columns: DataGridColumnDef[] = [
  { key: "name", label: "Name", filterable: true, filterType: "text" },
  { key: "role", label: "Role" },
];
const data = [{ id: "1", name: "Alice", role: "Eng" }];
const view = (filterPanelPinned: boolean): DataGridViewConfig => ({
  columns: [],
  sort: null,
  filters: [],
  perPage: 10,
  viewMode: "grid",
  filterPanelPinned,
});

let wrapper: VueWrapper | undefined;
afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
});

async function mountGrid(pinned?: boolean) {
  wrapper = mount(CuiDataGrid, {
    props: { columns, data, ...(pinned === undefined ? {} : { initialView: view(pinned) }) },
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper;
}

const button = (w: VueWrapper) =>
  w.findAll(".cui-data-grid-toolbar button").find((b) => b.text().includes("Filters"))!;
const popoverPanel = () => document.body.querySelector(".cui-popover__panel .cui-data-grid-filter-panel");
const inlinePanel = (w: VueWrapper) => w.element.querySelector(".cui-data-grid__content .cui-data-grid-filter-panel");
const pin = () => document.body.querySelector<HTMLButtonElement>(".cui-data-grid-filter-panel__pin")!;
const pinned = (w: VueWrapper) => (w.vm as unknown as { getConfig: () => DataGridViewConfig }).getConfig().filterPanelPinned;

describe("CuiDataGrid filter panel presentation", () => {
  it("is closed to begin with, in either presentation", async () => {
    for (const p of [undefined, false, true]) {
      const w = await mountGrid(p);
      expect(popoverPanel()).toBeNull();
      expect(inlinePanel(w)).toBeNull();
      expect(button(w).attributes("aria-expanded")).toBe("false");
      w.unmount();
      wrapper = undefined;
    }
  });

  it("unpinned (the default), the Filters button opens a popover, not an inline column", async () => {
    const w = await mountGrid();
    await button(w).trigger("click");
    await flushPromises();
    expect(popoverPanel()).not.toBeNull();
    expect(inlinePanel(w)).toBeNull();
    expect(button(w).attributes("aria-expanded")).toBe("true");
    expect(document.getElementById(button(w).attributes("aria-controls")!)).toBe(popoverPanel());
  });

  it("pinned, the Filters button toggles the inline column and there is no popover", async () => {
    const w = await mountGrid(true);
    await button(w).trigger("click");
    await flushPromises();
    expect(inlinePanel(w)).not.toBeNull();
    expect(popoverPanel()).toBeNull();
    expect(document.getElementById(button(w).attributes("aria-controls")!)).toBe(inlinePanel(w));
    await button(w).trigger("click");
    await flushPromises();
    expect(inlinePanel(w)).toBeNull();
    expect(button(w).attributes("aria-expanded")).toBe("false");
  });

  it("pinning from the popover moves the panel inline, still open; unpinning returns it", async () => {
    const w = await mountGrid();
    await button(w).trigger("click");
    await flushPromises();
    pin().click();
    await flushPromises();
    expect(pinned(w)).toBe(true);
    expect(popoverPanel()).toBeNull();
    expect(inlinePanel(w)).not.toBeNull();
    expect(button(w).attributes("aria-expanded")).toBe("true");

    pin().click();
    await flushPromises();
    expect(pinned(w)).toBe(false);
    expect(inlinePanel(w)).toBeNull();
    expect(popoverPanel()).not.toBeNull();
    expect(button(w).attributes("aria-expanded")).toBe("true");
  });

  it("the pin button is a named toggle", async () => {
    const w = await mountGrid();
    await button(w).trigger("click");
    await flushPromises();
    expect(pin().getAttribute("aria-label")).toBe("Pin filters");
    expect(pin().getAttribute("aria-pressed")).toBe("false");
    pin().click();
    await flushPromises();
    // A toggle keeps its name; aria-pressed carries the state.
    expect(pin().getAttribute("aria-label")).toBe("Pin filters");
    expect(pin().getAttribute("aria-pressed")).toBe("true");
  });

  it("the close control closes either presentation", async () => {
    const w = await mountGrid();
    await button(w).trigger("click");
    await flushPromises();
    document.body.querySelector<HTMLButtonElement>(".cui-data-grid-filter-panel__header button:last-child")!.click();
    await flushPromises();
    expect(popoverPanel()).toBeNull();
    expect(button(w).attributes("aria-expanded")).toBe("false");
  });

  it("a saved view restores the presentation it was saved with", async () => {
    const w = await mountGrid(false);
    const grid = w.vm as unknown as { loadConfig: (c: DataGridViewConfig) => void };
    grid.loadConfig(view(true));
    await flushPromises();
    expect(pinned(w)).toBe(true);
    await button(w).trigger("click");
    await flushPromises();
    expect(inlinePanel(w)).not.toBeNull();
    expect(popoverPanel()).toBeNull();

    // Loaded while the panel is open: it changes presentation in place.
    grid.loadConfig(view(false));
    await flushPromises();
    expect(inlinePanel(w)).toBeNull();
    expect(popoverPanel()).not.toBeNull();
  });

  it("the pinned state is what getConfig saves", async () => {
    const w = await mountGrid();
    expect(pinned(w)).toBe(false);
    await button(w).trigger("click");
    await flushPromises();
    pin().click();
    await flushPromises();
    expect(pinned(w)).toBe(true);
  });
});
