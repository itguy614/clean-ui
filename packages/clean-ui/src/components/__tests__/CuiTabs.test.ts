import { describe, it, expect } from "vitest";
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
