import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick, type VNode } from "vue";
import CuiDropdown from "../CuiDropdown.vue";
import CuiDropdownTrigger from "../CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../CuiDropdownMenu.vue";
import CuiDropdownItem from "../CuiDropdownItem.vue";
import CuiDropdownCheckItem from "../CuiDropdownCheckItem.vue";
import CuiContextMenu from "../CuiContextMenu.vue";
import CuiButton from "../CuiButton.vue";

/**
 * #160 — the menus' keyboard and focus gaps: no menu-button semantics on the trigger,
 * initial focus missing check and radio items, focus left on <body> after a close, and
 * CuiContextMenu's Escape outside the shared layer stack.
 */

let wrapper: VueWrapper | undefined;

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = "";
  vi.useRealTimers();
});

const menu = () => document.querySelector<HTMLElement>(".cui-dropdown-menu");
const items = () => Array.from(document.querySelectorAll<HTMLElement>('.cui-dropdown-menu [role^="menuitem"]'));
const escape = () => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

function mountDropdown(opts: { trigger?: () => VNode | VNode[]; menu?: () => VNode[]; props?: Record<string, unknown> } = {}) {
  wrapper = mount(CuiDropdown, {
    attachTo: document.body,
    props: opts.props,
    slots: {
      default: () => [
        h(CuiDropdownTrigger, opts.trigger ?? (() => h("button", { id: "btn" }, "Menu"))),
        h(CuiDropdownMenu, opts.menu ?? (() => [h(CuiDropdownItem, () => "One"), h(CuiDropdownItem, () => "Two")])),
      ],
    },
  });
  return wrapper;
}

const button = () => document.getElementById("btn")!;

describe("CuiDropdownTrigger menu-button semantics", () => {
  it("puts aria-haspopup, aria-expanded and aria-controls on the slotted button, not the wrapper", async () => {
    mountDropdown();
    const wrap = document.querySelector(".cui-dropdown-trigger")!;
    expect(button().getAttribute("aria-haspopup")).toBe("menu");
    expect(button().getAttribute("aria-expanded")).toBe("false");
    expect(button().hasAttribute("aria-controls")).toBe(false);
    expect(wrap.hasAttribute("aria-haspopup")).toBe(false);
    expect(wrap.hasAttribute("tabindex")).toBe(false);

    button().click();
    await nextTick();
    expect(button().getAttribute("aria-expanded")).toBe("true");
    expect(button().getAttribute("aria-controls")).toBe(menu()!.id);
    expect(menu()!.id).not.toBe("");
  });

  it("reaches a CuiButton's own <button> through its attrs", async () => {
    mountDropdown({ trigger: () => h(CuiButton, { id: "btn" }, () => "Menu") });
    expect(button().tagName).toBe("BUTTON");
    expect(button().getAttribute("aria-haspopup")).toBe("menu");
  });

  it("ArrowDown opens and focuses the first item; ArrowUp the last", async () => {
    vi.useFakeTimers();
    mountDropdown();
    button().focus();
    button().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(items()[0]);

    escape();
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(menu()).toBeNull();

    button().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(items().at(-1));
  });

  it("Enter and Space toggle a child that the browser would not click itself", async () => {
    mountDropdown({ trigger: () => h("div", { id: "btn", tabindex: 0 }, "Menu") });
    button().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    await nextTick();
    expect(menu()).not.toBeNull();
  });

  it("leaves Enter on a <button> to the browser's own click, so it doesn't toggle twice", async () => {
    mountDropdown();
    const e = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    button().dispatchEvent(e);
    await nextTick();
    expect(e.defaultPrevented).toBe(false);
    expect(menu()).toBeNull();
  });

  it("warns when the slot is not a single element", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mountDropdown({ trigger: () => [h("button", "A"), h("button", "B")] });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("CuiDropdownTrigger"));
    warn.mockRestore();
  });
});

