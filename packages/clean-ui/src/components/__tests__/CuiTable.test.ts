import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import CuiTable from "../CuiTable.vue";
import CuiTableHead from "../CuiTableHead.vue";
import CuiTableBody from "../CuiTableBody.vue";
import CuiTableFoot from "../CuiTableFoot.vue";
import CuiTableRow from "../CuiTableRow.vue";
import CuiTableCell from "../CuiTableCell.vue";

// Build the table tree with render functions (h) rather than an in-DOM string
// template — the browser HTML parser strips custom tags nested inside <table>,
// so a string template would never produce real thead/tbody/tr/td/th nodes.
function mountTable(props: Record<string, unknown> = {}) {
  return mount(CuiTable, {
    props,
    slots: {
      default: () => [
        h(CuiTableHead, () => [
          h(CuiTableRow, () => [
            h(CuiTableCell, { header: true }, () => "Name"),
            h(CuiTableCell, { header: true, align: "right" }, () => "Score"),
          ]),
        ]),
        h(CuiTableBody, () => [
          h(CuiTableRow, () => [
            h(CuiTableCell, () => "Alice"),
            h(CuiTableCell, () => "10"),
          ]),
          h(CuiTableRow, { selected: true }, () => [
            h(CuiTableCell, () => "Bob"),
            h(CuiTableCell, () => "20"),
          ]),
        ]),
        h(CuiTableFoot, () => [
          h(CuiTableRow, () => [
            h(CuiTableCell, () => "Total"),
            h(CuiTableCell, () => "30"),
          ]),
        ]),
      ],
    },
  });
}

describe("CuiTable + sub-components", () => {
  it("renders real table semantics with every section assembled via context", () => {
    const wrapper = mountTable();

    expect(wrapper.find("table.cui-table").exists()).toBe(true);
    expect(wrapper.find("thead").exists()).toBe(true);
    expect(wrapper.find("tbody").exists()).toBe(true);
    expect(wrapper.find("tfoot").exists()).toBe(true);

    // thead 1 row + tbody 2 rows + tfoot 1 row = 4 <tr>
    expect(wrapper.findAll("tr")).toHaveLength(4);
  });

  it("renders header cells as <th scope=col> in the head and body cells as <td>", () => {
    const wrapper = mountTable();

    // CuiTableCell with header:true renders <th> and gets scope="col"
    const headCells = wrapper.findAll("thead th");
    expect(headCells).toHaveLength(2);
    expect(headCells.map((c) => c.text())).toEqual(["Name", "Score"]);
    expect(headCells[0].attributes("scope")).toBe("col");

    // Body cells (no header prop) render as <td>
    const bodyCells = wrapper.findAll("tbody td");
    expect(bodyCells).toHaveLength(4);
    expect(bodyCells[0].text()).toBe("Alice");
  });

  it("infers <th scope=col> for cells in the head with no header prop", () => {
    // The common case: callers don't pass `header`, so the cell has to derive it
    // from the section context. A Boolean prop cast to `false` when absent would
    // silently make these <td> and break the sticky-header rule.
    const wrapper = mount(CuiTable, {
      props: { stickyHeader: true },
      slots: {
        default: () => [
          h(CuiTableHead, () => [
            h(CuiTableRow, () => [h(CuiTableCell, () => "Name"), h(CuiTableCell, () => "Score")]),
          ]),
          h(CuiTableBody, () => [
            h(CuiTableRow, () => [h(CuiTableCell, () => "Alice"), h(CuiTableCell, () => "10")]),
          ]),
        ],
      },
    });

    const headCells = wrapper.findAll("thead th");
    expect(headCells).toHaveLength(2);
    expect(headCells[0].attributes("scope")).toBe("col");
    expect(wrapper.findAll("thead td")).toHaveLength(0);
    // body cells are unaffected
    expect(wrapper.findAll("tbody td")).toHaveLength(2);
  });

  it("honors an explicit header={false} inside the head", () => {
    const wrapper = mount(CuiTable, {
      slots: {
        default: () => [
          h(CuiTableHead, () => [
            h(CuiTableRow, () => [h(CuiTableCell, { header: false }, () => "Plain")]),
          ]),
        ],
      },
    });

    expect(wrapper.find("thead td").exists()).toBe(true);
    expect(wrapper.find("thead th").exists()).toBe(false);
  });

  it("applies the align style on a cell", () => {
    const wrapper = mountTable();
    const scoreHeader = wrapper.findAll("thead th")[1];
    expect(scoreHeader.attributes("style")).toContain("text-align: right");
  });

  it("marks a selected row with cui-table-row--selected", () => {
    const wrapper = mountTable();
    const selected = wrapper.findAll("tr.cui-table-row--selected");
    expect(selected).toHaveLength(1);
    expect(selected[0].text()).toContain("Bob");
  });

  it("applies striped / bordered / hoverable modifier classes from props", () => {
    const wrapper = mountTable({ striped: true, bordered: true, hoverable: true });
    const table = wrapper.find("table.cui-table");
    expect(table.classes()).toContain("cui-table--striped");
    expect(table.classes()).toContain("cui-table--bordered");
    expect(table.classes()).toContain("cui-table--hoverable");
  });

  it("maps the size prop through to a modifier class", () => {
    const wrapper = mountTable({ size: "lg" });
    expect(wrapper.find("table.cui-table").classes()).toContain("cui-table--lg");
  });

  it("wraps the table in a scroll container when maxHeight is set", () => {
    const wrapper = mountTable({ maxHeight: "200px" });
    const scroller = wrapper.find(".cui-table-wrapper");
    expect(scroller.exists()).toBe(true);
    // the table lives inside the scroll wrapper
    expect(scroller.find("table.cui-table").exists()).toBe(true);
    expect((scroller.element as HTMLElement).style.maxHeight).toBe("200px");
  });
});

