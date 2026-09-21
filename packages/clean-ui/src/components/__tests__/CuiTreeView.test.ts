import { describe, it, expect } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiTreeView from "../CuiTreeView.vue";
import CuiTreeNode from "../CuiTreeNode.vue";
import CuiIcon from "../CuiIcon.vue";
import type { TreeNode } from "../CuiTreeView.vue";

// Find the CuiTreeNode whose OWN node.id matches, then return its clickable
// row element. `find` returns the first match in that node's subtree, which is
// its own row rather than a descendant's.
function rowFor(wrapper: VueWrapper, id: string | number) {
  const node = wrapper
    .findAllComponents(CuiTreeNode)
    .find((c) => (c.props("node") as TreeNode).id === id)!;
  return node.find(".cui-tree-node__row");
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
  function chevronFor(wrapper: VueWrapper, id: string | number) {
    return rowFor(wrapper, id).find<HTMLElement>(".cui-tree-node__chevron").element;
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

/**
 * #94 — expansion used to be private: no `v-model:expanded`, no `defineExpose`,
 * and `defaultExpanded` read once during setup. A consumer could observe
 * expansion through `@node-expand` but could not cause it, so "expand all",
 * "reveal this search hit" and restore-after-reload all required reaching into
 * the DOM to synthesise a click on the chevron.
 */
describe("CuiTreeView expansion API", () => {
  function chevronFor(wrapper: VueWrapper, id: string | number) {
    return rowFor(wrapper, id).find(".cui-tree-node__chevron");
  }

  describe("v-model:expanded (controlled)", () => {
    it("renders exactly the ids it is given", () => {
      const wrapper = mount(CuiTreeView, { props: { ...baseProps, expanded: ["veggies"] } });
      expect(wrapper.text()).toContain("Carrot");
      expect(wrapper.text()).not.toContain("Apple");
    });

    it("reacts to the bound array changing", async () => {
      const wrapper = mount(CuiTreeView, { props: { ...baseProps, expanded: [] } });
      expect(wrapper.text()).not.toContain("Apple");

      await wrapper.setProps({ expanded: ["fruits"] });
      expect(wrapper.text()).toContain("Apple");
    });

    it("emits update:expanded on toggle without expanding itself", async () => {
      // Controlled means controlled: the parent owns the array, so the tree
      // must not move until the prop comes back changed.
      const wrapper = mount(CuiTreeView, { props: { ...baseProps, expanded: [] } });
      await chevronFor(wrapper, "fruits").trigger("click");

      expect(wrapper.emitted("update:expanded")![0]).toEqual([["fruits"]]);
      expect(wrapper.text()).not.toContain("Apple");
    });

    it("ignores defaultExpanded and expandAll when it is provided", () => {
      const wrapper = mount(CuiTreeView, {
        props: { ...baseProps, expanded: [], defaultExpanded: ["fruits"], expandAll: true },
      });
      expect(wrapper.text()).not.toContain("Apple");
      expect(wrapper.text()).not.toContain("Carrot");
    });
  });

  describe("uncontrolled", () => {
    it("still seeds from defaultExpanded", () => {
      const wrapper = mount(CuiTreeView, { props: { ...baseProps, defaultExpanded: ["fruits"] } });
      expect(wrapper.text()).toContain("Apple");
    });

    it("still seeds from expandAll", () => {
      const wrapper = mount(CuiTreeView, { props: { ...baseProps, expandAll: true } });
      expect(wrapper.text()).toContain("Apple");
      expect(wrapper.text()).toContain("Carrot");
    });

    it("manages its own state and still reports every change", async () => {
      const wrapper = mount(CuiTreeView, { props: baseProps });
      await chevronFor(wrapper, "fruits").trigger("click");

      expect(wrapper.text()).toContain("Apple");
      expect(wrapper.emitted("update:expanded")![0]).toEqual([["fruits"]]);
    });
  });

  describe("imperative methods", () => {
    it("expands, collapses and toggles a node by id", async () => {
      const wrapper = mount(CuiTreeView, { props: baseProps });
      const tree = wrapper.vm as unknown as {
        expand: (id: string) => void;
        collapse: (id: string) => void;
        toggleExpand: (id: string) => void;
        isExpanded: (id: string) => boolean;
      };

      tree.expand("fruits");
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain("Apple");
      expect(tree.isExpanded("fruits")).toBe(true);

      tree.collapse("fruits");
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).not.toContain("Apple");

      tree.toggleExpand("fruits");
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain("Apple");
    });

    it("expand and collapse are no-ops when already in that state", async () => {
      const wrapper = mount(CuiTreeView, { props: { ...baseProps, defaultExpanded: ["fruits"] } });
      (wrapper.vm as unknown as { expand: (id: string) => void }).expand("fruits");
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted("update:expanded")).toBeUndefined();
      expect(wrapper.emitted("node-expand")).toBeUndefined();
    });

    it("expandAll opens every node that has children, at any depth", async () => {
      const deep: TreeNode[] = [
        { id: "a", label: "A", children: [{ id: "b", label: "B", children: [{ id: "c", label: "C" }] }] },
      ];
      const wrapper = mount(CuiTreeView, { props: { nodes: deep, animated: false } });
      (wrapper.vm as unknown as { expandAll: () => void }).expandAll();
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("C");
      // only the two nodes that have children — "c" is a leaf
      expect(wrapper.emitted("update:expanded")![0]).toEqual([["a", "b"]]);
    });

    it("collapseAll closes everything", async () => {
      const wrapper = mount(CuiTreeView, { props: { ...baseProps, expandAll: true } });
      (wrapper.vm as unknown as { collapseAll: () => void }).collapseAll();
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).not.toContain("Apple");
      expect(wrapper.emitted("update:expanded")![0]).toEqual([[]]);
    });

    it("reveal expands a deep node's ancestors but not the node itself", async () => {
      const deep: TreeNode[] = [
        { id: "a", label: "A", children: [{ id: "b", label: "B", children: [{ id: "c", label: "C" }] }] },
        { id: "z", label: "Z", children: [{ id: "y", label: "Y" }] },
      ];
      const wrapper = mount(CuiTreeView, { props: { nodes: deep, animated: false } });
      (wrapper.vm as unknown as { reveal: (id: string) => void }).reveal("c");
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted("update:expanded")![0]).toEqual([["a", "b"]]);
      expect(wrapper.text()).toContain("C");
      // an unrelated branch stays shut
      expect(wrapper.text()).not.toContain("Y");
    });

    it("reveal is a no-op for an id that isn't in the tree", async () => {
      const wrapper = mount(CuiTreeView, { props: baseProps });
      (wrapper.vm as unknown as { reveal: (id: string) => void }).reveal("nope");
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted("update:expanded")).toBeUndefined();
    });

    it("drives a controlled tree through update:expanded rather than moving itself", async () => {
      const wrapper = mount(CuiTreeView, { props: { ...baseProps, expanded: [] } });
      (wrapper.vm as unknown as { expandAll: () => void }).expandAll();
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted("update:expanded")![0]).toEqual([["fruits", "veggies"]]);
      expect(wrapper.text()).not.toContain("Apple");
    });

    it("reports the current ids", () => {
      const wrapper = mount(CuiTreeView, { props: { ...baseProps, defaultExpanded: ["fruits"] } });
      const tree = wrapper.vm as unknown as { expandedIds: () => string[] };
      expect(tree.expandedIds()).toEqual(["fruits"]);
    });

    it("exposes el", () => {
      const wrapper = mount(CuiTreeView, { props: baseProps });
      expect((wrapper.vm as unknown as { el: HTMLElement }).el).toBe(wrapper.element);
    });
  });

  describe("node-expand", () => {
    it("fires for single-node changes, however they were caused", async () => {
      const wrapper = mount(CuiTreeView, { props: baseProps });
      (wrapper.vm as unknown as { expand: (id: string) => void }).expand("fruits");
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted("node-expand")![0]).toEqual([
        expect.objectContaining({ id: "fruits" }),
        true,
      ]);
    });

    it("does not fire per node for bulk changes — those report through the model", async () => {
      const wrapper = mount(CuiTreeView, { props: baseProps });
      (wrapper.vm as unknown as { expandAll: () => void }).expandAll();
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted("node-expand")).toBeUndefined();
      expect(wrapper.emitted("update:expanded")).toHaveLength(1);
    });
  });
});
