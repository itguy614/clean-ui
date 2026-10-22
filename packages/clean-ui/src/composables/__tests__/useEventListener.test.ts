import { describe, it, expect, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import { useEventListener } from "../useEventListener";

afterEach(() => vi.restoreAllMocks());

describe("useEventListener", () => {
  it("attaches while enabled, and removes the same listener with the same capture flag", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const enabled = ref(true);
    const w = mount(defineComponent(() => {
      useEventListener("window", ["scroll", "resize"], () => {}, { enabled, capture: true });
      return () => h("div");
    }));
    const listener = add.mock.calls.find(([t]) => t === "scroll")![1];
    expect(add).toHaveBeenCalledWith("resize", listener, { capture: true });

    enabled.value = false;
    await nextTick();
    expect(remove).toHaveBeenCalledWith("scroll", listener, { capture: true });
    expect(remove).toHaveBeenCalledWith("resize", listener, { capture: true });

    enabled.value = true;
    await nextTick();
    remove.mockClear();
    w.unmount();
    expect(remove).toHaveBeenCalledWith("scroll", listener, { capture: true });
  });

  it("without enabled, holds the listener for the component's life", () => {
    const handler = vi.fn();
    const w = mount(defineComponent(() => {
      useEventListener("document", "keyup", handler);
      return () => h("div");
    }));
    document.dispatchEvent(new KeyboardEvent("keyup"));
    w.unmount();
    document.dispatchEvent(new KeyboardEvent("keyup"));
    expect(handler).toHaveBeenCalledOnce();
  });
});
