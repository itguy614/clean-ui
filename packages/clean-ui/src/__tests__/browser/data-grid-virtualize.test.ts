import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import CuiDataGrid from "../../components/CuiDataGrid.vue";
import preflight from "../../styles/preflight.css?inline";
import { frames, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #317 — a client-side grid pages by default (15 rows), and `virtualize` windowed that one
 * page: a 10,000-row grid scrolled through 15 rows and needed a pagination bar to reach the
 * rest. Virtualize now turns client-side paging off, so the scroll area holds every row
 * and the DOM holds only the window.
 *
 * Real browser: the window is computed from laid-out row heights and scroll offsets.
 */
describe("CuiDataGrid virtualize on a client-side grid (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(preflight)));
  afterAll(() => teardown());
  afterEach(cleanup);

  const rows = Array.from({ length: 10_000 }, (_, i) => ({ id: String(i + 1), name: `Row ${i + 1}` }));

  it("windows all 10,000 rows, with no pagination bar", async () => {
    const wrapper = track(
      mount(CuiDataGrid, {
        attachTo: host({ width: "500px" }),
        // Default perPageOptions: the grid would page at 15.
        props: { columns: [{ key: "name", label: "Name" }], data: rows, maxHeight: "300px", virtualize: true, hideToolbar: true },
      }),
    );
    await frames(3);

    const table = wrapper.element.querySelector("table")!;
    const scroller = table.parentElement!;
    const rendered = () => [...table.querySelectorAll("tbody tr:not([aria-hidden])")];

    // Far more scroll height than one 15-row page, and far fewer rows in the DOM than 10,000.
    expect(scroller.scrollHeight).toBeGreaterThan(rows.length * 10);
    expect(rendered().length).toBeGreaterThan(0);
    expect(rendered().length).toBeLessThan(100);
    expect(wrapper.element.querySelector(".cui-data-grid-pagination")).toBeNull();

    scroller.scrollTop = scroller.scrollHeight;
    scroller.dispatchEvent(new Event("scroll"));
    await frames(3);
    const names = rendered().map((r) => r.querySelector("td")!.textContent!.trim());
    expect(names).toContain("Row 10000");
    expect(rendered().length).toBeLessThan(100);
  });
});
