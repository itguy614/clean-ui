import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick } from "vue";
import CuiTabs from "../CuiTabs.vue";
import CuiTab from "../CuiTab.vue";

/**
 * #271 — the panel's aria-labelledby named its tab's *value*, which nothing in the DOM had as
 * an id, and the tab had no aria-controls: tab and panel weren't linked at all.
 */

let wrappers: VueWrapper[] = [];
afterEach(() => {
  wrappers.forEach((w) => w.unmount());
  wrappers = [];
});

// The bar renders its buttons once the panels have registered, on mount.
async function mountTabs(props: Record<string, unknown> = {}) {
  const w = mount(CuiTabs, {
    props: { modelValue: "one", ...props },
    slots: {
      default: () => [
        h(CuiTab, { value: "one", label: "One" }, () => "First"),
        h(CuiTab, { value: "two words", label: "Two" }, () => "Second"),
      ],
    },
    attachTo: document.body,
  });
  wrappers.push(w);
  await nextTick();
  return w;
}

const resolve = (id: string | undefined) => (id ? document.getElementById(id) : null);

describe("CuiTabs tab ↔ panel ids", () => {
  it("links the active tab and its panel both ways", async () => {
    const w = await mountTabs();
    const tab = w.find('[role="tab"][aria-selected="true"]');
    const panel = resolve(tab.attributes("aria-controls"))!;
    expect(panel.getAttribute("role")).toBe("tabpanel");
    expect(panel.textContent).toBe("First");
    expect(resolve(panel.getAttribute("aria-labelledby")!)).toBe(tab.element);
  });

  it("points no tab at a panel that isn't rendered, without keepAlive", async () => {
    const w = await mountTabs({ keepAlive: false });
    const inactive = w.findAll('[role="tab"]')[1];
    expect(inactive.attributes("aria-controls")).toBeUndefined();
  });

  it("links every tab to its panel with keepAlive, whose panels all stay mounted", async () => {
    const w = await mountTabs({ keepAlive: true });
    const tabs = w.findAll('[role="tab"]');
    const panels = w.findAll('[role="tabpanel"]');
    expect(tabs.map((t) => resolve(t.attributes("aria-controls")))).toEqual(panels.map((p) => p.element));
    expect(panels.map((p) => resolve(p.attributes("aria-labelledby")))).toEqual(tabs.map((t) => t.element));
  });

  it("encodes a value with spaces, so the reference is a single id", async () => {
    const w = await mountTabs({ modelValue: "two words" });
    const tab = w.find('[role="tab"][aria-selected="true"]');
    expect(tab.attributes("id")).not.toMatch(/\s/);
    const panel = resolve(tab.attributes("aria-controls"))!;
    expect(panel.textContent).toBe("Second");
    expect(resolve(panel.getAttribute("aria-labelledby")!)).toBe(tab.element);
  });

  it("gives two tab sets with the same values distinct ids, on one page", async () => {
    // One app, as on a real page: separate mounts would each restart the id counter.
    const set = () => h(CuiTabs, { modelValue: "one" }, () => [h(CuiTab, { value: "one", label: "One" }, () => "x")]);
    const w = mount({ render: () => h("div", [set(), set()]) }, { attachTo: document.body });
    wrappers.push(w);
    await nextTick();
    const [a, b] = w.findAll('[role="tab"]');
    expect(a.attributes("id")).not.toBe(b.attributes("id"));
    expect(resolve(resolve(b.attributes("aria-controls"))!.getAttribute("aria-labelledby")!)).toBe(b.element);
  });

  it("handles a value with a quote, which a selector lookup choked on", async () => {
    const w = mount(CuiTabs, {
      props: { modelValue: 'say "hi"', transition: "slide" },
      slots: { default: () => [h(CuiTab, { value: 'say "hi"', label: "A" }, () => "a"), h(CuiTab, { value: "b", label: "B" }, () => "b")] },
      attachTo: document.body,
    });
    wrappers.push(w);
    await nextTick();
    await w.findAll('[role="tab"]')[1].trigger("click"); // a slide computes the direction from the tab's index
    await nextTick();
    expect(w.find('[role="tab"][aria-selected="true"]').text()).toBe("B");
  });
});
