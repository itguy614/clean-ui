import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, ref } from "vue";
import CuiContextMenu from "../../components/CuiContextMenu.vue";
import CuiDropdownItem from "../../components/CuiDropdownItem.vue";

// #60 — long-press is the touch route to a context menu. Real Chromium,
// because jsdom has no `PointerEvent` at all, so the gesture cannot be
// expressed there, let alone its timing.
describe("CuiContextMenu long press (real browser)", () => {
  let wrapper: VueWrapper | undefined;
  const clicks = ref(0);

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    clicks.value = 0;
  });

  const DELAY = 80; // keep the suite quick; the prop is what's under test

  function mountMenu(props: Record<string, unknown> = {}) {
    clicks.value = 0;
    wrapper = mount(CuiContextMenu, {
      attachTo: document.body,
      props: { trigger: "longpress", longPressDelay: DELAY, ...props },
      slots: {
        default: () => h("button", { id: "target", onClick: () => clicks.value++ }, "target"),
        menu: () => h(CuiDropdownItem, () => "Rename"),
      },
    });
    return document.querySelector<HTMLElement>("#target")!;
  }

  const panel = () => document.querySelector(".cui-context-menu__panel");
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  function press(el: HTMLElement, type: string, x = 50, y = 60, pointerType = "touch") {
    el.dispatchEvent(
      new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType, pointerId: 1 }),
    );
  }

  it("opens after the hold elapses", async () => {
    const target = mountMenu();
    press(target, "pointerdown");
    expect(panel(), "must not open before the delay").toBeNull();

    await wait(DELAY + 40);
    expect(panel()).toBeTruthy();
    expect(wrapper!.emitted("open")![0]).toEqual([50, 60]);
  });

  it("a quick tap does not open it", async () => {
    const target = mountMenu();
    press(target, "pointerdown");
    press(target, "pointerup");
    await wait(DELAY + 40);

    expect(panel()).toBeNull();
  });

  it("moving beyond the tolerance cancels the hold — a drag is not a press", async () => {
    const target = mountMenu({ longPressTolerance: 10 });
    press(target, "pointerdown", 50, 60);
    press(target, "pointermove", 50, 90);
    await wait(DELAY + 40);

    expect(panel()).toBeNull();
  });

  it("small jitter within the tolerance still opens", async () => {
    const target = mountMenu({ longPressTolerance: 10 });
    press(target, "pointerdown", 50, 60);
    press(target, "pointermove", 52, 63);
    await wait(DELAY + 40);

    expect(panel()).toBeTruthy();
  });

  it("swallows the click the gesture produces, so the target is not activated", async () => {
    const target = mountMenu();
    press(target, "pointerdown");
    await wait(DELAY + 40);
    expect(panel()).toBeTruthy();

    // The platform still delivers a click from the same press.
    target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(clicks.value, "the press opened a menu; it must not also activate the target").toBe(0);

    // ...but only that one. A later, genuine tap works normally.
    target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(clicks.value).toBe(1);
  });

  it("does not double-open when the platform also fires contextmenu", async () => {
    // Android synthesises `contextmenu` after its own long press. With
    // trigger="auto" both routes are live, so the second must be swallowed.
    const target = mountMenu({ trigger: "auto" });
    press(target, "pointerdown");
    await wait(DELAY + 40);

    target.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 50, clientY: 60 }));
    await wait(20);

    expect(wrapper!.emitted("open")).toHaveLength(1);
    expect(document.querySelectorAll(".cui-context-menu__panel")).toHaveLength(1);
  });

  it("ignores a held mouse button — that is what contextmenu is for", async () => {
    const target = mountMenu({ trigger: "auto" });
    press(target, "pointerdown", 50, 60, "mouse");
    await wait(DELAY + 40);

    expect(panel()).toBeNull();
  });

  it("does not arm at all when the trigger is contextmenu only", async () => {
    const target = mountMenu({ trigger: "contextmenu" });
    press(target, "pointerdown");
    await wait(DELAY + 40);

    expect(panel()).toBeNull();
  });
});
