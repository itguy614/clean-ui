import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { page, userEvent } from "@vitest/browser/context";
import CuiDataGrid from "../../components/CuiDataGrid.vue";
import CuiModal from "../../components/CuiModal.vue";
import type { DataGridColumnDef, DataGridViewConfig } from "../../types/data-grid";
import preflight from "../../styles/preflight.css?inline";
import { frames, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #552 — the grid's filter panel is a popover from the Filters button unless it is pinned.
 * Real browser: where the panel sits, whether the table reflows, where focus is, and what a
 * press or Escape does are layout and focus, which jsdom does not compute.
 */
describe("CuiDataGrid filter panel: popover unless pinned (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(preflight)));
  afterAll(() => teardown());
  afterEach(async () => {
    cleanup();
    await page.viewport(414, 896);
  });

  const columns: DataGridColumnDef[] = [
    { key: "name", label: "Name", filterable: true, filterType: "text" },
    {
      key: "status",
      label: "Status",
      filterable: true,
      filterType: "select",
      filterOptions: [
        { label: "Open", value: "open" },
        { label: "Closed", value: "closed" },
      ],
    },
  ];
  const data = [
    { id: "1", name: "Alpha", status: "open" },
    { id: "2", name: "Beta", status: "closed" },
    { id: "3", name: "Gamma", status: "open" },
  ];
  const view = (pinned: boolean): DataGridViewConfig => ({
    columns: [],
    sort: null,
    filters: [],
    perPage: 10,
    viewMode: "grid",
    filterPanelPinned: pinned,
  });

  async function mountGrid(opts: { pinned?: boolean; columns?: DataGridColumnDef[]; width?: string } = {}) {
    const App = defineComponent({
      render: () =>
        h(CuiDataGrid, {
          columns: opts.columns ?? columns,
          data,
          initialView: view(opts.pinned ?? false),
        }),
    });
    const wrapper = track(mount(App, { attachTo: host({ width: opts.width ?? "700px" }) }));
    await frames(2);
    return wrapper.element as HTMLElement;
  }

  const filtersButton = (grid: HTMLElement) =>
    [...grid.querySelectorAll<HTMLButtonElement>(".cui-data-grid-toolbar button")].find((b) =>
      b.textContent?.includes("Filters"),
    )!;
  const popoverPanel = () => document.body.querySelector<HTMLElement>(".cui-popover__panel .cui-data-grid-filter-panel");
  const inlinePanel = (grid: HTMLElement) =>
    grid.querySelector<HTMLElement>(".cui-data-grid__content .cui-data-grid-filter-panel");
  const tableWidth = (grid: HTMLElement) => grid.querySelector<HTMLElement>("table")!.getBoundingClientRect().width;
  const pinButton = () => document.body.querySelector<HTMLButtonElement>(".cui-data-grid-filter-panel__pin")!;
  const open = async (grid: HTMLElement) => {
    await userEvent.click(filtersButton(grid));
    await frames(12);
  };

  it("opens as a popover over the table, which keeps its width", async () => {
    const grid = await mountGrid();
    const before = tableWidth(grid);
    expect(inlinePanel(grid)).toBeNull();
    await open(grid);
    const panel = popoverPanel()!;
    expect(panel).not.toBeNull();
    expect(grid.contains(panel)).toBe(false);
    expect(inlinePanel(grid)).toBeNull();
    expect(tableWidth(grid)).toBe(before);
    // Anchored to the button, a PANEL_OFFSET (4px) below it.
    const trigger = filtersButton(grid).getBoundingClientRect();
    const rect = panel.closest<HTMLElement>(".cui-popover__panel")!.getBoundingClientRect();
    expect(Math.abs(rect.top - trigger.bottom - 4)).toBeLessThan(1.5);
  });

  it("carries aria-expanded and aria-controls on the button, and names the dialog", async () => {
    const grid = await mountGrid();
    const button = filtersButton(grid);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.hasAttribute("aria-controls")).toBe(false);
    await open(grid);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    const controlled = document.getElementById(button.getAttribute("aria-controls")!);
    expect(controlled).toBe(popoverPanel());
    expect(popoverPanel()!.closest(".cui-popover__panel")!.getAttribute("aria-label")).toBe("Filters");
  });

  it("moves focus into the panel on open", async () => {
    const grid = await mountGrid();
    await open(grid);
    expect(popoverPanel()!.contains(document.activeElement)).toBe(true);
    // The first field, not the header's pin or close buttons.
    expect(document.activeElement!.tagName).toBe("INPUT");
  });

  it("closes on Escape and returns focus to the button", async () => {
    const grid = await mountGrid();
    await open(grid);
    await userEvent.keyboard("{Escape}");
    await frames(15);
    expect(popoverPanel()).toBeNull();
    expect(filtersButton(grid).getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(filtersButton(grid));
  });

  it("closes on a press outside and returns focus to the button", async () => {
    const grid = await mountGrid();
    await open(grid);
    await userEvent.click(document.body);
    await frames(15);
    expect(popoverPanel()).toBeNull();
    expect(document.activeElement).toBe(filtersButton(grid));
  });

  it("leaves focus where a press outside put it, when that is something focusable", async () => {
    const grid = await mountGrid();
    const other = document.createElement("button");
    other.textContent = "elsewhere";
    document.body.append(other);
    try {
      await open(grid);
      await userEvent.click(other);
      await frames(15);
      expect(popoverPanel()).toBeNull();
      expect(document.activeElement).toBe(other);
    } finally {
      other.remove();
    }
  });

  it("closes with its close control and returns focus to the button", async () => {
    const grid = await mountGrid();
    await open(grid);
    const close = popoverPanel()!.querySelector<HTMLButtonElement>(".cui-data-grid-filter-panel__header button:last-child")!;
    await userEvent.click(close);
    await frames(15);
    expect(popoverPanel()).toBeNull();
    expect(document.activeElement).toBe(filtersButton(grid));
  });

  it("closes on a second press of the Filters button", async () => {
    const grid = await mountGrid();
    await open(grid);
    await userEvent.click(filtersButton(grid));
    await frames(15);
    expect(popoverPanel()).toBeNull();
  });

  it("stays open while a select inside it is used", async () => {
    const grid = await mountGrid();
    await open(grid);
    const select = popoverPanel()!.querySelector<HTMLElement>(".cui-select, [role='combobox']")!;
    await userEvent.click(select);
    await frames(8);
    const option = [...document.body.querySelectorAll<HTMLElement>("[role='option']")].find((o) => o.textContent?.includes("Closed"))!;
    expect(option).toBeDefined();
    await userEvent.click(option);
    await frames(8);
    expect(popoverPanel()).not.toBeNull();
    expect(filtersButton(grid).getAttribute("aria-expanded")).toBe("true");
  });

  it("applies the filters it holds", async () => {
    const grid = await mountGrid();
    await open(grid);
    await userEvent.type(popoverPanel()!.querySelector("input")!, "Bet");
    const apply = [...popoverPanel()!.querySelectorAll("button")].find((b) => b.textContent?.includes("Apply"))!;
    await userEvent.click(apply);
    await frames(4);
    expect([...grid.querySelectorAll("tbody tr")].map((r) => r.textContent)).toHaveLength(1);
  });

  it("moves inline when pinned from the popover, keeps focus on the pin and no longer closes on a press outside", async () => {
    const grid = await mountGrid();
    const before = tableWidth(grid);
    await open(grid);
    await userEvent.click(pinButton());
    await frames(15);
    expect(popoverPanel()).toBeNull();
    const inline = inlinePanel(grid)!;
    expect(inline).not.toBeNull();
    expect(filtersButton(grid).getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(filtersButton(grid).getAttribute("aria-controls")!)).toBe(inline);
    expect(document.activeElement).toBe(inline.querySelector(".cui-data-grid-filter-panel__pin"));
    // The old look: a column beside the table, which gives up width for it.
    expect(tableWidth(grid)).toBeLessThan(before);
    await userEvent.click(document.body);
    await userEvent.keyboard("{Escape}");
    await frames(8);
    expect(inlinePanel(grid)).not.toBeNull();
  });

  it("does not pull focus to the pin when a pinned view is loaded from elsewhere", async () => {
    const App = defineComponent({
      render: () => h("div", [h("button", { id: "elsewhere" }, "x"), h(CuiDataGrid, { ref: "grid", columns, data })]),
    });
    const wrapper = track(mount(App, { attachTo: host({ width: "700px" }) }));
    await frames(2);
    const grid = wrapper.element as HTMLElement;
    await open(grid);
    const other = document.getElementById("elsewhere")!;
    other.focus();
    (wrapper.vm.$refs.grid as { loadConfig: (c: DataGridViewConfig) => void }).loadConfig(view(true));
    await frames(15);
    expect(inlinePanel(grid)).not.toBeNull();
    expect(document.activeElement).toBe(other);
  });

  it("names the button a popover trigger only while unpinned, and the panel's id sits on one element", async () => {
    const grid = await mountGrid();
    expect(filtersButton(grid).getAttribute("aria-haspopup")).toBe("dialog");
    await open(grid);
    const id = filtersButton(grid).getAttribute("aria-controls")!;
    await userEvent.click(pinButton());
    await frames(2);
    // Mid-exit of the popover, the inline panel already holds the id alone.
    expect(document.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
    await frames(15);
    expect(filtersButton(grid).hasAttribute("aria-haspopup")).toBe(false);
  });

  describe("the draft (edits not yet applied) is shared by the popover and the inline panel", () => {
    const withMulti: DataGridColumnDef[] = [
      ...columns,
      {
        key: "tag",
        label: "Tag",
        filterable: true,
        filterType: "multi-select",
        filterOptions: [
          { label: "Red", value: "red" },
          { label: "Blue", value: "blue" },
        ],
      },
    ];
    const panelEl = (grid: HTMLElement) => popoverPanel() ?? inlinePanel(grid)!;
    const nameInput = (grid: HTMLElement) => panelEl(grid).querySelector<HTMLInputElement>("input:not([type=checkbox])")!;
    const checked = (grid: HTMLElement) =>
      [...panelEl(grid).querySelectorAll<HTMLInputElement>("input[type=checkbox]")].map((c) => c.checked);
    const pinNow = async () => {
      await userEvent.click(document.body.querySelector<HTMLButtonElement>(".cui-data-grid-filter-panel__pin")!);
      await frames(15);
    };

    it("keeps typed and ticked edits through pin and unpin", async () => {
      const grid = await mountGrid({ columns: withMulti });
      await open(grid);
      await userEvent.type(nameInput(grid), "Al");
      await userEvent.click([...panelEl(grid).querySelectorAll("label")].find((l) => l.textContent?.includes("Blue"))!);
      expect(checked(grid)).toEqual([false, true]);
      await pinNow();
      expect(inlinePanel(grid)).not.toBeNull();
      expect(nameInput(grid).value).toBe("Al");
      expect(checked(grid)).toEqual([false, true]);
      await pinNow();
      expect(popoverPanel()).not.toBeNull();
      expect(nameInput(grid).value).toBe("Al");
      expect(checked(grid)).toEqual([false, true]);
    });

    it("holds no stale draft after Apply, Clear all, or closing and reopening", async () => {
      const grid = await mountGrid({ columns: withMulti });
      await open(grid);
      await userEvent.type(nameInput(grid), "Bet");
      await userEvent.click([...panelEl(grid).querySelectorAll("button")].find((b) => b.textContent?.includes("Apply"))!);
      await frames(4);
      await userEvent.type(nameInput(grid), "zzz"); // an edit made after applying, never applied
      await pinNow();
      expect(nameInput(grid).value).toBe("Betzzz"); // still the user's draft: nothing reset it
      await userEvent.click([...panelEl(grid).querySelectorAll("button")].find((b) => b.textContent?.includes("Clear all"))!);
      await frames(4);
      expect(nameInput(grid).value).toBe("");
      await userEvent.type(nameInput(grid), "q");
      await userEvent.click(filtersButton(grid)); // pinned: closes the inline panel
      await frames(4);
      await userEvent.click(filtersButton(grid));
      await frames(4);
      expect(nameInput(grid).value).toBe(""); // reopened: back to what is applied
    });

    it("restarts from a saved view that is loaded while it is open", async () => {
      const App = defineComponent({
        render: () => h(CuiDataGrid, { ref: "grid", columns: withMulti, data, initialView: view(false) }),
      });
      const wrapper = track(mount(App, { attachTo: host({ width: "700px" }) }));
      await frames(2);
      const grid = wrapper.element as HTMLElement;
      await open(grid);
      await userEvent.type(nameInput(grid), "draft");
      (wrapper.vm.$refs.grid as { loadConfig: (c: DataGridViewConfig) => void }).loadConfig({
        ...view(false),
        filters: [{ key: "name", value: "Gamma", type: "text" }],
      });
      await frames(6);
      expect(nameInput(grid).value).toBe("Gamma");
    });
  });

  it("returns to the popover when unpinned", async () => {
    const grid = await mountGrid({ pinned: true });
    await open(grid);
    expect(inlinePanel(grid)).not.toBeNull();
    expect(popoverPanel()).toBeNull();
    await userEvent.click(inlinePanel(grid)!.querySelector(".cui-data-grid-filter-panel__pin")!);
    await frames(15);
    expect(inlinePanel(grid)).toBeNull();
    expect(popoverPanel()).not.toBeNull();
    expect(popoverPanel()!.contains(document.activeElement)).toBe(true);
  });

  it("restores a pinned saved view as the inline panel, toggled by the button", async () => {
    const grid = await mountGrid({ pinned: true });
    expect(inlinePanel(grid)).toBeNull();
    await open(grid);
    expect(inlinePanel(grid)).not.toBeNull();
    expect(popoverPanel()).toBeNull();
    // Pinned, the button toggles the inline panel: no popover, no focus move.
    await userEvent.click(filtersButton(grid));
    await frames(4);
    expect(inlinePanel(grid)).toBeNull();
  });

  it("leaves an enclosing modal open when Escape closes the popover", async () => {
    const shown = ref(true);
    const App = defineComponent({
      render: () =>
        h(CuiModal, { visible: shown.value, "onUpdate:visible": (v: boolean) => (shown.value = v), title: "Host" }, () =>
          h(CuiDataGrid, { columns, data, initialView: view(false) }),
        ),
    });
    track(mount(App, { attachTo: host() }));
    await frames(15);
    const button = [...document.body.querySelectorAll<HTMLButtonElement>(".cui-data-grid-toolbar button")].find((b) =>
      b.textContent?.includes("Filters"),
    )!;
    await userEvent.click(button);
    await frames(12);
    expect(popoverPanel()).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await frames(15);
    expect(popoverPanel()).toBeNull();
    expect(shown.value).toBe(true);
    expect(document.activeElement).toBe(button);
  });

  it("fits a 390px viewport", async () => {
    await page.viewport(390, 800);
    const grid = await mountGrid({ width: "100%" });
    await open(grid);
    const panel = popoverPanel()!.closest<HTMLElement>(".cui-popover__panel")!;
    const rect = panel.getBoundingClientRect();
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  });

  it("scrolls inside the viewport when the panel is tall", async () => {
    await page.viewport(600, 420);
    const many: DataGridColumnDef[] = Array.from({ length: 14 }, (_, i) => ({
      key: `c${i}`,
      label: `Column ${i}`,
      filterable: true,
      filterType: "text" as const,
    }));
    const grid = await mountGrid({ columns: many });
    await open(grid);
    const panel = popoverPanel()!.closest<HTMLElement>(".cui-popover__panel")!;
    const rect = panel.getBoundingClientRect();
    expect(rect.height).toBeLessThanOrEqual(window.innerHeight);
    const body = popoverPanel()!.querySelector<HTMLElement>(".cui-data-grid-filter-panel__body")!;
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    // The footer stays reachable.
    const footer = popoverPanel()!.querySelector<HTMLElement>(".cui-data-grid-filter-panel__footer")!.getBoundingClientRect();
    expect(footer.bottom).toBeLessThanOrEqual(window.innerHeight);
  });
});
