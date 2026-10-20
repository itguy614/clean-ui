import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens, mountHosts } from "./helpers";
import CuiTable from "../../components/CuiTable.vue";
import CuiTableBody from "../../components/CuiTableBody.vue";
import CuiTableRow from "../../components/CuiTableRow.vue";
import CuiTableCell from "../../components/CuiTableCell.vue";
import CuiBreadcrumb from "../../components/CuiBreadcrumb.vue";
import CuiBreadcrumbItem from "../../components/CuiBreadcrumbItem.vue";

/**
 * #147 — prose rules inside `.cui-typography` repainted components: a table's cells took
 * the prose padding whatever the table's `size`, and a breadcrumb's list took prose markers
 * and indent. A cascade question, so measured in a real browser; the selector and template
 * guards live in `styles/__tests__/typography-exclusion.test.ts`.
 */
describe("prose rules don't reach into components (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => {
    removeTokens = installTokens(main);
  });
  afterAll(() => removeTokens());

  const dom = mountHosts();
  afterEach(() => dom.cleanup());

  function inScope(prose: boolean, render: () => ReturnType<typeof h>) {
    const host = dom.host();
    if (prose) host.className = "cui-typography";
    dom.track(mount({ render }, { attachTo: host }));
    return host;
  }

  it("leaves a table's cell padding to its size", () => {
    const table = () =>
      h(CuiTable, { size: "lg" }, () => h(CuiTableBody, () => h(CuiTableRow, () => h(CuiTableCell, () => "Cell"))));
    const style = (host: HTMLElement) => {
      const t = getComputedStyle(host.querySelector("table")!);
      const td = getComputedStyle(host.querySelector("td")!);
      return { padding: td.padding, border: td.borderBottomWidth, fontSize: t.fontSize, width: t.width, collapse: t.borderCollapse };
    };
    expect(style(inScope(true, table))).toEqual(style(inScope(false, table)));
  });

  it("leaves a breadcrumb's list and links as the breadcrumb draws them", () => {
    const crumbs = () =>
      h(CuiBreadcrumb, () => [h(CuiBreadcrumbItem, { href: "#home" }, () => "Home"), h(CuiBreadcrumbItem, () => "Page")]);
    const style = (host: HTMLElement) => {
      const ol = getComputedStyle(host.querySelector("ol")!);
      const a = getComputedStyle(host.querySelector("a")!);
      return {
        listStyle: ol.listStyleType,
        padding: ol.paddingLeft,
        li: getComputedStyle(host.querySelector("li")!).marginBottom,
        link: [a.color, a.textDecorationLine],
      };
    };
    expect(style(inScope(true, crumbs))).toEqual(style(inScope(false, crumbs)));
  });

  it("still styles prose itself, and the typography layer's own helpers", () => {
    const host = inScope(true, () => [
      h("ul", [h("li", "one")]),
      h("p", { class: "cui-lead" }, "Lead"),
      h("pre", [h("code", { class: "cui-code" }, "x")]),
    ]);
    expect(getComputedStyle(host.querySelector("ul")!).listStyleType).toBe("disc");
    // The lead keeps prose paragraph spacing; code in a block loses the inline chip.
    expect(getComputedStyle(host.querySelector("p.cui-lead")!).marginBottom).not.toBe("0px");
    expect(getComputedStyle(host.querySelector("pre code")!).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });
});