describe("CuiTable overflow containment", () => {
  /** jsdom lays nothing out; fake a table wider than its wrapper. */
  function forceOverflow(wrapper: ReturnType<typeof mountTable>, overflowing: boolean) {
    const scroller = wrapper.find(".cui-table-wrapper").element as HTMLElement;
    const table = wrapper.find("table.cui-table").element as HTMLElement;
    Object.defineProperty(scroller, "clientWidth", { value: 300, configurable: true });
    Object.defineProperty(table, "offsetWidth", {
      value: overflowing ? 900 : 300,
      configurable: true,
    });
    Object.defineProperty(table, "scrollWidth", {
      value: overflowing ? 900 : 300,
      configurable: true,
    });
    return (wrapper.vm as unknown as { measure: () => void }).measure();
  }

  it("always renders the wrapper, even with no sizing props", () => {
    const wrapper = mountTable();
    const scroller = wrapper.find(".cui-table-wrapper");
    expect(scroller.exists()).toBe(true);
    expect(scroller.find("table.cui-table").exists()).toBe(true);
  });

  it("leaves the wrapper inert while the table fits", async () => {
    const wrapper = mountTable();
    forceOverflow(wrapper, false);
    await wrapper.vm.$nextTick();

    const scroller = wrapper.find(".cui-table-wrapper");
    const style = (scroller.element as HTMLElement).style;
    // no overflow at all — a scroll container here would break a sticky thead
    expect(style.overflow).toBe("");
    expect(style.overflowX).toBe("");
    expect(scroller.attributes("tabindex")).toBeUndefined();
    expect(scroller.attributes("role")).toBeUndefined();
  });

  it("becomes a keyboard-reachable scroll region once the table overflows", async () => {
    const wrapper = mountTable();
    forceOverflow(wrapper, true);
    await wrapper.vm.$nextTick();

    const scroller = wrapper.find(".cui-table-wrapper");
    expect((scroller.element as HTMLElement).style.overflowX).toBe("auto");
    expect(scroller.attributes("tabindex")).toBe("0");
    expect(scroller.attributes("role")).toBe("region");
    expect(scroller.attributes("aria-label")).toBe("Scrollable table");
  });

  it("treats a maxHeight table as a scroll region without measuring", () => {
    const wrapper = mountTable({ maxHeight: "200px" });
    const scroller = wrapper.find(".cui-table-wrapper");
    expect((scroller.element as HTMLElement).style.overflow).toBe("auto");
    expect(scroller.attributes("tabindex")).toBe("0");
    expect(scroller.attributes("role")).toBe("region");
  });

  it("warns when stickyHeader is used on an overflowing table without maxHeight", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const wrapper = mountTable({ stickyHeader: true });
    forceOverflow(wrapper, true);

    expect(spy).toHaveBeenCalledWith(expect.stringContaining("stickyHeader"));
    spy.mockRestore();
  });
});
