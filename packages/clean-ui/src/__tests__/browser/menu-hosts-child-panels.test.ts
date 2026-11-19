import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, type VNode } from "vue";
import { userEvent } from "@vitest/browser/context";
import CuiPopover from "../../components/CuiPopover.vue";
import CuiSelect from "../../components/CuiSelect.vue";
import CuiCombobox from "../../components/CuiCombobox.vue";
import CuiButton from "../../components/CuiButton.vue";
import CuiDropdown from "../../components/CuiDropdown.vue";
import CuiDropdownTrigger from "../../components/CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../../components/CuiDropdownMenu.vue";
import CuiDropdownSub from "../../components/CuiDropdownSub.vue";
import CuiContextMenu from "../../components/CuiContextMenu.vue";
import preflight from "../../styles/preflight.css?inline";
import { frames, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #569 — the reverse of #552: a popover, select or combobox opened from inside a dropdown menu
 * or a context menu is teleported out of it, so a press in its panel used to count as a press
 * outside the menu and close it. A panel that takes a layer step says where it is, and the menu
 * (the host) asks `layerStep.hosts`, the same way for every host.
 */
const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

const CHILDREN: Record<string, { node: () => VNode; panel: string }> = {
  popover: {
    node: () =>
      h(
        CuiPopover,
        { width: "12rem" },
        { default: () => h(CuiButton, null, () => "Child"), content: () => h("div", { id: "child-body" }, "Body") },
      ),
    panel: "[role='dialog']",
  },
  select: { node: () => h(CuiSelect, { options, modelValue: "a" }), panel: "[role='listbox']" },
  combobox: { node: () => h(CuiCombobox, { options, modelValue: "a" }), panel: "[role='listbox']" },
};

describe("a menu stays open for a press in a panel it hosts (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(preflight)));
  afterAll(() => teardown());
  afterEach(cleanup);

  const press = (el: Element) => el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  const menus = () => [...document.querySelectorAll<HTMLElement>("[role='menu']")];

  async function mountHost(kind: "dropdown" | "context", child: () => VNode, inSub = false) {
    const content = () => [h("div", { id: "child" }, [child()])];
    const App = defineComponent({
      render: () =>
        h("div", { style: "padding: 40px" }, [
          kind === "dropdown"
            ? h(CuiDropdown, null, () => [
                h(CuiDropdownTrigger, null, () => h(CuiButton, { id: "host-trigger" }, () => "Menu")),
                h(CuiDropdownMenu, null, () =>
                  inSub ? [h(CuiDropdownSub, null, { default: () => "More", menu: () => content() })] : content(),
                ),
              ])
            : h(CuiContextMenu, null, {
                default: () => h("div", { id: "host-trigger", style: "padding: 8px" }, "Right-click me"),
                menu: content,
              }),
        ]),
    });
    track(mount(App, { attachTo: host() }));
    await frames(2);
    const trigger = document.getElementById("host-trigger")!;
    if (kind === "dropdown") await userEvent.click(trigger);
    else trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 120, clientY: 120 }));
    await frames(12);
    if (inSub) {
      const more = [...menus()[0].querySelectorAll<HTMLElement>("*")].find((e) => e.textContent?.trim() === "More")!;
      await userEvent.click(more);
      await frames(12);
    }
    expect(menus()).toHaveLength(inSub ? 2 : 1);
  }

  async function openChild() {
    await userEvent.click(document.querySelector<HTMLElement>("#child button, #child input, #child [role='combobox']")!);
    await frames(12);
  }

  for (const kind of ["dropdown", "context"] as const) {
    for (const [name, spec] of Object.entries(CHILDREN)) {
      it(`${name} opened from a ${kind} menu: a press inside it leaves both open; outside closes both`, async () => {
        await mountHost(kind, spec.node);
        await openChild();
        const panel = document.querySelector<HTMLElement>(spec.panel)!;
        expect(panel).toBeTruthy();
        press(panel);
        await frames(6);
        expect(document.querySelector(spec.panel)).toBeTruthy();
        expect(menus()).toHaveLength(1);

        press(document.body);
        await frames(15);
        expect(menus()).toHaveLength(0);
        expect(document.querySelector(spec.panel)).toBeNull();
      });
    }
  }

  it("a popover opened from a sub-menu of a dropdown menu keeps the whole stack open", async () => {
    await mountHost("dropdown", CHILDREN.popover.node, true);
    await openChild();
    press(document.getElementById("child-body")!);
    await frames(6);
    expect(menus()).toHaveLength(2);
    expect(document.querySelector("[role='dialog']")).toBeTruthy();
  });

  it("Escape closes the innermost layer first, leaving the menu open", async () => {
    await mountHost("dropdown", CHILDREN.popover.node);
    await openChild();
    expect(document.querySelector("[role='dialog']")).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    await frames(15);
    expect(document.querySelector("[role='dialog']")).toBeNull();
    expect(menus()).toHaveLength(1);
    await userEvent.keyboard("{Escape}");
    await frames(15);
    expect(menus()).toHaveLength(0);
  });
});
