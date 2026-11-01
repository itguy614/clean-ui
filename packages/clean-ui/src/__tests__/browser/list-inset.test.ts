import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { defineComponent, h } from "vue";
import main from "../../styles/main.css?inline";
import themeCss from "../../styles/theme.css?raw";
import CuiList from "../../components/CuiList.vue";
import CuiListItem from "../../components/CuiListItem.vue";

/**
 * #234 — the inset (settings-app) list. Each row paints the card fill and border itself,
 * with corners by position; the hover fill follows the row's shape; dividers are inset to
 * the row padding and are never elements. All of it is the cascade, so a real browser.
 */
describe("CuiList variant=inset (real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens";
    // The inlined main.css drops theme.css's `@theme` scale (Tailwind emits only what the
    // stylesheet itself uses), so the default scale is restated as `:root` beside it.
    style.textContent = `${main}\n${themeCss.replace(/^@theme/m, ":root")}`;
    document.head.append(style);
  });

  afterAll(() => document.getElementById("cui-tokens")?.remove());

  const fixtures: HTMLElement[] = [];
  afterEach(() => fixtures.splice(0).forEach((el) => el.remove()));

  function host(style = "") {
    const el = document.createElement("div");
    el.setAttribute("style", `width: 320px; ${style}`);
    document.body.append(el);
    fixtures.push(el);
    return el;
  }

  function inset(count: number, { style = "", rounded }: { style?: string; rounded?: string } = {}) {
    const w = mount(
      defineComponent({
        render: () =>
          h(CuiList, { variant: "inset", rounded }, () =>
            Array.from({ length: count }, (_, i) => h(CuiListItem, { key: i, title: `Row ${i}`, onClick: () => {} })),
          ),
      }),
      { attachTo: host(style) },
    );
    return [...w.element.querySelectorAll<HTMLElement>("li.cui-list-item")];
  }

  const css = (el: Element, prop: string, pseudo?: string) => getComputedStyle(el, pseudo).getPropertyValue(prop);
  const corners = (el: Element) =>
    ["border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius"].map((p) =>
      css(el, p),
    );

  it("rounds the first item's top, the last item's bottom, and squares the middle", () => {
    const [first, middle, last] = inset(3, { rounded: "lg" });
    expect(corners(first)).toEqual(["8px", "8px", "0px", "0px"]);
    expect(corners(middle)).toEqual(["0px", "0px", "0px", "0px"]);
    expect(corners(last)).toEqual(["0px", "0px", "8px", "8px"]);
  });

  it("rounds all four corners of a lone item", () => {
    const [only] = inset(1, { rounded: "lg" });
    expect(corners(only)).toEqual(["8px", "8px", "8px", "8px"]);
  });

  it("follows --cui-card-radius when rounded is unset, and --cui-list-radius over both", () => {
    expect(corners(inset(1, { style: "--cui-card-radius: 13px" })[0])).toEqual(["13px", "13px", "13px", "13px"]);
    expect(corners(inset(1, { style: "--cui-card-radius: 13px; --cui-list-radius: 3px", rounded: "lg" })[0])).toEqual([
      "3px",
      "3px",
      "3px",
      "3px",
    ]);
  });

  it("paints the card fill and border on each row, with no container padding", () => {
    const items = inset(3, { style: "--cui-card-bg: rgb(1, 2, 3)" });
    const list = items[0].parentElement!;
    expect(css(list, "padding-top")).toBe("0px");
    expect(css(list, "background-color")).toBe("rgba(0, 0, 0, 0)");
    for (const li of items) expect(css(li, "background-color")).toBe("rgb(1, 2, 3)");
    // One outer border round the group: no doubled border where two rows meet.
    expect(items.map((li) => [css(li, "border-top-width"), css(li, "border-bottom-width")])).toEqual([
      ["1px", "0px"],
      ["0px", "0px"],
      ["0px", "1px"],
    ]);
    expect(css(items[1], "border-left-width")).toBe("1px");
  });

  it("shapes the hover and focus fill to the row (border-radius: inherit)", () => {
    const [first, , last] = inset(3, { rounded: "lg" });
    const firstRow = first.querySelector(".cui-list-item__row")!;
    const lastRow = last.querySelector(".cui-list-item__row")!;
    expect(corners(firstRow)).toEqual(corners(first));
    expect(corners(lastRow)).toEqual(corners(last));
    // And the row fills its item edge to edge, so the fill reaches the group's edge.
    expect(firstRow.getBoundingClientRect().width).toBe(first.clientWidth);
  });

  it("fills a hovered row with the hover token, in the row's own shape", async () => {
    const [first] = inset(3, { rounded: "lg", style: "--cui-list-hover-bg: rgb(7, 8, 9)" });
    const row = first.querySelector<HTMLElement>(".cui-list-item__row")!;
    expect(css(row, "background-color")).toBe("rgba(0, 0, 0, 0)");
    await userEvent.hover(row);
    expect(css(row, "background-color")).toBe("rgb(7, 8, 9)");
    expect(corners(row)).toEqual(["8px", "8px", "0px", "0px"]);
    await userEvent.unhover(row);
  });

  it("draws a divider above every row but the first, inset to the row padding", () => {
    const items = inset(3, { style: "--cui-list-px: 20px" });
    expect(css(items[0], "content", "::before")).toBe("none");
    for (const li of items.slice(1)) {
      expect(css(li, "border-top-width", "::before")).toBe("1px");
      expect(css(li, "left", "::before")).toBe("20px");
      expect(css(li, "right", "::before")).toBe("20px");
    }
    // The row stacks above its item's divider, so a hover fill or focus ring covers the line
    // rather than being crossed by it.
    const row = items[1].querySelector(".cui-list-item__row")!;
    expect(css(row, "position")).toBe("relative");
    expect(Number(css(row, "z-index"))).toBeGreaterThan(0);
    expect(css(items[1], "z-index", "::before")).toBe("auto");
    // The dividers are pseudo-elements: the list's children are exactly its rows.
    expect(items[0].parentElement!.children).toHaveLength(3);
  });

  it("truncates a long title to one line", () => {
    const w = mount(
      defineComponent({
        render: () =>
          h(CuiList, { variant: "inset" }, () =>
            h(CuiListItem, { title: "A very long printer name ".repeat(10), subtitle: "Status line ".repeat(10) }),
          ),
      }),
      { attachTo: host() },
    );
    const title = w.element.querySelector<HTMLElement>(".cui-list-item__title")!;
    const subtitle = w.element.querySelector<HTMLElement>(".cui-list-item__subtitle-text")!;
    for (const el of [title, subtitle]) {
      expect(css(el, "text-overflow")).toBe("ellipsis");
      expect(el.scrollWidth).toBeGreaterThan(el.clientWidth);
      expect(el.getClientRects()).toHaveLength(1);
    }
    expect(w.element.getBoundingClientRect().width).toBeLessThanOrEqual(320);
  });
});
