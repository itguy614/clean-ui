import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, enableAutoUnmount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref, type Ref } from "vue";
import { useLayerStack } from "../useLayerStack";
import CuiModal from "../../components/CuiModal.vue";
import CuiTooltip from "../../components/CuiTooltip.vue";
import CuiPopover from "../../components/CuiPopover.vue";
import CuiCombobox from "../../components/CuiCombobox.vue";
import CuiDropdown from "../../components/CuiDropdown.vue";
import CuiDropdownTrigger from "../../components/CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../../components/CuiDropdownMenu.vue";
import CuiDropdownItem from "../../components/CuiDropdownItem.vue";

enableAutoUnmount(afterEach);

const escape = (target: EventTarget = document.body) => {
  const e = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
  target.dispatchEvent(e);
  return e;
};

/** A bare layer: open while `open` is true, logging its name on Escape. */
const Layer = defineComponent({
  props: { name: { type: String, required: true }, open: { type: Object as () => Ref<boolean>, required: true } },
  setup(props) {
    useLayerStack({ active: props.open, onEscape: () => log.push(props.name) });
    return () => h("div");
  },
});

let log: string[] = [];
afterEach(() => {
  log = [];
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("useLayerStack", () => {
  it("gives each Escape to the most recently opened layer only", async () => {
    const a = ref(false);
    const b = ref(false);
    mount(() => [h(Layer, { name: "a", open: a }), h(Layer, { name: "b", open: b })]);
    b.value = true;
    await nextTick();
    a.value = true;
    await nextTick();

    escape();
    expect(log).toEqual(["a"]);
    a.value = false;
    await nextTick();
    escape();
    expect(log).toEqual(["a", "b"]);
  });

  it("stops a handled Escape, and leaves one that something inside already handled", async () => {
    mount(() => h(Layer, { name: "a", open: ref(true) }));
    const outside = vi.fn();
    window.addEventListener("keydown", outside);

    const handled = escape();
    expect(handled.defaultPrevented).toBe(true);
    expect(outside).not.toHaveBeenCalled();

    const inner = document.createElement("input");
    document.body.append(inner);
    inner.addEventListener("keydown", (e) => e.preventDefault());
    escape(inner);
    expect(log).toEqual(["a"]);
    window.removeEventListener("keydown", outside);
    inner.remove();
  });

  it("ignores Escape during IME composition", () => {
    mount(() => h(Layer, { name: "a", open: ref(true) }));
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, isComposing: true }));
    expect(log).toEqual([]);
  });

  it("holds one document listener, only while a layer is open", async () => {
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    const keydownCalls = (spy: typeof add) => spy.mock.calls.filter(([type]) => type === "keydown").length;
    const a = ref(false);
    const b = ref(false);
    const wrapper = mount(() => [h(Layer, { name: "a", open: a }), h(Layer, { name: "b", open: b })]);
    expect(keydownCalls(add)).toBe(0);

    a.value = true;
    b.value = true;
    await nextTick();
    expect(keydownCalls(add)).toBe(1);
    a.value = false;
    await nextTick();
    expect(keydownCalls(remove)).toBe(0);

    wrapper.unmount();
    expect(keydownCalls(remove)).toBe(1);
  });
});

