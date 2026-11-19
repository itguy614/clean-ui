import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { userEvent } from "@vitest/browser/context";
import CuiCheckbox from "../../components/CuiCheckbox.vue";
import CuiDataGrid from "../../components/CuiDataGrid.vue";
import type { DataGridColumnDef } from "../../types/data-grid";
import preflight from "../../styles/preflight.css?inline";
import { frames, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #553 and #556, both CuiCheckbox layout, measured in a real browser: line boxes and font
 * sizes are layout, which jsdom does not compute.
 *
 * - #553: an unlabeled checkbox on a text line changed the line's height when it was checked
 *   (a data grid's checked row came out shorter), because the baseline came from the check
 *   icon once it was there.
 * - #556: the label was a fixed 1rem whatever the `size`, so the grid's column manager and
 *   filter options read larger than the table they belong to.
 */
describe("CuiCheckbox layout (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(preflight)));
  afterAll(() => teardown());
  afterEach(cleanup);

  // A line box tighter than the 1.25rem box, which is what makes the shift visible.
  const TIGHT = { fontFamily: "Georgia, serif", fontSize: "11px", lineHeight: "1" };

  describe("#553: an unlabeled checkbox keeps its line's height when checked", () => {
    it.each([
      ["checked", { modelValue: true }],
      ["indeterminate", { indeterminate: true }],
    ])("a text line is as tall %s as unchecked", async (_name, state) => {
      const el = host({ width: "300px" });
      Object.assign(el.style, TIGHT);
      const wrapper = track(
        mount(
          defineComponent({
            props: { state: Object, on: Boolean },
            render() {
              return h("div", { class: "line" }, ["Row ", h(CuiCheckbox, this.on ? (this.state as object) : {})]);
            },
          }),
          { attachTo: el, props: { state, on: false } },
        ),
      );
      await frames(2);
      const line = el.querySelector<HTMLElement>(".line")!;
      const box = el.querySelector<HTMLElement>(".cui-checkbox__indicator")!;
      const before = { h: line.getBoundingClientRect().height, top: box.getBoundingClientRect().top };
      await wrapper.setProps({ on: true });
      await frames(2);
      expect(line.getBoundingClientRect().height).toBeCloseTo(before.h, 1);
      expect(box.getBoundingClientRect().top).toBeCloseTo(before.top, 1);
    });

    it("a data grid's row is as tall with its selector checked as unchecked", async () => {
      const style = document.createElement("style");
      style.textContent = `.cui-table td, .cui-table th { font-family: Georgia, serif; font-size: 11px; line-height: 1; padding-block: 0 !important; }`;
      document.head.append(style);
      try {
        const columns: DataGridColumnDef[] = [{ key: "name", label: "Name" }];
        const data = [{ id: "1", name: "One" }, { id: "2", name: "Two" }];
        const wrapper = track(
          mount(CuiDataGrid, {
            attachTo: host({ width: "500px" }),
            props: { columns, data, bulkActions: [{ key: "delete", label: "Delete" }], hideToolbar: true },
          }),
        );
        await frames(2);
        const rows = [...wrapper.element.querySelectorAll<HTMLElement>("tbody tr")];
        const heights = () => rows.map((r) => r.getBoundingClientRect().height);
        const [first, second] = heights();
        expect(first).toBeCloseTo(second, 1);
        await userEvent.click(rows[0].querySelector<HTMLElement>(".cui-checkbox")!);
        await frames(3);
        expect(rows[0].querySelector(".cui-checkbox--checked")).not.toBeNull();
        const [after, other] = heights();
        expect(after).toBeCloseTo(first, 1);
        expect(other).toBeCloseTo(second, 1);
      } finally {
        style.remove();
      }
    });
  });

  describe("#556: the label follows the size", () => {
    const labelOf = (size?: string, token?: string) => {
      const el = host();
      if (token) el.style.setProperty("--cui-checkbox-font-size", token);
      track(mount(CuiCheckbox, { attachTo: el, props: { label: "Label", ...(size ? { size } : {}) } }));
      const root = el.querySelector<HTMLElement>(".cui-checkbox")!;
      const label = el.querySelector<HTMLElement>(".cui-checkbox__label")!;
      return { root, label, box: el.querySelector<HTMLElement>(".cui-checkbox__indicator")! };
    };

    it.each([
      ["xs", 12],
      ["sm", 13],
      ["md", 16],
      ["lg", 17],
      ["xl", 18],
    ])("size %s draws the label at %dpx", (size, px) => {
      expect(parseFloat(getComputedStyle(labelOf(size).label).fontSize)).toBeCloseTo(px, 1);
    });

    it("md, the default, is the size and position it always was", () => {
      const { root, label, box } = labelOf();
      expect(getComputedStyle(label).fontSize).toBe("16px");
      expect(root.getBoundingClientRect().height).toBeCloseTo(24, 1);
      // The 20px box sits 2px down, centred on the 24px first line.
      expect(box.getBoundingClientRect().top - root.getBoundingClientRect().top).toBeCloseTo(2, 1);
      expect(box.getBoundingClientRect().width).toBe(20);
    });

    it("centres the box on the label's first line at a smaller size", () => {
      const { root, label, box } = labelOf("sm");
      const l = label.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      expect(b.top + b.height / 2).toBeCloseTo(l.top + l.height / 2, 0);
      expect(root.getBoundingClientRect().height).toBeGreaterThanOrEqual(l.height);
    });

    it("--cui-checkbox-font-size restyles the label, from a container", () => {
      expect(getComputedStyle(labelOf("sm", "20px").label).fontSize).toBe("20px");
    });
  });

  describe("in the data grid", () => {
    const columns: DataGridColumnDef[] = [
      { key: "id", label: "Correlation ID", filterable: true, filterType: "multi-select", filterOptions: [{ label: "Alpha", value: "a" }, { label: "Beta", value: "b" }] },
      { key: "action", label: "Action Name" },
      { key: "long", label: "A very long column label that cannot possibly fit on one line of the manager" },
    ];
    const data = [{ id: "a", action: "x", long: "y" }];

    async function openGrid() {
      const App = defineComponent({ render: () => h(CuiDataGrid, { columns, data }) });
      const wrapper = track(mount(App, { attachTo: host({ width: "900px" }) }));
      await frames(2);
      return wrapper.element as HTMLElement;
    }
    const button = (text: string) =>
      [...document.body.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.includes(text))!;
    const fontSize = (el: Element) => parseFloat(getComputedStyle(el).fontSize);

    it("column manager: labels are the table's text size and two-word labels stay on one line", async () => {
      const grid = await openGrid();
      await userEvent.click(button("Columns"));
      await frames(3);
      const names = [...document.body.querySelectorAll<HTMLElement>(".cui-data-grid-column-manager__name")];
      const byText = (t: string) => names.find((n) => n.textContent === t)!;
      const cell = fontSize(grid.querySelector("tbody td:last-child")!);
      for (const text of ["Correlation ID", "Action Name"]) {
        const label = byText(text);
        expect(fontSize(label)).toBeCloseTo(cell, 1);
        // One line: its height is one line box, and nothing is cut off.
        expect(label.getBoundingClientRect().height).toBeLessThan(fontSize(label) * 1.5 * 1.5);
        expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
        // With room to spare (twice the text), so a wider font or a longer two-word label does not tip it into an ellipsis.
        const room = label.closest<HTMLElement>(".cui-checkbox")!.getBoundingClientRect().width - 28; // minus the box and its gap
        expect(room).toBeGreaterThanOrEqual(label.scrollWidth * 2);
      }
    });

    it("column manager: a long label ends in an ellipsis and carries a title", async () => {
      await openGrid();
      await userEvent.click(button("Columns"));
      await frames(3);
      const long = [...document.body.querySelectorAll<HTMLElement>(".cui-data-grid-column-manager__name")].find((n) =>
        n.textContent?.startsWith("A very long"),
      )!;
      expect(long.scrollWidth).toBeGreaterThan(long.clientWidth);
      expect(getComputedStyle(long).textOverflow).toBe("ellipsis");
      expect(long.title).toBe(long.textContent);
      // The move buttons were not pushed out of the popover.
      const row = long.closest(".cui-data-grid-column-manager__row")!.getBoundingClientRect();
      const move = long.closest(".cui-data-grid-column-manager__row")!.querySelector("button")!.getBoundingClientRect();
      expect(move.right).toBeLessThanOrEqual(row.right + 0.5);
    });

    it("filter panel: multi-select options are smaller than the 1rem default", async () => {
      await openGrid();
      await userEvent.click(button("Filters"));
      await frames(3);
      const option = [...document.body.querySelectorAll<HTMLElement>(".cui-checkbox__label")].find((l) => l.textContent?.trim() === "Alpha")!;
      expect(fontSize(option)).toBeCloseTo(13, 1);
    });
  });
});
