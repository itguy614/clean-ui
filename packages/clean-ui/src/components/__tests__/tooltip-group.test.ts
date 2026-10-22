import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick } from "vue";
import CuiTooltip from "../CuiTooltip.vue";
import { __resetTooltipGroup } from "../../composables/useTooltipGroup";

/**
 * #264 — every tooltip waited out its own showDelay, so moving along a toolbar meant a wait
 * at each button. Once one has been open, the next one opened within the skip window shows
 * at once and without its entry animation; the first after the window waits again.
 */
describe("tooltip warm window", () => {
  const mounted: VueWrapper[] = [];
  beforeEach(() => {
    // Date too: the window is measured with Date.now().
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
    __resetTooltipGroup();
  });
  afterEach(() => {
    mounted.splice(0).forEach((w) => w.unmount());
    vi.useRealTimers();
  });

  const tip = (text: string, props: Record<string, unknown> = {}) => {
    const w = mount(CuiTooltip, { props: { text, ...props }, slots: { default: () => h("button", text) }, attachTo: document.body });
    mounted.push(w);
    return w;
  };
  const shown = (text: string) => [...document.querySelectorAll(".cui-tooltip")].find((el) => el.textContent?.includes(text) && (el as HTMLElement).style.display !== "none");
  const enter = (w: VueWrapper) => w.trigger("mouseenter");
  const leave = (w: VueWrapper) => w.trigger("mouseleave");

  it("makes the first tooltip wait its showDelay", async () => {
    const a = tip("Alpha");
    await enter(a);
    await nextTick();
    expect(shown("Alpha")).toBeUndefined();
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(shown("Alpha")).toBeDefined();
  });

  it("opens the next one at once, with no animation, while the group is warm", async () => {
    const a = tip("Alpha");
    const b = tip("Bravo");
    await enter(a);
    vi.advanceTimersByTime(200);
    await nextTick();
    await leave(a);
    await enter(b);
    await nextTick();
    const panel = shown("Bravo") as HTMLElement | undefined;
    expect(panel, "no wait").toBeDefined();
    expect(panel!.dataset.instant).toBe("true");
  });

  it("stays warm for skipDelay after the last one closes, then cools", async () => {
    const a = tip("Alpha");
    const b = tip("Bravo");
    const c = tip("Charlie");
    await enter(a);
    vi.advanceTimersByTime(200);
    await nextTick();
    await leave(a);
    vi.advanceTimersByTime(100 + 200); // its hideDelay, then most of the window
    await nextTick();
    await enter(b);
    await nextTick();
    expect(shown("Bravo"), "inside the window").toBeDefined();
    await leave(b);
    vi.advanceTimersByTime(100 + 300 + 10); // closed, and the window has passed
    await nextTick();
    await enter(c);
    await nextTick();
    expect(shown("Charlie"), "cold again: waits").toBeUndefined();
    vi.advanceTimersByTime(200);
    await nextTick();
    expect((shown("Charlie") as HTMLElement).dataset.instant).toBeUndefined();
  });

  const lastVisible = (w: VueWrapper) => w.emitted<[boolean]>("update:visible")?.at(-1)?.[0];

  it("closes the one it replaces at once", async () => {
    const a = tip("Alpha");
    const b = tip("Bravo");
    await enter(a);
    vi.advanceTimersByTime(200);
    await nextTick();
    await leave(a);
    await enter(b);
    await nextTick();
    expect(lastVisible(a), "not waiting out its hideDelay").toBe(false);
    expect(lastVisible(b)).toBe(true);
  });

  it("skipDelay 0 opts that tooltip out: it waits, and doesn't warm the others", async () => {
    const a = tip("Alpha");
    const b = tip("Bravo", { skipDelay: 0 });
    const c = tip("Charlie");
    await enter(a);
    vi.advanceTimersByTime(200);
    await nextTick();
    await leave(a);
    await enter(b);
    await nextTick();
    expect(shown("Bravo"), "waits even while the group is warm").toBeUndefined();
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(lastVisible(a), "and replaces nothing early").toBe(false);
    vi.advanceTimersByTime(1000); // the group has cooled; Bravo is still open
    await enter(c);
    await nextTick();
    expect(shown("Charlie"), "an open opt-out doesn't warm the group").toBeUndefined();
  });

  it("forgets a warm opening once closed: a v-model reopen animates in", async () => {
    const a = tip("Alpha");
    const b = tip("Bravo");
    await enter(a);
    vi.advanceTimersByTime(200);
    await nextTick();
    await leave(a);
    await enter(b);
    await nextTick();
    await leave(b);
    vi.advanceTimersByTime(100 + 1000);
    await b.setProps({ visible: true });
    expect((shown("Bravo") as HTMLElement).dataset.instant).toBeUndefined();
  });

  it("starts one timer for hover then focus, so a leave cancels the show", async () => {
    const a = tip("Alpha");
    await enter(a);
    await a.trigger("focusin");
    await leave(a);
    await a.trigger("focusout");
    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(shown("Alpha")).toBeUndefined();
  });

  it("leaves the group when an open tooltip unmounts, starting the window", async () => {
    const a = tip("Alpha");
    const b = tip("Bravo");
    await enter(a);
    vi.advanceTimersByTime(200);
    await nextTick();
    mounted.splice(mounted.indexOf(a), 1);
    a.unmount();
    vi.advanceTimersByTime(1000);
    await enter(b);
    await nextTick();
    expect(shown("Bravo"), "cold: the unmounted one isn't still counted open").toBeUndefined();
  });

  it("leaves a tooltip opened through v-model alone: not replaced, and not warming the group", async () => {
    const manual = tip("Manual", { visible: true });
    const b = tip("Bravo");
    await nextTick();
    expect(shown("Manual")).toBeDefined();
    await enter(b);
    await nextTick();
    expect(shown("Bravo"), "the group is cold: waits").toBeUndefined();
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(shown("Bravo")).toBeDefined();
    expect(shown("Manual"), "still open").toBeDefined();
    expect(manual.emitted("update:visible")).toBeUndefined();
  });

  it("leaves a tooltip clicked open alone", async () => {
    const clicked = tip("Clicked", { trigger: "click" });
    const b = tip("Bravo");
    await clicked.trigger("click");
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(shown("Clicked")).toBeDefined();
    await enter(b);
    await nextTick();
    expect(shown("Bravo"), "cold: waits").toBeUndefined();
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(lastVisible(clicked)).toBe(true);
  });
});
