import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import type { ActiveBreakpoint } from "../../composables/useBreakpoint";
import CuiNavbar from "../CuiNavbar.vue";
import CuiNavbarBrand from "../CuiNavbarBrand.vue";
import CuiNavbarNav from "../CuiNavbarNav.vue";
import CuiNavbarActions from "../CuiNavbarActions.vue";
import CuiNavbarMenu from "../CuiNavbarMenu.vue";
import CuiConfigProvider from "../CuiConfigProvider.vue";

// The breakpoint is a viewport singleton: stand in for it, so a test sets the width.
const breakpoint = ref<ActiveBreakpoint>("xl");
vi.mock("../../composables/useBreakpoint", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../composables/useBreakpoint")>()),
  useBreakpoint: () => ({ breakpoint }),
}));

const mounted: VueWrapper[] = [];

/** A bar with a brand, a nav (a link, the current page's link and a menu) and actions. */
function mountNavbar(props: Record<string, unknown> = {}, nav = true) {
  const wrapper = mount(CuiNavbar, {
    props,
    attachTo: document.body,
    slots: {
      default: () => [
        h(CuiNavbarBrand, { href: "/" }, () => "Clean UI"),
        nav
          ? h(CuiNavbarNav, null, () => [
              h("a", { href: "/docs", "aria-current": "page" }, "Docs"),
              h(CuiNavbarMenu, { label: "Components" }, () => [h("a", { href: "/button" }, "Button"), h("a", { href: "/input" }, "Input")]),
            ])
          : null,
        h(CuiNavbarActions, null, () => h("button", { id: "theme" }, "Theme")),
      ],
    },
  });
  mounted.push(wrapper);
  return wrapper;
}

const links = () => Array.from(document.body.querySelectorAll("a")).map((a) => a.textContent);

beforeEach(() => {
  breakpoint.value = "xl";
});
afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount());
  document.body.innerHTML = "";
});

describe("CuiNavbar in the bar", () => {
  it("is a <header> landmark holding a named <nav>, with the current link marked", () => {
    const wrapper = mountNavbar();
    const header = wrapper.get("header");
    expect(header.classes()).toContain("cui-navbar");
    const nav = header.get("nav");
    expect(nav.attributes("aria-label")).toBe("Main");
    expect(nav.get('a[aria-current="page"]').text()).toBe("Docs");
  });

  it("takes the nav's name from `label`, and from the catalogue under a config provider", () => {
    expect(mountNavbar({ label: "Site" }).get("nav").attributes("aria-label")).toBe("Site");

    const translated = mount(
      { render: () => h(CuiConfigProvider, { messages: { navigation: { sidebar: "Seitenleiste", menu: "Menü", navbar: "Haupt" } } }, () => h(CuiNavbar, null, () => h(CuiNavbarNav))) },
      { attachTo: document.body },
    );
    expect(translated.get("nav").attributes("aria-label")).toBe("Haupt");
    translated.unmount();
  });

  it("keeps brand, nav and actions in the bar, with no menu button and no drawer", () => {
    const wrapper = mountNavbar();
    expect(wrapper.find("a.cui-navbar-brand").attributes("href")).toBe("/");
    expect(wrapper.find(".cui-navbar-actions #theme").exists()).toBe(true);
    expect(wrapper.find('button[aria-label="Navigation menu"]').exists()).toBe(false);
    expect(document.body.querySelector("[role=dialog]")).toBeNull();
  });

  it("renders a menu as a dropdown: a menu button whose panel holds the links as menu items", async () => {
    const wrapper = mountNavbar();
    const trigger = wrapper.get(".cui-navbar-menu__trigger");
    expect(trigger.attributes("aria-haspopup")).toBe("menu");
    expect(trigger.attributes("aria-expanded")).toBe("false");
    expect(trigger.text()).toBe("Components");
    // Shut: the links are not in the page at all.
    expect(links()).not.toContain("Button");

    await trigger.trigger("click");
    await flushPromises();
    expect(trigger.attributes("aria-expanded")).toBe("true");
    const menu = document.body.querySelector('[role="menu"]') as HTMLElement;
    expect(trigger.attributes("aria-controls")).toBe(menu.id);
    const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
    expect(items.map((i) => i.textContent)).toEqual(["Button", "Input"]);
    expect(items.every((i) => i.tagName === "A")).toBe(true);
  });

  it("closes the menu when a link in it is chosen, and on Escape", async () => {
    const wrapper = mountNavbar();
    const trigger = wrapper.get(".cui-navbar-menu__trigger");
    await trigger.trigger("click");
    await flushPromises();
    const link = document.body.querySelector('[role="menu"] a') as HTMLAnchorElement;
    link.addEventListener("click", (e) => e.preventDefault());
    link.click();
    await flushPromises();
    expect(trigger.attributes("aria-expanded")).toBe("false");

    await trigger.trigger("click");
    await flushPromises();
    expect(trigger.attributes("aria-expanded")).toBe("true");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flushPromises();
    expect(trigger.attributes("aria-expanded")).toBe("false");
  });

  it("the parts fail clearly outside a navbar, the menu included", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const part of [CuiNavbarBrand, CuiNavbarNav, CuiNavbarActions, CuiNavbarMenu]) {
      expect(() => mount(part)).toThrow(/must be used inside a <CuiNavbar>/);
    }
    warn.mockRestore();
  });
});

