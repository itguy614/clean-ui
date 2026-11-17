import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import type { ActiveBreakpoint } from "../../composables/useBreakpoint";
import CuiSidebar from "../CuiSidebar.vue";
import CuiSidebarHeader from "../CuiSidebarHeader.vue";
import CuiSidebarContent from "../CuiSidebarContent.vue";
import CuiSidebarFooter from "../CuiSidebarFooter.vue";
import CuiSidebarGroup from "../CuiSidebarGroup.vue";
import CuiConfigProvider from "../CuiConfigProvider.vue";

// The breakpoint is a viewport singleton: stand in for it, so a test sets the width.
const breakpoint = ref<ActiveBreakpoint>("xl");
vi.mock("../../composables/useBreakpoint", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../composables/useBreakpoint")>()),
  useBreakpoint: () => ({ breakpoint }),
}));

const mounted: VueWrapper[] = [];
function mountSidebar(props: Record<string, unknown> = {}) {
  const wrapper = mount(CuiSidebar, {
    props,
    attachTo: document.body,
    slots: {
      default: () => [
        h(CuiSidebarHeader, { title: "Clean UI" }),
        h(CuiSidebarContent, null, () => [
          h("a", { href: "/top" }, "Top link"),
          h(CuiSidebarGroup, { label: "Layout" }, () => [h("a", { href: "/grid" }, "Grid")]),
        ]),
        h(CuiSidebarFooter, null, () => "Footer"),
      ],
    },
  });
  mounted.push(wrapper);
  return wrapper;
}

beforeEach(() => {
  breakpoint.value = "xl";
});
afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount());
  document.body.innerHTML = "";
});

describe("CuiSidebar inline", () => {
  it("is a <nav> landmark with an accessible name", () => {
    const wrapper = mountSidebar();
    const nav = wrapper.get("nav");
    expect(nav.classes()).toContain("cui-sidebar");
    expect(nav.attributes("aria-label")).toBe("Sidebar");
  });

  it("takes its name from `label`, and from the catalogue under a config provider", () => {
    expect(mountSidebar({ label: "Docs" }).get("nav").attributes("aria-label")).toBe("Docs");

    const translated = mount(
      { render: () => h(CuiConfigProvider, { messages: { navigation: { sidebar: "Seitenleiste", menu: "Menü" } } }, () => h(CuiSidebar)) },
      { attachTo: document.body },
    );
    expect(translated.get("nav").attributes("aria-label")).toBe("Seitenleiste");
    translated.unmount();
  });

  it("renders the header, content, footer and group from its slot, with no menu button", () => {
    const wrapper = mountSidebar();
    expect(wrapper.find(".cui-sidebar-header").text()).toContain("Clean UI");
    expect(wrapper.find(".cui-sidebar-content").exists()).toBe(true);
    expect(wrapper.find(".cui-sidebar-footer").text()).toBe("Footer");
    expect(wrapper.find(".cui-sidebar-group").exists()).toBe(true);
    expect(wrapper.find('button[aria-label="Navigation menu"]').exists()).toBe(false);
  });

  it("sticks only when asked", () => {
    expect(mountSidebar().get("nav").classes()).not.toContain("cui-sidebar--sticky");
    expect(mountSidebar({ sticky: true }).get("nav").classes()).toContain("cui-sidebar--sticky");
  });

  it("the parts fail clearly outside a sidebar", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const part of [CuiSidebarHeader, CuiSidebarContent, CuiSidebarFooter]) {
      expect(() => mount(part)).toThrow(/must be used inside a <CuiSidebar>/);
    }
    warn.mockRestore();
  });
});

