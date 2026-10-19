import { describe, it, expect } from "vitest";
import { nextTick, ref } from "vue";
import { useDataGrid } from "../useDataGrid";
import type { DataGridColumn } from "../../types/data-grid";

// #258: column definitions passed as a ref or getter are followed after setup.
const base: DataGridColumn[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
];
const data = ref([{ id: "1", name: "Alice", email: "a@x.com", role: "Eng" }]);

describe("useDataGrid column definitions", () => {
  it("keeps the user's hidden columns and order through an unrelated change", async () => {
    const columns = ref<DataGridColumn[]>([...base]);
    const grid = useDataGrid({ columns, data });
    grid.toggleColumnVisibility("email");
    grid.reorderColumns(2, 0); // role first

    columns.value = [{ ...base[0], label: "Full name" }, base[1], base[2]];
    await nextTick();

    expect(grid.columnState.value).toEqual([
      { key: "role", visible: true },
      { key: "name", visible: true },
      { key: "email", visible: false },
    ]);
    expect(grid.visibleColumns.value.map((c) => c.label)).toEqual(["Role", "Full name"]);
  });

  it("inserts a new column at its position and drops a removed one", async () => {
    const columns = ref<DataGridColumn[]>([...base]);
    const grid = useDataGrid({ columns, data });
    columns.value = [base[0], { key: "team", label: "Team" }, base[2]];
    await nextTick();
    expect(grid.columnState.value.map((cs) => cs.key)).toEqual(["name", "team", "role"]);
    expect(grid.columns.map((c) => c.key)).toEqual(["name", "team", "role"]);
  });

  it("a definition change does not mark a clean grid dirty", async () => {
    // Otherwise the view manager reports unsaved changes nobody made.
    const columns = ref<DataGridColumn[]>([...base]);
    const grid = useDataGrid({ columns, data });
    expect(grid.isDirty.value).toBe(false);
    columns.value = [...base, { key: "team", label: "Team" }];
    await nextTick();
    expect(grid.isDirty.value).toBe(false);
  });

  it("a definition change keeps a dirty grid dirty", async () => {
    const columns = ref<DataGridColumn[]>([...base]);
    const grid = useDataGrid({ columns, data });
    grid.toggleColumnVisibility("email");
    expect(grid.isDirty.value).toBe(true);
    columns.value = [...base, { key: "team", label: "Team" }];
    await nextTick();
    expect(grid.isDirty.value).toBe(true);
  });

  it("still reads a plain array once, as before", async () => {
    const columns = [...base];
    const grid = useDataGrid({ columns, data });
    columns.push({ key: "team", label: "Team" });
    await nextTick();
    expect(grid.columns.map((c) => c.key)).toEqual(["name", "email", "role"]);
  });
});
