import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { PhPrinter } from "@phosphor-icons/vue";
import CuiList from "../CuiList.vue";
import CuiListItem from "../CuiListItem.vue";
import CuiStatusDot from "../CuiStatusDot.vue";

/** A list of `items`, each mounted with the given item props. */
function list(listProps: Record<string, unknown>, items: Array<Record<string, unknown>>, slots = {}) {
  return mount(
    defineComponent({
      render: () => h(CuiList, listProps, () => items.map((p, i) => h(CuiListItem, { key: i, ...p }, slots))),
    }),
  );
}

describe("CuiList", () => {
  it("renders a real ul of li items, with role=list for Safari", () => {
    const w = list({}, [{ title: "A" }, { title: "B" }]);
    const ul = w.find("ul.cui-list");
    expect(ul.exists()).toBe(true);
    expect(ul.attributes("role")).toBe("list");
    expect(w.findAll("ul > li.cui-list-item")).toHaveLength(2);
  });

  it("renders an ol when asked, and div rows (not li) for a div list", () => {
    expect(list({ as: "ol" }, [{ title: "A" }]).findAll("ol > li")).toHaveLength(1);

    const div = list({ as: "div" }, [{ title: "A" }]);
    expect(div.find("div.cui-list").attributes("role")).toBeUndefined();
    expect(div.findAll("li")).toHaveLength(0);
    expect(div.findAll("div.cui-list > div.cui-list-item")).toHaveLength(1);
  });

  it("never puts a divider in the markup, so the item count stays the row count", () => {
    const w = list({ variant: "inset" }, Array.from({ length: 10 }, (_, i) => ({ title: `Row ${i}` })));
    const ul = w.find("ul").element;
    expect(ul.children).toHaveLength(10);
    expect([...ul.children].every((c) => c.tagName === "LI")).toBe(true);
    expect(w.findAll("hr, [role='separator']")).toHaveLength(0);
    expect(w.findAll(".cui-list-item--divided")).toHaveLength(10);
  });

  it("divides an inset list always, and a plain one only when asked", () => {
    expect(list({}, [{ title: "A" }]).find(".cui-list-item--divided").exists()).toBe(false);
    expect(list({ divided: true }, [{ title: "A" }]).find(".cui-list-item--divided").exists()).toBe(true);
    expect(list({ variant: "inset" }, [{ title: "A" }]).find(".cui-list-item--inset").exists()).toBe(true);
  });

  it("removes a hidden item from the DOM, so first/last corners land on visible rows", () => {
    const w = list({ variant: "inset" }, [{ title: "A" }, { title: "B", hidden: true }]);
    expect(w.findAll("li")).toHaveLength(1);
  });

  it("emits its radius as a private property only when rounded is set", () => {
    expect(list({}, []).find("ul").attributes("style")).toBeUndefined();
    expect(list({ rounded: "sm" }, []).find("ul").attributes("style")).toContain("--_list-radius");
  });
});

