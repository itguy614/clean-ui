import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import CuiTabs from "../../components/CuiTabs.vue";
import CuiTab from "../../components/CuiTab.vue";
import main from "../../styles/main.css?inline";
import { userEvent } from "@vitest/browser/context";
import { frames, installTokens, mountHosts, settleScroll } from "./helpers";

/**
 * #236 — an overflowing tab bar's only cue was a faint edge fade, and a wheel mouse
 * without a horizontal wheel couldn't reach the trailing tabs at all. The bar now renders
 * through CuiScrollArea with its scroll buttons: one on each side with more tabs, which
 * scrolls the bar when clicked.
 */
describe("CuiTabs scroll buttons (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(main)));
  afterAll(() => teardown());
  afterEach(cleanup);

  const labels = ["Profile", "Digest emails", "Password", "Sign-in methods", "Devices", "Connected apps"];

  function mountTabs(props: Record<string, unknown> = {}, style: Partial<CSSStyleDeclaration> = { width: "300px" }) {
    const active = ref("Profile");
    const wrapper = track(
      mount(
        defineComponent({
          setup: () => () =>
            h(
              CuiTabs,
              { modelValue: active.value, "onUpdate:modelValue": (v: string) => (active.value = v), ...props },
              () => labels.map((label) => h(CuiTab, { value: label, label }, () => label)),
            ),
        }),
        { attachTo: host(style) },
      ),
    );
    const root = wrapper.element as HTMLElement;
    const scroller = root.querySelector<HTMLElement>(".cui-scroll-area__scroller")!;
    const button = (edge: "start" | "end") => root.querySelector<HTMLButtonElement>(`.cui-scroll-area__edge--${edge} button`)!;
    const showing = (edge: "start" | "end") => !button(edge).parentElement!.classList.contains("cui-scroll-area__edge--hidden");
    return { root, scroller, button, showing };
  }


  it("shows the end button on an overflowing bar, and reveals more tabs when clicked", async () => {
    const { scroller, button, showing } = mountTabs();
    await frames(3);
    expect(showing("start")).toBe(false);
    expect(showing("end")).toBe(true);
    button("end").click();
    await settleScroll(scroller);
    expect(scroller.scrollLeft).toBeGreaterThan(scroller.clientWidth / 2);
    expect(showing("start"), "now there's more before").toBe(true);
  });

  it("shows no buttons when every tab fits", async () => {
    const { showing } = mountTabs({}, { width: "1200px" });
    await frames(3);
    expect(showing("start")).toBe(false);
    expect(showing("end")).toBe(false);
  });

  it("covers the bar's full height with an opaque button", async () => {
    const { scroller, button } = mountTabs();
    await frames(3);
    const b = button("end").getBoundingClientRect();
    const s = scroller.getBoundingClientRect();
    expect(b.height).toBeCloseTo(s.height, 0);
    expect(getComputedStyle(button("end")).backgroundColor).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  });

  it("puts the end button on the left in a right-to-left page, scrolling toward the end", async () => {
    const { scroller, button } = mountTabs({}, { width: "300px", direction: "rtl" });
    await frames(3);
    const end = button("end").getBoundingClientRect();
    expect(end.left).toBeLessThan(scroller.getBoundingClientRect().left + 40);
    button("end").click();
    await settleScroll(scroller);
    // Negative in a right-to-left scroller: further along is further below zero.
    expect(scroller.scrollLeft).toBeLessThan(-scroller.clientWidth / 2);
  });

  it("scrolls a vertical bar down from its bottom button", async () => {
    // A vertical bar scrolls once the tabs component has a bounded height.
    const { scroller, button, showing } = mountTabs({ orientation: "vertical", style: "height: 120px" });
    await frames(3);
    expect(showing("end")).toBe(true);
    const b = button("end").getBoundingClientRect();
    expect(b.bottom).toBeCloseTo(scroller.getBoundingClientRect().bottom, 0);
    button("end").click();
    await settleScroll(scroller);
    expect(scroller.scrollTop).toBeGreaterThan(0);
  });

  it("takes its paint from --cui-tabs-scroll-button-* on a container", async () => {
    const { root, button } = mountTabs();
    const container = root.parentElement!;
    container.style.setProperty("--cui-tabs-scroll-button-bg", "rgb(10, 20, 30)");
    container.style.setProperty("--cui-tabs-scroll-button-size", "40px");
    await frames(3);
    expect(getComputedStyle(button("end")).backgroundColor).toBe("rgb(10, 20, 30)");
    expect(button("end").getBoundingClientRect().width).toBeCloseTo(40, 0);
  });

  // A click on a scroll button mustn't take focus: it would sit inside aria-hidden, and
  // the tablist's arrow keys would stop working.
  it("leaves focus on the tab when a scroll button is clicked", async () => {
    const { root, scroller, button } = mountTabs();
    await frames(3);
    const profile = root.querySelector<HTMLElement>('[data-cui-tab-value="Profile"]')!;
    profile.focus();
    await userEvent.click(button("end"));
    await settleScroll(scroller);
    expect(document.activeElement).toBe(profile);
    await userEvent.keyboard("{ArrowRight}");
    expect(root.querySelector('[aria-selected="true"]')?.textContent).toContain("Digest emails");
  });

  // #289 — the shared index maths reads the bar's direction: ArrowLeft goes on to the
  // next tab in a right-to-left page, the way the bar reads.
  it("moves to the next tab with ArrowLeft in a right-to-left page", async () => {
    const { root } = mountTabs({}, { width: "1200px", direction: "rtl" });
    await frames(2);
    const tab = (label: string) => root.querySelector<HTMLElement>(`[data-cui-tab-value="${label}"]`)!;
    tab("Profile").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(tab("Digest emails"));
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tab("Profile"));
  });
});
