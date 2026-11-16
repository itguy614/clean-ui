import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter, type Router } from "vue-router";
import { nextTick } from "vue";
import Navigation from "../Navigation.vue";
import { PAGES } from "../../navigation/pages";

// jsdom has no matchMedia: a wide screen, so the sidebar is inline rather than a drawer.
window.matchMedia = ((query: string) => ({
  matches: query.includes("min-width"),
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  onchange: null,
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

const Blank = { render: () => null };

let router: Router;
let wrapper: VueWrapper;

async function mountNav(path = "/") {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:pathMatch(.*)*", component: Blank }],
  });
  await router.push(path);
  wrapper = mount(Navigation, { attachTo: document.body, global: { plugins: [router] } });
  await nextTick();
}

const box = () => wrapper.find<HTMLInputElement>("input");
const results = () => wrapper.findAll("[data-docs-search-results] a[href]");
const press = async (key: string, target: Element = box().element) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  await flushPromises();
};
async function type(value: string) {
  await box().setValue(value);
  await nextTick();
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  wrapper.unmount();
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("Navigation search", () => {
  it("sits in a named search landmark and the box has a name", async () => {
    await mountNav();
    const landmark = wrapper.find("[role='search']");
    expect(landmark.attributes("aria-label")).toBe("Search documentation");
    const labelledby = box().attributes("aria-labelledby")!;
    expect(wrapper.find(`#${labelledby}`).text()).toBe("Filter pages");
  });

  it("filters as you type and shows the empty state for a nonsense query", async () => {
    await mountNav();
    await type("dropdown");
    const hrefs = results().map((a) => a.attributes("href"));
    expect(hrefs).toContain("/components/select");
    expect(hrefs).toContain("/components/dropdown");
    expect(hrefs).not.toContain("/components/button");

    await type("qqqqq");
    expect(wrapper.text()).toContain("No matches");
  });

  it("highlights the matched text in a label", async () => {
    await mountNav();
    await type("drop");
    expect(wrapper.find("mark.docs-search-mark").text()).toBe("Drop");
  });

  it("opens every group that matches, even ones that were shut", async () => {
    await mountNav();
    await type("dialog");
    const triggers = wrapper.findAll("[data-docs-search-results] .cui-sidebar-group__trigger");
    expect(triggers.length).toBeGreaterThan(0);
    for (const trigger of triggers) expect(trigger.attributes("aria-expanded")).toBe("true");
  });

  it("restores the navigation, and which groups were open, when the box is cleared", async () => {
    await mountNav("/components/button");
    // The Actions group holds the current page, so it opens by itself.
    const open = (label: string) =>
      wrapper
        .findAll("[data-docs-nav] .cui-sidebar-group__trigger")
        .find((t) => t.text() === label.toUpperCase() || t.text() === label)!
        .attributes("aria-expanded");
    await nextTick();
    expect(open("Actions")).toBe("true");
    expect(open("Overlay")).toBe("false");

    await type("modal");
    await type("");
    expect(wrapper.find<HTMLElement>("[data-docs-nav]").element.style.display).toBe("");
    expect(open("Actions")).toBe("true");
    expect(open("Overlay")).toBe("false");
    expect(results()).toHaveLength(0);
  });

  it("announces the count once typing pauses, not on each keystroke", async () => {
    await mountNav();
    const status = () => wrapper.find("[role='status']").text();
    await type("m");
    await type("mo");
    await type("mod");
    expect(status()).toBe("");
    vi.advanceTimersByTime(600);
    await nextTick();
    expect(status()).toMatch(/pages? found$/);
    await type("qqqqq");
    vi.advanceTimersByTime(600);
    await nextTick();
    expect(status()).toBe("No matches");
  });

  it("Enter opens the best match and leaves the drawer", async () => {
    await mountNav();
    await wrapper.setProps({ open: true });
    await type("dropdown");
    await press("Enter");
    await vi.runAllTimersAsync();
    expect(router.currentRoute.value.path).toBe("/components/dropdown");
    expect(wrapper.emitted("update:open")?.at(-1)).toEqual([false]);
  });

  it("Enter does nothing when there is no match", async () => {
    await mountNav();
    await type("qqqqq");
    await press("Enter");
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("Escape clears the box and keeps focus there; on an empty box it blurs", async () => {
    await mountNav();
    box().element.focus();
    await type("modal");
    await press("Escape");
    expect(box().element.value).toBe("");
    expect(document.activeElement).toBe(box().element);
    await press("Escape");
    expect(document.activeElement).not.toBe(box().element);
  });

  it("Arrow Down moves into the results, between them, and Arrow Up from the first returns", async () => {
    await mountNav();
    box().element.focus();
    await type("dialog");
    const links = results().map((l) => l.element as HTMLElement);
    expect(links.length).toBeGreaterThan(1);

    await press("ArrowDown");
    expect(document.activeElement).toBe(links[0]);
    await press("ArrowDown", links[0]!);
    expect(document.activeElement).toBe(links[1]);
    await press("ArrowUp", links[1]!);
    expect(document.activeElement).toBe(links[0]);
    await press("ArrowUp", links[0]!);
    expect(document.activeElement).toBe(box().element);
  });

  it("Escape from a result clears the box and returns focus to it", async () => {
    await mountNav();
    await type("dialog");
    await press("ArrowDown");
    await press("Escape", document.activeElement!);
    expect(box().element.value).toBe("");
    expect(document.activeElement).toBe(box().element);
  });

  it("/ focuses the box, but not while typing elsewhere or with a modifier", async () => {
    await mountNav();
    const other = document.createElement("textarea");
    document.body.append(other);
    other.focus();
    other.dispatchEvent(new KeyboardEvent("keydown", { key: "/", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(other);

    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "/", ctrlKey: true, bubbles: true }));
    expect(document.activeElement).toBe(other);

    const slash = new KeyboardEvent("keydown", { key: "/", bubbles: true, cancelable: true });
    document.body.dispatchEvent(slash);
    expect(slash.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(box().element);
  });

  it("keeps every page reachable: the unfiltered navigation lists the whole index", async () => {
    await mountNav();
    const hrefs = new Set(wrapper.findAll("a[href]").map((a) => a.attributes("href")));
    for (const page of PAGES) expect(hrefs.has(page.path)).toBe(true);
  });
});