describe("CuiNavbar below its breakpoint (collapse-below, default lg)", () => {
  it("moves the nav out of the bar: a labelled menu button, brand and actions staying", async () => {
    breakpoint.value = "md";
    const wrapper = mountNavbar();
    await flushPromises();
    expect(wrapper.find("nav").exists()).toBe(false);
    const button = wrapper.get(".cui-navbar__toggle");
    expect(button.attributes("aria-label")).toBe("Navigation menu");
    expect(button.attributes("aria-expanded")).toBe("false");
    expect(button.attributes("aria-controls")).toBeTruthy();
    expect(wrapper.find(".cui-navbar-brand").exists()).toBe(true);
    expect(wrapper.find(".cui-navbar-actions #theme").exists()).toBe(true);
  });

  it("keeps the collapsed links out of the tab order: they are not in the DOM", async () => {
    breakpoint.value = "base";
    mountNavbar();
    await flushPromises();
    expect(links()).toEqual(["Clean UI"]);
    expect(document.body.querySelector("[role=dialog]")).toBeNull();
  });

  it("opens the nav in a slideover the button's aria-controls names, once: no duplicates", async () => {
    breakpoint.value = "sm";
    const wrapper = mountNavbar();
    await flushPromises();
    const button = wrapper.get(".cui-navbar__toggle");
    await button.trigger("click");
    await flushPromises();

    expect(button.attributes("aria-expanded")).toBe("true");
    const dialog = document.body.querySelector("[role=dialog]") as HTMLElement;
    expect(dialog.id).toBe(button.attributes("aria-controls"));
    // The dialog is the menu, the landmark inside it is the nav: two names, not one.
    expect(dialog.getAttribute("aria-label")).toBe("Navigation menu");
    const nav = dialog.querySelector("nav") as HTMLElement;
    expect(nav.getAttribute("aria-label")).toBe("Main");
    // Written once, rendered once: the link and the menu's trigger are in the drawer only.
    expect(document.body.querySelectorAll("nav")).toHaveLength(1);
    expect(links().filter((l) => l === "Docs")).toHaveLength(1);
    expect(document.body.querySelector(".cui-navbar-menu__trigger")).toBeNull();
  });

  it("renders a menu as a collapsible group in the drawer, not a dropdown", async () => {
    breakpoint.value = "sm";
    const wrapper = mountNavbar();
    await flushPromises();
    await wrapper.get(".cui-navbar__toggle").trigger("click");
    await flushPromises();
    const dialog = document.body.querySelector("[role=dialog]") as HTMLElement;
    const trigger = dialog.querySelector(".cui-sidebar-group__trigger") as HTMLElement;
    expect(trigger.textContent).toContain("Components");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(dialog.querySelector('[role="menu"], [role="menuitem"]')).toBeNull();
    trigger.click();
    await flushPromises();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(Array.from(dialog.querySelectorAll(".cui-sidebar-group a")).map((a) => a.textContent)).toEqual(["Button", "Input"]);
  });

  it("closes the drawer when a link in it is followed", async () => {
    breakpoint.value = "sm";
    const wrapper = mountNavbar();
    await flushPromises();
    const button = wrapper.get(".cui-navbar__toggle");
    await button.trigger("click");
    await flushPromises();
    const link = document.body.querySelector('[role=dialog] a[href="/docs"]') as HTMLAnchorElement;
    link.addEventListener("click", (e) => e.preventDefault());
    link.click();
    await flushPromises();
    expect(button.attributes("aria-expanded")).toBe("false");
  });

  it("shows no menu button without a CuiNavbarNav, or when `toggle` is off", async () => {
    breakpoint.value = "md";
    const bare = mountNavbar({}, false);
    await flushPromises();
    expect(bare.find(".cui-navbar__toggle").exists()).toBe(false);
    const off = mountNavbar({ toggle: false });
    await flushPromises();
    expect(off.find(".cui-navbar__toggle").exists()).toBe(false);
  });

  it("stays in the bar at every width with collapse-below=never", async () => {
    breakpoint.value = "base";
    const wrapper = mountNavbar({ collapseBelow: "never" });
    await flushPromises();
    expect(wrapper.find("nav").exists()).toBe(true);
    expect(wrapper.find(".cui-navbar__toggle").exists()).toBe(false);
  });

  it("exposes toggleAttrs and toggle for a button of the app's own, wired to the drawer", async () => {
    breakpoint.value = "md";
    const navbar = ref<InstanceType<typeof CuiNavbar> | null>(null);
    const Host = defineComponent({
      setup: () => () => [
        h("button", { id: "mine", ...navbar.value?.toggleAttrs, onClick: () => navbar.value?.toggle() }),
        h(CuiNavbar, { ref: navbar, toggle: false }, () => h(CuiNavbarNav, null, () => h("a", { href: "/x" }, "X"))),
      ],
    });
    const wrapper = mount(Host, { attachTo: document.body });
    mounted.push(wrapper);
    await flushPromises();
    const mine = wrapper.get("#mine");
    expect(mine.attributes("aria-label")).toBe("Navigation menu");
    expect(mine.attributes("aria-expanded")).toBe("false");
    await mine.trigger("click");
    await flushPromises();
    expect(mine.attributes("aria-expanded")).toBe("true");
    expect((document.body.querySelector("[role=dialog]") as HTMLElement).id).toBe(mine.attributes("aria-controls"));
  });
});

