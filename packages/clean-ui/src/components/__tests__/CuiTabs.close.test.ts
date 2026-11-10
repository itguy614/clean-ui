import { describe, it, expect } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, ref } from "vue";
import CuiTabs from "../CuiTabs.vue";
import CuiTab from "../CuiTab.vue";

// #153 — the close button is a sibling of the tab button (a button can't hold a button), and
// Delete closes the focused closeable tab.
describe("CuiTabs closeable tabs (#153)", () => {
  // `remove: false` is a consumer that keeps the tab on `close` (a confirm, a refusal).
  function closeHost(opts: { disabledTwo?: boolean; remove?: boolean } = {}) {
    const closed: string[] = [];
    const wrapper = mount(
      defineComponent({
        components: { CuiTabs, CuiTab },
        setup() {
          const items = ref([
            { value: "one", closeable: true, disabled: false },
            { value: "two", closeable: true, disabled: !!opts.disabledTwo },
            { value: "three", closeable: false, disabled: false },
          ]);
          const onClose = (v: string) => {
            closed.push(v);
            if (opts.remove !== false) items.value = items.value.filter((i) => i.value !== v);
          };
          return { active: ref("one"), items, onClose };
        },
        template: `
          <CuiTabs v-model="active" @close="onClose">
            <CuiTab v-for="i in items" :key="i.value" :value="i.value" :label="i.value[0].toUpperCase() + i.value.slice(1)" :closeable="i.closeable" :disabled="i.disabled">x</CuiTab>
          </CuiTabs>`,
      }),
      { attachTo: document.body },
    );
    return { wrapper, closed };
  }
  const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));

  it("renders the close button beside the tab button, not inside it, named for its tab", async () => {
    const { wrapper } = closeHost();
    await wrapper.vm.$nextTick();
    const tab = wrapper.get('[role="tab"]').element;
    const close = wrapper.get(".cui-tabs__tab-close").element;
    expect(tab.querySelector("button")).toBeNull();
    expect(tab.contains(close)).toBe(false);
    expect(close.parentElement).toBe(tab.parentElement);
    expect(close.getAttribute("type")).toBe("button");
    expect(close.getAttribute("tabindex")).toBe("-1");
    expect(close.getAttribute("aria-label")).toBe("Close One");
    wrapper.unmount();
  });

  it("clicking close emits close and does not activate the tab", async () => {
    const { wrapper, closed } = closeHost();
    await wrapper.vm.$nextTick();
    await wrapper.findAll(".cui-tabs__tab-close")[1].trigger("click");
    expect(closed).toEqual(["two"]);
    expect(wrapper.findAll('[role="tab"]')[0].attributes("aria-selected")).toBe("true");
    wrapper.unmount();
  });

  it.each(["Delete", "Backspace"])("%s closes the focused closeable tab and moves focus to the next", async (k) => {
    const { wrapper, closed } = closeHost();
    await wrapper.vm.$nextTick();
    const tabs = wrapper.findAll<HTMLElement>('[role="tab"]');
    tabs[0].element.focus();
    key(tabs[0].element, k);
    await flushPromises();
    expect(closed).toEqual(["one"]);
    expect(document.activeElement).toBe(tabs[1].element);
    // "one" was the active tab and the consumer dropped it: the neighbour took the selection.
    expect(tabs[1].attributes("aria-selected")).toBe("true");
    wrapper.unmount();
  });

  it("does not move focus when the consumer keeps the tab", async () => {
    const { wrapper, closed } = closeHost({ remove: false });
    await wrapper.vm.$nextTick();
    const tabs = wrapper.findAll<HTMLElement>('[role="tab"]');
    tabs[0].element.focus();
    key(tabs[0].element, "Delete");
    await wrapper.vm.$nextTick();
    expect(closed).toEqual(["one"]);
    expect(document.activeElement).toBe(tabs[0].element);
    wrapper.unmount();
  });

  it("ignores an auto-repeated key, so a held Delete closes one tab", async () => {
    const { wrapper, closed } = closeHost();
    await wrapper.vm.$nextTick();
    const tab = wrapper.get<HTMLElement>('[role="tab"]').element;
    key(tab, "Delete", { repeat: true });
    expect(closed).toEqual([]);
    wrapper.unmount();
  });

  it("a click on the tab's area beside its close button activates the tab", async () => {
    const { wrapper } = closeHost();
    await wrapper.vm.$nextTick();
    await wrapper.findAll(".cui-tabs__tab")[1].trigger("click");
    expect(wrapper.findAll('[role="tab"]')[1].attributes("aria-selected")).toBe("true");
    wrapper.unmount();
  });

  it("moves focus to the previous tab when no tab follows", async () => {
    const closed: string[] = [];
    const wrapper = mount(
      defineComponent({
        components: { CuiTabs, CuiTab },
        setup() {
          const showTwo = ref(true);
          return { active: ref("one"), showTwo, onClose: (v: string) => (closed.push(v), (showTwo.value = false)) };
        },
        template: `
          <CuiTabs v-model="active" @close="onClose">
            <CuiTab value="one" label="One">1</CuiTab>
            <CuiTab v-if="showTwo" value="two" label="Two" closeable>2</CuiTab>
          </CuiTabs>`,
      }),
      { attachTo: document.body },
    );
    await wrapper.vm.$nextTick();
    const tabs = wrapper.findAll<HTMLElement>('[role="tab"]');
    tabs[1].element.focus();
    key(tabs[1].element, "Delete");
    await flushPromises();
    expect(closed).toEqual(["two"]);
    expect(document.activeElement).toBe(tabs[0].element);
    wrapper.unmount();
  });

  it("closes only the focused tab, not the active one, and ignores a non-closeable tab", async () => {
    const { wrapper, closed } = closeHost();
    await wrapper.vm.$nextTick();
    const tabs = wrapper.findAll<HTMLElement>('[role="tab"]');
    // "one" is active; focus rests on "three", which is not closeable.
    key(tabs[2].element, "Delete");
    expect(closed).toEqual([]);
    // Focus on "two" (not active): it is the one that closes.
    key(tabs[1].element, "Backspace");
    expect(closed).toEqual(["two"]);
    wrapper.unmount();
  });

  it("closes from the close button's own focus, and leaves modified keys alone", async () => {
    const { wrapper, closed } = closeHost();
    await wrapper.vm.$nextTick();
    const close = wrapper.findAll(".cui-tabs__tab-close")[0].element;
    key(close, "Delete", { ctrlKey: true });
    expect(closed).toEqual([]);
    key(close, "Delete");
    expect(closed).toEqual(["one"]);
    wrapper.unmount();
  });

  it("cannot close a disabled tab, by click or key", async () => {
    const { wrapper, closed } = closeHost({ disabledTwo: true });
    await wrapper.vm.$nextTick();
    const tabs = wrapper.findAll<HTMLElement>('[role="tab"]');
    const closeTwo = wrapper.findAll(".cui-tabs__tab-close")[1];
    expect(closeTwo.attributes("disabled")).toBeDefined();
    await closeTwo.trigger("click");
    key(tabs[1].element, "Delete");
    expect(closed).toEqual([]);
    wrapper.unmount();
  });

  it("skips a disabled neighbour when moving focus", async () => {
    const { wrapper } = closeHost({ disabledTwo: true });
    await wrapper.vm.$nextTick();
    const tabs = wrapper.findAll<HTMLElement>('[role="tab"]');
    tabs[0].element.focus();
    key(tabs[0].element, "Delete");
    await wrapper.vm.$nextTick();
    expect(document.activeElement).toBe(tabs[2].element);
    wrapper.unmount();
  });
});
