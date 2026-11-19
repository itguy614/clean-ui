import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h } from "vue";
import { userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import CuiModalHeader from "../../components/CuiModalHeader.vue";
import CuiButton from "../../components/CuiButton.vue";
import CuiDataGrid from "../../components/CuiDataGrid.vue";
import type { DataGridViewAdapter } from "../../types/data-grid";
import { frames, injectStyle, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #557 and #558, alignment polish: the saved-views menu's icons sit on their label's centre
 * line with the standard gap, and a modal header with actions centres title, actions and Close
 * on one line, with Close at a small button's height. Layout claims, so a real browser.
 */
describe("alignment polish (real browser, #557 #558)", () => {
  let removeTokens: () => void;
  beforeAll(() => (removeTokens = installTokens(`${main} .cui-button { transition: none !important; }`)));
  afterAll(() => removeTokens());

  const dom = mountHosts();
  const rules: Array<() => void> = [];
  let grid: VueWrapper | undefined;
  afterEach(() => {
    grid?.unmount();
    grid = undefined;
    dom.cleanup();
    rules.splice(0).forEach((remove) => remove());
  });
  const centreY = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.top + r.height / 2;
  };

  describe("CuiModalHeader (#558)", () => {
    function header(slots: Record<string, () => unknown> = {}, props: Record<string, unknown> = {}) {
      const host = dom.host();
      host.style.width = "480px";
      mount(CuiModalHeader, { attachTo: host, props: { title: "Title", ...props }, slots: slots as never });
      return host.querySelector<HTMLElement>(".cui-modal-header")!;
    }
    const withButton = { actions: () => h(CuiButton, { size: "sm", variant: "outline" }, () => "Edit") };

    it("centres the title, the actions and Close on one line, Close as tall as a small button", async () => {
      const root = header(withButton);
      await frames(3);
      const title = root.querySelector(".cui-modal-header__title")!;
      const button = root.querySelector(".cui-modal-header__actions .cui-button")!;
      const close = root.querySelector(".cui-modal-header__close")!;
      expect(Math.abs(centreY(title) - centreY(close))).toBeLessThan(0.5);
      expect(Math.abs(centreY(button) - centreY(close))).toBeLessThan(0.5);
      expect(close.getBoundingClientRect().height).toBe(button.getBoundingClientRect().height);
      expect(close.getBoundingClientRect().height).toBe(32);
    });

    it("keeps the title-only look: top-aligned, a 1.75rem Close nudged up", async () => {
      const root = header();
      await frames(3);
      const close = root.querySelector(".cui-modal-header__close")!;
      expect(getComputedStyle(root).alignItems).toBe("flex-start");
      expect(close.getBoundingClientRect().height).toBe(28);
      expect(getComputedStyle(close).marginTop).toBe("-2px");
    });

    it("lets a plain consumer rule and a token override alignment and Close size", async () => {
      rules.push(injectStyle(".cui-modal-header { align-items: flex-end; }"));
      const root = header(withButton);
      root.style.setProperty("--cui-modal-header-height", "40px");
      await frames(3);
      expect(getComputedStyle(root).alignItems).toBe("flex-end");
      expect(root.querySelector(".cui-modal-header__close")!.getBoundingClientRect().height).toBe(40);
    });
  });

  describe("the saved views menu (#557)", () => {
    const adapter: DataGridViewAdapter = {
      load: async () => [],
      save: async () => {},
      remove: async () => {},
    };

    it("puts each action's icon on the label's centre line with the standard gap", async () => {
      const host = dom.host();
      host.style.width = "700px";
      grid = mount(CuiDataGrid, {
        attachTo: host,
        props: { columns: [{ key: "a", label: "Alpha" }], data: [{ id: "1", a: 1 }], gridId: "g", viewAdapter: adapter },
      });
      await frames(4);
      await userEvent.click(host.querySelector<HTMLElement>(".cui-data-grid-view-manager button")!);
      await frames(12);
      const items = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].filter((i) => i.querySelector(".cui-dropdown-item__icon"));
      expect(items.length).toBeGreaterThanOrEqual(2);
      for (const item of items) {
        const icon = item.querySelector(".cui-dropdown-item__icon svg, .cui-dropdown-item__icon .cui-icon")!;
        const label = item.querySelector(".cui-dropdown-item__label")!;
        // The label's first line is 1.4 x the font size tall; the icon centres on it, within the
        // 1px nudge the item gives its icon column.
        const lineHeight = parseFloat(getComputedStyle(label).lineHeight);
        const lineCentre = label.getBoundingClientRect().top + lineHeight / 2;
        expect(Math.abs(centreY(icon) - lineCentre)).toBeLessThanOrEqual(1.5);
        const gap = label.getBoundingClientRect().left - icon.getBoundingClientRect().right;
        expect(gap).toBeGreaterThanOrEqual(6);
      }
    });
  });
});
