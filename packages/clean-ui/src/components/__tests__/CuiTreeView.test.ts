import { describe, it, expect } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiTreeView from "../CuiTreeView.vue";
import CuiTreeNode from "../CuiTreeNode.vue";
import CuiIcon from "../CuiIcon.vue";
import type { TreeNode } from "../CuiTreeView.vue";

// Find the CuiTreeNode whose OWN node.id matches, then return its clickable
// row element (the flex div carrying the @click="onNodeClick" handler — the
// one immediately containing the node's label/content).
function rowFor(wrapper: VueWrapper, id: string | number) {
  const node = wrapper
    .findAllComponents(CuiTreeNode)
    .find((c) => (c.props("node") as TreeNode).id === id)!;
  // Within that node's subtree, the first div bearing display:flex is its own row.
  return node.findAll("div").find((d) => d.attributes("style")?.includes("display: flex"))!;
}

const nodes: TreeNode[] = [
  {
    id: "fruits",
    label: "Fruits",
    children: [
      { id: "apple", label: "Apple" },
      { id: "banana", label: "Banana", disabled: true },
    ],
  },
  { id: "veggies", label: "Veggies", children: [{ id: "carrot", label: "Carrot" }] },
];

// Disable animation so expand/collapse is synchronous (no rAF/setTimeout in jsdom).
const baseProps = { nodes, animated: false };

describe("CuiTreeView", () => {
  it("renders a treeitem per top-level node with aria-expanded only on parents", () => {
    const wrapper = mount(CuiTreeView, { props: baseProps });
    const items = wrapper.findAll('[role="treeitem"]');
    // Collapsed: only the 2 top-level nodes are present.
    expect(items).toHaveLength(2);
    // Parent nodes (have children) carry aria-expanded; it starts collapsed.
    expect(items[0].attributes("aria-expanded")).toBe("false");
  });

  it("expands a node when its chevron is clicked, revealing children", async () => {
    const wrapper = mount(CuiTreeView, { props: baseProps });
    expect(wrapper.text()).not.toContain("Apple");

    // Clicking the chevron (the caret icon) toggles expansion.
    const parent = wrapper.findAll('[role="treeitem"]')[0];
    await parent.findAllComponents({ name: "CuiIcon" })[0].trigger("click");

    expect(wrapper.text()).toContain("Apple");
    expect(wrapper.findAll('[role="treeitem"]')[0].attributes("aria-expanded")).toBe("true");
  });

  it("emits node-expand with the node and expanded state on toggle", async () => {
    const wrapper = mount(CuiTreeView, { props: baseProps });
    const parent = wrapper.findAll('[role="treeitem"]')[0];
    await parent.findAllComponents({ name: "CuiIcon" })[0].trigger("click");

    const expandEvents = wrapper.emitted("node-expand");
    expect(expandEvents).toHaveLength(1);
    const [node, isExpanded] = expandEvents![0] as [TreeNode, boolean];
    expect(node.id).toBe("fruits");
    expect(isExpanded).toBe(true);

    // Toggle again collapses.
    await wrapper.findAll('[role="treeitem"]')[0].findAllComponents({ name: "CuiIcon" })[0].trigger("click");
    const second = wrapper.emitted("node-expand")![1] as [TreeNode, boolean];
    expect(second[1]).toBe(false);
  });

  it("emits node-click and update:modelValue when a selectable leaf is clicked", async () => {
    const wrapper = mount(CuiTreeView, {
      props: { ...baseProps, defaultExpanded: ["fruits"] },
    });
    await rowFor(wrapper, "apple").trigger("click");

    expect(wrapper.emitted("node-click")).toHaveLength(1);
    expect((wrapper.emitted("node-click")![0][0] as TreeNode).id).toBe("apple");
    expect(wrapper.emitted("update:modelValue")![0]).toEqual(["apple"]);
  });

  it("toggles selection off in single mode when the selected node is clicked again", async () => {
    const wrapper = mount(CuiTreeView, {
      props: { ...baseProps, defaultExpanded: ["fruits"], modelValue: "apple" },
    });
    await rowFor(wrapper, "apple").trigger("click");

    // Already selected → clicking again clears selection to null.
    expect(wrapper.emitted("update:modelValue")![0]).toEqual([null]);
  });

  it("accumulates selection ids in multiple mode", async () => {
    const wrapper = mount(CuiTreeView, {
      props: { ...baseProps, multiple: true, defaultExpanded: ["fruits"], modelValue: ["apple"] },
    });
    // Selecting Fruits (a parent, but selectable=true so it selects) adds to the array.
    await rowFor(wrapper, "fruits").trigger("click");

    expect(wrapper.emitted("update:modelValue")![0]).toEqual([["apple", "fruits"]]);
  });

  it("does not select disabled nodes", async () => {
    const wrapper = mount(CuiTreeView, {
      props: { ...baseProps, defaultExpanded: ["fruits"] },
    });
    await rowFor(wrapper, "banana").trigger("click");

    expect(wrapper.emitted("node-click")).toBeUndefined();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });
});