describe("CuiDropdown focus", () => {
  it("focuses a check item when it is the first item", async () => {
    mountDropdown({
      menu: () => [h(CuiDropdownCheckItem, { modelValue: false }, () => "Bold"), h(CuiDropdownItem, () => "Other")],
    });
    button().click();
    await nextTick();
    await nextTick();
    expect(document.activeElement?.getAttribute("role")).toBe("menuitemcheckbox");
  });

  it("Escape closes the menu and returns focus to the trigger", async () => {
    mountDropdown();
    button().click();
    await nextTick();
    await nextTick();
    expect(menu()!.contains(document.activeElement)).toBe(true);

    escape();
    expect(document.activeElement).toBe(button());
  });

  it("choosing an item returns focus to the trigger", async () => {
    mountDropdown();
    button().click();
    await nextTick();
    await nextTick();
    items()[1].click();
    expect(document.activeElement).toBe(button());
  });

  it("leaves focus alone when it is already outside the menu", async () => {
    mountDropdown();
    const outside = document.body.appendChild(document.createElement("input"));
    button().click();
    await nextTick();
    outside.focus();
    (wrapper!.vm as unknown as { close: () => void }).close();
    expect(document.activeElement).toBe(outside);
  });

  it("a hover-focus dropdown does not reopen when focus comes back to its trigger", async () => {
    vi.useFakeTimers();
    mountDropdown({ props: { trigger: "hover-focus" } });
    button().focus(); // focusin opens it
    await nextTick();
    await nextTick();
    expect(menu()!.contains(document.activeElement)).toBe(true);
    // Focus moving into its own menu is not focus leaving.
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(menu()).not.toBeNull();

    escape();
    expect(document.activeElement).toBe(button());
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(menu()).toBeNull();
  });
});

describe("CuiDropdown focus, re-entry and modifiers", () => {
  it("re-opening an open menu by hover or focus leaves focus on the item it is on", async () => {
    vi.useFakeTimers();
    mountDropdown({ props: { trigger: "hover-focus" } });
    button().focus();
    await nextTick();
    await nextTick();
    items()[1].focus();
    document.querySelector(".cui-dropdown")!.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(150);
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(items()[1]);
  });

  it("leaves a modified arrow key alone inside the menu", async () => {
    mountDropdown();
    button().click();
    await nextTick();
    await nextTick();
    const e = new KeyboardEvent("keydown", { key: "ArrowDown", ctrlKey: true, bubbles: true, cancelable: true });
    document.activeElement!.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(items()[0]);
  });

  it("returns focus to the focusable element inside a wrapped trigger", async () => {
    mountDropdown({ trigger: () => h("span", { class: "wrap" }, [h("button", { id: "btn" }, "Menu")]) });
    button().click();
    await nextTick();
    await nextTick();
    escape();
    expect(document.activeElement).toBe(button());
  });
});

describe("CuiContextMenu focus", () => {
  function mountContext(menuItems: () => VNode[] = () => [h(CuiDropdownItem, () => "Rename")]) {
    wrapper = mount(CuiContextMenu, {
      attachTo: document.body,
      slots: { default: () => h("button", { id: "row" }, "row"), menu: menuItems },
    });
    return wrapper;
  }
  const row = () => document.getElementById("row")!;
  const panel = () => document.querySelector<HTMLElement>(".cui-context-menu__panel");

  async function openFromKeyboard() {
    row().focus();
    row().dispatchEvent(new KeyboardEvent("keydown", { key: "F10", shiftKey: true, bubbles: true, cancelable: true }));
    await nextTick();
    await nextTick();
  }

  it("Escape closes it through the layer stack and returns focus to the row", async () => {
    mountContext();
    await openFromKeyboard();
    expect(panel()!.contains(document.activeElement)).toBe(true);

    const e = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    document.activeElement!.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(row());
    await nextTick();
    expect(panel()!.classList.contains("cui-context-menu__panel--closing")).toBe(true);
  });

  it("focuses a check item when it is the first item", async () => {
    mountContext(() => [h(CuiDropdownCheckItem, { modelValue: true }, () => "Pinned")]);
    await openFromKeyboard();
    expect(document.activeElement?.getAttribute("role")).toBe("menuitemcheckbox");
  });
});
