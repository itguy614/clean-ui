import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiDataGrid from "../CuiDataGrid.vue";
import { RESTORE_FOCUS_EVENT, restoreKeyOf } from "../../utils/focusRestore";
import { describeRovingFocusContract } from "../../composables/__tests__/roving-focus-contract";

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

  it("don't emit row-click again for a held key's auto-repeat", () => {
    const clicked: unknown[] = [];
    mountGrid({ onRowClick: (p: unknown) => clicked.push(p) });
    const row = rows()[0].element;
    row.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    row.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", repeat: true, bubbles: true, cancelable: true }));
    expect(clicked).toHaveLength(1);
  });

  it("describe how to open themselves, having no role that says so", () => {
    mountGrid({ onRowClick: () => {} });
    expect(rows()[0].attributes("aria-description")).toBe("Press Enter to open");
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

  it("restore focus by key to a row that is no longer rendered", async () => {
    const many = Array.from({ length: 300 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
    w = mount(CuiDataGrid, {
      props: { columns, data: many, hideToolbar: true, hidePagination: true, perPageOptions: [300], virtualize: true, maxHeight: "200px", onRowClick: () => {} },
      attachTo: document.body,
    });
    await nextTick();
    const rendered = rows().length;
    expect(rendered).toBeLessThan(300); // windowed
    const prefix = restoreKeyOf(rows()[0].element)!.split(":").slice(0, -1).join(":");
    document.dispatchEvent(new CustomEvent(RESTORE_FOCUS_EVENT, { detail: `${prefix}:250` }));
    await nextTick();
    await nextTick();
    expect((document.activeElement as HTMLElement).textContent).toContain("Row 250");
  });
});

describeRovingFocusContract("CuiDataGrid interactive rows", {
  mount: () =>
    mount(CuiDataGrid, { props: { columns, data, hideToolbar: true, onRowClick: () => {} }, attachTo: document.body }),
  items: () => [...document.querySelectorAll<HTMLElement>("tbody tr[tabindex]")],
  orientation: "vertical",
});
