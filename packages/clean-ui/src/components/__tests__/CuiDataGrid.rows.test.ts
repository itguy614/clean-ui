import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiDataGrid from "../CuiDataGrid.vue";
import { RESTORE_FOCUS_EVENT, restoreKeyOf } from "../../utils/focusRestore";

/**
 * #232 — every row was pointer-styled and click-only, whether or not anything listened for
 * row-click: a clickable grid couldn't be used from the keyboard, and a plain one looked
 * clickable.
 */

const columns = [{ key: "name", label: "Name" }];
const data = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
});

function mountGrid(props: Record<string, unknown> = {}) {
  w = mount(CuiDataGrid, { props: { columns, data, hideToolbar: true, ...props }, attachTo: document.body });
  return w;
}

const rows = () => w!.findAll("tbody tr").filter((r) => !r.attributes("aria-hidden"));
const press = (el: Element, key: string) => {
  const e = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  el.dispatchEvent(e);
  return e;
};

describe("CuiDataGrid rows", () => {
  it("are plain rows without a row-click listener: no tab stop, no pointer", () => {
    mountGrid();
    expect(rows().every((r) => r.attributes("tabindex") === undefined)).toBe(true);
    expect(rows()[0].classes()).not.toContain("cui-data-grid-table__row--interactive");
  });

  it("are one tab stop, on the first row, with a row-click listener", () => {
    mountGrid({ onRowClick: () => {} });
    expect(rows().map((r) => r.attributes("tabindex"))).toEqual(["0", "-1", "-1", "-1", "-1"]);
    expect(rows()[0].classes()).toContain("cui-data-grid-table__row--interactive");
  });

  it("follow rowClickable over the listener", () => {
    mountGrid({ onRowClick: () => {}, rowClickable: false });
    expect(rows()[0].attributes("tabindex")).toBeUndefined();
    w!.unmount();
    mountGrid({ rowClickable: true });
    expect(rows()[0].attributes("tabindex")).toBe("0");
  });

  it("move with the arrows, Home and End, and emit row-click on Enter and Space", async () => {
    const clicked: number[] = [];
    mountGrid({ onRowClick: ({ row }: { row: { id: number } }) => clicked.push(row.id) });
    const first = rows()[0].element as HTMLElement;
    first.focus();
    press(first, "ArrowDown");
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(rows()[1].element);
    press(document.activeElement!, "End");
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(rows()[4].element);
    expect(rows()[4].attributes("tabindex")).toBe("0");

    const space = press(document.activeElement!, " ");
    expect(space.defaultPrevented).toBe(true); // no scroll
    press(document.activeElement!, "Enter");
    expect(clicked).toEqual([5, 5]);
  });

  it("leave keys inside a cell's controls to them", () => {
    const clicked: unknown[] = [];
    mountGrid({
      onRowClick: (p: unknown) => clicked.push(p),
      bulkActions: [{ key: "x", label: "X" }],
    });
    const checkbox = rows()[0].find('[role="checkbox"]').element;
    press(checkbox, "Enter");
    expect(clicked).toEqual([]);
  });

  it("keep a tab stop when the active row is filtered out", async () => {
    mountGrid({ onRowClick: () => {} });
    const last = rows()[4].element as HTMLElement;
    last.focus();
    await nextTick();
    await w!.setProps({ data: data.slice(0, 2) });
    expect(rows().map((r) => r.attributes("tabindex"))).toEqual(["0", "-1"]);
  });

  it("restore focus by key to a row that unmounted while an overlay was open", async () => {
    mountGrid({ onRowClick: () => {} });
    const key = restoreKeyOf(rows()[3].element)!;
    expect(key).toBeTruthy();
    document.dispatchEvent(new CustomEvent(RESTORE_FOCUS_EVENT, { detail: key }));
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(rows()[3].element);
  });
});
