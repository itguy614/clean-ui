import { describe, it, expect, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
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

// #159: the header id was the literal "cui-popover-title", so every titled popover on
// a page shared it and aria-labelledby resolved to whichever the browser found first.
// These assert the reference *resolves* to this popover's own title, not merely that
// the attribute is present.
describe("CuiPopover accessible name", () => {
  afterEach(() => {
    document.body.querySelectorAll('[role="dialog"]').forEach((el) => el.remove());
  });

  const nameOf = (dialog: Element) => {
    const id = dialog.getAttribute("aria-labelledby");
    expect(id).toBeTruthy();
    const label = document.getElementById(id!);
    expect(label).not.toBeNull();
    // The label must be inside this dialog, not another popover's.
    expect(dialog.contains(label)).toBe(true);
    return label!.textContent!.trim();
  };

  it("gives each titled popover on a page its own title id", async () => {
    // One app, as on a real page: useId() is unique per app.
    const visible = ref(false);
    const wrapper = mount(
      defineComponent(() => () =>
        ["First", "Second"].map((title) =>
          h(CuiPopover, { title, visible: visible.value }, { default: () => h("button", title), content: () => "Body" }),
        ),
      ),
      { attachTo: document.body },
    );
    visible.value = true;
    await nextTick();

    const dialogs = [...document.body.querySelectorAll('[role="dialog"]')];
    expect(dialogs).toHaveLength(2);
    expect(dialogs.map(nameOf)).toEqual(["First", "Second"]);
    expect(dialogs[0].getAttribute("aria-labelledby")).not.toBe(dialogs[1].getAttribute("aria-labelledby"));

    wrapper.unmount();
  });

  it("names the dialog from a #header slot used without the title prop", async () => {
    const wrapper = mount(CuiPopover, {
      attachTo: document.body,
      props: { visible: false, closable: true },
      slots: { default: "<button>Open</button>", header: "<strong>Custom header</strong>", content: "Body" },
    });
    await wrapper.setProps({ visible: true });

    // The close button sits in the header row too, but is not part of the name.
    expect(nameOf(panel()!)).toBe("Custom header");
    wrapper.unmount();
  });

  it("has no aria-labelledby without a header", async () => {
    const wrapper = mount(CuiPopover, {
      attachTo: document.body,
      props: { visible: false },
      slots: { default: "<button>Open</button>", content: "Body" },
    });
    await wrapper.setProps({ visible: true });

    expect(panel()!.hasAttribute("aria-labelledby")).toBe(false);
    wrapper.unmount();
  });
});
