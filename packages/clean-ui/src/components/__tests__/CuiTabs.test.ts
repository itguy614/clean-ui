import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, ref } from "vue";
import CuiTabs from "../CuiTabs.vue";
import CuiTab from "../CuiTab.vue";

function isShown(el: Element): boolean {
  return (el as HTMLElement).style.display !== "none";
}

function makeHost(extra: { tabsProps?: string; tabTwoExtra?: string } = {}) {
  return defineComponent({
    components: { CuiTabs, CuiTab },
    setup() {
      const active = ref("one");
      return { active };
    },
    template: `
      <CuiTabs v-model="active" ${extra.tabsProps ?? ""}>
        <CuiTab value="one" label="One">Panel one</CuiTab>
        <CuiTab value="two" label="Two" ${extra.tabTwoExtra ?? ""}>Panel two</CuiTab>
      </CuiTabs>
    `,
  });
}

describe("CuiTabs + CuiTab", () => {
  it("renders a tab button per CuiTab child", async () => {
    const wrapper = mount(makeHost());
    await wrapper.vm.$nextTick();
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs).toHaveLength(2);
    expect(tabs.map((t) => t.text())).toEqual(["One", "Two"]);
  });

  it("auto-activates the first tab and shows its panel", async () => {
    const wrapper = mount(makeHost());
    await wrapper.vm.$nextTick();
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs[0].attributes("aria-selected")).toBe("true");
    expect(tabs[1].attributes("aria-selected")).toBe("false");

    const panels = wrapper.findAll('[role="tabpanel"]');
    expect(isShown(panels[0].element)).toBe(true);
    expect(isShown(panels[1].element)).toBe(false);
  });

  it("clicking a tab switches the active panel", async () => {
    const wrapper = mount(makeHost());
    await wrapper.vm.$nextTick();
    const tabs = wrapper.findAll('[role="tab"]');
    await tabs[1].trigger("click");

    expect(tabs[1].attributes("aria-selected")).toBe("true");
    expect(tabs[0].attributes("aria-selected")).toBe("false");

    const panels = wrapper.findAll('[role="tabpanel"]');
    expect(isShown(panels[0].element)).toBe(false);
    expect(isShown(panels[1].element)).toBe(true);
  });

  it("emits update:modelValue and updates the bound v-model when a tab is clicked", async () => {
    const wrapper = mount(makeHost());
    await wrapper.vm.$nextTick();
    await wrapper.findAll('[role="tab"]')[1].trigger("click");

    // bound parent ref reflects the new value
    expect((wrapper.vm as unknown as { active: string }).active).toBe("two");
  });

  it("honors v-model: programmatic value change activates the matching panel", async () => {
    const wrapper = mount(makeHost());
    await wrapper.vm.$nextTick();
    expect(isShown(wrapper.findAll('[role="tabpanel"]')[0].element)).toBe(true);

    (wrapper.vm as unknown as { active: string }).active = "two";
    await wrapper.vm.$nextTick();

    const panels = wrapper.findAll('[role="tabpanel"]');
    expect(isShown(panels[1].element)).toBe(true);
    expect(isShown(panels[0].element)).toBe(false);
    expect(wrapper.findAll('[role="tab"]')[1].attributes("aria-selected")).toBe("true");
  });

  it("does not activate a disabled tab on click", async () => {
    const wrapper = mount(makeHost({ tabTwoExtra: "disabled" }));
    await wrapper.vm.$nextTick();
    const tabs = wrapper.findAll('[role="tab"]');
    await tabs[1].trigger("click");

    expect(tabs[0].attributes("aria-selected")).toBe("true");
    expect(tabs[1].attributes("aria-selected")).toBe("false");
  });
});

describe("CuiTabs overflow", () => {
  /** jsdom reports every element as 0x0; fake a scrollable bar. */
  function stubMetrics(
    el: HTMLElement,
    { client, scroll, pos }: { client: number; scroll: number; pos: number },
  ) {
    Object.defineProperty(el, "clientWidth", { value: client, configurable: true });
    Object.defineProperty(el, "scrollWidth", { value: scroll, configurable: true });
    Object.defineProperty(el, "scrollLeft", { value: pos, configurable: true, writable: true });
  }

  it("renders the tablist inside a separate scroll viewport", async () => {
    const wrapper = mount(makeHost());
    await wrapper.vm.$nextTick();
    const bar = wrapper.get('[role="tablist"]');
    expect(bar.classes()).toContain("cui-tabs__bar");
    expect(bar.element.parentElement?.className).toContain("cui-tabs__bar-outer");
  });

  it("reports no overflow when the tabs fit", async () => {
    const wrapper = mount(makeHost());
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[role="tablist"]').attributes("data-overflow")).toBe("none");
  });

  it("marks the clipped edges as content scrolls", async () => {
    const wrapper = mount(makeHost());
    await wrapper.vm.$nextTick();
    const bar = wrapper.get('[role="tablist"]');
    const el = bar.element as HTMLElement;

    stubMetrics(el, { client: 200, scroll: 500, pos: 0 });
    await bar.trigger("scroll");
    expect(bar.attributes("data-overflow")).toBe("end");

    stubMetrics(el, { client: 200, scroll: 500, pos: 150 });
    await bar.trigger("scroll");
    expect(bar.attributes("data-overflow")).toBe("both");

    stubMetrics(el, { client: 200, scroll: 500, pos: 300 });
    await bar.trigger("scroll");
    expect(bar.attributes("data-overflow")).toBe("start");
  });

  it("scrolls the newly active tab into view on a v-model change", async () => {
    const wrapper = mount(makeHost(), { attachTo: document.body });
    await wrapper.vm.$nextTick();

    const target = wrapper.findAll('[role="tab"]')[1].element as HTMLElement;
    const spy = vi.fn();
    target.scrollIntoView = spy;

    (wrapper.vm as unknown as { active: string }).active = "two";
    await wrapper.vm.$nextTick();

    expect(spy).toHaveBeenCalledWith({ inline: "nearest", block: "nearest" });
    wrapper.unmount();
  });

  it("scopes the keyboard-nav tab lookup to its own tablist", async () => {
    // Two tab sets sharing tab values: arrow-key nav must focus the local tab
    const host = defineComponent({
      components: { CuiTabs, CuiTab },
      template: `
        <div>
          <CuiTabs data-set="a">
            <CuiTab value="one" label="One">A one</CuiTab>
            <CuiTab value="two" label="Two">A two</CuiTab>
          </CuiTabs>
          <CuiTabs data-set="b">
            <CuiTab value="one" label="One">B one</CuiTab>
            <CuiTab value="two" label="Two">B two</CuiTab>
          </CuiTabs>
        </div>
      `,
    });
    const wrapper = mount(host, { attachTo: document.body });
    await wrapper.vm.$nextTick();

    const second = wrapper.findAll(".cui-tabs")[1];
    await second.get('[role="tablist"]').trigger("keydown", { key: "ArrowRight" });
    await wrapper.vm.$nextTick();

    const focused = document.activeElement as HTMLElement;
    expect(second.element.contains(focused)).toBe(true);
    wrapper.unmount();
  });
});
