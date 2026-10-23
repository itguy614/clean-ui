import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, ref } from "vue";
import CuiTabs from "../CuiTabs.vue";
import CuiTab from "../CuiTab.vue";
import { describeRovingFocusContract } from "../../composables/__tests__/roving-focus-contract";

function isShown(el: Element): boolean {
  return (el as HTMLElement).style.display !== "none";
}

function makeHost(extra: { tabsProps?: string; tabTwoExtra?: string; onSubmit?: (e: Event) => void } = {}) {
  return defineComponent({
    components: { CuiTabs, CuiTab },
    setup() {
      const active = ref("one");
      return { active, onSubmit: extra.onSubmit ?? (() => {}) };
    },
    // Wrapped in a form so a tab button that defaults to type="submit" shows up (#238).
    template: `
      <form @submit="onSubmit">
        <CuiTabs v-model="active" ${extra.tabsProps ?? ""}>
          <CuiTab value="one" label="One">Panel one</CuiTab>
          <CuiTab value="two" label="Two" ${extra.tabTwoExtra ?? ""}>Panel two</CuiTab>
        </CuiTabs>
      </form>
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

describe("CuiTab #label slot", () => {
  it("renders slot content inside the tab button instead of the label text", async () => {
    const wrapper = mount(
      defineComponent({
        components: { CuiTabs, CuiTab },
        setup: () => ({ count: ref(3) }),
        template: `
          <CuiTabs>
            <CuiTab value="clients" label="Clients">
              <template #label>Clients <span class="badge">{{ count }}</span></template>
              Panel
            </CuiTab>
            <CuiTab value="plain" label="Plain">Panel two</CuiTab>
          </CuiTabs>
        `,
      }),
    );
    await wrapper.vm.$nextTick();

    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs[0].find(".badge").exists()).toBe(true);
    expect(tabs[0].text()).toBe("Clients 3");
    // a tab without the slot still renders its label prop
    expect(tabs[1].text()).toBe("Plain");
    expect(tabs[1].find(".badge").exists()).toBe(false);
  });

  it("re-renders slot content when its reactive source changes", async () => {
    const host = defineComponent({
      components: { CuiTabs, CuiTab },
      setup: () => ({ count: ref(3) }),
      template: `
        <CuiTabs>
          <CuiTab value="clients" label="Clients">
            <template #label>Clients <span class="badge">{{ count }}</span></template>
            Panel
          </CuiTab>
        </CuiTabs>
      `,
    });
    const wrapper = mount(host);
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".badge").text()).toBe("3");

    (wrapper.vm as unknown as { count: number }).count = 7;
    await wrapper.vm.$nextTick();
    // the slot is invoked by CuiTabs' render, so the count must still track
    expect(wrapper.find(".badge").text()).toBe("7");
  });

  it("keeps tab order when a tab's label prop changes", async () => {
    const host = defineComponent({
      components: { CuiTabs, CuiTab },
      setup: () => ({ first: ref("One") }),
      template: `
        <CuiTabs>
          <CuiTab value="one" :label="first">Panel one</CuiTab>
          <CuiTab value="two" label="Two">Panel two</CuiTab>
          <CuiTab value="three" label="Three">Panel three</CuiTab>
        </CuiTabs>
      `,
    });
    const wrapper = mount(host);
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('[role="tab"]').map((t) => t.text())).toEqual(["One", "Two", "Three"]);

    // Re-registering used to push the tab to the end of the bar
    (wrapper.vm as unknown as { first: string }).first = "Renamed";
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('[role="tab"]').map((t) => t.text())).toEqual([
      "Renamed",
      "Two",
      "Three",
    ]);
  });
});

describe("CuiTabs overflow", () => {
  /** jsdom reports every element as 0x0; fake the scroller's size and position. */
  function stubMetrics(el: HTMLElement, { client, scroll, pos }: { client: number; scroll: number; pos: number }) {
    for (const [key, value] of Object.entries({ clientWidth: client, scrollWidth: scroll, scrollLeft: pos })) {
      Object.defineProperty(el, key, { value, configurable: true, writable: true });
    }
    el.dispatchEvent(new Event("scroll"));
  }
  const scrollerOf = (wrapper: ReturnType<typeof mount>) => wrapper.get(".cui-scroll-area__scroller").element as HTMLElement;
  /** The scroll buttons showing, by edge. */
  const shownButtons = (wrapper: ReturnType<typeof mount>) =>
    wrapper.findAll(".cui-scroll-area__edge").filter((e) => !e.classes("cui-scroll-area__edge--hidden")).map((e) => (e.classes("cui-scroll-area__edge--start") ? "start" : "end"));

  it("renders the tablist inside the scroll area's scroller, with the chrome outside it", async () => {
    const wrapper = mount(makeHost());
    await wrapper.vm.$nextTick();
    const bar = wrapper.get('[role="tablist"]');
    expect(bar.classes()).toContain("cui-tabs__bar");
    const scroller = bar.element.parentElement!;
    expect(scroller.className).toContain("cui-scroll-area__scroller");
    expect(scroller.closest(".cui-tabs__bar-outer")).not.toBeNull();
    // The tablist's arrow keys are the keyboard's way along it: no second tab stop.
    expect(scroller.getAttribute("tabindex")).toBeNull();
    expect(scroller.getAttribute("role")).toBeNull();
  });

  it("shows a scroll button only on a side with more tabs (auto)", async () => {
    const wrapper = mount(makeHost(), { attachTo: document.body });
    await wrapper.vm.$nextTick();
    const el = scrollerOf(wrapper);
    stubMetrics(el, { client: 200, scroll: 200, pos: 0 });
    await wrapper.vm.$nextTick();
    expect(shownButtons(wrapper), "everything fits").toEqual([]);

    stubMetrics(el, { client: 200, scroll: 500, pos: 0 });
    await wrapper.vm.$nextTick();
    expect(shownButtons(wrapper)).toEqual(["end"]);
    stubMetrics(el, { client: 200, scroll: 500, pos: 150 });
    await wrapper.vm.$nextTick();
    expect(shownButtons(wrapper)).toEqual(["start", "end"]);
    stubMetrics(el, { client: 200, scroll: 500, pos: 300 });
    await wrapper.vm.$nextTick();
    expect(shownButtons(wrapper)).toEqual(["start"]);
    wrapper.unmount();
  });

  it("keeps both buttons with always, the spent one disabled; none with never", async () => {
    const always = mount(makeHost({ tabsProps: 'scroll-buttons="always"' }), { attachTo: document.body });
    await always.vm.$nextTick();
    stubMetrics(scrollerOf(always), { client: 200, scroll: 500, pos: 0 });
    await always.vm.$nextTick();
    expect(shownButtons(always)).toEqual(["start", "end"]);
    const buttons = always.findAll(".cui-scroll-area__indicator");
    expect(buttons.map((b) => b.attributes("disabled") !== undefined)).toEqual([true, false]);
    // Pointer affordances only.
    for (const b of buttons) expect(b.attributes("tabindex")).toBe("-1");
    expect(always.find(".cui-scroll-area__edge").attributes("aria-hidden")).toBe("true");
    always.unmount();

    const never = mount(makeHost({ tabsProps: 'scroll-buttons="never"' }), { attachTo: document.body });
    await never.vm.$nextTick();
    stubMetrics(scrollerOf(never), { client: 200, scroll: 500, pos: 150 });
    await never.vm.$nextTick();
    expect(never.findAll(".cui-scroll-area__edge")).toHaveLength(0);
    never.unmount();
  });

  it("keeps the scroll buttons out of the tablist", async () => {
    const wrapper = mount(makeHost({ tabsProps: 'scroll-buttons="always"' }));
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[role="tablist"]').findAll(".cui-scroll-area__indicator")).toHaveLength(0);
  });

  it("scrolls the bar, and only the bar, to the newly active tab on a v-model change", async () => {
    const wrapper = mount(makeHost(), { attachTo: document.body });
    await wrapper.vm.$nextTick();

    const bar = (wrapper.find('[role="tablist"]').element as HTMLElement).parentElement as HTMLElement;
    const target = wrapper.findAll('[role="tab"]')[1].element as HTMLElement;
    // Past the bar's end: jsdom lays nothing out.
    target.getBoundingClientRect = () => ({ left: 500, right: 600, top: 0, bottom: 30, width: 100, height: 30, x: 500, y: 0, toJSON() {} });
    Object.defineProperty(bar, "clientWidth", { value: 300 });
    const scrollBy = vi.fn();
    bar.scrollBy = scrollBy as never;
    // scrollIntoView would scroll the page too (#243).
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;

    (wrapper.vm as unknown as { active: string }).active = "two";
    await wrapper.vm.$nextTick();

    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy.mock.calls[0][0].left).toBeGreaterThan(0);
    expect(scrollIntoView).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("keyboard nav works with a tab value containing a quote or backslash", async () => {
    const host = defineComponent({
      components: { CuiTabs, CuiTab },
      template: `
        <CuiTabs>
          <CuiTab value="one" label="One">One</CuiTab>
          <CuiTab value='say "hi" \\ there' label="Two">Two</CuiTab>
        </CuiTabs>
      `,
    });
    const wrapper = mount(host, { attachTo: document.body });
    await wrapper.vm.$nextTick();

    await wrapper.get('[role="tablist"]').trigger("keydown", { key: "ArrowRight" });
    await wrapper.vm.$nextTick();

    expect(document.activeElement).toBe(wrapper.findAll('[role="tab"]')[1].element);
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

// #238: a <button> with no type is a submit button, so a tab set inside a <form>
// submitted the form on every tab switch. Fixed in #167; button-type.test.ts guards every
// component statically, and this checks the behaviour end to end.
describe("CuiTabs inside a form", () => {
  it("switching or closing a tab does not submit the form", async () => {
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    const wrapper = mount(makeHost({ tabTwoExtra: "closeable", onSubmit }), { attachTo: document.body });
    await wrapper.vm.$nextTick();

    await wrapper.findAll('[role="tab"]')[1].trigger("click");
    await wrapper.get(".cui-tabs__tab-close").trigger("click");
    expect(onSubmit).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});

// #289 — the shared index maths: one tab stop, arrows wrapping at the ends.
const threeTabs = () =>
  defineComponent({
    components: { CuiTabs, CuiTab },
    setup: () => ({ active: ref("one") }),
    template: `
      <div>
        <CuiTabs v-model="active">
          <CuiTab value="one" label="One">1</CuiTab>
          <CuiTab value="two" label="Two">2</CuiTab>
          <CuiTab value="three" label="Three">3</CuiTab>
        </CuiTabs>
      </div>
    `,
  });

describeRovingFocusContract("CuiTabs", {
  mount: () => mount(threeTabs(), { attachTo: document.body }),
  items: () => [...document.querySelectorAll<HTMLElement>('[role="tab"]')],
  orientation: "horizontal",
  wrap: true,
});

describe("CuiTabs keyboard with every tab disabled", () => {
  it("does nothing on Home or End, rather than throwing", async () => {
    const errors: unknown[] = [];
    const wrapper = mount(
      defineComponent({
        components: { CuiTabs, CuiTab },
        setup: () => ({ active: ref("one") }),
        template: `<CuiTabs v-model="active"><CuiTab value="one" label="One" disabled>1</CuiTab><CuiTab value="two" label="Two" disabled>2</CuiTab></CuiTabs>`,
      }),
      { attachTo: document.body, global: { config: { errorHandler: (err) => errors.push(err) } } },
    );
    await wrapper.vm.$nextTick();
    for (const key of ["Home", "End"]) {
      wrapper.get('[role="tablist"]').element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
    }
    expect(errors).toEqual([]);
    wrapper.unmount();
  });
});