// The acceptance cases from #278, on the real components.
describe("useLayerStack across overlays", () => {
  async function settle() {
    await nextTick();
    vi.runAllTimers();
    await nextTick();
  }

  it("a tooltip left showing beneath a modal opened later doesn't take the modal's Escape", async () => {
    vi.useFakeTimers();
    const onModal = vi.fn();
    const onTip = vi.fn();
    const modalOpen = ref(false);
    mount(
      defineComponent(() => () => [
        h(CuiTooltip, { text: "Hint", visible: true, "onUpdate:visible": onTip }, () => h("button", "Open")),
        h(CuiModal, { visible: modalOpen.value, title: "Dialog", "onUpdate:visible": onModal }),
      ]),
      { attachTo: document.body },
    );
    await settle();
    modalOpen.value = true;
    await settle();

    escape();
    await settle();
    expect(onModal).toHaveBeenLastCalledWith(false);
    expect(onTip).not.toHaveBeenCalled();
  });

  it("a persistent modal declines Escape without passing it to the popover beneath", async () => {
    vi.useFakeTimers();
    const onPopover = vi.fn();
    const onModal = vi.fn();
    const modalOpen = ref(false);
    mount(
      defineComponent(() => () => [
        h(CuiPopover, { visible: true, "onUpdate:visible": onPopover }, { default: () => h("button", "Trigger"), content: () => "Panel" }),
        h(CuiModal, { visible: modalOpen.value, persistent: true, title: "Dialog", "onUpdate:visible": onModal }),
      ]),
      { attachTo: document.body },
    );
    await settle();
    modalOpen.value = true;
    await settle();

    escape();
    await settle();
    expect(onModal).not.toHaveBeenCalled();
    expect(onPopover).not.toHaveBeenCalled();
  });

  it("an open combobox list inside a modal closes on Escape and the modal stays", async () => {
    vi.useFakeTimers();
    const onModal = vi.fn();
    mount(
      defineComponent(() => () =>
        h(CuiModal, { visible: true, title: "Dialog", "onUpdate:visible": onModal }, () =>
          h(CuiCombobox, { options: [{ value: "a", label: "A" }] }),
        ),
      ),
      { attachTo: document.body },
    );
    await settle();
    const input = document.querySelector<HTMLInputElement>(".cui-modal-overlay input")!;
    const list = () => document.querySelector(".cui-combobox__dropdown");
    input.dispatchEvent(new FocusEvent("focus"));
    await settle();
    expect(list()).not.toBeNull();

    escape(input);
    await settle();
    expect(list()).toBeNull();
    expect(onModal).not.toHaveBeenCalled();
  });

  it("Escape on an item of a dropdown inside a modal closes the dropdown, not the modal", async () => {
    vi.useFakeTimers();
    const onModal = vi.fn();
    mount(
      defineComponent(() => () =>
        h(CuiModal, { visible: true, title: "Dialog", "onUpdate:visible": onModal }, () =>
          h(CuiDropdown, null, () => [
            h(CuiDropdownTrigger, null, () => h("button", { id: "open" }, "Open")),
            h(CuiDropdownMenu, null, () => h(CuiDropdownItem, null, () => "Item")),
          ]),
        ),
      ),
      { attachTo: document.body },
    );
    await settle();
    document.getElementById("open")!.click();
    await settle();
    const item = document.querySelector<HTMLElement>(".cui-dropdown-item")!;
    expect(item).not.toBeNull();

    escape(item); // the menu is teleported: this never passes through the dropdown wrapper
    await settle();
    expect(document.querySelector(".cui-dropdown-item")).toBeNull();
    expect(onModal).not.toHaveBeenCalled();
  });

  it("a popover dismissed by Escape leaves the next Escape to the modal beneath", async () => {
    vi.useFakeTimers();
    const onModal = vi.fn();
    const onPopover = vi.fn();
    const popoverOpen = ref(false);
    mount(
      defineComponent(() => () => [
        h(CuiModal, { visible: true, title: "Dialog", "onUpdate:visible": onModal }),
        h(CuiPopover, { visible: popoverOpen.value, hideDelay: 100, "onUpdate:visible": onPopover }, { default: () => h("button", "Trigger"), content: () => "Panel" }),
      ]),
      { attachTo: document.body },
    );
    await settle();
    popoverOpen.value = true;
    await settle();

    escape();
    escape(); // before hideDelay would have elapsed
    await settle();
    expect(onPopover).toHaveBeenLastCalledWith(false);
    expect(onModal).toHaveBeenLastCalledWith(false);
  });

  // Found in the docs site: the pointer rests on the button that opened the modal, so its
  // tooltip's show delay runs out after the modal opened, under the backdrop.
  it("a tooltip outside a modal that shows after the modal opened goes beneath it", async () => {
    vi.useFakeTimers();
    const onModal = vi.fn();
    const onTip = vi.fn();
    const tipOpen = ref(false);
    mount(
      defineComponent(() => () => [
        h(CuiTooltip, { text: "Hint", visible: tipOpen.value, "onUpdate:visible": onTip }, () => h("button", "Open")),
        h(CuiModal, { visible: true, title: "Dialog", "onUpdate:visible": onModal }),
      ]),
      { attachTo: document.body },
    );
    await settle();
    tipOpen.value = true;
    await settle();

    escape();
    await settle();
    expect(onModal).toHaveBeenLastCalledWith(false);
    expect(onTip).not.toHaveBeenCalled();
  });

  it("a tooltip in a popover in a modal still closes first, though both panels are teleported", async () => {
    vi.useFakeTimers();
    const onModal = vi.fn();
    const onPopover = vi.fn();
    const onTip = vi.fn();
    const tipOpen = ref(false);
    mount(
      defineComponent(() => () =>
        h(CuiModal, { visible: true, title: "Dialog", "onUpdate:visible": onModal }, () =>
          h(CuiPopover, { visible: true, "onUpdate:visible": onPopover }, {
            default: () => h("button", "Trigger"),
            content: () => h(CuiTooltip, { text: "Hint", visible: tipOpen.value, "onUpdate:visible": onTip }, () => h("button", "Inner")),
          }),
        ),
      ),
      { attachTo: document.body },
    );
    await settle();
    tipOpen.value = true;
    await settle();

    escape();
    await settle();
    expect(onTip).toHaveBeenLastCalledWith(false);
    expect(onPopover).not.toHaveBeenCalled();
    expect(onModal).not.toHaveBeenCalled();
  });
});
