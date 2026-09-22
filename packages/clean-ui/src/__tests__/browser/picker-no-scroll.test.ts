import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import CuiDatePicker from "../../components/CuiDatePicker.vue";
import CuiTimePicker from "../../components/CuiTimePicker.vue";
import CuiDateRangePicker from "../../components/CuiDateRangePicker.vue";
import { frames } from "./helpers";

/**
 * #112 follow-up. Making the popover panel focusable (`opacity: 0` instead of
 * `visibility: hidden`) meant `focus()` started actually doing something — and
 * focusing an element scrolls it into view. The panel is still at the origin
 * when focus lands, so opening a picker part-way down a page yanked the whole
 * page to the top.
 *
 * `visibility: hidden` had masked this: the focus call was a silent no-op, so
 * there was nothing to scroll to. Every focus in the picker path now passes
 * `{ preventScroll: true }` — the panel opens beside a trigger the user is
 * already looking at, so there is nothing to scroll to in the first place.
 */
describe("pickers do not scroll the page when opened (real browser)", () => {
  let wrapper: VueWrapper | undefined;
  let spacer: HTMLElement | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    spacer?.remove();
    spacer = undefined;
    window.scrollTo(0, 0);
  });

  /** A tall page, scrolled down, with the field in view near the bottom. */
  function tallScrolledPage() {
    spacer = document.createElement("div");
    spacer.style.cssText = "height: 3000px; padding-top: 1500px;";
    document.body.append(spacer);
    const host = document.createElement("div");
    spacer.append(host);
    window.scrollTo(0, 1400);
    return host;
  }

  it("CuiDatePicker keeps the scroll position when opened by keyboard", async () => {
    const host = tallScrolledPage();
    wrapper = mount(CuiDatePicker, { attachTo: host, props: { modelValue: "2026-03-15" } });
    await frames(2);

    const before = window.scrollY;
    expect(before, "fixture must actually be scrolled").toBeGreaterThan(1000);

    (wrapper.find("input").element as HTMLInputElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    await frames(12);

    expect(document.querySelector('[role="grid"]'), "panel should be open").toBeTruthy();
    expect(window.scrollY, "opening the calendar must not scroll the page").toBe(before);
  });

  it("CuiDatePicker keeps the scroll position on close", async () => {
    const host = tallScrolledPage();
    wrapper = mount(CuiDatePicker, { attachTo: host, props: { modelValue: "2026-03-15" } });
    await frames(2);
    (wrapper.find("input").element as HTMLInputElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    await frames(12);

    const before = window.scrollY;
    await userEvent.keyboard("{Escape}");
    await frames(8);

    expect(window.scrollY).toBe(before);
  });

it("CuiDateRangePicker keeps the scroll position when opened", async () => {
    const host = tallScrolledPage();
    wrapper = mount(CuiDateRangePicker, {
      attachTo: host,
      props: { modelValue: { start: "2026-03-10", end: "2026-03-20" } },
    });
    await frames(2);

    const before = window.scrollY;
    expect(before).toBeGreaterThan(1000);

    await userEvent.click(wrapper.find("input").element);
    await frames(14);

    expect(document.querySelector('[role="grid"]')).toBeTruthy();
    expect(window.scrollY).toBe(before);
  });

  describe("inside a scrolling container, as the docs shell uses", () => {
    // apps/docs/src/App.vue scrolls its main region with `overflowY: auto`
    // rather than scrolling the window, and that is the shape a real consumer
    // sits in.
    //
    // These hold today for a reason worth stating: the panel is teleported to
    // <body>, so it is not inside the container at all and focusing it cannot
    // scroll one — unlike the window cases above, they do NOT fail if
    // `preventScroll` is removed. They pin the arrangement rather than the
    // fix: they would catch the panel being teleported somewhere else, or a
    // `scrollIntoView` creeping in on the trigger.
    let box: HTMLElement | undefined;

    afterEach(() => {
      box?.remove();
      box = undefined;
    });

    function scrollingContainer() {
      box = document.createElement("div");
      box.style.cssText = "height: 400px; overflow-y: auto;";
      const inner = document.createElement("div");
      inner.style.cssText = "height: 2000px; padding-top: 900px;";
      const host = document.createElement("div");
      inner.append(host);
      box.append(inner);
      document.body.append(box);
      box.scrollTop = 800;
      return host;
    }

    it.each([
      ["CuiDatePicker", CuiDatePicker, { modelValue: "2026-03-15" }, "input"],
      ["CuiDateRangePicker", CuiDateRangePicker, { modelValue: { start: "2026-03-10", end: "2026-03-20" } }, "input"],
      ["CuiTimePicker", CuiTimePicker, { modelValue: "09:30", format: "24" }, ".cui-time-picker__trigger"],
    ])("%s does not scroll its container", async (_name, component, props, trigger) => {
      const host = scrollingContainer();
      wrapper = mount(component as never, { attachTo: host, props: props as never });
      await frames(2);

      const before = box!.scrollTop;
      expect(before).toBe(800);

      await userEvent.click(wrapper.find(trigger).element);
      await frames(14);

      expect(box!.scrollTop, "opening must not scroll the container either").toBe(before);
    });
  });

  it("CuiTimePicker keeps the scroll position when opened", async () => {
    const host = tallScrolledPage();
    wrapper = mount(CuiTimePicker, { attachTo: host, props: { modelValue: "09:30", format: "24" } });
    await frames(2);

    const before = window.scrollY;
    expect(before).toBeGreaterThan(1000);

    (wrapper.find(".cui-time-picker__trigger").element as HTMLElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    await frames(12);

    expect(document.querySelector(".cui-time-picker__panel")).toBeTruthy();
    expect(window.scrollY).toBe(before);
  });

  it("CuiTimePicker keeps the scroll position while moving between fields", async () => {
    const host = tallScrolledPage();
    wrapper = mount(CuiTimePicker, { attachTo: host, props: { modelValue: "09:30", format: "24" } });
    await frames(2);
    (wrapper.find(".cui-time-picker__trigger").element as HTMLElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    await frames(12);

    const before = window.scrollY;
    await userEvent.keyboard("{ArrowRight}");
    await frames(4);

    expect(window.scrollY).toBe(before);
  });
});
