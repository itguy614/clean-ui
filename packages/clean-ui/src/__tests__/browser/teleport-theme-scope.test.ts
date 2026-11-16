import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createApp, defineComponent, h, nextTick, type App } from "vue";
import main from "../../styles/main.css?inline";
import { allThemesCss } from "./theme-css";
import {
  frames,
  injectStyle,
  mountHosts,
  themeTokensOn as tokensOn,
  themeTokensUnder as tokensUnder,
} from "../../../../../config/test/browser-helpers";
import CuiModal from "../../components/CuiModal.vue";
import CuiSlideover from "../../components/CuiSlideover.vue";
import CuiPopover from "../../components/CuiPopover.vue";
import CuiTooltip from "../../components/CuiTooltip.vue";
import CuiDropdown from "../../components/CuiDropdown.vue";
import CuiDropdownTrigger from "../../components/CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../../components/CuiDropdownMenu.vue";
import CuiDropdownItem from "../../components/CuiDropdownItem.vue";
import CuiDropdownSub from "../../components/CuiDropdownSub.vue";
import CuiContextMenu from "../../components/CuiContextMenu.vue";
import CuiSelect from "../../components/CuiSelect.vue";
import CuiButton from "../../components/CuiButton.vue";
import CuiToastProvider from "../../components/CuiToastProvider.vue";
import { useToast } from "../../composables/useToast";
import { useCleanUIContext, type CleanUIContext } from "../../composables/useCleanUIContext";

/**
 * #418 — every teleporting component renders its panel in `<body>`, outside a
 * `<div class="cui-theme-violet">` or a scoped `<div class="dark">` around it. Since #329 the
 * semantic tokens resolve on the theme scope, so the panel took the page's theme. Each now
 * copies the nearest theme class and a scoped `dark` onto the root it teleports, live.
 *
 * Real browser: what is measured is the token the cascade resolves on the teleported root,
 * against an element carrying the scope's classes directly under `<body>`.
 */
