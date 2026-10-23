import { describe, it, expect, vi, afterEach } from "vitest";
import { useDataGridViews } from "../useDataGridViews";
import type { DataGridSavedView } from "../../types/data-grid";

// #370 — saving a view called crypto.randomUUID, which a page on plain HTTP doesn't have.
describe("useDataGridViews", () => {
  afterEach(() => vi.unstubAllGlobals());

  function memoryAdapter() {
    let stored: DataGridSavedView[] = [];
    return {
      load: async () => stored,
      save: async (_: string, view: DataGridSavedView) => {
        stored = [...stored.filter((v) => v.id !== view.id), view];
      },
      remove: async (_: string, id: string) => {
        stored = stored.filter((v) => v.id !== id);
      },
    };
  }

  it("saves a view on a page without crypto.randomUUID", async () => {
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: (a: Uint8Array) => real.getRandomValues(a) });
    const grid = useDataGridViews({ gridId: "g", adapter: memoryAdapter() });
    await grid.saveView("Mine", {} as DataGridSavedView["config"]);
    expect(grid.views.value).toHaveLength(1);
    expect(grid.views.value[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(grid.activeViewId.value).toBe(grid.views.value[0].id);
  });

  it("keeps a view's id when it's saved again under the same name", async () => {
    const grid = useDataGridViews({ gridId: "g", adapter: memoryAdapter() });
    await grid.saveView("Mine", {} as DataGridSavedView["config"]);
    const id = grid.views.value[0].id;
    await grid.saveView("Mine", {} as DataGridSavedView["config"]);
    expect(grid.views.value.map((v) => v.id)).toEqual([id]);
  });
});
