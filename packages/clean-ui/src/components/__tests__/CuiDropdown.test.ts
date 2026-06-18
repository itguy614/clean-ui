import { describe, it, expect, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import CuiDropdown from "../CuiDropdown.vue";
import CuiDropdownTrigger from "../CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../CuiDropdownMenu.vue";
import CuiDropdownItem from "../CuiDropdownItem.vue";

// The menu teleports to document.body and renders only while open (or closing).
const menuInBody = () => document.body.querySelector(".cui-dropdown-menu");

function mountDropdown(itemProps: Record<string, unknown> = {}, onSelect?: () => void) {
  return mount(CuiDropdown, {
    attachTo: document.body,
    slots: {
      default: () => [
        h(CuiDropdownTrigger, () => h("button", "Menu")),
        h(CuiDropdownMenu, () => [
          h(CuiDropdownItem, { ...itemProps, onSelect }, () => "Item One"),
        ]),
      ],
    },
  });
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("CuiDropdown behavior", () => {
  it("does not render the menu until the trigger is clicked", async () => {
    const wrapper = mountDropdown();
    expect(menuInBody()).toBeNull();

    await wrapper.find(".cui-dropdown-trigger").trigger("click");
    expect(menuInBody()).not.toBeNull();
    expect(menuInBody()?.textContent).toContain("Item One");

    wrapper.unmount();
  });

  it("toggles closed when the trigger is clicked again", async () => {
    vi.useFakeTimers();
    const wrapper = mountDropdown();
    const trigger = wrapper.find(".cui-dropdown-trigger");

    await trigger.trigger("click");
    expect(menuInBody()).not.toBeNull();

    // Second click starts the close animation; advance past the 150ms timer.
    await trigger.trigger("click");
    vi.advanceTimersByTime(200);
    await wrapper.vm.$nextTick();
    expect(menuInBody()).toBeNull();

    vi.useRealTimers();
    wrapper.unmount();
  });

  it("fires @select and closes when an item is clicked", async () => {
    vi.useFakeTimers();
    const onSelect = vi.fn();
    const wrapper = mountDropdown({}, onSelect);

    await wrapper.find(".cui-dropdown-trigger").trigger("click");
    const item = menuInBody()?.querySelector<HTMLElement>('[role="menuitem"]');
    expect(item).not.toBeNull();

    item!.click();
    expect(onSelect).toHaveBeenCalledTimes(1);

    // closeOnSelect defaults true -> closeAll() -> isClosing -> 150ms timer.
    vi.advanceTimersByTime(200);
    await wrapper.vm.$nextTick();
    expect(menuInBody()).toBeNull();

    vi.useRealTimers();
    wrapper.unmount();
  });

  it("does not close on select when closeOnSelect is false", async () => {
    vi.useFakeTimers();
    const onSelect = vi.fn();
    const wrapper = mountDropdown({ closeOnSelect: false }, onSelect);

    await wrapper.find(".cui-dropdown-trigger").trigger("click");
    const item = menuInBody()?.querySelector<HTMLElement>('[role="menuitem"]');
    item!.click();

    expect(onSelect).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(200);
    await wrapper.vm.$nextTick();
    expect(menuInBody()).not.toBeNull();

    vi.useRealTimers();
    wrapper.unmount();
  });

  it("does not fire @select for a disabled item", async () => {
    const onSelect = vi.fn();
    const wrapper = mountDropdown({ disabled: true }, onSelect);

    await wrapper.find(".cui-dropdown-trigger").trigger("click");
    const item = menuInBody()?.querySelector<HTMLElement>('[role="menuitem"]');
    item!.click();

    expect(onSelect).not.toHaveBeenCalled();
    expect(menuInBody()).not.toBeNull();

    wrapper.unmount();
  });
});
