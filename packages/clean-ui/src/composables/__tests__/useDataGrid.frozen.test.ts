import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { nextTick, ref } from "vue";
import { useDataGrid } from "../useDataGrid";
import { __clearWarned } from "../../utils/devWarn";
import type { DataGridColumnDef, DataGridViewConfig } from "../../types/data-grid";

/** #465 — a frozen (`sticky`) column is always in the leftmost block, in declared order, and never moves. */

const leaf = (key: string, sticky?: boolean) => ({ key, label: key.toUpperCase(), ...(sticky ? { sticky } : {}) });
const keysOf = (grid: ReturnType<typeof make>) => grid.columnState.value.map((c) => c.key);

function make(columns: DataGridColumnDef[], extra: Record<string, unknown> = {}) {
  return useDataGrid({ columns: ref(columns), data: ref([]), ...extra });
}

// declared out of order on purpose: a frozen column after normal ones, and one in the middle
const flat = (): DataGridColumnDef[] => [leaf("a"), leaf("f1", true), leaf("b"), leaf("f2", true), leaf("c")];

describe("frozen columns lead, in declared order", () => {
  it("pulls frozen columns to the front by default, and starts clean", () => {
    const grid = make(flat());
    expect(keysOf(grid)).toEqual(["f1", "f2", "a", "b", "c"]);
    expect(grid.isDirty.value).toBe(false);
    expect(grid.visibleColumns.value.map((c) => c.key)).toEqual(["f1", "f2", "a", "b", "c"]);
  });

  it("reports which columns are frozen", () => {
    const grid = make(flat());
    expect(grid.isFrozen("f1")).toBe(true);
    expect(grid.isFrozen("a")).toBe(false);
  });

  it("heals an initialView whose order breaks the rule", () => {
    const initialView: DataGridViewConfig = {
      ...make(flat()).getConfig(),
      columns: ["c", "f2", "b", "f1", "a"].map((key) => ({ key, visible: true })),
    };
    const grid = make(flat(), { initialView });
    expect(keysOf(grid)).toEqual(["f1", "f2", "c", "b", "a"]);
  });

  it("heals a loaded config, and keeps each column's visibility", () => {
    const grid = make(flat());
    grid.loadConfig({
      ...grid.getConfig(),
      columns: ["a", "f2", "b", "f1", "c"].map((key) => ({ key, visible: key !== "b" })),
    });
    expect(keysOf(grid)).toEqual(["f1", "f2", "a", "b", "c"]);
    expect(grid.columnState.value.find((c) => c.key === "b")!.visible).toBe(false);
  });

  it("heals on a columns change", async () => {
    const defs = ref<DataGridColumnDef[]>([leaf("a"), leaf("b"), leaf("f1", true)]);
    const grid = useDataGrid({ columns: defs, data: ref([]) });
    expect(keysOf(grid)).toEqual(["f1", "a", "b"]);
    defs.value = [leaf("a"), leaf("b"), leaf("f1", true), leaf("f3", true), leaf("n")];
    await nextTick();
    expect(keysOf(grid)).toEqual(["f1", "f3", "n", "a", "b"]);
    // a column made frozen later joins the block
    defs.value = [leaf("a"), leaf("b", true), leaf("f1", true), leaf("f3", true), leaf("n")];
    await nextTick();
    expect(keysOf(grid)).toEqual(["b", "f1", "f3", "n", "a"]);
  });
});

describe("the state refuses moves that break it", () => {
  it("never moves a frozen column", () => {
    const grid = make(flat());
    grid.reorderColumns(0, 4);
    grid.reorderColumns(1, 3);
    expect(keysOf(grid)).toEqual(["f1", "f2", "a", "b", "c"]);
    grid.moveColumn("f1", 1);
    grid.reorderUnit(0, 3);
    expect(keysOf(grid)).toEqual(["f1", "f2", "a", "b", "c"]);
  });

  it("never lands a normal column in or before the frozen block", () => {
    const grid = make(flat());
    grid.reorderColumns(4, 0);
    expect(keysOf(grid)).toEqual(["f1", "f2", "c", "a", "b"]);
    grid.reorderColumns(3, 1);
    expect(keysOf(grid)).toEqual(["f1", "f2", "a", "c", "b"]);
    grid.reorderUnit(4, 0);
    expect(keysOf(grid)).toEqual(["f1", "f2", "b", "a", "c"]);
    // one step up from the first normal column is a no-op
    grid.moveColumn("b", -1);
    expect(keysOf(grid)).toEqual(["f1", "f2", "b", "a", "c"]);
    // normal columns still move among themselves
    grid.moveColumn("b", 1);
    expect(keysOf(grid)).toEqual(["f1", "f2", "a", "b", "c"]);
  });
});

describe("groups and frozen columns", () => {
  const defs = (): DataGridColumnDef[] => [
    leaf("n1"),
    { label: "Reads", children: [leaf("r1", true), leaf("r2", true)] },
    { label: "RSSI", children: [leaf("s1"), leaf("s2")] },
    leaf("n2"),
  ];

  it("freezes a group wholly, to the front, and never moves it", () => {
    const grid = make(defs());
    expect(keysOf(grid)).toEqual(["r1", "r2", "n1", "s1", "s2", "n2"]);
    const reads = grid.columnUnits.value[0];
    expect(reads.type).toBe("group");
    if (reads.type === "group") {
      grid.moveGroup(reads.group, 1);
      grid.reorderGroup(reads.group, 3);
    }
    grid.reorderColumns(0, 1);
    expect(keysOf(grid)).toEqual(["r1", "r2", "n1", "s1", "s2", "n2"]);
  });

  it("keeps another group out of the frozen group", () => {
    const grid = make(defs());
    const rssi = grid.columnUnits.value[2];
    if (rssi.type === "group") grid.reorderGroup(rssi.group, 0);
    expect(keysOf(grid)).toEqual(["r1", "r2", "s1", "s2", "n1", "n2"]);
  });

  describe("a group that mixes frozen and normal columns", () => {
    let warn: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
      __clearWarned();
      warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    });
    afterEach(() => warn.mockRestore());

    const mixed = (): DataGridColumnDef[] => [
      leaf("n1"),
      { label: "Mixed", children: [leaf("m1", true), leaf("m2"), leaf("m3")] },
      leaf("f", true),
    ];

    it("is unfrozen, whole, with a warning", () => {
      const grid = make(mixed());
      expect(grid.isFrozen("m1")).toBe(false);
      expect(grid.isFrozen("f")).toBe(true);
      // the group stays together and the real frozen column leads
      expect(keysOf(grid)).toEqual(["f", "n1", "m1", "m2", "m3"]);
      expect(warn).toHaveBeenCalledOnce();
      expect(warn.mock.calls[0][0]).toContain('"Mixed"');
      expect(warn.mock.calls[0][0]).toContain("mixes frozen");
    });

    it("lets the unfrozen group move like any other", () => {
      const grid = make(mixed());
      const mixedUnit = grid.columnUnits.value[2];
      if (mixedUnit.type === "group") grid.moveGroup(mixedUnit.group, -1);
      expect(keysOf(grid)).toEqual(["f", "m1", "m2", "m3", "n1"]);
    });
  });
});
