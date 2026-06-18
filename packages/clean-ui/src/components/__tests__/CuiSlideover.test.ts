import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import CuiSlideover from "../CuiSlideover.vue";

// useOverlay closes via setTimeout(animationDuration=250) before emitting
// update:visible=false, so timers must be faked for deterministic close assertions.
describe("CuiSlideover", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.style.overflow = "";
  });

  it("does not render the dialog while visible=false", () => {
    const wrapper = mount(CuiSlideover, { props: { visible: false } });
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    wrapper.unmount();
  });

  it("teleports a dialog into document.body when opened via v-model:visible", async () => {
    const wrapper = mount(CuiSlideover, {
      props: { visible: false, title: "Settings" },
    });

    await wrapper.setProps({ visible: true });
    await vi.runAllTimersAsync();

    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    // Title prop renders into the teleported header.
    expect(document.body.textContent).toContain("Settings");

    wrapper.unmount();
  });

  it("closing via v-model emits update:visible=false and removes the dialog after the exit animation", async () => {
    const wrapper = mount(CuiSlideover, { props: { visible: true } });
    await vi.runAllTimersAsync();
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();

    await wrapper.setProps({ visible: false });
    await vi.runAllTimersAsync();

    expect(wrapper.emitted("update:visible")?.at(-1)).toEqual([false]);
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();

    wrapper.unmount();
  });

  it("close button emits update:visible=false and close", async () => {
    const wrapper = mount(CuiSlideover, {
      props: { visible: true, title: "Panel" },
    });
    await vi.runAllTimersAsync();

    const closeBtn = document.body.querySelector<HTMLButtonElement>(
      '[role="dialog"] button',
    );
    expect(closeBtn).not.toBeNull();

    closeBtn!.click();
    await vi.runAllTimersAsync();

    expect(wrapper.emitted("update:visible")?.at(-1)).toEqual([false]);
    expect(wrapper.emitted("close")).toHaveLength(1);

    wrapper.unmount();
  });

  it("persistent backdrop click does not close the slideover", async () => {
    const wrapper = mount(CuiSlideover, {
      props: { visible: true, persistent: true },
    });
    await vi.runAllTimersAsync();

    const backdrop = document.body.querySelector<HTMLElement>(
      '[role="dialog"]',
    )?.parentElement?.firstElementChild as HTMLElement;
    backdrop?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.runAllTimersAsync();

    expect(wrapper.emitted("update:visible")).toBeUndefined();
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();

    wrapper.unmount();
  });
});
