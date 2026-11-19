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

async function mountGrid(pinned?: boolean, extra: Record<string, unknown> = {}) {
  wrapper = mount(CuiDataGrid, {
    props: { columns, data, ...(pinned === undefined ? {} : { initialView: view(pinned) }), ...extra },
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

/**
 * #570 — a pinned inline panel is not part of the grid's loading or empty branches: it keeps its
 * place while the grid loads or has no rows, so the filter that emptied the result can be cleared.
 */
describe("CuiDataGrid pinned filter panel outside the loading and empty states (#570)", () => {
  const open = async (w: VueWrapper) => {
    await button(w).trigger("click");
    await flushPromises();
  };
  const byText = (w: VueWrapper, t: string) =>
    [...inlinePanel(w)!.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.includes(t))!;

  it("stays while loading, beside the skeleton", async () => {
    const w = await mountGrid(true, { loading: true });
    await open(w);
    expect(inlinePanel(w)).not.toBeNull();
    expect(w.element.querySelector(".cui-data-grid__content .cui-skeleton")).not.toBeNull();
    await w.setProps({ loading: false });
    expect(inlinePanel(w)).not.toBeNull();
  });

  it("stays with no rows at all, beside the empty state", async () => {
    const w = await mountGrid(true, { data: [] });
    await open(w);
    expect(inlinePanel(w)).not.toBeNull();
    expect(w.element.querySelector(".cui-data-grid__content .cui-empty-state")).not.toBeNull();
  });

  it("stays when a filter matched nothing, and Clear all brings the rows back", async () => {
    const w = await mountGrid(true);
    await open(w);
    const input = inlinePanel(w)!.querySelector<HTMLInputElement>("input")!;
    input.value = "zzz";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await flushPromises();
    byText(w, "Apply").click();
    await flushPromises();
    expect(w.element.querySelector(".cui-data-grid__content .cui-empty-state")).not.toBeNull();
    expect(inlinePanel(w)).not.toBeNull();
    byText(w, "Clear all").click();
    await flushPromises();
    expect(w.element.querySelector(".cui-empty-state")).toBeNull();
    expect(w.element.querySelector("tbody tr")).not.toBeNull();
  });

  it("keeps the side while empty", async () => {
    const w = await mountGrid(true, { filterPanelSide: "left", data: [] });
    await open(w);
    const content = w.element.querySelector<HTMLElement>(".cui-data-grid__content")!;
    expect(content.style.flexDirection).toBe("row-reverse");
    expect(inlinePanel(w)).not.toBeNull();
  });

  it("with hideFilterPanel there is no button and no panel, a pinned loaded view included", async () => {
    const w = await mountGrid(true, { hideFilterPanel: true, data: [] });
    expect(w.findAll(".cui-data-grid-toolbar button").some((b) => b.text().includes("Filters"))).toBe(false);
    expect(inlinePanel(w)).toBeNull();
    (w.vm as unknown as { loadConfig: (c: DataGridViewConfig) => void }).loadConfig(view(true));
    await flushPromises();
    expect(inlinePanel(w)).toBeNull();
    expect(popoverPanel()).toBeNull();
  });

  it("with hideFilterPanel the shared open state cannot be left open", async () => {
    const w = await mountGrid(false);
    await open(w);
    expect(popoverPanel()).not.toBeNull();
    await w.setProps({ hideFilterPanel: true });
    await flushPromises();
    expect(popoverPanel()).toBeNull();
    await w.setProps({ hideFilterPanel: false });
    await flushPromises();
    expect(popoverPanel()).toBeNull();
    expect(button(w).attributes("aria-expanded")).toBe("false");
  });

  it("hiding the button closes a pinned open panel too, and it stays shut", async () => {
    const w = await mountGrid(true);
    await open(w);
    expect(inlinePanel(w)).not.toBeNull();
    await w.setProps({ hideFilterPanel: true });
    await flushPromises();
    expect(inlinePanel(w)).toBeNull();
    await w.setProps({ hideFilterPanel: false });
    await flushPromises();
    expect(inlinePanel(w)).toBeNull();
  });

  it("hiding the toolbar closes an open panel: no button, so no panel", async () => {
    const w = await mountGrid(true);
    await open(w);
    await w.setProps({ hideToolbar: true });
    await flushPromises();
    expect(inlinePanel(w)).toBeNull();
  });

  it("losing the last filterable column closes an open panel", async () => {
    const w = await mountGrid(true);
    await open(w);
    await w.setProps({ columns: [{ key: "name", label: "Name" }] });
    await flushPromises();
    expect(inlinePanel(w)).toBeNull();
  });

  it("with no filterable column the panel never renders", async () => {
    const w = await mountGrid(true, { columns: [{ key: "name", label: "Name" }] });
    expect(inlinePanel(w)).toBeNull();
  });
});
