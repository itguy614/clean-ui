import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiMarkdownViewer from "../CuiMarkdownViewer.vue";
import { createMarkdownRenderAdapter } from "../supplied-adapter";
import { markAsTrustedHtml } from "../contract";

describe("CuiMarkdownViewer", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  it("renders the adapter's HTML and applies clean-ui's typography class with no extra consumer setup", async () => {
    wrapper = mount(CuiMarkdownViewer, {
      props: { modelValue: "# Hello", adapter: createMarkdownRenderAdapter() },
    });
    await nextTick();

    expect(wrapper.classes()).toContain("cui-typography");
    expect(wrapper.find("h1").text()).toBe("Hello");
  });

  it("falls back to escaped source with one developer warning when the adapter throws — never blank, never propagating", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const throwingAdapter = () => {
      throw new Error("adapter exploded");
    };

    expect(() => {
      wrapper = mount(CuiMarkdownViewer, {
        props: { modelValue: "<script>alert(1)</script> not rendered", adapter: throwingAdapter },
      });
    }).not.toThrow();
    await nextTick();

    expect(wrapper!.text()).toContain("<script>alert(1)</script> not rendered");
    expect(wrapper!.html()).not.toContain("<script>alert(1)</script> not");
    expect(wrapper!.html()).toContain("&lt;script&gt;");
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]![0]).toContain("adapter threw");

    warnSpy.mockRestore();
  });

  it("re-renders cleanly on a value change — no leftover content from the previous value", async () => {
    wrapper = mount(CuiMarkdownViewer, {
      props: { modelValue: "# First", adapter: createMarkdownRenderAdapter() },
    });
    await nextTick();
    expect(wrapper.html()).toContain("First");

    await wrapper.setProps({ modelValue: "# Second" });
    await nextTick();

    expect(wrapper.html()).toContain("Second");
    expect(wrapper.html()).not.toContain("First");
    expect(wrapper.findAll("h1")).toHaveLength(1); // not accumulating extra nodes
  });

  it("re-renders cleanly when switching from a throwing adapter back to a working one", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    wrapper = mount(CuiMarkdownViewer, {
      props: {
        modelValue: "content",
        adapter: () => {
          throw new Error("boom");
        },
      },
    });
    await nextTick();
    expect(wrapper.classes()).toContain("cui-markdown-viewer--fallback");

    await wrapper.setProps({ adapter: createMarkdownRenderAdapter(), modelValue: "# Recovered" });
    await nextTick();

    expect(wrapper.classes()).not.toContain("cui-markdown-viewer--fallback");
    expect(wrapper.find("h1").text()).toBe("Recovered");
    warnSpy.mockRestore();
  });

  it("accepts a TrustedHtml value produced by markAsTrustedHtml from a third-party adapter", async () => {
    wrapper = mount(CuiMarkdownViewer, {
      props: { modelValue: "ignored by this adapter", adapter: () => markAsTrustedHtml("<p>from a third party</p>") },
    });
    await nextTick();

    expect(wrapper.text()).toBe("from a third party");
  });
});
