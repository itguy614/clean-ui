import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { defineComponent, h, reactive } from "vue";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiSlideover from "../CuiSlideover.vue";
import CuiDrawer from "../CuiDrawer.vue";
import CuiSlideoverStack from "../CuiSlideoverStack.vue";

/**
 * #41 — a panel declared inside another panel's content is its child, by component tree
 * (the DOM is no help: both teleport to the body). Closing the parent closes the child, children
 * first; closing a child leaves its parent; a sibling is nobody's child.
 */
const flush = () => vi.runAllTimersAsync();
const escape = () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
const dialogs = () => [...document.body.querySelectorAll('[role="dialog"]')];

let wrappers: VueWrapper[] = [];

function mountNested(opts: { stack?: boolean; childKind?: "slideover" | "drawer" } = {}) {
  const st = reactive({ opener: false, parent: false, child: false, grand: false, sibling: false });
  const log: string[] = [];
  const bind = (key: "parent" | "child" | "grand" | "sibling") => ({
    visible: st[key],
    "onUpdate:visible": (v: boolean) => (st[key] = v),
    onClose: () => log.push(key),
    "data-testid": key,
  });
  const Child = opts.childKind === "drawer" ? CuiDrawer : CuiSlideover;
  const tree = () => [
    h("button", { id: "opener" }, "opener"),
    h(CuiSlideover, bind("parent"), {
      default: () => [
        h("button", { id: "in-parent" }, "in parent"),
        h(Child, bind("child"), {
          default: () => [h("button", { id: "in-child" }, "in child"), h(CuiSlideover, bind("grand"), { default: () => h("button", { id: "in-grand" }, "g") })],
        }),
      ],
    }),
    h(CuiSlideover, bind("sibling"), { default: () => h("button", { id: "in-sibling" }, "s") }),
  ];
  const w = mount(
    defineComponent({ render: () => (opts.stack ? h(CuiSlideoverStack, null, { default: tree }) : h("div", tree())) }),
    { attachTo: document.body },
  );
  wrappers.push(w);
  return { st, log };
}

describe.each([{ stack: false }, { stack: true }])("nested panels (stack: $stack)", ({ stack }) => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    wrappers.splice(0).forEach((w) => w.unmount());
    vi.useRealTimers();
    document.body.innerHTML = "";
    document.body.style.overflow = "";
  });

  async function openAll(st: Record<string, boolean>, keys: string[]) {
    for (const k of keys) {
      st[k] = true;
      await flush();
    }
  }

  it("closing the parent closes the open child, and the child's v-model follows", async () => {
    const { st } = mountNested({ stack });
    await openAll(st, ["parent", "child"]);
    expect(dialogs()).toHaveLength(2);
    st.parent = false;
    await flush();
    expect(st.child).toBe(false);
    expect(st.parent).toBe(false);
    expect(dialogs()).toHaveLength(0);
  });

  it("each reports close, the children first", async () => {
    const { st, log } = mountNested({ stack });
    await openAll(st, ["parent", "child", "grand"]);
    st.parent = false;
    await flush();
    expect(log).toEqual(["grand", "child", "parent"]);
    expect(st.grand).toBe(false);
  });

  it("closes three deep from the middle: the grandchild goes, the parent stays", async () => {
    const { st } = mountNested({ stack });
    await openAll(st, ["parent", "child", "grand"]);
    st.child = false;
    await flush();
    expect(st.grand).toBe(false);
    expect(st.parent).toBe(true);
    expect(dialogs()).toHaveLength(1);
  });

  it("closing a child alone does not close its parent", async () => {
    const { st } = mountNested({ stack });
    await openAll(st, ["parent", "child"]);
    st.child = false;
    await flush();
    expect(st.parent).toBe(true);
    expect(dialogs()).toHaveLength(1);
  });

  it("Escape closes the top panel only; a second one closes its parent, which had no children left", async () => {
    const { st, log } = mountNested({ stack });
    await openAll(st, ["parent", "child"]);
    escape();
    await flush();
    expect(st.child).toBe(false);
    expect(st.parent).toBe(true);
    escape();
    await flush();
    expect(log).toEqual(["child", "parent"]);
  });

  it("Escape after a cascade has nothing left to close and does not throw", async () => {
    const { st } = mountNested({ stack });
    await openAll(st, ["parent", "child"]);
    st.parent = false;
    await flush();
    escape();
    await flush();
    expect(dialogs()).toHaveLength(0);
  });

  it("a sibling is independent in both directions", async () => {
    const { st } = mountNested({ stack });
    await openAll(st, ["parent", "child", "sibling"]);
    st.parent = false;
    await flush();
    expect(st.child).toBe(false);
    expect(st.sibling).toBe(true);
    st.sibling = false;
    await flush();
    expect(dialogs()).toHaveLength(0);
  });

  it("closing a sibling leaves a parent and its child", async () => {
    const { st } = mountNested({ stack });
    await openAll(st, ["sibling", "parent", "child"]);
    st.sibling = false;
    await flush();
    expect(st.parent).toBe(true);
    expect(st.child).toBe(true);
  });

  it("focus returns to the parent's opener, not the child's, which is inside the parent", async () => {
    const { st } = mountNested({ stack });
    const opener = document.getElementById("opener")!;
    opener.focus();
    st.parent = true;
    await flush();
    document.getElementById("in-parent")!.focus();
    st.child = true;
    await flush();
    document.getElementById("in-child")!.focus();
    st.parent = false;
    await flush();
    expect(document.activeElement).toBe(opener);
  });

  it("a child closing alone returns focus to the control inside its parent", async () => {
    const { st } = mountNested({ stack });
    st.parent = true;
    await flush();
    const inParent = document.getElementById("in-parent")!;
    inParent.focus();
    st.child = true;
    await flush();
    st.child = false;
    await flush();
    expect(document.activeElement).toBe(inParent);
  });

  it("the parent closing while the child is mid-enter leaves nothing behind", async () => {
    const { st } = mountNested({ stack });
    st.parent = true;
    await flush();
    st.child = true;
    // Not flushed: the child has not even flipped to its open state.
    await Promise.resolve();
    st.parent = false;
    await flush();
    expect(st.child).toBe(false);
    expect(dialogs()).toHaveLength(0);
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("releases the scroll lock once, after the last of the cascade", async () => {
    const { st } = mountNested({ stack });
    await openAll(st, ["parent", "child", "grand"]);
    expect(document.body.style.overflow).toBe("hidden");
    st.parent = false;
    await flush();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("a drawer child goes with its parent too", async () => {
    const { st } = mountNested({ stack, childKind: "drawer" });
    await openAll(st, ["parent", "child"]);
    st.parent = false;
    await flush();
    expect(st.child).toBe(false);
  });
});
