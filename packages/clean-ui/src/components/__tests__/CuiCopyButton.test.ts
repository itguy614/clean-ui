import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import CuiCopyButton from "../CuiCopyButton.vue";
import CuiButton from "../CuiButton.vue";
import CuiIcon from "../CuiIcon.vue";

describe("CuiCopyButton", () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("writes the value prop to the clipboard on click", async () => {
    const wrapper = mount(CuiCopyButton, { props: { value: "hello world" } });
    await wrapper.getComponent(CuiButton).trigger("click");
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith("hello world");
    wrapper.unmount();
  });

  it("enters the copied state after a successful copy", async () => {
    const wrapper = mount(CuiCopyButton, { props: { value: "abc" } });
    // before copy: copy icon, configured color
    expect(wrapper.getComponent(CuiIcon).props("name")).toBe("copy");
    expect(wrapper.getComponent(CuiButton).props("color")).toBe("primary");

    await wrapper.getComponent(CuiButton).trigger("click");
    await vi.waitFor(() => {
      expect(wrapper.getComponent(CuiIcon).props("name")).toBe("check");
    });
    // copied state swaps the button color to success
    expect(wrapper.getComponent(CuiButton).props("color")).toBe("success");
    wrapper.unmount();
  });

  it("reverts to the idle state after resetDelay", async () => {
    const wrapper = mount(CuiCopyButton, { props: { value: "abc", resetDelay: 1500 } });
    await wrapper.getComponent(CuiButton).trigger("click");
    await vi.waitFor(() => {
      expect(wrapper.getComponent(CuiIcon).props("name")).toBe("check");
    });

    vi.advanceTimersByTime(1500);
    await wrapper.vm.$nextTick();
    expect(wrapper.getComponent(CuiIcon).props("name")).toBe("copy");
    expect(wrapper.getComponent(CuiButton).props("color")).toBe("primary");
    wrapper.unmount();
  });

  it("shows the copiedTooltip text once copied", async () => {
    const wrapper = mount(CuiCopyButton, {
      props: { value: "abc", tooltip: "Copy code", copiedTooltip: "Done!" },
    });
    await wrapper.getComponent(CuiButton).trigger("click");
    await vi.waitFor(() => {
      expect(wrapper.getComponent(CuiIcon).props("name")).toBe("check");
    });
    // tooltip text prop flips to the copied variant
    const tooltip = wrapper.findAllComponents({ name: "CuiTooltip" })[0];
    expect(tooltip.props("text")).toBe("Done!");
    wrapper.unmount();
  });
});
