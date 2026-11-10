import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import main from "../../styles/main.css?inline";
import { frames, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";
import CuiCard from "../../components/CuiCard.vue";
import CuiPopover from "../../components/CuiPopover.vue";
import CuiToast from "../../components/CuiToast.vue";
import CuiSlideover from "../../components/CuiSlideover.vue";
import CuiSelect from "../../components/CuiSelect.vue";
import CuiButton from "../../components/CuiButton.vue";
import CuiDropdown from "../../components/CuiDropdown.vue";
import CuiDropdownTrigger from "../../components/CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../../components/CuiDropdownMenu.vue";
import CuiDropdownItem from "../../components/CuiDropdownItem.vue";

/**
 * #335 — the card, popover, listbox panel, toast and slideover wrote their own black shadow,
 * which stayed as faint on a dark surface and disappeared. They read `--cui-shadow-*` now,
 * which strengthens under `.dark`; and the listbox panel shares the dropdown menu's value
 * (`md`) instead of a layered one of its own.
 *
 * Real browser: it is the resolved cascade (`getComputedStyle`) that is measured, with the
 * library's stylesheet injected and `dark` toggled on the root.
 */
describe("elevated surfaces strengthen their shadow in dark mode (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => (removeTokens = installTokens(main)));
  afterAll(() => removeTokens());
  const fixtures = mountHosts();
  afterEach(() => {
    fixtures.cleanup();
    document.documentElement.classList.remove("dark");
  });

  const shadowOf = (el: Element) => getComputedStyle(el).boxShadow;
  /** The total black alpha across a shadow's layers: how heavy it is. */
  const weight = (shadow: string) =>
    [...shadow.matchAll(/rgba\(0, 0, 0, ([\d.]+)\)/g)].reduce((n, m) => n + Number(m[1]), 0);

  const settle = () => frames(3);

  /** The level each surface is meant to read, as the cascade resolves it right now. */
  function level(name: string): string {
    const probe = document.body.appendChild(document.createElement("div"));
    probe.style.boxShadow = `var(--cui-shadow-${name})`;
    const resolved = shadowOf(probe);
    probe.remove();
    return resolved;
  }
  const LEVEL: Record<string, string> = { CuiCard: "xs", CuiPopover: "md", CuiToast: "md", CuiSlideover: "lg", CuiListboxPanel: "md" };

  const SURFACES: Record<string, () => Promise<HTMLElement>> = {
    async CuiCard() {
      fixtures.track(mount(CuiCard, { props: { variant: "elevated" }, slots: { default: "Body" }, attachTo: fixtures.host() }));
      await settle();
      return document.querySelector<HTMLElement>(".cui-card")!;
    },
    async CuiPopover() {
      fixtures.track(
        mount(CuiPopover, {
          props: { visible: true, title: "Panel" },
          slots: { default: () => h(CuiButton, () => "Trigger"), content: () => "Content" },
          attachTo: fixtures.host(),
        }),
      );
      await settle();
      return document.querySelector<HTMLElement>(".cui-popover__panel")!;
    },
    async CuiToast() {
      fixtures.track(mount(CuiToast, { props: { title: "Saved", autoDismiss: 0 }, attachTo: fixtures.host() }));
      await settle();
      return document.querySelector<HTMLElement>(".cui-toast")!;
    },
    async CuiSlideover() {
      fixtures.track(mount(CuiSlideover, { props: { visible: true, title: "Sheet" }, slots: { default: "Body" }, attachTo: fixtures.host() }));
      await settle();
      return document.querySelector<HTMLElement>(".cui-slideover__panel")!;
    },
    async CuiListboxPanel() {
      const w = fixtures.track(mount(CuiSelect, { props: { options: [{ value: "a", label: "A" }] }, attachTo: fixtures.host() }));
      await w.find(".cui-select__trigger").trigger("click");
      await settle();
      return document.querySelector<HTMLElement>(".cui-listbox-panel")!;
    },
  };

  describe.each(Object.entries(SURFACES))("%s", (name, open) => {
    it("casts a stronger shadow under .dark than in light mode", async () => {
      const el = await open();
      expect(el).not.toBeNull();
      const light = shadowOf(el);
      expect(weight(light)).toBeGreaterThan(0); // precondition: a shadow
      expect(light).toBe(level(LEVEL[name]!)); // and it is the level's, not a literal
      document.documentElement.classList.add("dark");
      await settle();
      expect(weight(shadowOf(el))).toBeGreaterThan(weight(light));
      expect(shadowOf(el)).toBe(level(LEVEL[name]!));
    });
  });

  it("gives the listbox panel the dropdown menu's shadow, in light and dark", async () => {
    const listbox = await SURFACES.CuiListboxPanel();
    const w = fixtures.track(
      mount(
        {
          render: () =>
            h(CuiDropdown, null, () => [
              h(CuiDropdownTrigger, null, () => h(CuiButton, () => "Menu")),
              h(CuiDropdownMenu, null, () => h(CuiDropdownItem, null, () => "One")),
            ]),
        },
        { attachTo: fixtures.host() },
      ),
    );
    await w.find(".cui-button").trigger("click");
    await settle();
    const menu = document.querySelector<HTMLElement>(".cui-dropdown-menu")!;
    expect(menu).not.toBeNull();
    expect(shadowOf(listbox)).toBe(shadowOf(menu));
    document.documentElement.classList.add("dark");
    await settle();
    expect(shadowOf(listbox)).toBe(shadowOf(menu));
  });
});
