import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import main from "../../styles/main.css?inline";
import { installTokens, mountHosts } from "./helpers";
import CuiToggle from "../../components/CuiToggle.vue";
import CuiButton from "../../components/CuiButton.vue";
import CuiButtonGroup from "../../components/CuiButtonGroup.vue";
import { h } from "vue";
import { motionDuration } from "../../utils/motion";

/**
 * #261 — the motion tokens are custom properties, so a container restyles everything
 * inside it, and motionDuration() reads what the CSS resolves to there.
 */
describe("motion tokens (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => (removeTokens = installTokens(main)));
  afterAll(() => removeTokens());
  const dom = mountHosts();
  afterEach(() => dom.cleanup());

  const track = (host: HTMLElement) => host.querySelector<HTMLElement>(".cui-toggle__track")!;

  it("gives a component the default durations and the ease-out curve", () => {
    const host = dom.host();
    dom.track(mount(CuiToggle, { props: { modelValue: false }, attachTo: host }));
    expect(getComputedStyle(track(host)).transitionDuration.split(", ")).toContain("0.2s");
  });

  it("lets a container's --cui-duration-base change a component's transition", () => {
    const host = dom.host();
    host.style.setProperty("--cui-duration-base", "500ms");
    dom.track(mount(CuiToggle, { props: { modelValue: false }, attachTo: host }));
    expect(getComputedStyle(track(host)).transitionDuration.split(", ")).toContain("0.5s");
    // And the JS reads the same value there, so a wait can't outlast or cut short the CSS.
    expect(motionDuration("base", track(host))).toBe(500);
    expect(motionDuration("base")).toBe(200);
  });

  it("transitions a button's transform for the press, and a group turns the press off", () => {
    const host = dom.host();
    dom.track(mount({ render: () => [h(CuiButton, () => "Alone"), h(CuiButtonGroup, () => [h(CuiButton, () => "In"), h(CuiButton, () => "Group")])] }, { attachTo: host }));
    const [alone, grouped] = [...host.querySelectorAll<HTMLElement>(".cui-button")];
    expect(getComputedStyle(alone).transitionProperty).toContain("transform");
    expect(getComputedStyle(alone).getPropertyValue("--cui-press-scale").trim()).toBe("0.97");
    expect(getComputedStyle(grouped).getPropertyValue("--cui-press-scale").trim()).toBe("1");
  });
});
