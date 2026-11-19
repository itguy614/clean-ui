import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { page, userEvent } from "@vitest/browser/context";
import CuiDataGrid from "../../components/CuiDataGrid.vue";
import type { DataGridColumnDef, DataGridViewConfig } from "../../types/data-grid";
import preflight from "../../styles/preflight.css?inline";
import { frames, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #570 — a pinned inline filter panel is outside the grid's loading and empty branches. Real
 * browser: it keeps the same position and width while the grid loads and when a filter matched
 * nothing (no reflow flicker), and Clear all works from the empty state.
 */
describe("CuiDataGrid pinned filter panel through loading and empty states (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(preflight)));
  afterAll(() => teardown());
  afterEach(async () => {
    cleanup();
    await page.viewport(414, 896);
  });

  const columns: DataGridColumnDef[] = [{ key: "name", label: "Name", filterable: true, filterType: "text" }];
  const data = [
    { id: "1", name: "Alpha" },
    { id: "2", name: "Beta" },
  ];
  const view: DataGridViewConfig = {
    columns: [],
    sort: null,
    filters: [],
    perPage: 10,
    viewMode: "grid",
    filterPanelPinned: true,
  };

  async function mountGrid(side: "left" | "right" = "right") {
    const loading = ref(false);
    const rows = ref(data);
    const App = defineComponent({
      render: () =>
        h(CuiDataGrid, {
          columns,
          data: rows.value,
          loading: loading.value,
          filterPanelSide: side,
          initialView: view,
        }),
    });
    const wrapper = track(mount(App, { attachTo: host({ width: "700px" }) }));
    await frames(2);
    const grid = wrapper.element as HTMLElement;
    const button = [...grid.querySelectorAll<HTMLButtonElement>(".cui-data-grid-toolbar button")].find((b) =>
      b.textContent?.includes("Filters"),
    )!;
    await userEvent.click(button);
    await frames(4);
    return { grid, loading, rows };
  }

  const panel = (grid: HTMLElement) =>
    grid.querySelector<HTMLElement>(".cui-data-grid__content .cui-data-grid-filter-panel");
  // Relative to the content row: the active-filter chips above it may add a line when a filter
  // applies, which moves the whole row, not the panel within it.
  const box = (grid: HTMLElement) => {
    const c = grid.querySelector<HTMLElement>(".cui-data-grid__content")!.getBoundingClientRect();
    const r = panel(grid)!.getBoundingClientRect();
    return [r.left - c.left, r.top - c.top, r.width].map((n) => Math.round(n * 10) / 10);
  };
  const panelButton = (grid: HTMLElement, text: string) =>
    [...panel(grid)!.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.includes(text))!;

  for (const side of ["right", "left"] as const) {
    it(`keeps its position and width while loading and with no rows (${side})`, async () => {
      const { grid, loading, rows } = await mountGrid(side);
      expect(panel(grid)).not.toBeNull();
      const before = box(grid);

      loading.value = true;
      await frames(3);
      expect(grid.querySelector(".cui-skeleton")).not.toBeNull();
      expect(box(grid)).toEqual(before);

      loading.value = false;
      rows.value = [];
      await frames(3);
      expect(grid.querySelector(".cui-empty-state")).not.toBeNull();
      expect(box(grid)).toEqual(before);

      // The empty state occupies only the area beside the panel.
      const content = grid.querySelector<HTMLElement>(".cui-data-grid__content")!.getBoundingClientRect();
      const empty = grid.querySelector<HTMLElement>(".cui-empty-state")!.getBoundingClientRect();
      const p = panel(grid)!.getBoundingClientRect();
      expect(empty.left >= content.left - 0.5 && empty.right <= content.right + 0.5).toBe(true);
      expect(empty.right <= p.left + 0.5 || empty.left >= p.right - 0.5).toBe(true);
    });
  }

  it("Clear all works from the empty state a filter produced", async () => {
    const { grid } = await mountGrid();
    const before = box(grid);
    const input = panel(grid)!.querySelector<HTMLInputElement>("input")!;
    await userEvent.click(input);
    await userEvent.keyboard("zzz");
    await userEvent.click(panelButton(grid, "Apply"));
    await frames(3);
    expect(grid.querySelector(".cui-empty-state")).not.toBeNull();
    expect(box(grid)).toEqual(before);

    await userEvent.click(panelButton(grid, "Clear all"));
    await frames(3);
    expect(grid.querySelector(".cui-empty-state")).toBeNull();
    expect(grid.querySelectorAll("tbody tr").length).toBe(2);
    expect(box(grid)).toEqual(before);
  });
});