describe("CuiListItem", () => {
  it("throws outside a CuiList", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => mount(CuiListItem, { props: { title: "A" } })).toThrow(/inside a <CuiList>/);
    vi.restoreAllMocks();
  });

  it("is a plain div row with no click listener, href or to", () => {
    const row = list({}, [{ title: "A" }]).find(".cui-list-item__row");
    expect(row.element.tagName).toBe("DIV");
    expect(row.classes()).not.toContain("cui-list-item__row--interactive");
  });

  it("is a button with a click listener, and calls it", async () => {
    const onClick = vi.fn();
    const w = list({}, [{ title: "A", onClick }]);
    const row = w.find(".cui-list-item__row");
    expect(row.element.tagName).toBe("BUTTON");
    expect(row.attributes("type")).toBe("button");
    await row.trigger("click");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is a link with href, and the href wins over a click listener", () => {
    const row = list({}, [{ title: "A", href: "/x", onClick: () => {} }]).find(".cui-list-item__row");
    expect(row.element.tagName).toBe("A");
    expect(row.attributes("href")).toBe("/x");
  });

  it("renders a router-link with to", () => {
    const RouterLink = defineComponent({ props: ["to"], setup: (_, { slots }) => () => h("a", { href: "#r" }, slots.default?.()) });
    const w = mount(
      defineComponent({ render: () => h(CuiList, null, () => h(CuiListItem, { title: "A", to: "/r" })) }),
      { global: { components: { RouterLink } } },
    );
    expect(w.findComponent(RouterLink).props("to")).toBe("/r");
  });

  it("renders any element with as", () => {
    expect(list({}, [{ title: "A", as: "label" }]).find(".cui-list-item__row").element.tagName).toBe("LABEL");
  });

  it("makes as=button a non-submitting button", () => {
    const row = list({}, [{ title: "A", as: "button", onClick: () => {} }]).find(".cui-list-item__row");
    expect(row.attributes("type")).toBe("button");
    expect(row.classes()).toContain("cui-list-item__row--interactive");
  });

  it("gives an as element with a click listener the interactive styling", () => {
    const row = list({}, [{ title: "A", as: "label", onClick: () => {} }]).find(".cui-list-item__row");
    expect(row.classes()).toContain("cui-list-item__row--interactive");
  });

  it("lets the consumer's attributes win over the row defaults", () => {
    const w = list({}, [
      { title: "A", onClick: () => {}, type: "submit" },
      { title: "B", as: "label", "aria-disabled": "true" },
    ]);
    const [button, label] = w.findAll(".cui-list-item__row");
    expect(button.attributes("type")).toBe("submit");
    expect(label.attributes("aria-disabled")).toBe("true");
  });

  it("forwards attributes to the row, keeping class on the item", () => {
    const w = list({}, [{ title: "A", href: "/a", class: "mine", "aria-current": "page" }]);
    expect(w.find("li").classes()).toContain("mine");
    expect(w.find("li").attributes("aria-current")).toBeUndefined();
    expect(w.find("a").attributes("aria-current")).toBe("page");
  });

  describe("disabled", () => {
    it("disables a button row and does not call the listener", async () => {
      const onClick = vi.fn();
      const row = list({}, [{ title: "A", onClick, disabled: true }]).find(".cui-list-item__row");
      expect(row.attributes("disabled")).toBeDefined();
      expect(row.classes()).not.toContain("cui-list-item__row--interactive");
      await row.trigger("click");
      expect(onClick).not.toHaveBeenCalled();
    });

    it("drops a modified click listener (@click.once) on a disabled row", async () => {
      const onClickOnce = vi.fn();
      const row = list({}, [{ title: "A", as: "div", onClickOnce, disabled: true }]).find(".cui-list-item__row");
      await row.trigger("click");
      expect(onClickOnce).not.toHaveBeenCalled();
    });

    it("puts no aria-disabled on a generic element, where it announces nothing", () => {
      const row = list({}, [{ title: "A", disabled: true }]).find(".cui-list-item__row");
      expect(row.attributes("aria-disabled")).toBeUndefined();
      expect(row.classes()).toContain("cui-list-item__row--disabled");
    });

    it("turns a link into a non-followable, non-focusable one", async () => {
      const onClick = vi.fn();
      const row = list({}, [{ title: "A", href: "/x", onClick, disabled: true }]).find(".cui-list-item__row");
      expect(row.attributes("href")).toBeUndefined();
      expect(row.attributes("aria-disabled")).toBe("true");
      await row.trigger("click");
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  it("renders title, subtitle and subtitle-prefix", () => {
    const w = list({}, [{ title: "Printer", subtitle: "Ready" }], {
      "subtitle-prefix": () => h(CuiStatusDot, { tone: "success" }),
    });
    expect(w.find(".cui-list-item__title").text()).toBe("Printer");
    expect(w.find(".cui-list-item__subtitle-text").text()).toBe("Ready");
    expect(w.find(".cui-list-item__subtitle .cui-status-dot").exists()).toBe(true);
  });

  it("renders a hidden chevron, which the trailing slot replaces", () => {
    const chevron = list({}, [{ title: "A", chevron: true }]).find(".cui-list-item__chevron");
    expect(chevron.attributes("aria-hidden")).toBe("true");
    expect(chevron.find("svg").exists()).toBe(true);

    const trailing = list({}, [{ title: "A", chevron: true }], { trailing: () => h("b", "3") });
    expect(trailing.find(".cui-list-item__chevron").exists()).toBe(false);
    expect(trailing.find(".cui-list-item__trailing b").text()).toBe("3");
  });

  it("takes an icon component or name, and the icon slot", () => {
    expect(list({}, [{ title: "A", icon: PhPrinter }]).find(".cui-list-item__icon svg").exists()).toBe(true);
    expect(list({}, [{ title: "A" }], { icon: () => h("img", { alt: "" }) }).find(".cui-list-item__icon img").exists()).toBe(true);
    expect(list({}, [{ title: "A" }]).find(".cui-list-item__icon").exists()).toBe(false);
  });

  it("the default slot replaces title and subtitle", () => {
    const w = list({}, [{ title: "A", subtitle: "B" }], { default: () => h("em", "custom") });
    expect(w.find(".cui-list-item__title").exists()).toBe(false);
    expect(w.find(".cui-list-item__content em").text()).toBe("custom");
  });

  it("exposes el, focus and blur on the row", () => {
    const w = mount(
      defineComponent({
        render: () => h(CuiList, null, () => h(CuiListItem, { title: "A", href: "/a", ref: "item" })),
      }),
      { attachTo: document.body },
    );
    const item = w.findComponent(CuiListItem).vm as unknown as { el: HTMLElement; focus: () => void; blur: () => void };
    expect(item.el.tagName).toBe("A");
    item.focus();
    expect(document.activeElement).toBe(item.el);
    item.blur();
    expect(document.activeElement).not.toBe(item.el);
    w.unmount();
  });
});

describe("CuiStatusDot", () => {
  it("is aria-hidden without a label, and an img with one", () => {
    const decorative = mount(CuiStatusDot, { props: { tone: "error" } });
    expect(decorative.attributes("aria-hidden")).toBe("true");
    expect(decorative.attributes("role")).toBeUndefined();

    const named = mount(CuiStatusDot, { props: { tone: "error", label: "Offline" } });
    expect(named.attributes("aria-hidden")).toBeUndefined();
    expect(named.attributes("role")).toBe("img");
    expect(named.attributes("aria-label")).toBe("Offline");
  });

  it.each([
    ["success", "--cui-success"],
    ["info", "--cui-info"],
    ["warning", "--cui-warning"],
    ["error", "--cui-error"],
    ["neutral", "--cui-surface-dark"],
  ] as const)("maps tone %s to %s", (tone, token) => {
    expect(mount(CuiStatusDot, { props: { tone } }).attributes("style")).toContain(`var(${token})`);
  });
});
