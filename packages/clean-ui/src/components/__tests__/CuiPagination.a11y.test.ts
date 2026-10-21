import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import CuiPagination from "../CuiPagination.vue";
import CuiConfigProvider from "../CuiConfigProvider.vue";

/**
 * #155 — the per-page selector had no accessible name, and four ARIA strings were hard-coded
 * English beside a translated UI.
 */

describe("CuiPagination naming", () => {
  it("names the per-page selector", () => {
    const w = mount(CuiPagination, { props: { currentPage: 1, total: 50, perPage: 10 }, attachTo: document.body });
    const combo = w.find('[role="combobox"]');
    expect(document.getElementById(combo.attributes("aria-labelledby")!)?.textContent).toBe("Results per page");
    w.unmount();
  });

  it("hides the ellipsis from assistive tech", () => {
    const w = mount(CuiPagination, { props: { currentPage: 1, totalPages: 20 } });
    expect(w.find(".cui-pagination__ellipsis").attributes("aria-hidden")).toBe("true");
  });

  it("takes every accessible name from the message catalogue", () => {
    const w = mount(CuiConfigProvider, {
      props: {
        messages: {
          pagination: {
            label: "Seiten",
            perPageLabel: "Ergebnisse pro Seite",
            previous: "Vorherige Seite",
            next: "Nächste Seite",
            page: (n: number) => `Seite ${n}`,
          },
        },
      },
      slots: { default: () => h(CuiPagination, { currentPage: 2, totalPages: 5 }) },
      attachTo: document.body,
    });
    expect(w.find("nav").attributes("aria-label")).toBe("Seiten");
    expect(w.find(".cui-pagination__btn--nav").attributes("aria-label")).toBe("Vorherige Seite");
    expect(w.findAll(".cui-pagination__btn--nav")[1].attributes("aria-label")).toBe("Nächste Seite");
    expect(w.find('[aria-current="page"]').attributes("aria-label")).toBe("Seite 2");
    const combo = w.find('[role="combobox"]');
    expect(document.getElementById(combo.attributes("aria-labelledby")!)?.textContent).toBe("Ergebnisse pro Seite");
    w.unmount();
  });
});
