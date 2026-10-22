import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { cdp } from "@vitest/browser/context";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "./helpers";
import { motionDuration } from "../../utils/motion";
import CuiModal from "../../components/CuiModal.vue";
import CuiDropdown from "../../components/CuiDropdown.vue";
import CuiDropdownTrigger from "../../components/CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../../components/CuiDropdownMenu.vue";
import CuiDropdownItem from "../../components/CuiDropdownItem.vue";
import CuiButton from "../../components/CuiButton.vue";
import CuiSpinner from "../../components/CuiSpinner.vue";
import CuiAccordion from "../../components/CuiAccordion.vue";
import CuiAccordionItem from "../../components/CuiAccordionItem.vue";
import CuiSkeleton from "../../components/CuiSkeleton.vue";
import CuiSlideover from "../../components/CuiSlideover.vue";

/**
 * #265 — under `prefers-reduced-motion: reduce` the library clamped every animation and
 * transition on the whole page (`*`) to 1ms: no movement, but no fades either, and it
 * reached the consumer's own elements. It now removes movement only: fades and colour keep
 * their durations, and only the library's own elements are touched.
 */
describe("reduced motion (real browser)", () => {
  let removeTokens: () => void;
  const setReduced = (reduce: boolean) =>
    cdp().send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "" }] });

  beforeAll(async () => {
    removeTokens = installTokens(main);
    await setReduced(true);
  });
  afterAll(async () => {
    await setReduced(false);
    removeTokens();
  });

  const mounted: VueWrapper[] = [];
  const hosts: HTMLElement[] = [];
  afterEach(() => {
    mounted.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((el) => el.remove());
  });
  const host = () => {
    const el = document.createElement("div");
    el.style.cssText = "position: fixed; left: 160px; top: 40px;";
    document.body.append(el);
    hosts.push(el);
    return el;
  };
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const frame = () => new Promise((r) => requestAnimationFrame(r));

  it("matches the emulated setting", () => {
    expect(matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
  });

  it("fades a menu out where it stands: opacity transitions, transform doesn't", async () => {
    const w = mount(
      {
        render: () =>
          h(CuiDropdown, null, () => [
            h(CuiDropdownTrigger, null, () => h(CuiButton, () => "Menu")),
            h(CuiDropdownMenu, null, () => h(CuiDropdownItem, null, () => "One")),
          ]),
      },
      { attachTo: host() },
    );
    mounted.push(w);
    await w.find(".cui-button").trigger("click");
    await wait(motionDuration("base") + 50);
    const menu = document.querySelector<HTMLElement>(".cui-dropdown-menu")!;
    await w.find(".cui-button").trigger("click");
    await wait(40);
    const style = getComputedStyle(menu);
    expect(style.transitionProperty).not.toContain("transform");
    expect(style.transform).toBe("none");
    expect(Number(style.opacity), "still fading").toBeGreaterThan(0);
    expect(Number(style.opacity)).toBeLessThan(1);
    await wait(motionDuration("fast") + 100);
    expect(document.querySelector(".cui-dropdown-menu"), "gone once the fade has played").toBeNull();
  });

  it("closes a modal as soon as its fade ends, with the dialog standing still", async () => {
    const w = mount(CuiModal, { props: { visible: true, title: "Modal" } });
    mounted.push(w);
    await wait(motionDuration("slow") + 100);
    const dialog = document.querySelector<HTMLElement>(".cui-modal")!;
    await w.setProps({ visible: false });
    await frame();
    expect(getComputedStyle(dialog).transform).toBe("none");
    expect(w.emitted("close"), "not before the fade").toBeUndefined();
    await wait(motionDuration("slow") + 150);
    expect(w.emitted("close")).toHaveLength(1);
    expect(document.body.style.overflow).toBe("");
  });

  it("leaves the consumer's own elements alone, even inside a .cui-typography scope", () => {
    const scope = document.createElement("main");
    scope.className = "cui-typography cui-density-compact";
    const own = document.createElement("div");
    own.style.cssText = "transition: transform 300ms ease, opacity 300ms ease;";
    scope.append(own);
    host().append(scope);
    const style = getComputedStyle(own);
    expect(style.transitionProperty).toContain("transform");
    expect(style.transitionDuration).toContain("0.3s");
  });

  it.each(["ring", "dots", "bars"] as const)("stops a %s spinner's moving parts, not just its root", (variant) => {
    const w = mount(CuiSpinner, { props: { variant }, attachTo: host() });
    mounted.push(w);
    const moving = [...(w.element as HTMLElement).querySelectorAll<HTMLElement>("*")].filter((el) => el.getAnimations().length);
    expect(moving).toEqual([]);
  });

  it("opens an accordion panel to its full height, with no transition to wait for", async () => {
    const w = mount(
      { render: () => h(CuiAccordion, null, () => h(CuiAccordionItem, { value: "a", label: "A" }, () => "Panel")) },
      { attachTo: host() },
    );
    mounted.push(w);
    await w.find("button").trigger("click");
    await wait(50);
    expect(document.querySelector<HTMLElement>(".cui-accordion-item__panel")!.style.maxHeight).toBe("none");
  });

  it("stops a shimmer, which loops on a pseudo-element", () => {
    const w = mount(CuiSkeleton, { props: { animation: "shimmer" }, attachTo: host() });
    mounted.push(w);
    const all = [w.element as HTMLElement, ...(w.element as HTMLElement).querySelectorAll<HTMLElement>("*")];
    expect(all.some((el) => getComputedStyle(el, "::after").animationName !== "none")).toBe(false);
  });

  it("fades a slideover's panel where it stands, rather than popping it", async () => {
    const w = mount(CuiSlideover, { props: { visible: true, title: "Panel" } });
    mounted.push(w);
    await wait(motionDuration("slow") + 100);
    const panel = document.querySelector<HTMLElement>(".cui-slideover__panel")!;
    expect(Number(getComputedStyle(panel).opacity)).toBe(1);
    await w.setProps({ visible: false });
    await wait(60);
    const style = getComputedStyle(panel);
    expect(style.transform).toBe("none");
    expect(Number(style.opacity), "mid-fade").toBeGreaterThan(0);
    expect(Number(style.opacity)).toBeLessThan(1);
  });
});
