import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import main from "../../styles/main.css?inline";
import CuiTransferList from "../../components/CuiTransferList.vue";
import CuiMaskedInput from "../../components/CuiMaskedInput.vue";

/**
 * #469 — the two override routes CuiTransferList and CuiMaskedInput now promise: a token set
 * on an ancestor, and a plain consumer rule at (0,1,0), both with no `!important`. Real
 * browser: both are about the cascade, which jsdom does not model.
 */
describe("CuiTransferList and CuiMaskedInput themeable properties (real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens-469t";
    style.textContent = `${main}
      :root { --color-surface-500: oklch(0.7 0.01 270); --color-surface-600: oklch(0.6 0.012 270);
        --color-primary-500: oklch(0.5 0.2 270); --color-primary-100: oklch(0.93 0.04 270); }
      * { transition: none !important; }`;
    document.head.append(style);
  });
  afterAll(() => document.getElementById("cui-tokens-469t")?.remove());

  const wrappers: VueWrapper[] = [];
  const hosts: HTMLElement[] = [];
  const sheets: HTMLStyleElement[] = [];
  afterEach(() => {
    wrappers.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((h) => h.remove());
    sheets.splice(0).forEach((s) => s.remove());
  });

  const consumer = (css: string) => {
    const el = document.createElement("style");
    el.textContent = css;
    document.head.append(el);
    sheets.push(el);
  };
  function host(hostStyle: string) {
    const h = document.createElement("div");
    h.setAttribute("style", hostStyle);
    document.body.append(h);
    hosts.push(h);
    return h;
  }
  const items = [{ value: 1, label: "Alpha" }, { value: 2, label: "Beta" }];
  function transferList(hostStyle = "", props: Record<string, unknown> = {}) {
    const w = mount(CuiTransferList, { props: { items, modelValue: [2], ...props }, attachTo: host(hostStyle) });
    wrappers.push(w);
    return w.element as HTMLElement;
  }
  const css = (el: Element, prop: string) => getComputedStyle(el).getPropertyValue(prop);
  const part = (root: HTMLElement, sel: string) => root.querySelector(sel) as HTMLElement;

  describe("CuiTransferList", () => {
    it("takes a container token for the gap, panel paint and the row's size", () => {
      const root = transferList(
        [
          "--cui-transfer-list-gap: 17px",
          "--cui-transfer-list-bg: rgb(1, 2, 3)",
          "--cui-transfer-list-border: 3px solid rgb(4, 5, 6)",
          "--cui-transfer-list-radius: 11px",
          "--cui-transfer-list-px: 21px",
          "--cui-transfer-list-py: 9px",
          "--cui-transfer-list-font-size: 19px",
          "--cui-transfer-list-color: rgb(7, 8, 9)",
        ].join(";"),
      );
      const panel = part(root, ".cui-transfer-list__panel");
      const row = part(root, ".cui-transfer-list__option");
      expect(css(root, "column-gap")).toBe("17px");
      expect(css(panel, "background-color")).toBe("rgb(1, 2, 3)");
      expect(css(panel, "border-top-width")).toBe("3px");
      expect(css(panel, "border-top-color")).toBe("rgb(4, 5, 6)");
      expect(css(panel, "border-top-left-radius")).toBe("11px");
      expect(css(row, "padding-left")).toBe("21px");
      expect(css(row, "padding-top")).toBe("9px");
      expect(css(row, "font-size")).toBe("19px");
      expect(css(row, "color")).toBe("rgb(7, 8, 9)");
    });

    it("takes a container token for a marked row and the focus ring", async () => {
      const root = transferList(
        "--cui-transfer-list-pressed-bg: rgb(10, 20, 30); --cui-transfer-list-focus-ring: rgb(40, 50, 60)",
        { modelValue: [] },
      );
      const row = part(root, ".cui-transfer-list__option");
      row.click();
      await nextTick();
      expect(css(row, "background-color")).toBe("rgb(10, 20, 30)");
      row.focus();
      expect(css(row, "outline-color")).toBe("rgb(40, 50, 60)");
    });

    it("lets a plain consumer rule win over the component, with no !important", () => {
      // The component's paint is inside `:where()`, so it is (0,0,0) despite the scoped attribute.
      consumer(`
        .cui-transfer-list { column-gap: 13px; }
        .cui-transfer-list__panel { background: rgb(1, 2, 3); border-radius: 2px; }
        .cui-transfer-list__option { padding: 3px 5px; font-size: 18px; color: rgb(9, 8, 7); }
        .cui-transfer-list__option--selected { background: rgb(5, 6, 7); }
        .cui-transfer-list__title { color: rgb(11, 12, 13); }`);
      const root = transferList("", { modelValue: [] });
      const row = part(root, ".cui-transfer-list__option");
      expect(css(root, "column-gap")).toBe("13px");
      expect(css(part(root, ".cui-transfer-list__panel"), "background-color")).toBe("rgb(1, 2, 3)");
      expect(css(part(root, ".cui-transfer-list__panel"), "border-top-left-radius")).toBe("2px");
      expect(css(row, "padding-left")).toBe("5px");
      expect(css(row, "padding-top")).toBe("3px");
      expect(css(row, "font-size")).toBe("18px");
      expect(css(row, "color")).toBe("rgb(9, 8, 7)");
      expect(css(part(root, ".cui-transfer-list__title"), "color")).toBe("rgb(11, 12, 13)");
    });

    it("emits no themeable paint inline on a row, panel or header", () => {
      // A bare inline declaration outranks every stylesheet rule, which is what #469 removes.
      const root = transferList();
      const inline = [...root.querySelectorAll<HTMLElement>("*")]
        .filter((el) => el.style.length && !el.classList.contains("cui-transfer-list"))
        .filter((el) => [...el.style].some((p) => !p.startsWith("--")));
      expect(inline.map((el) => el.className)).toEqual([]);
      expect([...root.style].every((p) => p.startsWith("--_transfer-list-"))).toBe(true);
    });
  });

  describe("CuiMaskedInput", () => {
    // CuiMaskedInput draws nothing of its own: it is a CuiInput. Its themeable surface is the
    // input's, and it must stay reachable through the masked input's own root class.
    function masked(hostStyle = "") {
      const w = mount(CuiMaskedInput, { props: { mask: "##-##" }, attachTo: host(hostStyle) });
      wrappers.push(w);
      return w.element as HTMLElement;
    }

    it("takes a container --cui-input-radius", () => {
      const field = part(masked("--cui-input-radius: 9px"), ".cui-input");
      expect(css(field, "border-top-left-radius")).toBe("9px");
    });

    it("lets a plain consumer rule win, with no !important", () => {
      consumer(".cui-input { border-radius: 5px; }");
      const field = part(masked(), ".cui-input");
      expect(css(field, "border-top-left-radius")).toBe("5px");
    });

    it("carries its own root class", () => {
      expect(masked().classList.contains("cui-masked-input")).toBe(true);
    });

    it("writes no inline style of its own beyond the input's private tokens", () => {
      const root = masked();
      const inline = [...root.querySelectorAll<HTMLElement>("*")].flatMap((el) => [...el.style]).filter((p) => !p.startsWith("--_input-"));
      expect(inline).toEqual([]);
    });
  });
});
