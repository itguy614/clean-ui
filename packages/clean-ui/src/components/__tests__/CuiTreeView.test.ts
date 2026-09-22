import { describe, it, expect, afterEach } from "vitest";
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
    const wrapper = mount(CuiTreeView, { props: { ...baseProps, defaultExpanded: ["fruits"] } });
    const items = wrapper.findAll('[role="treeitem"]');

    // fruits (+ apple, banana) and veggies
    expect(items).toHaveLength(4);
    // A parent carries aria-expanded, reflecting its state...
    expect(items[0].attributes("aria-expanded")).toBe("true");
    expect(items.find((i) => i.text().startsWith("Veggies"))!.attributes("aria-expanded")).toBe("false");
    // ...and a leaf must NOT, or assistive tech announces every row as collapsible.
    const leaf = items.find((i) => i.text().startsWith("Apple"))!;
    expect(leaf.attributes("aria-expanded")).toBeUndefined();
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

/**
 * #74 — CuiTreeView had no keyboard handling of any kind: no tabindex, no
 * keydown listener, so expand/collapse and selection were reachable only with a
 * pointer (WCAG 2.1.1). The tree ARIA was correspondingly thin — no
 * `aria-selected`, no `role="group"` on the children wrapper, no `aria-disabled`.
 */
describe("CuiTreeView keyboard", () => {
  const deep: TreeNode[] = [
    {
      id: "a",
      label: "Alpha",
      children: [
        { id: "a1", label: "Alpha one" },
        { id: "a2", label: "Alpha two", children: [{ id: "a2x", label: "Alpha two x" }] },
      ],
    },
    { id: "b", label: "Bravo", children: [{ id: "b1", label: "Bravo one" }] },
    { id: "c", label: "Charlie" },
  ];

  // One tree at a time, torn down between tests: these assertions read
  // document.activeElement, so a leftover mount would have them querying the
  // wrong tree.
  let tree: VueWrapper | undefined;

  afterEach(() => {
    tree?.unmount();
    tree = undefined;
  });

  function mountTree(props: Record<string, unknown> = {}) {
    tree = mount(CuiTreeView, {
      attachTo: document.body,
      props: { nodes: deep, animated: false, ...props },
    });
    return tree;
  }

  const item = (id: string) =>
    tree!.element.querySelector<HTMLElement>(`[data-cui-tree-id="${id}"]`)!;
  const focusedId = () => (document.activeElement as HTMLElement | null)?.dataset.cuiTreeId;
  const tabStops = () => tree!.element.querySelectorAll('[role="treeitem"][tabindex="0"]');

  /** Press a key on whichever treeitem currently holds focus. */
  async function press(wrapper: VueWrapper, key: string) {
    const target = (document.activeElement as HTMLElement) ?? item("a");
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
  }

  it("is a single tab stop — one tabindex=0 for the whole tree", () => {
    const wrapper = mountTree({ expandAll: true });
    const minusOnes = wrapper.element.querySelectorAll('[role="treeitem"][tabindex="-1"]');

    expect(tabStops()).toHaveLength(1);
    expect(tabStops()[0].getAttribute("data-cui-tree-id")).toBe("a");
    expect(minusOnes.length).toBeGreaterThan(0);
  });

  it("moves down and up through visible items, crossing depth boundaries", async () => {
    const wrapper = mountTree({ defaultExpanded: ["a"] });
    item("a").focus();

    await press(wrapper, "ArrowDown");
    expect(focusedId()).toBe("a1");
    await press(wrapper, "ArrowDown");
    expect(focusedId()).toBe("a2");
    // out of the branch and on to the next top-level node
    await press(wrapper, "ArrowDown");
    expect(focusedId()).toBe("b");
    await press(wrapper, "ArrowUp");
    expect(focusedId()).toBe("a2");
  });

  it("does not run off either end", async () => {
    const wrapper = mountTree();
    item("a").focus();

    // Prove movement is live first — otherwise "focus did not move" is satisfied
    // by a handler that does nothing at all, and this test can never fail.
    await press(wrapper, "ArrowDown");
    expect(focusedId()).toBe("b");
    await press(wrapper, "ArrowUp");
    expect(focusedId()).toBe("a");

    await press(wrapper, "ArrowUp");
    expect(focusedId(), "already at the top").toBe("a");

    item("c").focus();
    await press(wrapper, "ArrowDown");
    expect(focusedId(), "already at the bottom").toBe("c");
  });

  it("right expands a collapsed parent, then steps into its first child", async () => {
    const wrapper = mountTree();
    item("a").focus();

    await press(wrapper, "ArrowRight");
    expect(wrapper.emitted("update:expanded")![0]).toEqual([["a"]]);
    expect(focusedId(), "expanding must not also move").toBe("a");

    await press(wrapper, "ArrowRight");
    expect(focusedId()).toBe("a1");
  });

  it("right does nothing on a leaf", async () => {
    // a1 deliberately, not the last node: on the last one a wrongly-moving Right
    // clamps back to where it started, and the test passes for the wrong reason.
    const wrapper = mountTree({ defaultExpanded: ["a"] });
    item("a1").focus();
    await press(wrapper, "ArrowRight");

    expect(focusedId()).toBe("a1");
    expect(wrapper.emitted("update:expanded")).toBeUndefined();
  });

  it("left collapses an expanded parent, then steps out to the parent", async () => {
    const wrapper = mountTree({ defaultExpanded: ["a"] });
    item("a").focus();

    await press(wrapper, "ArrowLeft");
    expect(wrapper.emitted("update:expanded")![0]).toEqual([[]]);
    expect(focusedId()).toBe("a");

  });

  it("left steps out to the parent from a child", async () => {
    const wrapper = mountTree({ defaultExpanded: ["a"] });
    item("a1").focus();

    await press(wrapper, "ArrowLeft");
    expect(focusedId()).toBe("a");
  });

  it("Home and End jump to the first and last visible items", async () => {
    const wrapper = mountTree({ defaultExpanded: ["a"] });
    item("a2").focus();

    await press(wrapper, "End");
    expect(focusedId()).toBe("c");
    await press(wrapper, "Home");
    expect(focusedId()).toBe("a");
  });

  it("Enter and Space select, matching a row click", async () => {
    for (const key of ["Enter", " "]) {
      const wrapper = mountTree();
      item("c").focus();
      await press(wrapper, key);

      expect(wrapper.emitted("node-click")![0][0]).toMatchObject({ id: "c" });
      expect(wrapper.emitted("update:modelValue")![0]).toEqual(["c"]);
      }
  });

  it("Enter toggles instead of selecting when selectable is false", async () => {
    const wrapper = mountTree({ selectable: false });
    item("a").focus();
    await press(wrapper, "Enter");

    expect(wrapper.emitted("update:expanded")![0]).toEqual([["a"]]);
    expect(wrapper.emitted("node-click")).toBeUndefined();
  });

  it("* expands every sibling at the current level", async () => {
    const wrapper = mountTree();
    item("a").focus();
    await press(wrapper, "*");

    // a and b have children; c is a leaf and is not included
    expect(wrapper.emitted("update:expanded")![0]).toEqual([["a", "b"]]);
  });

  it("type-ahead jumps to the item starting with what was typed", async () => {
    const wrapper = mountTree();
    item("a").focus();

    await press(wrapper, "b");
    expect(focusedId()).toBe("b");
  });

  it("type-ahead accumulates within the window rather than treating each key separately", async () => {
    // Discriminating because "Charlie" exists: if each keystroke were handled on
    // its own, "c" would jump there. Accumulated, the buffer is "bc", which
    // matches nothing, so focus must stay on Bravo.
    const wrapper = mountTree();
    item("a").focus();

    await press(wrapper, "b");
    expect(focusedId()).toBe("b");
    await press(wrapper, "c");
    expect(focusedId(), "'bc' matches nothing — 'c' must not be read on its own").toBe("b");
  });

  it("skips disabled nodes when moving", async () => {
    const withDisabled: TreeNode[] = [
      { id: "x", label: "Ex" },
      { id: "y", label: "Why", disabled: true },
      { id: "z", label: "Zed" },
    ];
    tree = mount(CuiTreeView, {
      attachTo: document.body,
      props: { nodes: withDisabled, animated: false },
    });
    const wrapper = tree;
    item("x").focus();
    await press(wrapper, "ArrowDown");

    expect(focusedId()).toBe("z");
  });

  it("keeps focus on the tree when a collapse hides the focused node", async () => {
    const wrapper = mountTree({ defaultExpanded: ["a"] });
    item("a1").focus();
    await press(wrapper, "ArrowLeft"); // a1 is a leaf → moves to parent "a"
    expect(focusedId()).toBe("a");

    await press(wrapper, "ArrowLeft"); // collapses "a", hiding a1/a2
    expect(document.querySelector('[data-cui-tree-id="a1"]')).toBeNull();
    // the roving tab stop is still a real, visible node
    expect(tabStops()).toHaveLength(1);
  });

  it("a row click adopts the roving focus, so Tab resumes there", async () => {
    const wrapper = mountTree();
    await rowFor(wrapper, "c").trigger("click");

    expect(item("c").getAttribute("tabindex")).toBe("0");
    expect(item("a").getAttribute("tabindex")).toBe("-1");
  });
});

