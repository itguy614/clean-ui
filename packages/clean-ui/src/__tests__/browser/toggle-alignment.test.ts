import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import CuiToggle from "../../components/CuiToggle.vue";
import preflight from "../../styles/preflight.css?inline";
import { frames, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * A toggle's track and the first line of its label share one centre line, at every size. The
 * track used to hang from the top with a fixed 0.125rem margin, so the two only met by accident
 * (the user saw the text sit above the control).
 */
describe("CuiToggle alignment (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(preflight)));
  afterAll(() => teardown());
  afterEach(cleanup);

  const centre = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.top + r.height / 2;
  };

  // The first line of the label: a Range over its first text node is the line, not the block.
  const firstLineCentre = (label: HTMLElement) => {
    const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
    let text: Node | null = walker.nextNode();
    while (text && !text.textContent?.trim()) text = walker.nextNode();
    const range = document.createRange();
    range.selectNodeContents(text!);
    const rect = range.getClientRects()[0];
    return rect.top + rect.height / 2;
  };

  it.each(["sm", "md", "lg"] as const)("the %s track and its label centre on one line", async (size) => {
    const el = host({ width: "320px" });
    track(mount(CuiToggle, { attachTo: el, props: { label: "Notifications", size } }));
    await frames(2);
    const trackEl = el.querySelector<HTMLElement>(".cui-toggle__track")!;
    const label = el.querySelector<HTMLElement>(".cui-toggle__label")!;
    expect(Math.abs(centre(trackEl) - firstLineCentre(label))).toBeLessThan(0.75);
  });

  it.each(["sm", "md", "lg"] as const)("with a description and a wrapped label, the %s track centres on the first line", async (size) => {
    const el = host({ width: "140px" });
    track(
      mount(CuiToggle, {
        attachTo: el,
        props: { label: "A label long enough to wrap onto more lines", description: "Some help text", size },
      }),
    );
    await frames(2);
    const trackEl = el.querySelector<HTMLElement>(".cui-toggle__track")!;
    const label = el.querySelector<HTMLElement>(".cui-toggle__label")!;
    expect(label.getBoundingClientRect().height).toBeGreaterThan(40);
    expect(Math.abs(centre(trackEl) - firstLineCentre(label))).toBeLessThan(0.75);
  });
});
