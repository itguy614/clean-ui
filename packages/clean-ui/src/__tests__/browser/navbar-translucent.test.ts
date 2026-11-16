import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import CuiNavbar from "../../components/CuiNavbar.vue";
import CuiNavbarActions from "../../components/CuiNavbarActions.vue";

/**
 * #513 — the frosted bar: a tint and a blur only with `sticky`, the blur a token a consumer
 * can set, the bar still stacked under the overlays, and nothing in it holding a viewport-fixed
 * box that the bar's backdrop-filter (a containing block for fixed descendants) would capture.
 */
describe("CuiNavbar translucent (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => {
    removeTokens = installTokens(main);
  });
  afterAll(() => removeTokens());

  const mounted: VueWrapper[] = [];
  const hosts: HTMLElement[] = [];
  afterEach(() => {
    mounted.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((el) => el.remove());
  });

  function setup(props: Record<string, unknown>, hostStyle = "") {
    const host = document.createElement("div");
    host.style.cssText = `min-height: 2000px; ${hostStyle}`;
    document.body.append(host);
    hosts.push(host);
    const w = mount({ render: () => h(CuiNavbar, { collapseBelow: "never", ...props }, () => h(CuiNavbarActions, null, () => "x")) }, { attachTo: host });
    mounted.push(w);
    return host.querySelector<HTMLElement>("header")!;
  }

  it("is solid by default, and frosted with sticky + translucent: a ~80% tint over an 8px blur", async () => {
    const solid = getComputedStyle(setup({ sticky: true }));
    expect(solid.backdropFilter).toBe("none");
    const frosted = getComputedStyle(setup({ sticky: true, translucent: true }));
    expect(frosted.backdropFilter).toBe("blur(8px)");
    // color-mix(…, transparent): the background's alpha is the mix, not opaque.
    expect(frosted.backgroundColor).toMatch(/\/ 0\.8\)$|rgba\(.*, 0\.8\)$/);
    expect(solid.backgroundColor).not.toMatch(/0\.8/);
  });

  it("is a no-op without sticky", () => {
    const bar = setup({ translucent: true });
    const style = getComputedStyle(bar);
    expect(bar.classList.contains("cui-navbar--translucent")).toBe(false);
    expect(style.backdropFilter).toBe("none");
    expect(style.backgroundColor).not.toMatch(/0\.8/);
  });

  it("reads the blur from --cui-navbar-blur, which a container can set", () => {
    const bar = setup({ sticky: true, translucent: true }, "--cui-navbar-blur: 3px");
    expect(getComputedStyle(bar).backdropFilter).toBe("blur(3px)");
  });

  it("follows --cui-navbar-bg for the tint", () => {
    const bar = setup({ sticky: true, translucent: true }, "--cui-navbar-bg: rgb(255 0 0)");
    expect(getComputedStyle(bar).backgroundColor).toMatch(/srgb 1 0 0 \/ 0\.8|rgba\(255, 0, 0, 0\.8\)/);
  });

  it("stays stacked under the overlay scale, and the frosted bar nests nothing fixed", async () => {
    const bar = setup({ sticky: true, translucent: true });
    await nextTick();
    const z = Number(getComputedStyle(bar).zIndex);
    expect(z).toBeLessThan(Number(getComputedStyle(document.documentElement).getPropertyValue("--cui-z-overlay") || 9990));
    for (const el of bar.querySelectorAll("*")) expect(getComputedStyle(el).position).not.toBe("fixed");
  });
});