describe("CuiTreeView tree ARIA", () => {
  const nodesWithChild: TreeNode[] = [
    { id: "p", label: "Parent", children: [{ id: "k", label: "Kid" }] },
    { id: "d", label: "Disabled", disabled: true },
  ];

  function mountTree(props: Record<string, unknown> = {}) {
    return mount(CuiTreeView, { props: { nodes: nodesWithChild, animated: false, ...props } });
  }

  it("marks the children wrapper as a group so depth is conveyed", () => {
    const wrapper = mountTree({ defaultExpanded: ["p"] });
    expect(wrapper.find('[role="group"]').exists()).toBe(true);
  });

  it("reports selection state", async () => {
    const wrapper = mountTree({ modelValue: "d" });
    const items = wrapper.findAll('[role="treeitem"]');
    expect(items[1].attributes("aria-selected")).toBe("true");
    expect(items[0].attributes("aria-selected")).toBe("false");
  });

  it("omits aria-selected entirely when the tree is not selectable", () => {
    const wrapper = mountTree({ selectable: false });
    expect(wrapper.find('[role="treeitem"]').attributes("aria-selected")).toBeUndefined();
  });

  it("announces multi-select only when multiple is set", () => {
    expect(mountTree().find('[role="tree"]').attributes("aria-multiselectable")).toBeUndefined();
    expect(mountTree({ multiple: true }).find('[role="tree"]').attributes("aria-multiselectable")).toBe("true");
  });

  it("marks disabled nodes, and takes them out of the tab order", () => {
    const wrapper = mountTree();
    const disabled = wrapper.findAll('[role="treeitem"]')[1];
    expect(disabled.attributes("aria-disabled")).toBe("true");
    expect(disabled.attributes("tabindex")).toBeUndefined();
  });

  it("carries level, set size and position", () => {
    const wrapper = mountTree({ defaultExpanded: ["p"] });
    const parent = wrapper.findAll('[role="treeitem"]')[0];
    expect(parent.attributes("aria-level")).toBe("1");
    expect(parent.attributes("aria-setsize")).toBe("2");
    expect(parent.attributes("aria-posinset")).toBe("1");

    const child = wrapper.findAll('[role="treeitem"]')[1];
    expect(child.attributes("aria-level")).toBe("2");
    expect(child.attributes("aria-setsize")).toBe("1");
  });
});
