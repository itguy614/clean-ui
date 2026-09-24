import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h } from "vue";
import CuiPopover from "../../components/CuiPopover.vue";
import CuiButton from "../../components/CuiButton.vue";

// Floating UI positions with `transform: translate()` by default. The panel
// animates in with `transform: scale(...)` — and a CSS animation on `transform`
// REPLACES the element's transform for its whole duration, so the positioning
// translate was dropped and the panel rendered at the TOP-LEFT CORNER of the
// screen for the full 0.15s before snapping into place. Reported against the
// date and date-range pickers, which render through CuiPopover; CuiTooltip had
// it too, where the 200ms show delay made it easier to miss.
//
// `usePopover` now passes `transform: false`, so Floating UI writes `left`/`top`
// and the animation owns `transform` uncontested.
//
// This has to run in a real browser AND with the shared keyframes present: the
// displacement only exists while the animation is actually running, so a
// harness without `@keyframes cui-scale-in` reports a perfectly placed panel.
// That is exactly how it went unnoticed.
describe("floating panels do not flash at the top-left (real browser)", () => {
  let wrapper: VueWrapper | undefined;


  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.getElementById("host")?.remove();
  });

  function host() {
    const el = document.createElement("div");
    el.id = "host";
    el.style.cssText = "position: fixed; left: 40px; width: 300px; bottom: 0; height: 80px;";
    document.body.append(el);
    return el;
  }

  const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

  async function openPopover(props: Record<string, unknown> = {}) {
    wrapper = mount(CuiPopover, {
      attachTo: host(),
      props: { title: "Panel", ...props },
      slots: { default: () => h(CuiButton, () => "open") },
    });
    await wrapper.vm.$nextTick();
    document
      .querySelector<HTMLElement>("#host .cui-popover > div")!
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }

  it("stays put for the whole scale-in animation", async () => {
    await openPopover({ placement: "top" });

    // The animation is 0.15s — about 9 frames at 60Hz. Sample past the end.
    const frames: { top: number; left: number }[] = [];
    for (let i = 0; i < 14; i++) {
      await frame();
      const panel = document.querySelector<HTMLElement>(".cui-popover__panel");
      if (!panel) continue;
      const rect = panel.getBoundingClientRect();
      frames.push({ top: rect.top, left: rect.left });
    }

    expect(frames.length).toBeGreaterThan(10);
    const settled = frames[frames.length - 1];
    // Sanity: the panel really is somewhere down the page, not at the origin.
    expect(settled.top).toBeGreaterThan(100);

    // Before the fix every frame of the animation read (0, 0) and then jumped
    // hundreds of pixels. The panel scales, so allow a few px of movement.
    for (const f of frames) {
      expect(Math.abs(f.top - settled.top), `panel moved to top=${f.top}`).toBeLessThan(20);
      expect(Math.abs(f.left - settled.left), `panel moved to left=${f.left}`).toBeLessThan(20);
    }
  });

it("hides the unpositioned panel without making it unfocusable", async () => {
    // The guard used to be `visibility: hidden`, and focus() on a
    // visibility:hidden element is a silent no-op — so every consumer wanting
    // to move focus into the panel on open was racing the positioning and
    // losing intermittently (#112). `opacity: 0` hides it just as well and
    // leaves it focusable, which is why the pickers need no retry loop.
    await openPopover();
    await frame();
    await frame();

    const panel = document.querySelector<HTMLElement>(".cui-popover__panel")!;
    expect(getComputedStyle(panel).visibility).toBe("visible");

    // ...and it really can take focus, first attempt.
    panel.tabIndex = -1;
    panel.focus();
    expect(document.activeElement).toBe(panel);
  });

  it("positions through left/top, which an animated transform cannot displace", async () => {
    await openPopover();
    await frame();

    const panel = document.querySelector<HTMLElement>(".cui-popover__panel")!;
    expect(parseFloat(panel.style.top)).toBeGreaterThan(0);
    // If positioning ever reverts to Floating UI's default translate, the
    // animation will stomp it again and the flash comes back.
    expect(panel.style.transform ?? "").not.toMatch(/translate/);
  });
});