describe("CuiTreeView chevron hit target", () => {
  /** The chevron box is the row's first child. */
  function chevronFor(wrapper: VueWrapper, id: string | number) {
    return rowFor(wrapper, id).element.firstElementChild as HTMLElement;
  }

  // jsdom does no layout, so assert the emitted sizing expression: the 24px
  // floor (WCAG 2.5.8) must come from scaleControlHeight, not the glyph size.
  it.each([
    ["sm", "0.75rem"],
    ["md", "0.875rem"],
    ["lg", "1rem"],
  ])("floors the %s chevron box at 24px while the glyph stays %s", (size, iconSize) => {
    const wrapper = mount(CuiTreeView, { props: { ...baseProps, size } });
    const chevron = chevronFor(wrapper, "fruits");

    expect(chevron.style.width).toBe(`max(24px, calc(${iconSize} * var(--cui-density-scale, 1)))`);
    expect(chevron.style.height).toBe(chevron.style.width);

    // the caret glyph itself is unchanged — read the icon's size prop, since
    // the rendered phosphor svg carries its dimensions differently
    const caret = wrapper
      .findAllComponents(CuiIcon)
      .find((c) => c.props("name") === "caret-right")!;
    expect(caret.props("size")).toBe(iconSize);
  });

  it("gives leaf nodes the same box so rows stay aligned and equal height", () => {
    const wrapper = mount(CuiTreeView, {
      props: { ...baseProps, size: "sm", defaultExpanded: ["fruits"] },
    });
    const parent = chevronFor(wrapper, "fruits");
    const leaf = chevronFor(wrapper, "apple");

    expect(leaf.style.width).toBe(parent.style.width);
    expect(leaf.style.height).toBe(parent.style.height);
    // ...but a leaf draws no caret
    expect(leaf.querySelector("svg")).toBeNull();
  });

  it("keeps the caret optically in place by offsetting the wider box", () => {
    const wrapper = mount(CuiTreeView, { props: { ...baseProps, size: "sm" } });
    const chevron = chevronFor(wrapper, "fruits");

    // negative margin == -(hitSize - iconSize)/2, so the glyph's centre doesn't
    // move and stays aligned with the showLines connectors
    expect(chevron.style.marginLeft).toBe(
      "calc((0.75rem - max(24px, calc(0.75rem * var(--cui-density-scale, 1)))) / 2)",
    );
  });

  it("still toggles expansion when the chevron box is clicked", async () => {
    const wrapper = mount(CuiTreeView, { props: { ...baseProps } });
    const chevron = chevronFor(wrapper, "fruits");
    chevron.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("node-expand")![0]).toEqual([expect.objectContaining({ id: "fruits" }), true]);
    // the row's own select handler must not also fire
    expect(wrapper.emitted("node-click")).toBeUndefined();
  });
});
