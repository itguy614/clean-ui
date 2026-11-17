import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import type { ActiveBreakpoint } from "../../composables/useBreakpoint";
import CuiNavbar from "../CuiNavbar.vue";
import CuiNavbarBrand from "../CuiNavbarBrand.vue";
import CuiNavbarNav from "../CuiNavbarNav.vue";
import CuiNavbarActions from "../CuiNavbarActions.vue";
import CuiNavbarMenu from "../CuiNavbarMenu.vue";
import CuiNavbarLink from "../CuiNavbarLink.vue";
import { __clearWarned } from "../../utils/devWarn";
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

describe("CuiNavbar review fixes", () => {
  it("gives only links the menu-item role, and keeps a role an item already has", async () => {
    const wrapper = mount(CuiNavbar, {
      attachTo: document.body,
      slots: {
        default: () =>
          h(CuiNavbarNav, null, () =>
            h(CuiNavbarMenu, { label: "More" }, () => [h("a", { href: "/a" }, "A"), h("hr"), h("a", { href: "/b", role: "menuitemradio" }, "B")]),
          ),
      },
    });
    mounted.push(wrapper);
    await wrapper.get(".cui-navbar-menu__trigger").trigger("click");
    await flushPromises();
    const menu = document.body.querySelector('[role="menu"]') as HTMLElement;
    expect(menu.querySelector("hr")!.getAttribute("role")).toBeNull();
    expect(menu.querySelector('a[href="/a"]')!.getAttribute("role")).toBe("menuitem");
    expect(menu.querySelector('a[href="/b"]')!.getAttribute("role")).toBe("menuitemradio");
  });

  it("a modified click on a menu link or a drawer link leaves the menu and the drawer open", async () => {
    const wrapper = mountNavbar();
    const trigger = wrapper.get(".cui-navbar-menu__trigger");
    await trigger.trigger("click");
    await flushPromises();
    const link = document.body.querySelector('[role="menu"] a') as HTMLAnchorElement;
    link.addEventListener("click", (e) => e.preventDefault());
    link.dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));
    await flushPromises();
    expect(trigger.attributes("aria-expanded")).toBe("true");
  });

  it("shows no menu button for a hidden nav, which would open an empty drawer", async () => {
    breakpoint.value = "md";
    const wrapper = mount(CuiNavbar, {
      attachTo: document.body,
      slots: { default: () => h(CuiNavbarNav, { hidden: true }, () => h("a", { href: "/x" }, "X")) },
    });
    mounted.push(wrapper);
    await flushPromises();
    expect(wrapper.find(".cui-navbar__toggle").exists()).toBe(false);
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

  it("warns in development that translucent needs sticky", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    __clearWarned();
    mountNavbar({ sticky: true, translucent: true });
    expect(warn).not.toHaveBeenCalled();
    mountNavbar({ translucent: true });
    expect(String(warn.mock.calls[0]?.[0])).toContain("`translucent`");
    warn.mockRestore();
    __clearWarned();
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

  it("is frosted only with sticky and translucent together", () => {
    expect(mountNavbar({ sticky: true }).get("header").classes()).not.toContain("cui-navbar--translucent");
    expect(mountNavbar({ translucent: true }).get("header").classes()).not.toContain("cui-navbar--translucent");
    expect(mountNavbar({ sticky: true, translucent: true }).get("header").classes()).toContain("cui-navbar--translucent");
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

  it("is elevated at once when `sticky` is switched on over a page that has already scrolled", async () => {
    Object.defineProperty(window, "scrollY", { value: 300, configurable: true });
    const wrapper = mountNavbar();
    await nextTick();
    await wrapper.setProps({ sticky: true });
    expect(wrapper.get("header").classes()).toContain("cui-navbar--scrolled");
  });
});

/** An icon component of the test's own: a bare svg carrying a marker class. */
const TestIcon = { render: () => h("svg", { class: "test-icon" }) };

function mountNav(nav: () => unknown, props: Record<string, unknown> = {}) {
  const wrapper = mount(CuiNavbar, { props, attachTo: document.body, slots: { default: () => h(CuiNavbarNav, null, nav as () => never) } });
  mounted.push(wrapper);
  return wrapper;
}

describe("CuiNavbarLink", () => {
  it("renders an icon, the label and a suffix inline in the bar, as a link", () => {
    const wrapper = mountNav(() => h(CuiNavbarLink, { href: "/inbox", icon: TestIcon }, { default: () => "Inbox", suffix: () => h("b", { class: "badge" }, "3") }));
    const link = wrapper.get("a.cui-navbar-link");
    expect(link.attributes("href")).toBe("/inbox");
    expect(Array.from(link.element.children).map((c) => c.className)).toEqual(["cui-navbar-link__icon", "cui-navbar-link__label", "cui-navbar-link__suffix"]);
    expect(link.find(".test-icon").exists()).toBe(true);
    expect(link.get(".cui-navbar-link__label").text()).toBe("Inbox");
    expect(link.get(".badge").text()).toBe("3");
  });

  it("hides the icon from assistive technology, and names an icon-only link by its aria-label", () => {
    const wrapper = mountNav(() => [
      h(CuiNavbarLink, { href: "/a", icon: TestIcon }, () => "Labelled"),
      h(CuiNavbarLink, { href: "/b", icon: TestIcon, "aria-label": "Search" }),
    ]);
    for (const icon of wrapper.findAll(".cui-navbar-link__icon .cui-icon")) expect(icon.attributes("aria-hidden")).toBe("true");
    expect(wrapper.get('a[href="/b"]').attributes("aria-label")).toBe("Search");
    expect(wrapper.get('a[href="/b"]').find(".cui-navbar-link__label").exists()).toBe(false);
  });

  it("warns in development about an icon-only link with no accessible name, once it has one it does not", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    __clearWarned();
    mountNav(() => h(CuiNavbarLink, { href: "/b", icon: TestIcon, "aria-label": "Search" }));
    expect(warn).not.toHaveBeenCalled();
    mountNav(() => h(CuiNavbarLink, { href: "/b", icon: TestIcon }));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("CuiNavbarLink");
    expect(String(warn.mock.calls[0][0])).toContain("accessible name");
    warn.mockRestore();
    __clearWarned();
  });

  it("passes aria-current through, and `active` overrides it", () => {
    const wrapper = mountNav(() => [
      h(CuiNavbarLink, { href: "/a", "aria-current": "page" }, () => "Passed"),
      h(CuiNavbarLink, { href: "/b", active: true }, () => "Active"),
      h(CuiNavbarLink, { href: "/c", active: false }, () => "Not"),
      h(CuiNavbarLink, { href: "/d" }, () => "Unset"),
    ]);
    const current = (href: string) => wrapper.get(`a[href="${href}"]`).attributes("aria-current");
    expect(current("/a")).toBe("page");
    expect(current("/b")).toBe("page");
    expect(current("/c")).toBe("false");
    expect(current("/d")).toBeUndefined();
  });

  it("drops the target of a disabled link, and holds its click back", async () => {
    const wrapper = mountNav(() => h(CuiNavbarLink, { href: "/gone", disabled: true }, () => "Gone"));
    const link = wrapper.get(".cui-navbar-link");
    expect(link.attributes("href")).toBeUndefined();
    expect(link.attributes("aria-disabled")).toBe("true");
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.element.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });

  it("does not run a consumer's click listener on a disabled link, and warns about a link with no target", () => {
    const onClick = vi.fn();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    __clearWarned();
    const wrapper = mountNav(() => [
      h(CuiNavbarLink, { href: "/gone", disabled: true, onClick }, () => "Gone"),
      h(CuiNavbarLink, { href: "/ok", onClick }, () => "Ok"),
    ]);
    wrapper.get('[aria-disabled="true"]').element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(onClick).not.toHaveBeenCalled();
    wrapper.get('a[href="/ok"]').element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
    mountNav(() => h(CuiNavbarLink, null, () => "Nowhere"));
    expect(String(warn.mock.calls[0]?.[0])).toContain("`to`");
    warn.mockRestore();
    __clearWarned();
  });

  it("fails clearly outside a navbar", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => mount(CuiNavbarLink)).toThrow(/must be used inside a <CuiNavbar>/);
    warn.mockRestore();
  });

  it("is a menu item in a dropdown menu, beside a plain link that is one too", async () => {
    const wrapper = mountNav(() =>
      h(CuiNavbarMenu, { label: "More" }, () => [h(CuiNavbarLink, { href: "/a", icon: TestIcon }, { default: () => "Link", suffix: () => "s" }), h("a", { href: "/b" }, "Plain")]),
    );
    await wrapper.get(".cui-navbar-menu__trigger").trigger("click");
    await flushPromises();
    const items = Array.from(document.body.querySelectorAll('[role="menu"] [role="menuitem"]'));
    expect(items[1].textContent).toBe("Plain");
    expect(items).toHaveLength(2);
    expect(items[0].className).toContain("cui-navbar-link");
    expect(items[0].querySelector(".test-icon")).not.toBeNull();
  });

  it("renders its icon and suffix in the drawer, and in a menu's group there, once", async () => {
    breakpoint.value = "sm";
    const wrapper = mount(CuiNavbar, {
      attachTo: document.body,
      slots: {
        default: () =>
          h(CuiNavbarNav, null, () => [
            h(CuiNavbarLink, { href: "/inbox", icon: TestIcon }, { default: () => "Inbox", suffix: () => h("b", { class: "count" }, "3") }),
            h(CuiNavbarMenu, { label: "More", icon: TestIcon }, { default: () => h(CuiNavbarLink, { href: "/x", icon: TestIcon }, { default: () => "Deep", suffix: () => h("i", { class: "ext" }) }), suffix: () => h("em", { class: "menu-count" }, "2") }),
          ]),
      },
    });
    mounted.push(wrapper);
    await flushPromises();
    await wrapper.get(".cui-navbar__toggle").trigger("click");
    await flushPromises();
    const dialog = document.body.querySelector("[role=dialog]") as HTMLElement;
    const inbox = dialog.querySelector('a[href="/inbox"]') as HTMLElement;
    expect(inbox.querySelector(".test-icon")).not.toBeNull();
    expect(inbox.querySelector(".count")!.textContent).toBe("3");
    expect(document.body.querySelectorAll('a[href="/inbox"]')).toHaveLength(1);
    // The group's heading carries the menu's icon and suffix; its link is a row with its own.
    const heading = dialog.querySelector(".cui-sidebar-group__trigger") as HTMLElement;
    expect(heading.querySelector(".test-icon")).not.toBeNull();
    expect(heading.querySelector(".menu-count")!.textContent).toBe("2");
    expect(heading.textContent).toContain("More");
    (heading as HTMLButtonElement).click();
    await flushPromises();
    const deep = dialog.querySelector('a[href="/x"]') as HTMLElement;
    expect(deep.querySelector(".test-icon")).not.toBeNull();
    expect(deep.querySelector(".ext")).not.toBeNull();
    expect(deep.getAttribute("role")).toBeNull();
  });

  it("puts a menu's icon and suffix on its trigger, the suffix before the caret", () => {
    const wrapper = mountNav(() => h(CuiNavbarMenu, { label: "More", icon: TestIcon }, { default: () => h("a", { href: "/x" }, "X"), suffix: () => h("em", { class: "menu-count" }, "2") }));
    const trigger = wrapper.get(".cui-navbar-menu__trigger");
    expect(trigger.find(".test-icon").exists()).toBe(true);
    const suffix = trigger.get(".cui-button__suffix, [class*='suffix']");
    const order = Array.from(suffix.element.children).map((c) => c.className.toString());
    expect(order[0]).toContain("cui-navbar-menu__suffix");
    expect(order[order.length - 1]).toContain("cui-icon");
    expect(trigger.get(".menu-count").text()).toBe("2");
  });
});
