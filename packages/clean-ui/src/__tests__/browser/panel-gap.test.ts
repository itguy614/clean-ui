import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { h, nextTick, type Component } from "vue";
import CuiSelect from "../../components/CuiSelect.vue";
import CuiCombobox from "../../components/CuiCombobox.vue";
import CuiTagInput from "../../components/CuiTagInput.vue";
import CuiDatePicker from "../../components/CuiDatePicker.vue";
import CuiDateRangePicker from "../../components/CuiDateRangePicker.vue";
import CuiTimePicker from "../../components/CuiTimePicker.vue";
import CuiPopover from "../../components/CuiPopover.vue";
import CuiTooltip from "../../components/CuiTooltip.vue";
import CuiButton from "../../components/CuiButton.vue";
import CuiDropdown from "../../components/CuiDropdown.vue";
import CuiDropdownTrigger from "../../components/CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../../components/CuiDropdownMenu.vue";
import CuiDropdownItem from "../../components/CuiDropdownItem.vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import { PANEL_OFFSET } from "../../utils/position";

/**
 * #486 — the date, date-range and time pickers sat 10px from their field (CuiPopover's default,
 * which leaves room for an arrow they do not draw) while a Combobox or Select sat 4px. Every
 * arrowless trigger-anchored panel now sits PANEL_OFFSET from its trigger; the arrow popover
 * and the tooltip keep a larger gap on purpose, pinned here so the exemption is deliberate.
 *
 * Real Chromium: the gap is a measured one, trigger border box to panel border box, which jsdom
 * reports as zero. Measured once the panel has finished scaling in, since mid-animation its
 * rect is the shrunken one.
 */
const POPOVER_ARROW_GAP = 10;
const TOOLTIP_GAP = 8;

