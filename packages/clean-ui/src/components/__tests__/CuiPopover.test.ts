import { describe, it, expect, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import CuiPopover from "../CuiPopover.vue";

// The popover panel teleports to <body> and renders only while open
// (v-if="isVisible"). It carries role="dialog", so we can locate it there.
const panel = () => document.body.querySelector('[role="dialog"]');

describe("CuiPopover behavior", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.querySelectorAll('[role="dialog"]').forEach((el) => el.remove());
  });

  it("clicking the trigger (default trigger='click') opens the panel", async () => {
    const wrapper = mount(CuiPopover, {
      attachTo: document.body,
      slots: { default: "<button>Open</button>", content: "Panel body" },
    });

    expect(panel()).toBeNull();

    await wrapper.trigger("click");

    const p = panel();
    expect(p).not.toBeNull();
    expect(p?.textContent).toContain("Panel body");

    wrapper.unmount();
  });

  it("clicking the trigger again closes it (after hideDelay)", async () => {
    vi.useFakeTimers();
    const wrapper = mount(CuiPopover, {
      attachTo: document.body,
      props: { hideDelay: 100 },
      slots: { default: "<button>Open</button>", content: "Body" },
    });

    await wrapper.trigger("click");
    expect(panel()).not.toBeNull();

    // Second click triggers doHide(), which is deferred by hideDelay.
    await wrapper.trigger("click");
    expect(panel()).not.toBeNull(); // still open before the timer fires

    vi.advanceTimersByTime(100);
    await wrapper.vm.$nextTick();
    expect(panel()).toBeNull();

    wrapper.unmount();
  });

  it("respects controlled v-model:visible", async () => {
    const wrapper = mount(CuiPopover, {
      attachTo: document.body,
      props: { visible: false },
      slots: { default: "<button>Open</button>", content: "Body" },
    });

    expect(panel()).toBeNull();

    await wrapper.setProps({ visible: true });
    expect(panel()).not.toBeNull();

    await wrapper.setProps({ visible: false });
    expect(panel()).toBeNull();

    wrapper.unmount();
  });

  it("emits update:visible when opened by a click", async () => {
    const wrapper = mount(CuiPopover, {
      attachTo: document.body,
      slots: { default: "<button>Open</button>", content: "Body" },
    });

    await wrapper.trigger("click");

    expect(wrapper.emitted("update:visible")).toBeTruthy();
    expect(wrapper.emitted("update:visible")![0]).toEqual([true]);

    wrapper.unmount();
  });

  it("the header close button hides the panel", async () => {
    vi.useFakeTimers();
    const wrapper = mount(CuiPopover, {
      attachTo: document.body,
      props: { title: "Heading", hideDelay: 0 },
      slots: { content: "Body" },
    });

    // Open via the default click trigger.
    await wrapper.trigger("click");
    const p = panel();
    expect(p).not.toBeNull();

    const closeBtn = p!.querySelector("button");
    expect(closeBtn).not.toBeNull();
    closeBtn!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await wrapper.vm.$nextTick();

    expect(panel()).toBeNull();

    wrapper.unmount();
  });
});

// #248: the prop→state watcher was not immediate, so v-model:visible already true at
// mount was ignored and the popover started closed.
describe("CuiPopover initial visibility", () => {
  afterEach(() => {
    document.body.querySelectorAll('[role="dialog"]').forEach((el) => el.remove());
  });

  it("renders open when mounted with visible: true", async () => {
    const wrapper = mount(CuiPopover, {
      attachTo: document.body,
      props: { visible: true },
      slots: { default: "<button>Open</button>", content: "Body" },
    });
    await wrapper.vm.$nextTick();
    expect(panel()).not.toBeNull();
    wrapper.unmount();
  });

  it("closes on Escape when it started open", async () => {
    // The popover joins the Escape layer stack from a watcher on the open state, which
    // also has to run for the initial value.
    const wrapper = mount(CuiPopover, {
      attachTo: document.body,
      props: { visible: true, hideDelay: 0 },
      slots: { default: "<button>Open</button>", content: "Body" },
    });
    await wrapper.vm.$nextTick();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("update:visible")?.at(-1)).toEqual([false]);
    wrapper.unmount();
  });
});
