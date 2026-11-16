import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import { motionDuration } from "../../utils/motion";
import CuiNavbar from "../../components/CuiNavbar.vue";
import CuiNavbarBrand from "../../components/CuiNavbarBrand.vue";
import CuiNavbarNav from "../../components/CuiNavbarNav.vue";
import CuiNavbarMenu from "../../components/CuiNavbarMenu.vue";
import CuiNavbarActions from "../../components/CuiNavbarActions.vue";

/**
 * #194 — a real navbar: the keyboard through a bar with a dropdown menu, and a sticky bar's
 * published height keeping a focused element out from under it (WCAG 2.4.11).
 */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("CuiNavbar (real browser)", () => {
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
    window.scrollTo(0, 0);
  });

  function setup(props: Record<string, unknown> = {}) {
    const el = document.createElement("div");
    el.innerHTML = `<button id="before">before</button><div class="slot"></div><button id="after">after</button>`;
    document.body.append(el);
    hosts.push(el);
    const w = mount(
      {
        render: () =>
          h(CuiNavbar, { collapseBelow: "never", label: "Site", ...props }, () => [
            h(CuiNavbarBrand, { href: "#home" }, () => "Brand"),
            h(CuiNavbarNav, null, () => [
              h("a", { href: "#docs", "aria-current": "page" }, "Docs"),
              h(CuiNavbarMenu, { label: "Components" }, () => [h("a", { href: "#button" }, "Button"), h("a", { href: "#modal" }, "Modal")]),
            ]),
            h(CuiNavbarActions, null, () => h("button", null, "Sign in")),
          ]),
      },
      { attachTo: el.querySelector<HTMLElement>(".slot")! },
    );
    mounted.push(w);
    // A page, not a box the height of the bar: a sticky bar sticks within its parent.
    if (props.sticky) el.querySelectorAll<HTMLElement>(".slot, .slot > div").forEach((box) => (box.style.minHeight = "3000px"));
    return { el, w };
  }

  async function tabStops(): Promise<string[]> {
    (document.getElementById("before") as HTMLElement).focus();
    const stops: string[] = [];
    for (let i = 0; i < 10 && document.activeElement?.id !== "after"; i++) {
      await userEvent.tab();
      stops.push((document.activeElement as HTMLElement).textContent?.trim() ?? "");
    }
    return stops;
  }

  it("Tab visits the brand, the nav's links, the menu button and the actions: not the shut menu's links", async () => {
    setup();
    await nextTick();
    expect(await tabStops()).toEqual(["Brand", "Docs", "Components", "Sign in", "after"]);
  });

  it("opens the menu from the keyboard, moves through its links, and Escape hands focus back to the trigger", async () => {
    const { el } = setup();
    await nextTick();
    const trigger = el.querySelector<HTMLButtonElement>(".cui-navbar-menu__trigger")!;

    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await wait(motionDuration("base") + 50);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement?.textContent).toBe("Button");

    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent).toBe("Modal");
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent).toBe("Button");

    await userEvent.keyboard("{Escape}");
    await wait(motionDuration("fast") + 50);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("marks the current page with a surface fill and a border, reserving the border's room on every link", async () => {
    const { el } = setup();
    await nextTick();
    const docs = getComputedStyle(el.querySelector('a[aria-current="page"]')!);
    const brand = getComputedStyle(el.querySelector(".cui-navbar-nav")!.parentElement!.querySelector(".cui-navbar-actions button")!);
    expect(docs.borderTopWidth).toBe("1px");
    expect(docs.borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(docs.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(brand.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });

  describe("sticky", () => {
    it("publishes its measured height, and scroll-padding-top follows it", async () => {
      const { el } = setup({ sticky: true });
      await nextTick();
      const bar = el.querySelector<HTMLElement>("header")!;
      const px = bar.getBoundingClientRect().height;
      expect(px).toBeGreaterThan(0);
      expect(document.documentElement.style.getPropertyValue("--cui-navbar-height")).toBe(`${bar.offsetHeight}px`);
      expect(parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)).toBe(bar.offsetHeight);
    });

    it("an element scrolled to the top of the page (an anchor jump) lands below the bar, not under it", async () => {
      const { el } = setup({ sticky: true });
      await nextTick();
      const bar = el.querySelector<HTMLElement>("header")!;
      const page = el.querySelector<HTMLElement>(".slot > div")!;
      page.style.position = "relative";
      const target = document.createElement("button");
      target.textContent = "target";
      target.style.cssText = "position: absolute; top: 1500px";
      page.append(target);

      target.scrollIntoView({ block: "start" });
      await wait(50);
      expect(target.getBoundingClientRect().top).toBeGreaterThanOrEqual(bar.getBoundingClientRect().bottom);
    });

    it("sticks to the top, and is elevated (border and shadow) only once the page has scrolled", async () => {
      const { el } = setup({ sticky: true });
      await nextTick();
      const bar = el.querySelector<HTMLElement>("header")!;
      const shadow = () => getComputedStyle(bar, "::after").opacity;
      const border = () => getComputedStyle(bar).borderBottomColor;
      expect(shadow()).toBe("0");
      expect(border()).toBe("rgba(0, 0, 0, 0)");

      window.scrollTo(0, 400);
      await wait(motionDuration("fast") + 100);
      expect(bar.getBoundingClientRect().top).toBe(0);
      expect(shadow()).toBe("1");
      expect(border()).not.toBe("rgba(0, 0, 0, 0)");
    });
  });
});
