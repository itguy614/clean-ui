import { describe, it, expect } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "@vue/server-renderer";
import CuiSortableList from "../../components/CuiSortableList.vue";

// #198: the list measures, animates and listens to the document only once the user acts, so a
// server render with no DOM at all must get through setup (the focus, FLIP and Escape layers
// are the parts that could reach for one).
describe("CuiSortableList renders on the server (node environment)", () => {
  it("renders the items, handles and move buttons with no DOM", async () => {
    expect(typeof document).toBe("undefined");
    const html = await renderToString(
      createSSRApp({
        render: () => h(CuiSortableList, { modelValue: [{ id: 1, label: "One" }, { id: 2, label: "Two" }] }),
      }),
    );
    expect(html).toContain("cui-sortable-list");
    expect(html).toContain("One");
    expect(html).toContain('aria-label="Reorder Two"');
    expect(html).toContain('aria-label="Move One down"');
    expect(html).toContain('role="status"');
  });
});
