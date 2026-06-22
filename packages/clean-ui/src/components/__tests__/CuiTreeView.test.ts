import { describe, it, expect } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiTreeView from "../CuiTreeView.vue";
import CuiTreeNode from "../CuiTreeNode.vue";
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
