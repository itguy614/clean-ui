import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { h, nextTick } from "vue";
import CuiButton from "../../components/CuiButton.vue";
import CuiContextMenu from "../../components/CuiContextMenu.vue";
import CuiDropdownItem from "../../components/CuiDropdownItem.vue";
import CuiList from "../../components/CuiList.vue";
import CuiListItem from "../../components/CuiListItem.vue";
import { frames, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #396 and #422. Focus, the tab order, real keyboard activation and hit testing
 * (`pointer-events`) are all things jsdom doesn't model, so a real browser.
 */
describe("CuiButton focusableWhenDisabled (real browser, #396)", () => {
  const { host, track, cleanup } = mountHosts();
  afterEach(cleanup);

  function render(props: Record<string, unknown>) {
    const el = host({});
    const before = document.createElement("button");
    before.textContent = "Before";
    el.append(before);
    const wrapper = track(mount(CuiButton, { props, slots: { default: "Switch" }, attachTo: el }));
    return { wrapper, before, button: wrapper.element as HTMLButtonElement };
  }

  it("keeps focus when it becomes disabled under the keyboard", async () => {
    const { wrapper, button } = render({ focusableWhenDisabled: true });
    button.focus();
    await wrapper.setProps({ disabled: true });
    expect(document.activeElement).toBe(button);
  });

  it("stays in the tab order while disabled", async () => {
    const { before, button } = render({ focusableWhenDisabled: true, loading: true });
    before.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(button);
  });

  it("does nothing on a click, Enter or Space", async () => {
    const { wrapper, button } = render({ focusableWhenDisabled: true, disabled: true });
    await userEvent.click(button, { force: true });
    button.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(wrapper.emitted("click")).toBeUndefined();
  });

  it("is hit by the pointer, so a wrapping CuiContextMenu still opens", async () => {
    const el = host({});
    track(
      mount(CuiContextMenu, {
        attachTo: el,
        slots: {
          default: () => h(CuiButton, { focusableWhenDisabled: true, disabled: true, id: "busy" }, () => "Busy"),
          menu: () => h(CuiDropdownItem, () => "Pin"),
        },
      }),
    );
    const button = document.getElementById("busy")!;
    // `pointer-events: none` (the rule written for disabled links) would send the right-click
    // to whatever is underneath, which may or may not be inside the menu's trigger area.
    expect(getComputedStyle(button).pointerEvents).not.toBe("none");
    const targets: EventTarget[] = [];
    document.addEventListener("contextmenu", (e) => targets.push(e.target!), { capture: true, once: true });
    await userEvent.click(button, { button: "right", force: true });
    await frames(15);
    expect(targets.length === 1 && button.contains(targets[0] as Node)).toBe(true);
    expect(document.querySelector(".cui-context-menu__panel")).not.toBeNull();
  });

  it("without the prop, is natively disabled and leaves the tab order", async () => {
    const { before, button } = render({ disabled: true });
    expect(button.disabled).toBe(true);
    before.focus();
    await userEvent.tab();
    expect(document.activeElement).not.toBe(button);
  });
});

describe("a disabled link can't be focused or followed (real browser, #422)", () => {
  const { host, track, cleanup } = mountHosts();
  afterEach(cleanup);

  function expectDead(link: HTMLElement) {
    expect(link.tagName).toBe("A");
    expect(link.hasAttribute("href")).toBe(false);
    link.focus();
    expect(document.activeElement).not.toBe(link);
  }

  async function expectNotFollowed(link: HTMLElement) {
    const before = location.href;
    await userEvent.click(link, { force: true });
    await nextTick();
    expect(location.href).toBe(before);
  }

  it("CuiButton", async () => {
    const wrapper = track(mount(CuiButton, { props: { href: "#followed", disabled: true }, slots: { default: "Go" }, attachTo: host({}) }));
    const link = wrapper.element as HTMLElement;
    expectDead(link);
    await expectNotFollowed(link);
  });

  it("CuiListItem", async () => {
    track(
      mount(CuiList, {
        attachTo: host({}),
        slots: { default: () => h(CuiListItem, { href: "#followed", disabled: true, title: "Go" }) },
      }),
    );
    const link = document.querySelector<HTMLElement>(".cui-list-item__row")!;
    expectDead(link);
    await expectNotFollowed(link);
  });
});
