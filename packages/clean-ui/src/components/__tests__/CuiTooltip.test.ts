import { describe, it, expect, afterEach } from "vitest";
import { mount, enableAutoUnmount } from "@vue/test-utils";
import CuiTooltip from "../CuiTooltip.vue";

const tooltip = () => document.body.querySelector('[role="tooltip"]');

// #248 found CuiPopover ignoring v-model:visible already true at mount; CuiTooltip had
// the same non-immediate prop→state watcher.
describe("CuiTooltip controlled visibility", () => {
  enableAutoUnmount(afterEach);

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