describe.each(["light", "dark"] as const)("panel gap to the trigger (%s, real browser)", (mode) => {
  let removeTokens: () => void;
  beforeAll(() => {
    removeTokens = installTokens(main);
    document.documentElement.classList.toggle("dark", mode === "dark");
  });
  afterAll(() => {
    removeTokens();
    document.documentElement.classList.remove("dark");
  });

  let wrapper: VueWrapper | undefined;
  afterEach(async () => {
    wrapper?.unmount();
    wrapper = undefined;
    document.getElementById("gap-host")?.remove();
    // Let the previous panel's teardown finish, so it can't answer the next test's query.
    await new Promise((r) => requestAnimationFrame(r));
  });

  /** Near the top (opens below) or the bottom (no room below, so the panel flips above). */
  function host(at: "top" | "bottom") {
    const el = document.createElement("div");
    el.id = "gap-host";
    el.style.cssText = `position: fixed; left: 24px; width: 280px; ${at}: ${at === "top" ? 8 : 0}px;`;
    document.body.append(el);
    return el;
  }

  async function settle(panelSelector: string) {
    // Until the panel exists, then a few frames for Floating UI to place and flip it.
    for (let i = 0; i < 60 && !document.querySelector(panelSelector); i++) {
      await nextTick();
      await new Promise((r) => requestAnimationFrame(r));
    }
    for (let i = 0; i < 6; i++) await new Promise((r) => requestAnimationFrame(r));
    const panel = document.querySelector<HTMLElement>(panelSelector);
    expect(panel, `missing ${panelSelector}: not open`).toBeTruthy();
    await Promise.all(panel!.getAnimations().map((a) => a.finished));
    return panel!;
  }

  /**
   * The gap along the side the panel opened on: trigger border box to panel border box. Normally
   * below or above; a panel Floating UI finds no room for either way (CuiTimePicker's, beside a
   * narrow trigger at the viewport bottom) opens to a side, and keeps the gap there too.
   */
  function gap(trigger: Element, panel: Element) {
    const t = trigger.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    if (p.top >= t.bottom - 0.5) return { side: "below", gap: p.top - t.bottom };
    if (p.bottom <= t.top + 0.5) return { side: "above", gap: t.top - p.bottom };
    if (p.left >= t.right - 0.5) return { side: "right", gap: p.left - t.right };
    return { side: "left", gap: t.left - p.right };
  }

  const options = Array.from({ length: 12 }, (_, i) => ({ value: `v${i}`, label: `Option ${i + 1}` }));
  const popoverTrigger = (root: ParentNode) => root.querySelector(".cui-popover")!.firstElementChild!;
  const tallContent = "Popover content that is tall enough to matter. ".repeat(8);

  interface Case {
    name: string;
    mountIt: (el: HTMLElement) => VueWrapper;
    open: (el: HTMLElement) => Promise<void> | void;
    trigger: (el: HTMLElement) => Element;
    panel: string;
    expected: number;
  }

  const click = (selector: string) => (el: HTMLElement) => userEvent.click(el.querySelector<HTMLElement>(selector)!);
  const mountWith = (component: Component, props: Record<string, unknown>) => (el: HTMLElement) =>
    mount(component, { attachTo: el, props });

  const cases: Case[] = [
    {
      name: "CuiSelect",
      mountIt: mountWith(CuiSelect, { label: "Pick", options }),
      open: click(".cui-select__trigger"),
      trigger: (el) => el.querySelector(".cui-select__trigger")!,
      panel: ".cui-select__dropdown",
      expected: PANEL_OFFSET,
    },
    {
      name: "CuiCombobox",
      mountIt: mountWith(CuiCombobox, { label: "Pick", options }),
      open: (el) => userEvent.click(el.querySelector("input")!),
      trigger: (el) => el.querySelector(".cui-combobox__control")!,
      panel: ".cui-combobox__dropdown",
      expected: PANEL_OFFSET,
    },
    {
      name: "CuiTagInput",
      mountIt: mountWith(CuiTagInput, { label: "Tags", suggestions: options.map((o) => o.label) }),
      open: (el) => userEvent.click(el.querySelector("input")!),
      trigger: (el) => el.querySelector(".cui-tag-input__control")!,
      panel: ".cui-tag-input__dropdown",
      expected: PANEL_OFFSET,
    },
    {
      name: "CuiDropdownMenu",
      mountIt: (el) =>
        mount(
          {
            render: () =>
              h(CuiDropdown, null, () => [
                h(CuiDropdownTrigger, null, () => h(CuiButton, () => "Menu")),
                h(CuiDropdownMenu, null, () => Array.from({ length: 6 }, (_, i) => h(CuiDropdownItem, null, () => `Item ${i}`))),
              ]),
          },
          { attachTo: el },
        ),
      open: click(".cui-button"),
      trigger: (el) => el.querySelector(".cui-dropdown-trigger")!,
      panel: ".cui-dropdown-menu",
      expected: PANEL_OFFSET,
    },
    {
      name: "CuiDatePicker",
      mountIt: mountWith(CuiDatePicker, { modelValue: "2026-03-15" }),
      open: click(".cui-popover > div"),
      trigger: popoverTrigger,
      panel: ".cui-popover__panel",
      expected: PANEL_OFFSET,
    },
    {
      name: "CuiDateRangePicker",
      mountIt: mountWith(CuiDateRangePicker, {}),
      open: click(".cui-popover > div"),
      trigger: popoverTrigger,
      panel: ".cui-popover__panel",
      expected: PANEL_OFFSET,
    },
    {
      name: "CuiTimePicker",
      mountIt: mountWith(CuiTimePicker, {}),
      open: click(".cui-popover > div"),
      trigger: popoverTrigger,
      panel: ".cui-popover__panel",
      expected: PANEL_OFFSET,
    },
    {
      name: "CuiPopover with no-arrow",
      mountIt: (el) =>
        mount(CuiPopover, {
          attachTo: el,
          props: { placement: "bottom", noArrow: true, title: "Panel" },
          slots: { default: () => h(CuiButton, () => "Trigger"), content: () => tallContent },
        }),
      open: click(".cui-button"),
      trigger: popoverTrigger,
      panel: ".cui-popover__panel",
      expected: PANEL_OFFSET,
    },
    {
      // The arrow needs the room: a deliberate exemption, pinned.
      name: "CuiPopover with an arrow",
      mountIt: (el) =>
        mount(CuiPopover, {
          attachTo: el,
          props: { placement: "bottom", title: "Panel" },
          slots: { default: () => h(CuiButton, () => "Trigger"), content: () => tallContent },
        }),
      open: click(".cui-button"),
      trigger: popoverTrigger,
      panel: ".cui-popover__panel",
      expected: POPOVER_ARROW_GAP,
    },
    {
      name: "CuiTooltip",
      mountIt: (el) =>
        mount(CuiTooltip, {
          attachTo: el,
          props: { placement: "bottom", text: "Tip", trigger: "click" },
          slots: { default: () => h(CuiButton, () => "Trigger") },
        }),
      open: click(".cui-button"),
      trigger: (el) => el.querySelector(".cui-tooltip__trigger")!,
      panel: ".cui-tooltip",
      expected: TOOLTIP_GAP,
    },
  ];

  describe.each(cases)("$name", (c) => {
    it("sits the intended gap from its trigger, opening below", async () => {
      const el = host("top");
      wrapper = c.mountIt(el);
      await c.open(el);
      const panel = await settle(c.panel);
      const measured = gap(c.trigger(el), panel);
      expect(measured.side).toBe("below");
      expect(Math.abs(measured.gap - c.expected)).toBeLessThan(1);
    });

    it("keeps the same gap when flipped, with no room below", async () => {
      const el = host("bottom");
      wrapper = c.mountIt(el);
      await c.open(el);
      const panel = await settle(c.panel);
      const measured = gap(c.trigger(el), panel);
      expect(measured.side, "expected the panel to flip off the bottom").not.toBe("below");
      expect(Math.abs(measured.gap - c.expected)).toBeLessThan(1);
    });
  });
});
