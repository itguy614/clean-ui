import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick } from "vue";
import CuiPopover from "../../components/CuiPopover.vue";
import CuiDropdown from "../../components/CuiDropdown.vue";
import CuiDropdownTrigger from "../../components/CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../../components/CuiDropdownMenu.vue";
import CuiDropdownItem from "../../components/CuiDropdownItem.vue";
import CuiButton from "../../components/CuiButton.vue";
import CuiDropdownSub from "../../components/CuiDropdownSub.vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "./helpers";
import { motionDuration } from "../../utils/motion";
import { PANEL_OFFSET } from "../../utils/position";

/**
 * #262 — every floating panel scaled from its centre, so one below its trigger grew outward
 * in every direction. It now grows from the edge facing the trigger, after a flip too, on
 * both positioning paths: Floating UI (usePopover) and computeDropdownPosition.
 */
describe("floating panels grow out of their trigger (real browser)", () => {
  // The motion tokens, so the panels really animate: without them each duration is invalid.
  let removeTokens: () => void;
  beforeAll(() => (removeTokens = installTokens(main)));
  afterAll(() => removeTokens());
  let wrapper: VueWrapper | undefined;
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.getElementById("origin-host")?.remove();
  });

  /** A host pinned to the top or the bottom of the viewport, so the panel opens down or flips up. */
  function host(at: "top" | "bottom") {
    const el = document.createElement("div");
    el.id = "origin-host";
    // Mid-row, so a centred panel fits across: only the vertical side is in question.
    el.style.cssText = `position: fixed; left: 160px; ${at}: 0;`;
    document.body.append(el);
    return el;
  }

  const frames = async () => {
    for (let i = 0; i < 3; i++) {
      await nextTick();
      await new Promise((r) => requestAnimationFrame(r));
    }
  };

  /** The panel's computed vertical origin: 0 at its top edge, its height at the bottom. */
  function originY(panel: HTMLElement) {
    return parseFloat(getComputedStyle(panel).transformOrigin.split(" ")[1]);
  }

  it.each([
    ["top", "center top", "opens below and grows from its top"],
    ["bottom", "center bottom", "flips above and grows from its bottom"],
  ] as const)("a Floating UI panel at the %s %s", async (at, origin) => {
    wrapper = mount(CuiPopover, {
      props: { placement: "bottom", title: "Panel" },
      slots: { default: () => h(CuiButton, () => "Trigger"), content: () => "Popover content" },
      attachTo: host(at),
    });
    await wrapper.find(".cui-button").trigger("click");
    await frames();
    const panel = document.querySelector<HTMLElement>(".cui-popover__panel")!;
    expect(panel.style.getPropertyValue("--_popover-transform-origin")).toBe(origin);
    expect(originY(panel)).toBeCloseTo(at === "top" ? 0 : panel.offsetHeight, 0);
  });

  it.each([
    ["top", "left top"],
    ["bottom", "left bottom"],
  ] as const)("a dropdown menu at the %s grows from %s", async (at, origin) => {
    wrapper = mount(
      {
        render: () =>
          h(CuiDropdown, null, () => [
            h(CuiDropdownTrigger, null, () => h(CuiButton, () => "Menu")),
            h(CuiDropdownMenu, null, () => Array.from({ length: 6 }, (_, i) => h(CuiDropdownItem, null, () => `Item ${i}`))),
          ]),
      },
      { attachTo: host(at) },
    );
    await wrapper.find(".cui-button").trigger("click");
    await frames();
    const panel = document.querySelector<HTMLElement>(".cui-dropdown-menu")!;
    expect(panel.style.getPropertyValue("--_dropdown-menu-transform-origin")).toBe(origin);
    expect(originY(panel)).toBeCloseTo(at === "top" ? 0 : panel.offsetHeight, 0);
  });

  it("keeps a shifted Floating UI panel's origin over its trigger", async () => {
    // Nearly as wide as the viewport, so no side fits whole (flip() would otherwise move it
    // beside the trigger) and shift() slides it right instead: its origin moves back by as
    // much, so it still grows from under the trigger.
    const el = host("top");
    el.style.left = "0px";
    wrapper = mount(CuiPopover, {
      props: { placement: "bottom", title: "Panel", width: "400px" },
      slots: { default: () => h(CuiButton, () => "Trigger"), content: () => "Popover content" },
      attachTo: el,
    });
    await wrapper.find(".cui-button").trigger("click");
    await frames();
    const panel = document.querySelector<HTMLElement>(".cui-popover__panel")!;
    // Measured once it has finished scaling in: mid-animation its rect is the shrunken one.
    await Promise.all(panel.getAnimations().map((a) => a.finished));
    const trigger = el.querySelector<HTMLElement>(".cui-button")!.getBoundingClientRect();
    expect(panel.style.getPropertyValue("--_popover-transform-origin")).toMatch(/^clamp\(/);
    const originX = parseFloat(getComputedStyle(panel).transformOrigin.split(" ")[0]);
    expect(panel.getBoundingClientRect().left + originX).toBeCloseTo(trigger.left + trigger.width / 2, 0);
  });

  it("places a sub-menu opened while its parent scales in beside its row, not the shrunken one", async () => {
    wrapper = mount(
      {
        render: () =>
          h(CuiDropdown, null, () => [
            h(CuiDropdownTrigger, null, () => h(CuiButton, () => "Menu")),
            h(CuiDropdownMenu, null, () => [
              h(CuiDropdownItem, null, () => "First"),
              h(CuiDropdownSub, null, { default: () => "More", menu: () => [h(CuiDropdownItem, null, () => "Nested")] }),
            ]),
          ]),
      },
      { attachTo: host("top") },
    );
    // At the left edge, so the sub-menu has room to open to the right in a narrow viewport.
    document.getElementById("origin-host")!.style.left = "8px";
    await wrapper.find(".cui-button").trigger("click");
    await frames();
    // Partway into the parent's scale-in, so its rows are still shrunken.
    await new Promise((r) => setTimeout(r, 40));
    expect(document.querySelector<HTMLElement>(".cui-dropdown-menu")!.getAnimations().length).toBeGreaterThan(0);
    document.querySelector<HTMLElement>(".cui-dropdown-sub__trigger")!.click();
    await new Promise((r) => setTimeout(r, motionDuration("base") + 250));
    await frames();
    const row = document.querySelector<HTMLElement>(".cui-dropdown-sub__trigger")!.getBoundingClientRect();
    const sub = document.querySelector<HTMLElement>(".cui-dropdown-sub__menu")!.getBoundingClientRect();
    expect(Math.abs(sub.left - (row.right + PANEL_OFFSET))).toBeLessThan(1);
    expect(Math.abs(sub.top - row.top)).toBeLessThan(1);
  });
});
