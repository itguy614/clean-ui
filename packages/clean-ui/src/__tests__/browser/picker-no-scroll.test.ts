import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import CuiDatePicker from "../../components/CuiDatePicker.vue";
import CuiTimePicker from "../../components/CuiTimePicker.vue";
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
