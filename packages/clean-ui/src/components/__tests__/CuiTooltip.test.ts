import { describe, it, expect, afterEach, vi } from "vitest";
import { mount, enableAutoUnmount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import CuiTooltip from "../CuiTooltip.vue";
import CuiModal from "../CuiModal.vue";

enableAutoUnmount(afterEach);

const tooltip = () => document.body.querySelector('[role="tooltip"]');

// #248 found CuiPopover ignoring v-model:visible already true at mount; CuiTooltip had
// the same non-immediate prop→state watcher.
describe("CuiTooltip controlled visibility", () => {
  it("renders visible when mounted with visible: true", async () => {
    const wrapper = mount(CuiTooltip, {
      attachTo: document.body,
      props: { text: "Hint", visible: true },
      slots: { default: "<button>Target</button>" },
    });
    await wrapper.vm.$nextTick();
    expect(tooltip()).not.toBeNull();
  });

  it("starts hidden without visible", async () => {
    const wrapper = mount(CuiTooltip, {
      attachTo: document.body,
      props: { text: "Hint" },
      slots: { default: "<button>Target</button>" },
    });
    await wrapper.vm.$nextTick();
    expect(tooltip()).toBeNull();
  });
});

// #254: Escape only dismissed a tooltip while focus was inside its trigger. WCAG 1.4.13
// wants hover/focus content dismissible without moving pointer or focus.
describe("CuiTooltip Escape", () => {
  // Restore here rather than at the end of each test, so a failing assertion can't leak
  // fake timers or document spies into the rest of the file.
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const escape = (target: EventTarget = document.body) =>
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));

  it("dismisses a visible tooltip while focus is elsewhere, at once", async () => {
    const wrapper = mount(CuiTooltip, {
      attachTo: document.body,
      props: { text: "Hint", visible: true, hideDelay: 500 },
      slots: { default: "<button>Target</button>" },
    });
    await wrapper.vm.$nextTick();
    escape();
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("update:visible")?.at(-1)).toEqual([false]);
    expect(tooltip()).toBeNull(); // no hideDelay wait
  });

  it("inside a modal, the first Escape closes only the tooltip and the next closes the modal", async () => {
    vi.useFakeTimers();
    const onModal = vi.fn();
    const onTip = vi.fn();
    mount(
      defineComponent(() => () =>
        h(CuiModal, { visible: true, title: "Dialog", "onUpdate:visible": onModal }, () =>
          h(CuiTooltip, { text: "Hint", visible: true, "onUpdate:visible": onTip }, () => h("button", { id: "inside" }, "Target")),
        ),
      ),
      { attachTo: document.body },
    );
    // Let the modal finish opening: an Escape during its enter is not a close request.
    await nextTick();
    vi.runAllTimers();
    await nextTick();
    const inside = document.getElementById("inside")!;

    escape(inside);
    vi.runAllTimers();
    await nextTick();
    expect(onTip).toHaveBeenLastCalledWith(false);
    expect(onModal).not.toHaveBeenCalled();

    escape(inside);
    vi.runAllTimers();
    await nextTick();
    expect(onModal).toHaveBeenLastCalledWith(false);
  });

  it("lets Escape through to an expanded trigger so its popup closes too", async () => {
    const onTrigger = vi.fn();
    mount(CuiTooltip, {
      attachTo: document.body,
      props: { text: "Hint", visible: true },
      slots: { default: '<button id="expanded" aria-expanded="true">Target</button>' },
    });
    await nextTick();
    const trigger = document.getElementById("expanded")!;
    trigger.addEventListener("keydown", onTrigger);
    escape(trigger);
    await nextTick();
    expect(onTrigger).toHaveBeenCalledOnce();
    expect(tooltip()).toBeNull();
  });

  it("listens for Escape only while visible", async () => {
    // One ordered log, so a no-op removal (the immediate watcher runs once while hidden)
    // doesn't skew the count.
    const attached = new Set<unknown>();
    const realAdd = document.addEventListener.bind(document);
    const realRemove = document.removeEventListener.bind(document);
    vi.spyOn(document, "addEventListener").mockImplementation((type, l, o) => {
      if (type === "keydown") attached.add(l);
      realAdd(type, l, o);
    });
    vi.spyOn(document, "removeEventListener").mockImplementation((type, l, o) => {
      if (type === "keydown") attached.delete(l);
      realRemove(type, l, o);
    });
    const wrapper = mount(CuiTooltip, {
      attachTo: document.body,
      props: { text: "Hint", visible: false },
      slots: { default: "<button>Target</button>" },
    });
    const keydown = () => attached.size;
    expect(keydown()).toBe(0);

    await wrapper.setProps({ visible: true });
    expect(keydown()).toBe(1);
    await wrapper.setProps({ visible: false });
    expect(keydown()).toBe(0);

    // Unmounting while visible is covered by floating-listener-balance.test.ts.
  });
});
