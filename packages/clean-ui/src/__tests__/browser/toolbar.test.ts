import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { h } from "vue";
import CuiToolbar from "../../components/CuiToolbar.vue";
import CuiButton from "../../components/CuiButton.vue";
import { frames, installTokens, mountHosts, settleScroll } from "../../../../../config/test/browser-helpers";

/**
 * #190 — CuiToolbar's overflow is a CuiScrollArea: one line, edge fades where there is more,
 * and a scroller that clips. A focus ring is drawn outside its control, so a scroller with no
 * padding cuts it off — the toolbar's scroll-mode padding is what keeps it whole.
 *
 * Real browser: overflow, masks, `:focus-visible` from real Tab input and the clip are all
 * layout and paint, which jsdom does not compute.
 */
describe("CuiToolbar overflow and focus ring (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  // Tokens only: the scoped base is already loaded, in its layer, by setup.ts. Injected
  // again unlayered it would tie with the toolbar's zero-specificity padding and win on
  // source order, which no consumer's page does.
  beforeAll(() => (teardown = installTokens("")));
  afterAll(() => teardown());
  afterEach(cleanup);

  const LABELS = ["Bold", "Italic", "Underline", "Strikethrough", "Code", "Link", "Quote", "Heading"];

  async function mountToolbar(width: string, overflow: "scroll" | "wrap" = "scroll") {
    const el = host({ width });
    const before = document.createElement("button");
    before.textContent = "before";
    el.append(before);
    const wrapper = track(
      mount(CuiToolbar, {
        props: { label: "Formatting", overflow },
        slots: { default: () => LABELS.map((l) => h(CuiButton, { key: l, size: "sm" }, () => l)) },
        attachTo: el,
      }),
    );
    // The scroll area measures its overflow after mount.
    await frames(2);
    const scroller = wrapper.element.querySelector<HTMLElement>(".cui-scroll-area__scroller");
    const buttons = [...wrapper.element.querySelectorAll<HTMLElement>(".cui-button")];
    return { wrapper, scroller, buttons, before };
  }

  /** The focus ring's box: the control's, grown by the outline's width and offset. */
  function ringBox(el: HTMLElement) {
    const s = getComputedStyle(el);
    const grow = parseFloat(s.outlineWidth) + parseFloat(s.outlineOffset);
    const r = el.getBoundingClientRect();
    return { top: r.top - grow, bottom: r.bottom + grow, left: r.left - grow, right: r.right + grow };
  }

  /** The ring lies inside the scroller's padding box: nothing of it is clipped. */
  function expectRingUnclipped(scroller: HTMLElement, el: HTMLElement) {
    const s = scroller.getBoundingClientRect();
    const ring = ringBox(el);
    expect(getComputedStyle(el).outlineStyle).toBe("solid");
    expect(ring.top).toBeGreaterThanOrEqual(s.top - 0.5);
    expect(ring.bottom).toBeLessThanOrEqual(s.bottom + 0.5);
    expect(ring.left).toBeGreaterThanOrEqual(s.left - 0.5);
    expect(ring.right).toBeLessThanOrEqual(s.right + 0.5);
  }

  it("fades the end edge of a toolbar that overflows, and only that edge at the start", async () => {
    const { scroller } = await mountToolbar("240px");
    expect(scroller!.scrollWidth).toBeGreaterThan(scroller!.clientWidth);
    const mask = getComputedStyle(scroller!).maskImage;
    expect(mask).toContain("linear-gradient");
    // At the start, nothing is past the start edge: its stop is at 0.
    expect(mask).toMatch(/rgb\(0, 0, 0\) 0px/);
  });

  it("does not fade a toolbar that fits", async () => {
    const { scroller } = await mountToolbar("1200px");
    expect(scroller!.scrollWidth).toBeLessThanOrEqual(scroller!.clientWidth);
    expect(getComputedStyle(scroller!).maskImage).toBe("none");
  });

  it("is one tab stop: Tab enters on the first control and the next Tab leaves", async () => {
    const { buttons, before } = await mountToolbar("240px");
    before.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(buttons[0]);
    await userEvent.tab();
    expect(buttons).not.toContain(document.activeElement);
  });

  it("draws a whole focus ring on a control tabbed into, inside the scroller", async () => {
    const { scroller, buttons, before } = await mountToolbar("240px");
    before.focus();
    await userEvent.tab();
    await frames(1);
    expect(document.activeElement).toBe(buttons[0]);
    expectRingUnclipped(scroller!, buttons[0]);
  });

  it("scrolls the last control into view on End, its ring whole", async () => {
    const { scroller, buttons, before } = await mountToolbar("240px");
    before.focus();
    await userEvent.tab();
    await userEvent.keyboard("{End}");
    await settleScroll(scroller!);
    const last = buttons.at(-1)!;
    expect(document.activeElement).toBe(last);
    expect(scroller!.scrollLeft).toBeGreaterThan(0);
    expectRingUnclipped(scroller!, last);
  });

  it("wraps onto another line by default, with no scroller", async () => {
    const { wrapper, scroller, buttons } = await mountToolbar("240px", "wrap");
    expect(scroller).toBeNull();
    expect(buttons.at(-1)!.getBoundingClientRect().top).toBeGreaterThan(buttons[0].getBoundingClientRect().top);
    expect(wrapper.element.scrollWidth).toBeLessThanOrEqual(wrapper.element.clientWidth);
  });

  // Found in review (#190): CuiDataGridToolbar and the editor set their spacing as the public
  // token on the toolbar itself, which beat the same token set by a consumer on an ancestor.
  // They set the private default now, which the public token overrides from anywhere.
  it("lets a public token on an ancestor beat a built-on component's private default", async () => {
    const el = host({ width: "600px" });
    el.style.setProperty("--cui-toolbar-gap", "9px");
    const wrapper = track(
      mount(CuiToolbar, {
        props: { label: "Formatting" },
        attrs: { style: "--_toolbar-gap: 2px" },
        slots: { default: () => [h(CuiButton, null, () => "A"), h(CuiButton, null, () => "B")] },
        attachTo: el,
      }),
    );
    await frames(1);
    expect(getComputedStyle(wrapper.element).columnGap).toBe("9px");
    el.style.removeProperty("--cui-toolbar-gap");
    await frames(1);
    expect(getComputedStyle(wrapper.element).columnGap).toBe("2px");
  });
});
