import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { defineComponent, h, nextTick, ref } from "vue";
import CuiTabs from "../../components/CuiTabs.vue";
import CuiTab from "../../components/CuiTab.vue";
import preflight from "../../styles/preflight.css?inline";
import { frames, installTokens, mountHosts, settleScroll } from "./helpers";

/**
 * #235 — arrow-keying to an off-screen tab in an overflowing bar left it partly clipped,
 * focus ring included. Two scrolls fought: the active-tab watcher started a smooth
 * scrollIntoView, then focus() did its own instant one and interrupted it. And even a
 * completed `inline: "nearest"` scroll left the tab flush with the edge, under the fade.
 *
 * Real browser: smooth scrolling, scroll-padding and the resulting geometry are layout,
 * which jsdom does not compute.
 */
describe("CuiTabs brings the active tab fully into view (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(preflight)));
  afterAll(() => teardown());
  afterEach(cleanup);

  const labels = ["Profile", "Digest emails", "Password", "Sign-in methods", "Devices", "Connected apps"];

  function mountTabs(initial = "Profile", into?: HTMLElement) {
    const active = ref(initial);
    const wrapper = track(
      mount(
        defineComponent({
          setup: () => () =>
            h(
              CuiTabs,
              { modelValue: active.value, "onUpdate:modelValue": (v: string) => (active.value = v) },
              () => labels.map((label) => h(CuiTab, { value: label, label }, () => label)),
            ),
        }),
        { attachTo: into ?? host({ width: "300px" }) },
      ),
    );
    const list = wrapper.element.querySelector<HTMLElement>('[role="tablist"]')!;
    // The scroller is CuiScrollArea's (#236), around the tablist.
    const bar = wrapper.element.querySelector<HTMLElement>(".cui-scroll-area__scroller")!;
    const tab = (label: string) => list.querySelector<HTMLElement>(`[data-cui-tab-value="${label}"]`)!;
    return { active, bar, tab };
  }


  /** Which edges have more tabs past them: the ones with a fade and a scroll button. */
  function edges(bar: HTMLElement) {
    const max = bar.scrollWidth - bar.clientWidth;
    return { start: bar.scrollLeft > 1, end: bar.scrollLeft < max - 1 };
  }

  /**
   * Fully inside the bar, and clear of whichever edge fades and scroll buttons are
   * showing. They are only drawn on an edge with more tabs beyond it, so a tab at the
   * very end of the scroll range may sit flush there — its focus ring is inset, so
   * nothing is cut off.
   */
  function expectClearOfFade(bar: HTMLElement, el: HTMLElement) {
    const b = bar.getBoundingClientRect();
    const t = el.getBoundingClientRect();
    // The bar's scroll padding is the fade plus the scroll button.
    const fade = parseFloat(getComputedStyle(bar).scrollPaddingLeft);
    expect(fade).toBeGreaterThan(0);
    const fadeStart = edges(bar).start ? fade : 0;
    const fadeEnd = edges(bar).end ? fade : 0;
    expect(t.left).toBeGreaterThanOrEqual(b.left + fadeStart - 1);
    expect(t.right).toBeLessThanOrEqual(b.right - fadeEnd + 1);
  }

  it.each(["{End}", "{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}"])(
    "keyboard navigation to the last tab (%s) leaves it clear of the fade",
    async (keys) => {
      const { bar, tab } = mountTabs();
      await frames(2);
      expect(bar.scrollWidth).toBeGreaterThan(bar.clientWidth);

      tab("Profile").focus();
      await userEvent.keyboard(keys);
      await settleScroll(bar);

      const last = tab("Connected apps");
      expect(document.activeElement).toBe(last);
      expectClearOfFade(bar, last);
    },
  );

  it("keyboard navigation to a middle tab clears the fade on both sides", async () => {
    // "Sign-in methods" sits mid-bar: scrolled to, both edges still have tabs beyond.
    const { bar, tab } = mountTabs();
    await frames(2);
    tab("Profile").focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    await settleScroll(bar);

    const target = tab("Sign-in methods");
    expect(document.activeElement).toBe(target);
    expect(edges(bar)).toEqual({ start: true, end: true });
    expectClearOfFade(bar, target);
  });

  it("Home back to the first tab leaves it clear of the fade", async () => {
    const { bar, tab } = mountTabs();
    await frames(2);
    tab("Profile").focus();
    await userEvent.keyboard("{End}");
    await settleScroll(bar);
    await userEvent.keyboard("{Home}");
    await settleScroll(bar);

    expect(bar.scrollLeft).toBe(0);
    expect(document.activeElement).toBe(tab("Profile"));
  });

  it("re-pressing End on the already-active last tab brings it back into view", async () => {
    // No activeTab change, so no watcher scroll; the keydown has to scroll itself now
    // that focus() no longer does.
    const { bar, tab } = mountTabs();
    await frames(2);
    tab("Profile").focus();
    await userEvent.keyboard("{End}");
    await settleScroll(bar);
    bar.scrollLeft = 0;
    await settleScroll(bar);

    await userEvent.keyboard("{End}");
    await settleScroll(bar);
    expectClearOfFade(bar, tab("Connected apps"));
  });

  it("a v-model change leaves the new tab clear of the fade", async () => {
    const { active, bar, tab } = mountTabs();
    await frames(2);
    active.value = "Connected apps";
    await nextTick();
    await settleScroll(bar);

    expectClearOfFade(bar, tab("Connected apps"));
  });

  it("mounting on a trailing tab leaves it clear of the fade", async () => {
    const { bar, tab } = mountTabs("Devices");
    await settleScroll(bar);

    expectClearOfFade(bar, tab("Devices"));
  });

  // #243 — scrollIntoView scrolled every scrollable ancestor, the window too, so a tab bar
  // below the fold dragged the page down to it on mount and on every v-model change.
  it("scrolls only the bar, never the page, for tabs below the fold", async () => {
    host({ height: "200vh" });
    const below = host({ width: "300px" });
    expect(below.getBoundingClientRect().top).toBeGreaterThan(innerHeight);
    window.scrollTo(0, 0);

    const { active, bar, tab } = mountTabs("Connected apps", below);
    await settleScroll(bar);
    expect(window.scrollY, "not on mount").toBe(0);
    expect(bar.scrollLeft, "the bar itself still scrolled").toBeGreaterThan(0);
    expectClearOfFade(bar, tab("Connected apps"));

    active.value = "Profile";
    await nextTick();
    await settleScroll(bar);
    expect(window.scrollY, "nor on a v-model change").toBe(0);
    expect(bar.scrollLeft).toBe(0);
  });

  // Inside a modal that is still scaling in, the rects are scaled and the scroll offsets
  // aren't: measured naively, the bar stopped about 5% short and clipped the tab.
  it("lands the tab clear of the fade under an ancestor's scale transform", async () => {
    const scaled = host({ width: "300px", transform: "scale(0.9)", transformOrigin: "0 0" });
    const { bar, tab } = mountTabs("Connected apps", scaled);
    await settleScroll(bar);
    // Compare in the bar's own pixels: undo the scale on both rects.
    const b = bar.getBoundingClientRect();
    const t = tab("Connected apps").getBoundingClientRect();
    expect((t.right - b.left) / 0.9).toBeLessThanOrEqual(bar.clientWidth + 1);
    expect(bar.scrollLeft).toBe(bar.scrollWidth - bar.clientWidth);
  });
});
