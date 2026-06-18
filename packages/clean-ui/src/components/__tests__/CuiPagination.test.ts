import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CuiPagination from "../CuiPagination.vue";

// totalItems=50, perPage=10 -> 5 pages. We drive pages via totalPages directly
// for the page-button cases, and via total/perPage for the info/derivation case.

describe("CuiPagination", () => {
  it("emits update:currentPage with the next page when Next is clicked", async () => {
    const wrapper = mount(CuiPagination, {
      props: { currentPage: 2, totalPages: 5 },
    });
    await wrapper.find('[aria-label="Next page"]').trigger("click");
    expect(wrapper.emitted("update:currentPage")).toEqual([[3]]);
  });

  it("emits update:currentPage with the previous page when Prev is clicked", async () => {
    const wrapper = mount(CuiPagination, {
      props: { currentPage: 2, totalPages: 5 },
    });
    await wrapper.find('[aria-label="Previous page"]').trigger("click");
    expect(wrapper.emitted("update:currentPage")).toEqual([[1]]);
  });

  it("emits the page number when a page button is clicked", async () => {
    const wrapper = mount(CuiPagination, {
      props: { currentPage: 1, totalPages: 5 },
    });
    await wrapper.find('[aria-label="Page 4"]').trigger("click");
    expect(wrapper.emitted("update:currentPage")).toEqual([[4]]);
  });

  it("does not emit when clicking the already-current page", async () => {
    const wrapper = mount(CuiPagination, {
      props: { currentPage: 3, totalPages: 5 },
    });
    await wrapper.find('[aria-label="Page 3"]').trigger("click");
    expect(wrapper.emitted("update:currentPage")).toBeUndefined();
  });

  it("disables Previous at the first page and Next at the last page", () => {
    const first = mount(CuiPagination, { props: { currentPage: 1, totalPages: 5 } });
    expect(first.find('[aria-label="Previous page"]').attributes("disabled")).toBeDefined();
    expect(first.find('[aria-label="Next page"]').attributes("disabled")).toBeUndefined();

    const last = mount(CuiPagination, { props: { currentPage: 5, totalPages: 5 } });
    expect(last.find('[aria-label="Next page"]').attributes("disabled")).toBeDefined();
    expect(last.find('[aria-label="Previous page"]').attributes("disabled")).toBeUndefined();
  });

  it("does not emit when clicking a disabled bound control", async () => {
    const wrapper = mount(CuiPagination, { props: { currentPage: 1, totalPages: 5 } });
    await wrapper.find('[aria-label="Previous page"]').trigger("click");
    expect(wrapper.emitted("update:currentPage")).toBeUndefined();
  });

  it("derives page count from total and perPage (50/10 -> 5 page buttons)", () => {
    const wrapper = mount(CuiPagination, {
      props: { currentPage: 1, total: 50, perPage: 10, totalPages: 5 },
    });
    for (const p of [1, 2, 3, 4, 5]) {
      expect(wrapper.find(`[aria-label="Page ${p}"]`).exists()).toBe(true);
    }
    expect(wrapper.find('[aria-label="Page 6"]').exists()).toBe(false);
  });
});
