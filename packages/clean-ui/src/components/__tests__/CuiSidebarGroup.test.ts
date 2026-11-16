import { describe, it, expect } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import CuiSidebarGroup from "../CuiSidebarGroup.vue";

const links = () => [h("a", { href: "/a" }, "A"), h("a", { href: "/b" }, "B")];

/** Hidden from the tab order and the accessibility tree: hidden="until-found", else inert. */
const isShut = (panel: { attributes: (n: string) => string | undefined }) =>
  panel.attributes("hidden") === "until-found" || panel.attributes("inert") !== undefined;

describe("CuiSidebarGroup (outside any CuiSidebar)", () => {
  it("renders a labelled button with aria-expanded and aria-controls, shut by default", () => {
    const wrapper = mount(CuiSidebarGroup, { props: { label: "Layout" }, slots: { default: links } });
    const trigger = wrapper.get("button.cui-sidebar-group__trigger");
    expect(trigger.text()).toBe("Layout");
    expect(trigger.attributes("aria-expanded")).toBe("false");
    const panel = wrapper.get(".cui-sidebar-group__panel");
    expect(trigger.attributes("aria-controls")).toBe(panel.attributes("id"));
    expect(panel.attributes("role")).toBe("group");
    expect(panel.attributes("aria-labelledby")).toBe(trigger.attributes("id"));
  });

  it("expands and collapses on click, and hides what it holds again when shut", async () => {
    const wrapper = mount(CuiSidebarGroup, { props: { label: "Layout" }, slots: { default: links } });
    const trigger = wrapper.get("button");
    const panel = wrapper.get(".cui-sidebar-group__panel");
    expect(isShut(panel)).toBe(true);

    await trigger.trigger("click");
    expect(trigger.attributes("aria-expanded")).toBe("true");
    expect(wrapper.classes()).toContain("cui-sidebar-group--open");
    expect(isShut(panel)).toBe(false);

    await trigger.trigger("click");
    await flushPromises();
    expect(trigger.attributes("aria-expanded")).toBe("false");
    // Out of the tab order again: the links inside are not reachable.
    expect(isShut(panel)).toBe(true);
  });

  it("is a real <button>, so Enter and Space toggle it natively", () => {
    const wrapper = mount(CuiSidebarGroup, { props: { label: "Layout" }, slots: { default: links } });
    const trigger = wrapper.get(".cui-sidebar-group__trigger").element as HTMLButtonElement;
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.type).toBe("button");
  });

  it("supports v-model:expanded", async () => {
    const open = ref(true);
    const Host = defineComponent({
      setup: () => () =>
        h(CuiSidebarGroup, { label: "Layout", expanded: open.value, "onUpdate:expanded": (v: boolean) => (open.value = v) }, links),
    });
    const wrapper = mount(Host);
    const trigger = wrapper.get("button");
    expect(trigger.attributes("aria-expanded")).toBe("true");

    await trigger.trigger("click");
    expect(open.value).toBe(false);
    expect(trigger.attributes("aria-expanded")).toBe("false");

    open.value = true;
    await flushPromises();
    expect(trigger.attributes("aria-expanded")).toBe("true");
  });

  it("starts open with defaultExpanded", () => {
    const wrapper = mount(CuiSidebarGroup, { props: { label: "Layout", defaultExpanded: true }, slots: { default: links } });
    expect(wrapper.get("button").attributes("aria-expanded")).toBe("true");
    expect(isShut(wrapper.get(".cui-sidebar-group__panel"))).toBe(false);
  });

  describe("the group holding the current page", () => {
    const current = () => [h("a", { href: "/a" }, "A"), h("a", { href: "/b", "aria-current": "page" }, "B")];

    it("opens on mount", async () => {
      const wrapper = mount(CuiSidebarGroup, { props: { label: "Layout" }, slots: { default: current } });
      await flushPromises();
      expect(wrapper.get("button").attributes("aria-expanded")).toBe("true");
      expect(isShut(wrapper.get(".cui-sidebar-group__panel"))).toBe(false);
    });

    it("leaves a group without it shut", async () => {
      const wrapper = mount(CuiSidebarGroup, { props: { label: "Layout" }, slots: { default: links } });
      await flushPromises();
      expect(wrapper.get("button").attributes("aria-expanded")).toBe("false");
    });

    it("does not override an explicit v-model:expanded of false", async () => {
      const wrapper = mount(CuiSidebarGroup, { props: { label: "Layout", expanded: false }, slots: { default: current } });
      await flushPromises();
      expect(wrapper.get("button").attributes("aria-expanded")).toBe("false");
    });

    it("ignores aria-current=\"false\"", async () => {
      const slot = () => [h("a", { href: "/a", "aria-current": "false" }, "A")];
      const wrapper = mount(CuiSidebarGroup, { props: { label: "Layout" }, slots: { default: slot } });
      await flushPromises();
      expect(wrapper.get("button").attributes("aria-expanded")).toBe("false");
    });
  });

  it("opens when find-in-page reveals a match inside it", async () => {
    const wrapper = mount(CuiSidebarGroup, { props: { label: "Layout" }, slots: { default: links } });
    await wrapper.get(".cui-sidebar-group__panel").trigger("beforematch");
    expect(wrapper.get("button").attributes("aria-expanded")).toBe("true");
  });
});