describe("teleported panels keep the theme scope they were opened from (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => (removeTokens = injectStyle(main + allThemesCss)));
  afterAll(() => removeTokens());
  const fixtures = mountHosts();
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    fixtures.cleanup();
    cleanups.splice(0).forEach((c) => c());
  });

  /** An attached host nested in one element per class, outermost first; returns the innermost. */
  function scope(...classes: string[]): HTMLElement {
    let parent = fixtures.host();
    for (const name of classes) {
      const el = document.createElement("div");
      el.className = name;
      parent = parent.appendChild(el);
    }
    return parent;
  }

  async function settle() {
    await nextTick();
    await frames(3);
  }

  const query = (selector: string) => {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) throw new Error(`${selector} did not open`);
    return el;
  };

  const menu = () =>
    h(CuiDropdown, null, () => [
      h(CuiDropdownTrigger, null, () => h(CuiButton, () => "Menu")),
      h(CuiDropdownMenu, null, () => [
        h(CuiDropdownItem, null, () => "One"),
        h(CuiDropdownSub, null, { default: () => "More", menu: () => [h(CuiDropdownItem, null, () => "Nested")] }),
      ]),
    ]);

  let toastApi: ReturnType<typeof useToast>;
  const ToastOpener = defineComponent({ setup: () => ((toastApi = useToast()), () => h("span", "app")) });

  /** Each family: mount it in `host`, open it, and return the root it teleported. */
  const FAMILIES: Record<string, (host: HTMLElement) => Promise<HTMLElement>> = {
    async CuiModal(host) {
      fixtures.track(mount(CuiModal, { props: { visible: true, title: "Modal" }, slots: { default: "Body" }, attachTo: host }));
      await settle();
      return query(".cui-modal-overlay");
    },
    async CuiSlideover(host) {
      fixtures.track(mount(CuiSlideover, { props: { visible: true, title: "Sheet" }, slots: { default: "Body" }, attachTo: host }));
      await settle();
      return query(".cui-slideover-overlay");
    },
    async CuiPopover(host) {
      fixtures.track(
        mount(CuiPopover, {
          props: { visible: true, title: "Panel" },
          slots: { default: () => h(CuiButton, () => "Trigger"), content: () => "Content" },
          attachTo: host,
        }),
      );
      await settle();
      return query(".cui-popover__panel");
    },
    async CuiTooltip(host) {
      fixtures.track(mount(CuiTooltip, { props: { visible: true, text: "Tip" }, slots: { default: () => h("button", "Hover") }, attachTo: host }));
      await settle();
      return query(".cui-tooltip");
    },
    async CuiDropdownMenu(host) {
      const w = fixtures.track(mount({ render: menu }, { attachTo: host }));
      await w.find(".cui-button").trigger("click");
      await settle();
      return query(".cui-dropdown-menu");
    },
    async CuiDropdownSub(host) {
      const w = fixtures.track(mount({ render: menu }, { attachTo: host }));
      await w.find(".cui-button").trigger("click");
      await settle();
      query(".cui-dropdown-sub__trigger").click();
      await settle();
      return query(".cui-dropdown-sub__menu");
    },
    async CuiContextMenu(host) {
      const w = fixtures.track(
        mount(CuiContextMenu, { slots: { default: () => h("div", "Area"), menu: () => h(CuiDropdownItem, null, () => "One") }, attachTo: host }),
      );
      (w.vm as unknown as { openAt: (x: number, y: number) => void }).openAt(20, 20);
      await settle();
      return query(".cui-context-menu__panel");
    },
    async "CuiListboxPanel (CuiSelect)"(host) {
      const w = fixtures.track(mount(CuiSelect, { props: { options: [{ value: "a", label: "A" }] }, attachTo: host }));
      await w.find(".cui-select__trigger").trigger("click");
      await settle();
      return query(".cui-listbox-panel");
    },
    async CuiToastProvider(host) {
      fixtures.track(mount({ render: () => h(CuiToastProvider, null, () => h(ToastOpener)) }, { attachTo: host }));
      toastApi.toast({ title: "Saved", autoDismiss: 0 });
      await settle();
      return query(".cui-toast-container");
    },
  };

  describe.each(Object.entries(FAMILIES))("%s", (_name, open) => {
    it("takes a scoped theme", async () => {
      const violet = tokensUnder("cui-theme-violet");
      expect(violet.primary).not.toBe(tokensUnder("").primary); // precondition
      const host = scope("cui-theme-violet");
      const root = await open(host);
      expect(host.contains(root)).toBe(false); // really teleported
      expect(tokensOn(root)).toEqual(violet);
    });

    it("takes a scoped dark class", async () => {
      const dark = tokensUnder("dark");
      expect(dark.surface).not.toBe(tokensUnder("").surface); // precondition
      const root = await open(scope("dark"));
      expect(tokensOn(root)).toEqual(dark);
    });
  });

  it("combines a scoped theme with a scoped dark class further out", async () => {
    const expected = tokensUnder("dark cui-theme-violet");
    expect(expected.primary).not.toBe(tokensUnder("cui-theme-violet").primary); // precondition
    const root = await FAMILIES.CuiModal(scope("dark", "cui-theme-violet"));
    expect(tokensOn(root)).toEqual(expected);
  });

  it("draws a scoped theme plus dark in that theme, not the page theme's dark scale", async () => {
    // The page is ruby (later in the all-in-one than violet) and the dark class sits further out
    // than the violet box. The panel carries both classes on one element, which also matches
    // ruby's `.cui-theme-ruby .dark`: the same-element form has to outrank it.
    const html = document.documentElement;
    html.classList.add("cui-theme-ruby");
    cleanups.push(() => html.classList.remove("cui-theme-ruby"));
    const outer = document.createElement("div");
    outer.className = "dark";
    const box = document.createElement("div");
    box.className = "cui-theme-violet";
    const probe = document.createElement("div");
    box.append(probe);
    outer.append(box);
    document.body.append(outer);
    const expected = tokensOn(probe);
    outer.remove();

    const root = await FAMILIES.CuiModal(scope("dark", "cui-theme-violet"));
    expect(tokensOn(root)).toEqual(expected);
  });

  it("takes the nearest of two nested themes", async () => {
    const root = await FAMILIES.CuiTooltip(scope("cui-theme-forest", "cui-theme-violet"));
    expect(root.classList.contains("cui-theme-violet")).toBe(true);
    expect(root.classList.contains("cui-theme-forest")).toBe(false);
  });

  it("copies nothing for a theme and dark class on <html>, which already reach the panel", async () => {
    const html = document.documentElement;
    html.classList.add("cui-theme-violet", "dark");
    cleanups.push(() => html.classList.remove("cui-theme-violet", "dark"));
    const root = await FAMILIES.CuiModal(scope());
    expect(root.className).not.toMatch(/cui-theme-|\bdark\b/);
    expect(tokensOn(root)).toEqual(tokensUnder(""));
  });

  it("follows the scope when its theme or dark class changes while the panel is open", async () => {
    const host = scope("cui-theme-violet");
    const root = await FAMILIES.CuiDropdownMenu(host);
    expect(tokensOn(root)).toEqual(tokensUnder("cui-theme-violet"));

    host.classList.replace("cui-theme-violet", "cui-theme-forest");
    await settle();
    expect(tokensOn(root)).toEqual(tokensUnder("cui-theme-forest"));

    host.classList.add("dark");
    await settle();
    expect(tokensOn(root)).toEqual(tokensUnder("cui-theme-forest dark"));

    host.classList.remove("cui-theme-forest", "dark");
    await settle();
    expect(tokensOn(root)).toEqual(tokensUnder(""));
  });

  it("carries the scope into a panel opened from inside a teleported one", async () => {
    // A select in a modal: the listbox finds the modal overlay's copy on its way up.
    fixtures.track(
      mount(CuiModal, {
        props: { visible: true, title: "Modal" },
        slots: { default: () => h(CuiSelect, { options: [{ value: "a", label: "A" }] }) },
        attachTo: scope("cui-theme-violet"),
      }),
    );
    await settle();
    query(".cui-select__trigger").click();
    await settle();
    expect(tokensOn(query(".cui-listbox-panel"))).toEqual(tokensUnder("cui-theme-violet"));
  });

  it("hands the scope on to an app mounted outside the host's tree, through useCleanUIContext", async () => {
    let context!: CleanUIContext;
    const Host = defineComponent({ setup: () => ((context = useCleanUIContext()), () => h("div", "host")) });
    const host = scope("cui-theme-violet");
    fixtures.track(mount(Host, { attachTo: host }));
    await settle();

    const container = document.createElement("div");
    document.body.append(container);
    const app: App = createApp(() => h(CuiModal, { visible: true, title: "Dialog" }, () => "Body"));
    context.provideTo(app);
    app.mount(container);
    cleanups.push(() => (app.unmount(), container.remove()));
    await settle();
    const root = query(".cui-modal-overlay");
    expect(tokensOn(root)).toEqual(tokensUnder("cui-theme-violet"));

    host.classList.add("dark"); // and live, through the host's chain
    await settle();
    expect(tokensOn(root)).toEqual(tokensUnder("cui-theme-violet dark"));
  });
});
