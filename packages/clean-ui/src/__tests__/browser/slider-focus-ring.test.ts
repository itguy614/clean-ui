import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import CuiSlider from "../../components/CuiSlider.vue";
import preflight from "../../styles/preflight.css?inline";
import { frames, installTokens, mountHosts } from "./helpers";

/**
 * #172 — the native range input is opacity: 0 and nothing drew a ring when it took
 * focus, so a keyboard user could not see where focus was (WCAG 2.4.7). The ring is
 * drawn on the thumb. Real browser: `:focus-visible` only follows trusted keyboard input.
 */
describe("CuiSlider focus ring (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(preflight)));
  afterAll(() => teardown());
  afterEach(cleanup);

  /** A slider with a button before it, so Tab can reach it with real keyboard input. */
  function mountSlider(props: Record<string, unknown> = {}) {
    const el = host({ width: "300px" });
    const before = document.createElement("button");
    before.textContent = "before";
    el.append(before);
    const wrapper = track(mount(CuiSlider, { props: { label: "Volume", ...props }, attachTo: el }));
    const thumb = wrapper.element.querySelector<HTMLElement>(".cui-slider__thumb")!;
    return { wrapper, thumb, before };
  }

  async function tabToSlider(props: Record<string, unknown> = {}) {
    const slider = mountSlider(props);
    slider.before.focus();
    await userEvent.tab();
    await frames(2);
    return slider;
  }

  it("draws a ring on the thumb when the slider takes keyboard focus", async () => {
    const { wrapper, thumb } = await tabToSlider();
    expect(document.activeElement).toBe(wrapper.element.querySelector("input[type=range]"));
    const style = getComputedStyle(thumb);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
  });

  it("has no ring when not focused", async () => {
    const { thumb } = mountSlider();
    await frames(1);
    expect(getComputedStyle(thumb).outlineStyle).toBe("none");
  });

  it("takes its colour from the slider's colour role, overridable by token", async () => {
    const { thumb } = await tabToSlider({ color: "success" });
    const ring = getComputedStyle(thumb).outlineColor;
    thumb.closest<HTMLElement>(".cui-slider")!.style.setProperty("--cui-slider-focus-ring", "rgb(255, 0, 0)");
    await frames(1);
    expect(getComputedStyle(thumb).outlineColor).toBe("rgb(255, 0, 0)");
    expect(ring).not.toBe("rgb(255, 0, 0)");
  });
});
