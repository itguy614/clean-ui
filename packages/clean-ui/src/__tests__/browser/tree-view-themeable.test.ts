import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import CuiTreeView from "../../components/CuiTreeView.vue";
import type { TreeNode } from "../../components/CuiTreeView.vue";
import baselineJson from "./tree-view-baseline.json";

const nodes: TreeNode[] = [
  {
    id: "a",
    label: "Alpha",
    icon: "folder",
    children: [
      { id: "a1", label: "Alpha one", children: [{ id: "a1x", label: "Deep" }] },
      { id: "a2", label: "Alpha two", disabled: true },
    ],
  },
  { id: "b", label: "Bravo" },
];

describe("CuiTreeView is themeable (real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens-468";
    // The `--color-*` scale comes from a Tailwind `@theme` that only exists after the engine
    // has run, so the raw CSS here leaves every semantic slot undefined. Stub the slots the
    // tree reads with distinct values, light and dark, so a wrong or missing slot is visible.
    style.textContent = `${main}
      :root { --cui-primary-bg: rgb(1, 1, 1); --cui-primary: rgb(2, 2, 2); --cui-text-body: rgb(3, 3, 3);
        --cui-text-tertiary: rgb(4, 4, 4); --cui-text-secondary: rgb(5, 5, 5); --cui-border: rgb(6, 6, 6);
        --cui-border-strong: rgb(7, 7, 7); --cui-primary-focus-ring: rgb(8, 8, 8); }
      .dark { --cui-primary-bg: rgb(11, 11, 11); --cui-primary: rgb(12, 12, 12); --cui-text-body: rgb(13, 13, 13);
        --cui-text-tertiary: rgb(14, 14, 14); --cui-text-secondary: rgb(15, 15, 15); --cui-border: rgb(16, 16, 16);
        --cui-border-strong: rgb(17, 17, 17); --cui-primary-focus-ring: rgb(18, 18, 18); }`;
    document.head.append(style);
  });
  afterAll(() => document.getElementById("cui-tokens-468")?.remove());

  let wrapper: VueWrapper | undefined;
  let host: HTMLElement | undefined;
  const rules: HTMLStyleElement[] = [];
  afterEach(() => {
    wrapper?.unmount();
    host?.remove();
    wrapper = host = undefined;
    rules.splice(0).forEach((r) => r.remove());
  });

  async function render(props: Record<string, unknown> = {}, hostClass = "", hostStyle = "") {
    host = document.createElement("div");
    host.className = hostClass;
    host.setAttribute("style", hostStyle);
    document.body.append(host);
    wrapper = mount(CuiTreeView, {
      attachTo: host,
      props: { nodes, animated: false, defaultExpanded: ["a", "a1"], ...props },
    });
    await nextTick();
    return wrapper.element as HTMLElement;
  }

  const item = (id: string) => host!.querySelector<HTMLElement>(`[data-cui-tree-id="${id}"]`)!;
  const row = (id: string) => item(id).querySelector<HTMLElement>(":scope > .cui-tree-node__row")!;
  const round = (n: number) => Math.round(n * 100) / 100;

  /** Everything the stylesheet conversion must leave exactly as it was. */
  function capture() {
    const out: Record<string, unknown> = {};
    for (const id of ["a", "a1", "a1x", "a2", "b"]) {
      const r = row(id);
      const cs = getComputedStyle(r);
      const chevron = r.querySelector<HTMLElement>(".cui-tree-node__chevron")!;
      const ccs = getComputedStyle(chevron);
      const it = item(id);
      const itBox = it.getBoundingClientRect();
      const lines = [...it.querySelectorAll<HTMLElement>(":scope > div:not(.cui-tree-node__row):not(.cui-tree-node__group)")].map((l) => {
        const b = l.getBoundingClientRect();
        const s = getComputedStyle(l);
        return {
          x: round(b.left - itBox.left),
          y: round(b.top - itBox.top),
          w: round(b.width),
          h: round(b.height),
          bl: s.borderLeftWidth + " " + s.borderLeftColor,
          bt: s.borderTopWidth + " " + s.borderTopColor,
          z: s.zIndex,
        };
      });
      out[id] = {
        height: round(r.getBoundingClientRect().height),
        pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft],
        gap: cs.columnGap,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        cursor: cs.cursor,
        radius: cs.borderTopLeftRadius,
        bg: cs.backgroundColor,
        color: cs.color,
        opacity: cs.opacity,
        position: cs.position,
        z: cs.zIndex,
        chevron: { w: ccs.width, h: ccs.height, ml: ccs.marginLeft, transform: ccs.transform, transition: ccs.transitionProperty + ccs.transitionDuration },
        icons: [...r.querySelectorAll<HTMLElement>(".cui-icon")].map((i) => {
          const s = getComputedStyle(i);
          return { color: s.color, w: s.width, shrink: s.flexShrink };
        }),
        content: (() => {
          const s = getComputedStyle(r.lastElementChild!);
          return [s.flexGrow, s.minWidth, s.overflow, s.textOverflow, s.whiteSpace];
        })(),
        itemPosition: getComputedStyle(it).position,
        itemOutline: getComputedStyle(it).outlineStyle,
        lines,
      };
    }
    return out;
  }

  describe("rendering is what it was before the stylesheet conversion", () => {
    // Computed styles captured from the 1.9.0 build, when every one of these was an inline
    // declaration (`tree-view-baseline.json`). The tokens are stubbed above, so a wrong slot
    // reads as a wrong colour, light and dark.
    const baseline = baselineJson as Record<string, unknown>;

    for (const dark of [false, true]) {
      for (const size of ["sm", "md", "lg"]) {
        for (const lines of [true, false]) {
          const name = `${dark ? "dark" : "light"}-${size}-${lines ? "lines" : "nolines"}`;
          it(name, async () => {
            await render({ size, showLines: lines, modelValue: "a1" }, dark ? "dark" : "");
            expect(capture()).toEqual(baseline[name]);
          });
        }
      }
    }

    it("compact density", async () => {
      await render({ modelValue: "a1" }, "", "--cui-density-scale: 0.75");
      expect(capture()).toEqual(baseline["compact"]);
    });

    it("the focus ring", async () => {
      await render({ modelValue: "a1" });
      item("a").focus();
      await userEvent.keyboard("{ArrowDown}");
      const id = (document.activeElement as HTMLElement).dataset.cuiTreeId!;
      const s = getComputedStyle(row(id));
      expect({ id, outline: s.outlineStyle + s.outlineWidth + s.outlineColor + s.outlineOffset, radius: s.borderTopLeftRadius }).toEqual(
        baseline["focus"],
      );
    });
  });

  describe("a consumer can restyle it without !important (#468)", () => {
    function consumerRule(css: string) {
      const style = document.createElement("style");
      style.textContent = css;
      document.head.append(style);
      rules.push(style);
    }

    it("has no inline paint on a row, a chevron, an icon or a connector", async () => {
      await render({ modelValue: "a1" });
      for (const sel of [".cui-tree-node__row", ".cui-tree-node__chevron", ".cui-tree-node__icon", ".cui-tree-node__caret", ".cui-tree-node__line", ".cui-tree-node__content"]) {
        const els = [...host!.querySelectorAll<HTMLElement>(sel)];
        expect(els.length, sel).toBeGreaterThan(0);
        for (const el of els) expect(el.getAttribute("style") ?? "", sel).toBe("");
      }
    });

    it("takes a plain class rule on the row, the chevron and the connectors", async () => {
      consumerRule(`
        .cui-tree-node__row { padding-top: 11px; background: rgb(9, 9, 9); font-size: 21px; border-radius: 7px; gap: 13px; }
        .cui-tree-node__row--selected { background: rgb(19, 19, 19); color: rgb(29, 29, 29); }
        .cui-tree-node__chevron { width: 31px; }
        .cui-tree-node__line--through { border-left-color: rgb(39, 39, 39); }
        .cui-tree-node__line--branch { border-top-color: rgb(49, 49, 49); }
      `);
      await render({ modelValue: "a1" });
      const plain = getComputedStyle(row("b"));
      expect(plain.paddingTop).toBe("11px");
      expect(plain.backgroundColor).toBe("rgb(9, 9, 9)");
      expect(plain.fontSize).toBe("21px");
      expect(plain.borderTopLeftRadius).toBe("7px");
      expect(plain.columnGap).toBe("13px");
      const picked = getComputedStyle(row("a1"));
      expect(picked.backgroundColor).toBe("rgb(19, 19, 19)");
      expect(picked.color).toBe("rgb(29, 29, 29)");
      expect(getComputedStyle(row("a").querySelector(".cui-tree-node__chevron")!).width).toBe("31px");
      expect(getComputedStyle(item("a1").querySelector(".cui-tree-node__line--through")!).borderLeftColor).toBe("rgb(39, 39, 39)");
      expect(getComputedStyle(item("a1").querySelector(".cui-tree-node__line--branch")!).borderTopColor).toBe("rgb(49, 49, 49)");
    });

    it("takes the public tokens from a container", async () => {
      await render(
        { modelValue: "a1" },
        "",
        [
          "--cui-tree-view-py: 9px",
          "--cui-tree-view-px: 17px",
          "--cui-tree-view-gap: 3px",
          "--cui-tree-view-font-size: 19px",
          "--cui-tree-view-radius: 5px",
          "--cui-tree-view-bg: rgb(61, 61, 61)",
          "--cui-tree-view-color: rgb(62, 62, 62)",
          "--cui-tree-view-pressed-bg: rgb(63, 63, 63)",
          "--cui-tree-view-pressed-color: rgb(64, 64, 64)",
          "--cui-tree-view-border: rgb(65, 65, 65)",
          "--cui-tree-view-height: 40px",
        ].join(";"),
      );
      const plain = getComputedStyle(row("b"));
      expect(plain.paddingTop).toBe("9px");
      expect(plain.paddingRight).toBe("17px");
      expect(plain.paddingLeft).toBe("17px");
      expect(plain.columnGap).toBe("3px");
      expect(plain.fontSize).toBe("19px");
      expect(plain.borderTopLeftRadius).toBe("5px");
      expect(plain.backgroundColor).toBe("rgb(61, 61, 61)");
      expect(plain.color).toBe("rgb(62, 62, 62)");
      const picked = getComputedStyle(row("a1"));
      expect(picked.backgroundColor).toBe("rgb(63, 63, 63)");
      expect(picked.color).toBe("rgb(64, 64, 64)");
      expect(getComputedStyle(row("b").querySelector(".cui-tree-node__chevron")!).height).toBe("40px");
      // The connectors follow the padding token, and take the border one.
      const through = item("a1").querySelector(".cui-tree-node__line--through")!;
      expect(getComputedStyle(through).borderLeftColor).toBe("rgb(65, 65, 65)");
      // depth 1: (1 - 1) * indent + px + 0.5rem
      expect(through.getBoundingClientRect().left - item("a1").getBoundingClientRect().left).toBe(17 + 8);
    });

    it("takes the focus ring token, and a consumer rule on the ring", async () => {
      await render({ modelValue: "a1" }, "", "--cui-tree-view-focus-ring: rgb(71, 71, 71)");
      item("a").focus();
      await userEvent.keyboard("{ArrowDown}");
      const focused = row((document.activeElement as HTMLElement).dataset.cuiTreeId!);
      expect(getComputedStyle(focused).outlineColor).toBe("rgb(71, 71, 71)");
      consumerRule(".cui-tree-node__row { outline-width: 4px; }");
      expect(getComputedStyle(focused).outlineWidth).toBe("4px");
    });
  });

});