describe("CuiNavbar sticky", () => {
  const html = document.documentElement;
  let resize: (() => void) | undefined;
  let height = 56;

  beforeEach(() => {
    height = 56;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: () => void) {
          resize = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(() => height);
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    html.style.removeProperty("--cui-navbar-height");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    html.style.removeProperty("--cui-navbar-height");
    html.style.scrollPaddingTop = "";
  });

  it("is off by default: no class, no token", () => {
    const wrapper = mountNavbar();
    expect(wrapper.get("header").classes()).not.toContain("cui-navbar--sticky");
    expect(html.style.getPropertyValue("--cui-navbar-height")).toBe("");
    expect(html.style.scrollPaddingTop).toBe("");
  });

  it("publishes its height as --cui-navbar-height with a matching scroll-padding-top, and follows a resize", async () => {
    const wrapper = mountNavbar({ sticky: true });
    await nextTick();
    expect(wrapper.get("header").classes()).toContain("cui-navbar--sticky");
    expect(html.style.getPropertyValue("--cui-navbar-height")).toBe("56px");
    expect(html.style.scrollPaddingTop).toBe("var(--cui-navbar-height, 0px)");

    height = 72;
    resize?.();
    expect(html.style.getPropertyValue("--cui-navbar-height")).toBe("72px");
  });

  it("gains an elevated state once the page has scrolled, and loses it back at the top", async () => {
    const wrapper = mountNavbar({ sticky: true });
    await nextTick();
    expect(wrapper.get("header").classes()).not.toContain("cui-navbar--scrolled");
    Object.defineProperty(window, "scrollY", { value: 40, configurable: true });
    window.dispatchEvent(new Event("scroll"));
    await nextTick();
    expect(wrapper.get("header").classes()).toContain("cui-navbar--scrolled");
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    window.dispatchEvent(new Event("scroll"));
    await nextTick();
    expect(wrapper.get("header").classes()).not.toContain("cui-navbar--scrolled");
  });

  it("puts the document back when it goes away, and when `sticky` is switched off", async () => {
    html.style.scrollPaddingTop = "2rem";
    const wrapper = mountNavbar({ sticky: true });
    await nextTick();
    await wrapper.setProps({ sticky: false });
    expect(html.style.getPropertyValue("--cui-navbar-height")).toBe("");
    expect(html.style.scrollPaddingTop).toBe("2rem");

    await wrapper.setProps({ sticky: true });
    expect(html.style.getPropertyValue("--cui-navbar-height")).toBe("56px");
    wrapper.unmount();
    mounted.splice(mounted.indexOf(wrapper), 1);
    expect(html.style.getPropertyValue("--cui-navbar-height")).toBe("");
    expect(html.style.scrollPaddingTop).toBe("2rem");
  });
});
