import { describe, it, expect, afterEach, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiConfigProvider from "../CuiConfigProvider.vue";
import CuiModal from "../CuiModal.vue";
import CuiSortableList from "../CuiSortableList.vue";
import { __clearWarned } from "../../utils/devWarn";

const people = () => [
  { id: 1, label: "Ada" },
  { id: 2, label: "Grace" },
  { id: 3, label: "Linus" },
];

const mounted: VueWrapper[] = [];
afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount());
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  __clearWarned();
});

/** A parent that holds the v-model (or refuses it, with `accept: false`). */
function setup(props: Record<string, unknown> = {}, accept = true) {
  const model = ref(people());
  const App = defineComponent({
    render: () =>
      h(CuiSortableList, {
        modelValue: model.value,
        "onUpdate:modelValue": (v: ReturnType<typeof people>) => accept && (model.value = v),
        ...props,
      }),
  });
  const wrapper = mount(App, { attachTo: document.body });
  mounted.push(wrapper);
  return { wrapper, model, list: () => wrapper.findComponent(CuiSortableList) };
}

const labels = (w: VueWrapper) => w.findAll(".cui-sortable-list__content").map((c) => c.text());
const handle = (w: VueWrapper, i: number) => w.findAll(".cui-sortable-list__handle")[i];
const status = (w: VueWrapper) => w.find('[role="status"]').text();
const press = (el: { trigger: (e: string, o?: object) => Promise<void> }, key: string) => el.trigger("keydown", { key });

