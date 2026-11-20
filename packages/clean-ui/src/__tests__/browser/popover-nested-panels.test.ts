import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { userEvent } from "@vitest/browser/context";
import CuiPopover from "../../components/CuiPopover.vue";
import CuiButton from "../../components/CuiButton.vue";
import CuiDropdown from "../../components/CuiDropdown.vue";
import CuiDropdownTrigger from "../../components/CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../../components/CuiDropdownMenu.vue";
import CuiDropdownItem from "../../components/CuiDropdownItem.vue";
import CuiDropdownSub from "../../components/CuiDropdownSub.vue";
import CuiContextMenu from "../../components/CuiContextMenu.vue";
import preflight from "../../styles/preflight.css?inline";
import { frames, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #552 — a panel opened from inside a click-trigger popover is teleported out of it, so a press
 * in that panel used to count as a press outside the popover and close it. Every panel that
 * takes a layer step says where it is (`useLayerStep`'s `el`), and the popover asks.
 */
describe("a popover stays open for a press in a panel it hosts (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(preflight)));
  afterAll(() => teardown());
  afterEach(cleanup);

  const open = ref(false);

  async function mountPopover() {
    open.value = false;
    const App = defineComponent({
      render: () =>
        h("div", { style: "padding: 40px" }, [
          h(
            CuiPopover,
            { visible: open.value, "onUpdate:visible": (v: boolean) => (open.value = v), width: "20rem" },
            {
              default: () => h(CuiButton, { id: "pop-trigger" }, () => "Popover"),
              content: () => [
                h(CuiDropdown, null, () => [
                  h(CuiDropdownTrigger, null, () => h(CuiButton, { id: "dd-trigger" }, () => "Dropdown")),
                  h(CuiDropdownMenu, null, () => [
                    h(CuiDropdownItem, null, () => "First"),
                    h(CuiDropdownSub, null, { default: () => "More", menu: () => [h(CuiDropdownItem, null, () => "Nested")] }),
                  ]),
                ]),
                h(CuiContextMenu, null, {
                  default: () => h("div", { id: "ctx-target", style: "padding: 8px" }, "Right-click me"),
                  menu: () => [h(CuiDropdownItem, null, () => "Copy")],
                }),
              ],
            },
          ),
        ]),
    });
    track(mount(App, { attachTo: host() }));
    await frames(2);
    await userEvent.click(document.getElementById("pop-trigger")!);
    await frames(12);
    expect(open.value).toBe(true);
  }

  const press = (el: Element) => el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  const menus = () => [...document.querySelectorAll<HTMLElement>("[role='menu']")];

  it("a dropdown menu, and its sub-menu", async () => {
    await mountPopover();
    await userEvent.click(document.getElementById("dd-trigger")!);
    await frames(12);
    expect(menus()).toHaveLength(1);
    press(menus()[0]);
    await frames(4);
    expect(open.value).toBe(true);

    const more = [...menus()[0].querySelectorAll<HTMLElement>("*")].find((e) => e.textContent?.trim() === "More")!;
    await userEvent.click(more);
    await frames(12);
    expect(menus()).toHaveLength(2);
    press(menus()[1]);
    await frames(4);
    expect(open.value).toBe(true);
    expect(menus()).toHaveLength(2);
  });

  it("a context menu", async () => {
    await mountPopover();
    document
      .getElementById("ctx-target")!
      .dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 120, clientY: 120 }));
    await frames(12);
    expect(menus()).toHaveLength(1);
    press(menus()[0]);
    await frames(4);
    expect(open.value).toBe(true);
  });

  it("closes for a press truly outside, with a menu open or not", async () => {
    await mountPopover();
    await userEvent.click(document.getElementById("dd-trigger")!);
    await frames(12);
    expect(menus()).toHaveLength(1);
    press(document.body);
    await frames(15);
    expect(open.value).toBe(false);

    await userEvent.click(document.getElementById("pop-trigger")!);
    await frames(12);
    expect(open.value).toBe(true);
    press(document.body);
    await frames(15);
    expect(open.value).toBe(false);
  });
});