describe("CuiSidebar below its breakpoint (collapse-below, default lg)", () => {
  it("moves out of the page: no nav inline, a labelled menu button instead", async () => {
    breakpoint.value = "md";
    const wrapper = mountSidebar();
    await flushPromises();
    expect(wrapper.find("nav").exists()).toBe(false);
    const button = wrapper.get("button");
    expect(button.attributes("aria-label")).toBe("Navigation menu");
    expect(button.attributes("aria-expanded")).toBe("false");
    expect(button.attributes("aria-controls")).toBeTruthy();
  });

  it("keeps the links out of the tab order while shut: they are not in the DOM", async () => {
    breakpoint.value = "base";
    mountSidebar();
    await flushPromises();
    expect(document.body.querySelector("a")).toBeNull();
    expect(document.body.querySelector("[role=dialog]")).toBeNull();
  });

  it("opens the content in a slideover that the button's aria-controls names", async () => {
    breakpoint.value = "sm";
    const wrapper = mountSidebar();
    await flushPromises();
    const button = wrapper.get("button");
    await button.trigger("click");
    await flushPromises();

    expect(button.attributes("aria-expanded")).toBe("true");
    const dialog = document.body.querySelector("[role=dialog]") as HTMLElement;
    expect(dialog.id).toBe(button.attributes("aria-controls"));
    // The dialog is the menu, the landmark inside it is the sidebar: two names, not one.
    expect(dialog.getAttribute("aria-label")).toBe("Navigation menu");
    const nav = dialog.querySelector("nav") as HTMLElement;
    expect(nav.getAttribute("aria-label")).toBe("Sidebar");
    expect(nav.textContent).toContain("Top link");
    expect(nav.textContent).toContain("Layout");
  });

  it("exposes toggleAttrs for a button of the app's own, wired to the drawer and its state", async () => {
    breakpoint.value = "md";
    const open = ref(false);
    const sidebar = ref<InstanceType<typeof CuiSidebar> | null>(null);
    const Host = defineComponent({
      setup: () => () => [
        h("button", { id: "mine", ...sidebar.value?.toggleAttrs, onClick: () => (open.value = !open.value) }),
        h(CuiSidebar, { ref: sidebar, toggle: false, open: open.value, "onUpdate:open": (v: boolean) => (open.value = v) }, () => h("a", { href: "/x" }, "X")),
      ],
    });
    const wrapper = mount(Host, { attachTo: document.body });
    mounted.push(wrapper);
    await flushPromises();
    const button = wrapper.get("#mine");
    expect(button.attributes("aria-label")).toBe("Navigation menu");
    expect(button.attributes("aria-expanded")).toBe("false");

    await button.trigger("click");
    await flushPromises();
    const dialog = document.body.querySelector("[role=dialog]") as HTMLElement;
    expect(button.attributes("aria-expanded")).toBe("true");
    expect(button.attributes("aria-controls")).toBe(dialog.id);
  });

  it("supports v-model:open, with the built-in button turned off", async () => {
    breakpoint.value = "md";
    const open = ref(false);
    const Host = defineComponent({
      setup: () => () =>
        h(CuiSidebar, { toggle: false, open: open.value, "onUpdate:open": (v: boolean) => (open.value = v) }, () => h("a", { href: "/x" }, "X")),
    });
    const wrapper = mount(Host, { attachTo: document.body });
    mounted.push(wrapper);
    await flushPromises();
    expect(wrapper.find("button").exists()).toBe(false);

    open.value = true;
    await flushPromises();
    expect(document.body.querySelector("[role=dialog] a")).not.toBeNull();

    open.value = false;
    await flushPromises();
    expect(document.body.querySelector("[role=dialog] a")).toBeNull();
  });

  it("closes the drawer when the viewport grows past the breakpoint, and stays shut when it shrinks again", async () => {
    breakpoint.value = "md";
    const wrapper = mountSidebar();
    await flushPromises();
    await wrapper.get("button").trigger("click");
    await flushPromises();
    expect(document.body.querySelector("[role=dialog]")).not.toBeNull();

    breakpoint.value = "xl";
    await flushPromises();
    expect(wrapper.find("nav").exists()).toBe(true);
    expect(document.body.querySelector("[role=dialog]")).toBeNull();

    breakpoint.value = "md";
    await flushPromises();
    expect(wrapper.get("button").attributes("aria-expanded")).toBe("false");
    expect(document.body.querySelector("[role=dialog]")).toBeNull();
  });

  it("closes the drawer when a link in it is followed", async () => {
    breakpoint.value = "md";
    const wrapper = mountSidebar();
    await flushPromises();
    await wrapper.get("button").trigger("click");
    await flushPromises();
    const link = document.body.querySelector("[role=dialog] a[href='/top']") as HTMLElement;
    link.addEventListener("click", (e) => e.preventDefault());
    link.click();
    await flushPromises();
    expect(document.body.querySelector("[role=dialog] a")).toBeNull();
    expect(wrapper.get("button").attributes("aria-expanded")).toBe("false");
  });

  it("collapses at exactly its breakpoint's width and not above", async () => {
    breakpoint.value = "md";
    const atMd = mountSidebar({ collapseBelow: "md" });
    await flushPromises();
    expect(atMd.find("nav").exists()).toBe(true);

    breakpoint.value = "sm";
    await flushPromises();
    expect(atMd.find("nav").exists()).toBe(false);
  });

  it("collapse-below=\"never\" stays inline at every width", async () => {
    breakpoint.value = "base";
    const wrapper = mountSidebar({ collapseBelow: "never" });
    await flushPromises();
    expect(wrapper.find("nav").exists()).toBe(true);
    expect(wrapper.find('button[aria-label="Navigation menu"]').exists()).toBe(false);
  });
});
