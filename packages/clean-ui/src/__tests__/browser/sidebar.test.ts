import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import { motionDuration } from "../../utils/motion";
import CuiSidebar from "../../components/CuiSidebar.vue";
import CuiSidebarHeader from "../../components/CuiSidebarHeader.vue";
import CuiSidebarContent from "../../components/CuiSidebarContent.vue";
import CuiSidebarGroup from "../../components/CuiSidebarGroup.vue";
import CuiList from "../../components/CuiList.vue";
import CuiListItem from "../../components/CuiListItem.vue";

/**
 * #193 — keyboard use of a real sidebar: Tab skips the links of a shut group (they are
 * hidden, not just clipped), the group's heading opens on Enter and on Space, and the current
 * page's link is marked without taking layout room.
 */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("CuiSidebar keyboard (real browser)", () => {
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

  function setup() {
    const el = document.createElement("div");
    el.innerHTML = '<button id="before">before</button><div class="slot" style="height:400px;width:260px"></div><button id="after">after</button>';
    document.body.append(el);
    hosts.push(el);
    const w = mount(
      {
        render: () =>
          h(CuiSidebar, { collapseBelow: "never", label: "Docs" }, () => [
            h(CuiSidebarHeader, { title: "Docs" }),
            h(CuiSidebarContent, null, () => [
              h(CuiList, null, () => h(CuiListItem, { title: "Home", href: "#home", class: "top" })),
              h(CuiSidebarGroup, { label: "One" }, () =>
                h(CuiList, null, () => [
                  h(CuiListItem, { title: "One A", href: "#1a", class: "one-a" }),
                  h(CuiListItem, { title: "One B", href: "#1b", class: "one-b", "aria-current": "page" }),
                ]),
              ),
              h(CuiSidebarGroup, { label: "Two" }, () => h(CuiList, null, () => h(CuiListItem, { title: "Two A", href: "#2a", class: "two-a" }))),
            ]),
          ]),
      },
      { attachTo: el.querySelector<HTMLElement>(".slot")! },
    );
    mounted.push(w);
    return { el, w };
  }

  async function tabStops(): Promise<string[]> {
    (document.getElementById("before") as HTMLElement).focus();
    const stops: string[] = [];
    for (let i = 0; i < 12 && document.activeElement?.id !== "after"; i++) {
      await userEvent.tab();
      stops.push((document.activeElement as HTMLElement).textContent?.trim() ?? "");
    }
    return stops;
  }

  it("Tab reaches the top link, the open group's links and every heading, but not a shut group's links", async () => {
    setup();
    await nextTick();
    await wait(motionDuration("slow") + 100);
    // "One" holds the current page, so it opened itself; "Two" is shut.
    expect(await tabStops()).toEqual(["Home", "One", "One A", "One B", "Two", "after"]);
  });

  it("opens a heading on Enter and on Space, and Tab then reaches its links", async () => {
    const { el } = setup();
    await nextTick();
    const two = [...el.querySelectorAll<HTMLButtonElement>(".cui-sidebar-group__trigger")].find((b) => b.textContent?.includes("Two"))!;

    two.focus();
    await userEvent.keyboard("{Enter}");
    await wait(motionDuration("slow") + 100);
    expect(two.getAttribute("aria-expanded")).toBe("true");
    await userEvent.tab();
    expect(document.activeElement?.textContent?.trim()).toBe("Two A");

    two.focus();
    await userEvent.keyboard(" ");
    await wait(motionDuration("slow") + 100);
    expect(two.getAttribute("aria-expanded")).toBe("false");
    await userEvent.tab();
    expect(document.activeElement?.id).toBe("after");
  });

  it("marks the current page with a surface fill and a border, and reserves the border's room on every link", async () => {
    const { el } = setup();
    await nextTick();
    const row = (cls: string) => el.querySelector<HTMLElement>(`.${cls} .cui-list-item__row`)!;
    const current = getComputedStyle(row("one-b"));
    const other = getComputedStyle(row("one-a"));
    expect(current.borderTopWidth).toBe("1px");
    expect(other.borderTopWidth).toBe("1px");
    // The border is visible only on the current page.
    expect(other.borderTopColor).toBe("rgba(0, 0, 0, 0)");
    expect(current.borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(current.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(other.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(row("one-b").getBoundingClientRect().height).toBe(row("one-a").getBoundingClientRect().height);
  });
});
