import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h } from "vue";
import CuiContextMenu from "../CuiContextMenu.vue";
import CuiDropdownItem from "../CuiDropdownItem.vue";

/**
 * #60 — the menu could only be summoned by the native `contextmenu` event, and
 * `positionAtCursor` was private, so a consumer wiring their own gesture had to
 * dispatch a synthetic MouseEvent at a private code path. On touch that made
 * context actions effectively unreachable; by keyboard they were unreachable
 * outright, since nothing opened the menu without a pointer.
 */
function mountMenu(props: Record<string, unknown> = {}) {
  return mount(CuiContextMenu, {
    attachTo: document.body,
    props,
    slots: {
      default: () => h("button", { id: "target" }, "target"),
      menu: () => h(CuiDropdownItem, () => "Rename"),
    },
  });
}

const panel = () => document.querySelector(".cui-context-menu__panel");
const exposed = (w: VueWrapper) =>
  w.vm as unknown as { openAt: (x: number, y: number) => void; close: () => void; isOpen: boolean };

describe("CuiContextMenu triggers", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  describe("openAt", () => {
    it("opens the menu at the coordinates it is given", async () => {
      wrapper = mountMenu();
      exposed(wrapper).openAt(120, 240);
      await wrapper.vm.$nextTick();

      expect(panel()).toBeTruthy();
      expect(wrapper.emitted("open")![0]).toEqual([120, 240]);
    });

    it("does nothing when disabled", async () => {
      wrapper = mountMenu({ disabled: true });
      exposed(wrapper).openAt(10, 10);
      await wrapper.vm.$nextTick();

      expect(panel()).toBeNull();
      expect(wrapper.emitted("open")).toBeUndefined();
    });

    it("re-opening while open does not leave the panel animating out", async () => {
      wrapper = mountMenu();
      exposed(wrapper).openAt(10, 10);
      await wrapper.vm.$nextTick();
      exposed(wrapper).openAt(200, 200);
      await wrapper.vm.$nextTick();

      expect(document.querySelectorAll(".cui-context-menu__panel")).toHaveLength(1);
      expect(panel()!.classList.contains("cui-context-menu__panel--closing")).toBe(false);
      expect(wrapper.emitted("open")).toHaveLength(2);
    });
  });

  describe("keyboard", () => {
    // Shift+F10 and the dedicated Menu key are the platform conventions. The
    // menu opens at the focused element, as the platform does, rather than at a
    // cursor that keyboard users do not have.
    it.each([
      ["the Menu key", { key: "ContextMenu" }],
      ["Shift+F10", { key: "F10", shiftKey: true }],
    ])("opens on %s", async (_label, init) => {
      wrapper = mountMenu();
      await wrapper.find("#target").trigger("keydown", init);

      expect(panel()).toBeTruthy();
      expect(wrapper.emitted("open")).toHaveLength(1);
    });

    it("positions at the focused element, not at the origin", async () => {
      wrapper = mountMenu();
      const target = wrapper.find("#target").element;
      target.getBoundingClientRect = () =>
        ({ left: 40, bottom: 90, top: 70, right: 140, width: 100, height: 20, x: 40, y: 70 }) as DOMRect;

      await wrapper.find("#target").trigger("keydown", { key: "ContextMenu" });
      expect(wrapper.emitted("open")![0]).toEqual([40, 90]);
    });

    it("ignores F10 without shift, and other keys", async () => {
      wrapper = mountMenu();
      await wrapper.find("#target").trigger("keydown", { key: "F10" });
      await wrapper.find("#target").trigger("keydown", { key: "a" });

      expect(panel()).toBeNull();
    });

    it("does not open when disabled", async () => {
      wrapper = mountMenu({ disabled: true });
      await wrapper.find("#target").trigger("keydown", { key: "ContextMenu" });

      expect(panel()).toBeNull();
    });
  });

  describe("trigger prop", () => {
    it("responds to contextmenu by default", async () => {
      wrapper = mountMenu();
      await wrapper.find(".cui-context-menu").trigger("contextmenu", { clientX: 5, clientY: 6 });

      expect(panel()).toBeTruthy();
      expect(wrapper.emitted("open")![0]).toEqual([5, 6]);
    });

    it("ignores contextmenu when the trigger is longpress only", async () => {
      wrapper = mountMenu({ trigger: "longpress" });
      await wrapper.find(".cui-context-menu").trigger("contextmenu", { clientX: 5, clientY: 6 });

      expect(panel()).toBeNull();
    });

    it("marks the wrapper only when long-press is enabled", () => {
      // The class carries the touch-callout / user-select suppression, which
      // has to be in place before a hold starts — so it must not be applied to
      // consumers who never asked for long-press.
      for (const [trigger, expected] of [
        ["contextmenu", false],
        ["longpress", true],
        ["auto", true],
      ] as const) {
        const w = mountMenu({ trigger });
        expect(
          w.find(".cui-context-menu").classes().includes("cui-context-menu--longpress"),
          `trigger=${trigger}`,
        ).toBe(expected);
        w.unmount();
      }
    });
  });

  it("emits close", async () => {
    wrapper = mountMenu();
    exposed(wrapper).openAt(10, 10);
    await wrapper.vm.$nextTick();
    exposed(wrapper).close();

    expect(wrapper.emitted("close")).toHaveLength(1);
  });
});
