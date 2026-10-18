import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import CuiPopover from "../../components/CuiPopover.vue";
import CuiButton from "../../components/CuiButton.vue";
import { frames, mountHosts } from "./helpers";

/**
 * #248 — a popover mounted with v-model:visible already true. The panel is hidden until
 * Floating UI has positioned it, and when it opens on the very first render the
 * reference element is only just mounting, so this checks it still gets positioned and
 * shown next to its trigger rather than staying hidden or landing at the origin.
 *
 * Real browser: positioning is layout, which jsdom does not compute.
 */
describe("CuiPopover open at mount (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  afterEach(cleanup);

  it("is positioned and visible beside its trigger", async () => {
    const el = host({ position: "fixed", left: "200px", top: "200px" });
    track(
      mount(CuiPopover, {
        attachTo: el,
        props: { title: "Panel", visible: true, placement: "bottom" },
        slots: { default: () => h(CuiButton, () => "open") },
      }),
    );
    await frames(20);

    const panel = document.querySelector<HTMLElement>(".cui-popover__panel")!;
    expect(panel).not.toBeNull();
    // The pre-positioning guard is opacity, not visibility (see hiddenUntilPositioned).
    expect(getComputedStyle(panel).opacity).toBe("1");
    const trigger = el.querySelector("button")!.getBoundingClientRect();
    const rect = panel.getBoundingClientRect();
    expect(rect.top).toBeGreaterThanOrEqual(trigger.bottom - 1);
    // placement "bottom" centres the panel on its trigger.
    const center = (r: DOMRect) => r.left + r.width / 2;
    expect(Math.abs(center(rect) - center(trigger))).toBeLessThan(4);
  });
});