describe("CuiSortableList", () => {
  it("renders a named list with a handle and move buttons per item", () => {
    const { wrapper } = setup({ label: "People" });
    const ul = wrapper.find("ul");
    expect(ul.attributes("role")).toBe("list");
    expect(ul.attributes("aria-label")).toBe("People");
    expect(labels(wrapper)).toEqual(["Ada", "Grace", "Linus"]);
    expect(handle(wrapper, 1).attributes("aria-label")).toBe("Reorder Grace");
    expect(wrapper.find(".cui-sortable-list").exists()).toBe(true);
    // The handle is described by the instructions, which are in the page for assistive tech.
    const help = handle(wrapper, 0).attributes("aria-describedby")!;
    expect(wrapper.find(`#${help}`).text()).toContain("Space to grab");
  });

  it("names itself from the catalogue when no label is given", () => {
    expect(setup().wrapper.find("ul").attributes("aria-label")).toBe("Reorderable list");
  });

  it("follows a localized catalogue", () => {
    const w = mount(
      defineComponent({
        render: () =>
          h(CuiConfigProvider, { messages: { sortableList: { handle: (item: string) => `${item} verschieben`, label: "Sortierbare Liste" } } }, () =>
            h(CuiSortableList, { modelValue: people() }),
          ),
      }),
      { attachTo: document.body },
    );
    mounted.push(w);
    expect(w.find("ul").attributes("aria-label")).toBe("Sortierbare Liste");
    expect(handle(w, 0).attributes("aria-label")).toBe("Ada verschieben");
  });

  it("names an item from itemLabel, a label-ish property, or the item itself", () => {
    const byFn = setup({ itemLabel: (p: { id: number }) => `#${p.id}` }).wrapper;
    expect(handle(byFn, 2).attributes("aria-label")).toBe("Reorder #3");
    const strings = mount(CuiSortableList, { props: { modelValue: ["x", "y"] }, attachTo: document.body });
    mounted.push(strings as unknown as VueWrapper);
    expect(strings.findAll(".cui-sortable-list__handle")[1].attributes("aria-label")).toBe("Reorder y");
  });

  it("keys items by itemKey, a property name or a function, without warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const items = [{ slug: "a", label: "A" }, { slug: "b", label: "B" }];
    const byName = mount(CuiSortableList, { props: { modelValue: items, itemKey: "slug" }, attachTo: document.body });
    const byFn = mount(CuiSortableList, { props: { modelValue: items, itemKey: (i: { slug: string }) => i.slug }, attachTo: document.body });
    mounted.push(byName as unknown as VueWrapper, byFn as unknown as VueWrapper);
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns once in development about an item with no key", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const w = mount(CuiSortableList, { props: { modelValue: [{ label: "A" }, { label: "B" }] }, attachTo: document.body });
    mounted.push(w as unknown as VueWrapper);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("item-key");
  });

  it("renders the item and handle slots", () => {
    const w = mount(CuiSortableList, {
      props: { modelValue: people() },
      slots: {
        item: `<template #item="{ item, index }"><b class="mine">{{ index }}:{{ item.label }}</b></template>`,
        handle: `<template #handle="{ item }"><i class="grip">{{ item.id }}</i></template>`,
      },
      attachTo: document.body,
    });
    mounted.push(w as unknown as VueWrapper);
    expect(w.findAll(".mine").map((e) => e.text())).toEqual(["0:Ada", "1:Grace", "2:Linus"]);
    expect(w.findAll(".cui-sortable-list__handle .grip").map((e) => e.text())).toEqual(["1", "2", "3"]);
  });

  describe("keyboard grab", () => {
    it("grabs on Space or Enter, moves a draft, and commits once on drop", async () => {
      const { wrapper, model, list } = setup();
      await press(handle(wrapper, 0), " ");
      expect(handle(wrapper, 0).attributes("aria-pressed")).toBe("true");
      expect(status(wrapper)).toBe("Ada grabbed, position 1 of 3.");
      await press(handle(wrapper, 0), "ArrowDown");
      expect(status(wrapper)).toBe("Ada moved to position 2 of 3.");
      expect(labels(wrapper)).toEqual(["Grace", "Ada", "Linus"]);
      expect(model.value.map((p) => p.label)).toEqual(["Ada", "Grace", "Linus"]);
      expect(list().emitted("update:modelValue")).toBeUndefined();
      await press(handle(wrapper, 1), "Enter");
      expect(model.value.map((p) => p.label)).toEqual(["Grace", "Ada", "Linus"]);
      expect(list().emitted("update:modelValue")).toHaveLength(1);
      expect(list().emitted("reorder")![0]).toEqual([{ item: { id: 1, label: "Ada" }, from: 0, to: 1 }]);
      expect(status(wrapper)).toBe("Ada dropped at position 2 of 3.");
    });

    it("stops at the ends", async () => {
      const { wrapper } = setup();
      await press(handle(wrapper, 0), " ");
      await press(handle(wrapper, 0), "ArrowUp");
      expect(labels(wrapper)).toEqual(["Ada", "Grace", "Linus"]);
      expect(status(wrapper)).toBe("Ada grabbed, position 1 of 3.");
    });

    it("restores the order on Escape and emits nothing", async () => {
      const { wrapper, list } = setup();
      await press(handle(wrapper, 0), " ");
      await press(handle(wrapper, 0), "End");
      expect(labels(wrapper)).toEqual(["Grace", "Linus", "Ada"]);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
      await nextTick();
      expect(labels(wrapper)).toEqual(["Ada", "Grace", "Linus"]);
      expect(list().emitted("update:modelValue")).toBeUndefined();
      expect(status(wrapper)).toBe("Reorder cancelled. Ada is back at position 1 of 3.");
      expect(handle(wrapper, 0).attributes("aria-pressed")).toBe("false");
    });

    it("ignores a held key's repeats: the grab is not dropped by its own auto-repeat", async () => {
      const { wrapper } = setup();
      await handle(wrapper, 0).trigger("keydown", { key: " " });
      await handle(wrapper, 0).trigger("keydown", { key: " ", repeat: true });
      expect(handle(wrapper, 0).attributes("aria-pressed")).toBe("true");
    });

    it("drops the grab, emitting nothing, when the parent replaces the items under it", async () => {
      const { wrapper, model, list } = setup();
      await press(handle(wrapper, 0), " ");
      await press(handle(wrapper, 0), "ArrowDown");
      model.value = [{ id: 2, label: "Grace" }, { id: 3, label: "Linus" }];
      await nextTick();
      expect(labels(wrapper)).toEqual(["Grace", "Linus"]);
      expect(list().emitted("update:modelValue")).toBeUndefined();
      expect(wrapper.find('[aria-pressed="true"]').exists()).toBe(false);
    });

    it("leaves a drop with no move silent", async () => {
      const { wrapper, list } = setup();
      await press(handle(wrapper, 1), " ");
      await press(handle(wrapper, 1), " ");
      expect(list().emitted("update:modelValue")).toBeUndefined();
      expect(list().emitted("reorder")).toBeUndefined();
    });

    it("is not available when disabled", async () => {
      const { wrapper } = setup({ disabled: true });
      expect(handle(wrapper, 0).attributes("disabled")).toBeDefined();
      await press(handle(wrapper, 0), " ");
      expect(handle(wrapper, 0).attributes("aria-pressed")).toBe("false");
    });

    it("returns to the parent's order when the parent refuses the move", async () => {
      const { wrapper, model } = setup({}, false);
      await press(handle(wrapper, 0), " ");
      await press(handle(wrapper, 0), "ArrowDown");
      await press(handle(wrapper, 1), " ");
      expect(model.value.map((p) => p.label)).toEqual(["Ada", "Grace", "Linus"]);
      expect(labels(wrapper)).toEqual(["Ada", "Grace", "Linus"]);
    });

    it("cancels the grab, not the enclosing modal, on the first Escape", async () => {
      const visible = ref(true);
      const model = ref(people());
      const w = mount(
        defineComponent({
          render: () =>
            h(CuiModal, { visible: visible.value, "onUpdate:visible": (v: boolean) => (visible.value = v), title: "Order" }, () =>
              h(CuiSortableList, { modelValue: model.value, "onUpdate:modelValue": (v: typeof model.value) => (model.value = v) }),
            ),
        }),
        { attachTo: document.body },
      );
      mounted.push(w);
      await nextTick();
      const grip = document.body.querySelectorAll<HTMLElement>(".cui-sortable-list__handle")[0];
      grip.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }));
      await nextTick();
      expect(grip.getAttribute("aria-pressed")).toBe("true");
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
      await nextTick();
      expect(grip.getAttribute("aria-pressed")).toBe("false");
      expect(visible.value).toBe(true);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
      await nextTick();
      expect(visible.value).toBe(false);
    });
  });

  describe("move buttons", () => {
    const button = (w: VueWrapper, item: string, dir: "up" | "down") => w.find(`button[aria-label="Move ${item} ${dir}"]`);

    it("move an item and emit once, announcing the new position", async () => {
      const { wrapper, model, list } = setup();
      await button(wrapper, "Grace", "down").trigger("click");
      expect(model.value.map((p) => p.label)).toEqual(["Ada", "Linus", "Grace"]);
      expect(list().emitted("reorder")![0]).toEqual([{ item: { id: 2, label: "Grace" }, from: 1, to: 2 }]);
      expect(status(wrapper)).toBe("Grace moved to position 3 of 3.");
    });

    it("are unavailable at the ends and when disabled, and do nothing then", async () => {
      const { wrapper, list } = setup();
      expect(button(wrapper, "Ada", "up").attributes("aria-disabled")).toBe("true");
      await button(wrapper, "Ada", "up").trigger("click");
      expect(list().emitted("update:modelValue")).toBeUndefined();
      const off = setup({ disabled: true });
      expect(button(off.wrapper, "Grace", "down").attributes("aria-disabled")).toBe("true");
    });

    it("name themselves by direction in a horizontal list", () => {
      const { wrapper } = setup({ orientation: "horizontal" });
      expect(wrapper.find('button[aria-label="Move Grace earlier"]').exists()).toBe(true);
      expect(wrapper.find('button[aria-label="Move Grace later"]').exists()).toBe(true);
    });

    it("are left out with moveButtons off", () => {
      expect(setup({ moveButtons: false }).wrapper.find(".cui-sortable-list__actions").exists()).toBe(false);
    });
  });

  it("keeps an item disabled by `itemDisabled` focusable but inert (#559, #577)", async () => {
    const { wrapper, model } = setup({ itemDisabled: (p: { id: number }) => p.id === 2 });
    // Reachable, and said to be unavailable: aria-disabled, not the disabled attribute.
    expect((handle(wrapper, 1).element as HTMLButtonElement).disabled).toBe(false);
    expect(handle(wrapper, 1).attributes("aria-disabled")).toBe("true");
    expect(handle(wrapper, 1).attributes("data-cui-focusable-disabled")).toBeDefined();
    expect(handle(wrapper, 0).attributes("aria-disabled")).toBeUndefined();
    // Space and Enter do not grab it.
    for (const key of [" ", "Enter"]) await press(handle(wrapper, 1), key);
    expect(handle(wrapper, 1).attributes("aria-pressed")).toBe("false");
    expect(status(wrapper)).toBe("");
    expect(wrapper.find('button[aria-label="Move Grace down"]').attributes("aria-disabled")).toBe("true");
    expect(wrapper.find('button[aria-label="Move Grace up"]').attributes("aria-disabled")).toBe("true");
    // A neighbor can still pass it.
    await wrapper.find('button[aria-label="Move Ada down"]').trigger("click");
    expect(model.value.map((p) => p.label)).toEqual(["Grace", "Ada", "Linus"]);
  });

  it("is hidden with `hidden`, and exposes its element and focus", async () => {
    const { wrapper, list } = setup({ hidden: true });
    expect((wrapper.find(".cui-sortable-list").element as HTMLElement).style.display).toBe("none");
    const vm = list().vm as unknown as { el: HTMLElement; focus: () => void };
    expect(vm.el).toBeInstanceOf(HTMLElement);
    vm.focus();
  });
});
