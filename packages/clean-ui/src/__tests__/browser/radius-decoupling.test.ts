import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick, type Component } from "vue";
import main from "../../styles/main.css?inline";
import CuiAccordion from "../../components/CuiAccordion.vue";
import CuiAccordionItem from "../../components/CuiAccordionItem.vue";
import CuiAlert from "../../components/CuiAlert.vue";
import CuiBadge from "../../components/CuiBadge.vue";
import CuiButton from "../../components/CuiButton.vue";
import CuiCard from "../../components/CuiCard.vue";
import CuiFieldset from "../../components/CuiFieldset.vue";
import CuiInput from "../../components/CuiInput.vue";
import CuiModal from "../../components/CuiModal.vue";
import CuiPagination from "../../components/CuiPagination.vue";
import CuiPopover from "../../components/CuiPopover.vue";
import CuiTooltip from "../../components/CuiTooltip.vue";

/**
 * #294 — `rounded="md"` reads `--cui-radius-md` and nothing else. `--cui-button-radius` is
 * CuiButton's own token: setting it restyles buttons, not the cards, modals and alerts that
 * used to follow it.
 *
 * Real browser: the cascade and `var()` resolution are the subject.
 */
describe("the radius scale and the button token are separate (#294, real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens-294-decoupling";
    style.textContent = main;
    document.head.append(style);
  });
  afterAll(() => document.getElementById("cui-tokens-294-decoupling")?.remove());

  const wrappers: VueWrapper[] = [];
  const hosts: HTMLElement[] = [];
  afterEach(() => {
    wrappers.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((el) => el.remove());
    document.documentElement.removeAttribute("style");
  });

  /** Mount into a host carrying `style`; the element selected by `pick` is measured. */
  async function radiusOf(component: Component, props: Record<string, unknown>, style: string, pick = ":scope", slots?: Record<string, () => unknown>) {
    const host = document.createElement("div");
    host.setAttribute("style", style);
    document.body.append(host);
    hosts.push(host);
    wrappers.push(mount(component, { props, slots: slots as never, attachTo: host }));
    await nextTick();
    await new Promise((r) => setTimeout(r, 30));
    const el = pick === ":scope" ? (host.querySelector("[data-v-app]")!.firstElementChild as HTMLElement) : (host.querySelector(pick) ?? document.querySelector(pick))!;
    expect(el, `nothing matched ${pick}`).toBeTruthy();
    return getComputedStyle(el).borderTopLeftRadius;
  }

  const slot = { default: () => "x" };

  // Every `md` consumer, with how to find the element whose corner is measured.
  const MD_CONSUMERS: Array<[string, Component, Record<string, unknown>, string, Record<string, () => unknown> | undefined]> = [
    ["CuiCard", CuiCard, { rounded: "md" }, ":scope", slot],
    ["CuiAlert", CuiAlert, { rounded: "md", title: "T" }, ":scope", slot],
    ["CuiFieldset", CuiFieldset, { rounded: "md", legend: "L" }, ":scope", slot],
    ["CuiInput", CuiInput, { modelValue: "x", rounded: "md" }, ".cui-input", undefined],
    ["CuiAccordion", CuiAccordion, { modelValue: [] }, ":scope", { default: () => h(CuiAccordionItem, { value: "a", label: "A" }, slot) }],
    ["CuiPagination", CuiPagination, { currentPage: 2, totalPages: 9 }, ".cui-pagination__btn", undefined],
  ];

  it("CuiButton follows --cui-button-radius", async () => {
    expect(await radiusOf(CuiButton, { rounded: "md" }, "--cui-button-radius: 11px", ":scope", slot)).toBe("11px");
  });

  it("does not move a card, alert, fieldset, input, accordion or pagination button at md", async () => {
    for (const [name, component, props, pick, slots] of MD_CONSUMERS) {
      expect(await radiusOf(component, props, "--cui-button-radius: 11px", pick, slots), name).toBe("6px");
    }
  });

  it("does not move a modal or popover panel (teleported: the token is set on the root)", async () => {
    document.documentElement.style.setProperty("--cui-button-radius", "11px");
    expect(await radiusOf(CuiModal, { visible: true, rounded: "md", title: "T" }, "", ".cui-modal", slot)).toBe("6px");
    expect(
      await radiusOf(CuiPopover, { visible: true, rounded: "md" }, "", ".cui-popover__panel", { default: () => h("button", "o"), content: () => "c" }),
    ).toBe("6px");
    expect(await radiusOf(CuiTooltip, { visible: true, text: "t" }, "", ".cui-tooltip", { default: () => h("button", "o") })).toBe("6px");
  });

  it("moves every md consumer when --cui-radius-md is set, buttons included", async () => {
    for (const [name, component, props, pick, slots] of MD_CONSUMERS) {
      expect(await radiusOf(component, props, "--cui-radius-md: 9px", pick, slots), name).toBe("9px");
    }
    expect(await radiusOf(CuiButton, { rounded: "md" }, "--cui-radius-md: 9px", ":scope", slot)).toBe("9px");
  });

  it("moves a teleported panel when --cui-radius-md is set on the root", async () => {
    document.documentElement.style.setProperty("--cui-radius-md", "9px");
    expect(await radiusOf(CuiModal, { visible: true, rounded: "md", title: "T" }, "", ".cui-modal", slot)).toBe("9px");
    expect(
      await radiusOf(CuiPopover, { visible: true, rounded: "md" }, "", ".cui-popover__panel", { default: () => h("button", "o"), content: () => "c" }),
    ).toBe("9px");
  });

  it("lets a button's own token win over the scale, and a component's own token win over both", async () => {
    expect(await radiusOf(CuiButton, { rounded: "md" }, "--cui-radius-md: 9px; --cui-button-radius: 3px", ":scope", slot)).toBe("3px");
    const own: Array<[string, Component, Record<string, unknown>, string, string, Record<string, () => unknown> | undefined]> = [
      ["CuiCard", CuiCard, { rounded: "md" }, ":scope", "--cui-card-radius", slot],
      ["CuiAlert", CuiAlert, { rounded: "md", title: "T" }, ":scope", "--cui-alert-radius", slot],
      ["CuiFieldset", CuiFieldset, { rounded: "md", legend: "L" }, ":scope", "--cui-fieldset-radius", slot],
      ["CuiBadge", CuiBadge, { rounded: "md" }, ":scope", "--cui-badge-radius", slot],
      ["CuiInput", CuiInput, { modelValue: "x", rounded: "md" }, ".cui-input", "--cui-input-radius", undefined],
      ["CuiAccordion", CuiAccordion, { modelValue: [] }, ":scope", "--cui-accordion-radius", { default: () => h(CuiAccordionItem, { value: "a", label: "A" }, slot) }],
      ["CuiPagination", CuiPagination, { currentPage: 2, totalPages: 9 }, ".cui-pagination__btn", "--cui-pagination-radius", undefined],
    ];
    for (const [name, component, props, pick, token, slots] of own) {
      expect(await radiusOf(component, props, `--cui-radius-md: 9px; --cui-button-radius: 2px; ${token}: 4px`, pick, slots), name).toBe("4px");
    }
  });

  it("takes a Badge, Fieldset and Popover's corners from their own tokens and plain rules", async () => {
    const consumer = document.createElement("style");
    consumer.textContent = ".cui-badge { border-radius: 2px; }";
    document.head.append(consumer);
    try {
      expect(await radiusOf(CuiBadge, { rounded: "full" }, "", ":scope", slot)).toBe("2px");
    } finally {
      consumer.remove();
    }
    document.documentElement.style.setProperty("--cui-popover-radius", "5px");
    expect(
      await radiusOf(CuiPopover, { visible: true, rounded: "lg" }, "", ".cui-popover__panel", { default: () => h("button", "o"), content: () => "c" }),
    ).toBe("5px");
  });

  it("keeps the scale's other steps on their tokens", async () => {
    expect(await radiusOf(CuiCard, { rounded: "lg" }, "--cui-radius-lg: 14px; --cui-button-radius: 3px", ":scope", slot)).toBe("14px");
    expect(await radiusOf(CuiCard, { rounded: "sm" }, "--cui-radius-sm: 2px; --cui-button-radius: 3px", ":scope", slot)).toBe("2px");
  });

  describe("an input's attached buttons", () => {
    const buttons = { "prefix-button": () => h(CuiButton, { size: "sm" }, () => "A"), "suffix-button": () => h(CuiButton, { size: "sm" }, () => "Go") };

    async function ends(props: Record<string, unknown>, style: string) {
      const host = document.createElement("div");
      host.setAttribute("style", style);
      document.body.append(host);
      hosts.push(host);
      wrappers.push(mount(CuiInput, { props: { modelValue: "x", ...props }, slots: buttons, attachTo: host }));
      await nextTick();
      const field = getComputedStyle(host.querySelector(".cui-input")!);
      const prefix = getComputedStyle(host.querySelector(".cui-input__prefix-button .cui-button")!);
      const suffix = getComputedStyle(host.querySelector(".cui-input__suffix-button .cui-button")!);
      return { field, prefix, suffix };
    }

    it("round their outer ends with a pill, and square the inner ones", async () => {
      const { field, prefix, suffix } = await ends({ rounded: "full" }, "");
      expect(field.borderTopLeftRadius).toBe("9999px");
      // Less the border, which a radius that large clamps to the same half-height anyway.
      expect(parseFloat(prefix.borderTopLeftRadius)).toBeGreaterThan(1000);
      expect(parseFloat(prefix.borderBottomLeftRadius)).toBeGreaterThan(1000);
      expect(prefix.borderTopRightRadius).toBe("0px");
      expect(parseFloat(suffix.borderTopRightRadius)).toBeGreaterThan(1000);
      expect(suffix.borderTopLeftRadius).toBe("0px");
    });

    it("follow the field, not --cui-button-radius", async () => {
      const { prefix } = await ends({ rounded: "md" }, "--cui-button-radius: 11px");
      expect(prefix.borderTopLeftRadius).toBe("5px");
      const moved = await ends({ rounded: "md" }, "--cui-radius-md: 10px");
      expect(moved.prefix.borderTopLeftRadius).toBe("9px");
      const own = await ends({ rounded: "md" }, "--cui-input-radius: 12px");
      expect(own.prefix.borderTopLeftRadius).toBe("11px");
    });
  });
});
