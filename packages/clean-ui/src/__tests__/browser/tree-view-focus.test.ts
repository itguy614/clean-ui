import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import CuiTreeView from "../../components/CuiTreeView.vue";
import type { TreeNode } from "../../components/CuiTreeView.vue";
import preflight from "../../styles/preflight.css?inline";

// The roving focus added for #74 is half DOM, half CSS, and jsdom can verify
// neither: it has no layout, and no concept of `:focus-visible` at all. So the
// focus ring — and the fact that focus lands on a row a sighted keyboard user
// can actually see — are only checkable in a real browser.
describe("CuiTreeView focus (real browser)", () => {
  let wrapper: VueWrapper | undefined;

  beforeAll(() => {
    const style = document.createElement("style");
    // The focus-ring token has to be defined, not just the reset: the rule is
    // `outline: 2px solid var(--cui-primary-focus-ring)`, and an undefined
    // custom property makes the whole declaration invalid at computed-value
    // time — `outline-style` silently falls back to `none` and the assertion
    // reads as "no ring" for the wrong reason.
    style.textContent = `
      @layer theme, base, components, utilities;
      @layer base { ${preflight} }
      :root { --cui-primary-focus-ring: rgba(59, 70, 200, 0.4); }
    `;
    document.head.append(style);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  const nodes: TreeNode[] = [
    { id: "a", label: "Alpha", children: [{ id: "a1", label: "Alpha one" }] },
    { id: "b", label: "Bravo" },
  ];

  function mountTree(props: Record<string, unknown> = {}) {
    wrapper = mount(CuiTreeView, {
      attachTo: document.body,
      props: { nodes, animated: false, ...props },
    });
    return wrapper;
  }

  const item = (id: string) =>
    wrapper!.element.querySelector<HTMLElement>(`[data-cui-tree-id="${id}"]`)!;
  const rowOf = (id: string) => item(id).querySelector<HTMLElement>(".cui-tree-node__row")!;
  const outlineOf = (el: Element) => getComputedStyle(el).outlineStyle;

  // Real keyboard input through the browser, not dispatchEvent. `:focus-visible`
  // keys off Chromium's "was the last interaction a keyboard one" heuristic,
  // which only trusted events set — a synthesised KeyboardEvent leaves the ring
  // off and the assertion silently inverted.
  async function key(k: string) {
    await userEvent.keyboard(k);
    await wrapper!.vm.$nextTick();
    await wrapper!.vm.$nextTick();
    await new Promise((r) => requestAnimationFrame(() => r(null)));
  }

  it("draws the focus ring on the row, not around the whole subtree", async () => {
    mountTree({ defaultExpanded: ["a"] });
    item("a").focus();
    await key("{ArrowDown}"); // keyboard interaction → :focus-visible

    const focused = document.activeElement as HTMLElement;
    expect(focused.dataset.cuiTreeId).toBe("a1");

    // The row is outlined...
    expect(outlineOf(rowOf("a1"))).not.toBe("none");
    // ...and the treeitem element itself is not, even though it holds the
    // tabindex and the focus. It wraps the entire subtree, so an outline there
    // would box in every descendant.
    expect(outlineOf(item("a1"))).toBe("none");
  });

  it("gives the focused row a visible box, not a zero-sized one", async () => {
    mountTree();
    item("a").focus();
    await key("{ArrowDown}");

    const rect = rowOf("b").getBoundingClientRect();
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
  });

  it("moves real DOM focus, so a screen reader follows the arrow keys", async () => {
    mountTree({ defaultExpanded: ["a"] });
    item("a").focus();
    expect(document.activeElement).toBe(item("a"));

    await key("{ArrowDown}");
    expect(document.activeElement).toBe(item("a1"));

    await key("{ArrowUp}");
    expect(document.activeElement).toBe(item("a"));
  });

  it("keeps exactly one reachable tab stop as focus moves", async () => {
    mountTree({ expandAll: true });
    item("a").focus();
    await key("{ArrowDown}");

    const stops = wrapper!.element.querySelectorAll('[role="treeitem"][tabindex="0"]');
    expect(stops).toHaveLength(1);
    expect((stops[0] as HTMLElement).dataset.cuiTreeId).toBe("a1");
  });

  it("does not ring the row on a pointer click", async () => {
    // `:focus-visible` is the point — a mouse user gets no keyboard focus ring,
    // even though the click does adopt the roving tab stop.
    mountTree();
    await userEvent.click(rowOf("b"));
    await wrapper!.vm.$nextTick();

    expect(outlineOf(rowOf("b"))).toBe("none");
    expect(item("b").getAttribute("tabindex")).toBe("0");
  });
});
