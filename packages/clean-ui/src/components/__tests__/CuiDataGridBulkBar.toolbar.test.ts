import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiDataGrid from "../CuiDataGrid.vue";
import { describeRovingFocusContract, press } from "../../composables/__tests__/roving-focus-contract";

/**
 * #421 — the bulk-action bar was a row of buttons with a tab stop each, so a grid with many
 * actions cost a long run of Tab presses. It is a CuiToolbar now: one stop, arrows between
 * the actions and "Clear", and the count beside it rather than among its items.
 */

const columns = [{ key: "name", label: "Name" }];
const data = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];
const bulkActions = [
  { key: "archive", label: "Archive" },
  { key: "export", label: "Export" },
  { key: "delete", label: "Delete", variant: "destructive" as const },
];

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
});

/** Mount a grid and select every row, so the bar shows (after the next render). */
function mountGrid() {
  const wrapper = mount(CuiDataGrid, {
    props: { columns, data, hideToolbar: true, bulkActions },
    attachTo: document.body,
  });
  wrapper.find<HTMLElement>('[role="checkbox"][aria-label="Select all rows"]').element.click();
  return wrapper;
}

async function mountWithSelection() {
  w = mountGrid();
  await nextTick();
  await nextTick(); // the roving stop settles after the bar renders
  return w;
}

const bar = () => w!.find(".cui-data-grid-bulk-bar");
const buttons = () => [...bar().element.querySelectorAll<HTMLElement>(".cui-button")];

describe("CuiDataGridBulkBar as a toolbar", () => {
  it("is a toolbar named from the messages, holding the actions and Clear", async () => {
    await mountWithSelection();
    const toolbar = bar().find('[role="toolbar"]');
    expect(toolbar.exists()).toBe(true);
    expect(toolbar.attributes("aria-label")).toBe("Bulk actions");
    expect(toolbar.attributes("aria-orientation")).toBe("horizontal");
    expect(toolbar.findAll(".cui-button").map((b) => b.text())).toEqual(["Archive", "Export", "Delete", "Clear"]);
  });

  it("keeps the count outside the toolbar", async () => {
    await mountWithSelection();
    const count = bar().find(".cui-data-grid-bulk-bar__count");
    expect(count.text()).toBe("2 items selected");
    expect(count.element.closest('[role="toolbar"]')).toBeNull();
  });

  it("gives the row one tab stop, and the arrows reach Clear at the end", async () => {
    await mountWithSelection();
    expect(buttons().map((b) => b.getAttribute("tabindex"))).toEqual(["0", "-1", "-1", "-1"]);
    buttons()[0].focus();
    await press("ArrowRight");
    expect(document.activeElement).toBe(buttons()[1]);
    await press("End");
    expect(document.activeElement?.textContent?.trim()).toBe("Clear");
    expect(buttons().map((b) => b.getAttribute("tabindex"))).toEqual(["-1", "-1", "-1", "0"]);
  });
});

describeRovingFocusContract("CuiDataGridBulkBar", {
  mount: mountGrid,
  items: () => [...document.querySelectorAll<HTMLElement>(".cui-data-grid-bulk-bar .cui-button")],
  orientation: "horizontal",
});
