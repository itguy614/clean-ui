import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CuiBadge from "../CuiBadge.vue";

describe("CuiBadge", () => {
  it("does not render a remove button by default", () => {
    const wrapper = mount(CuiBadge, { slots: { default: "Tag" } });
    expect(wrapper.find(".cui-badge__remove").exists()).toBe(false);
  });

  it("renders a remove button when removable", () => {
    const wrapper = mount(CuiBadge, {
      props: { removable: true },
      slots: { default: "Tag" },
    });
    const btn = wrapper.find(".cui-badge__remove");
    expect(btn.exists()).toBe(true);
    expect(btn.attributes("aria-label")).toBeTruthy();
  });

  it("emits remove when the remove button is clicked", async () => {
    const wrapper = mount(CuiBadge, {
      props: { removable: true },
      slots: { default: "Tag" },
    });
    await wrapper.find(".cui-badge__remove").trigger("click");
    expect(wrapper.emitted("remove")).toHaveLength(1);
  });

  it("does not emit remove without interaction", () => {
    const wrapper = mount(CuiBadge, {
      props: { removable: true },
      slots: { default: "Tag" },
    });
    expect(wrapper.emitted("remove")).toBeUndefined();
  });

  it("renders slot content in standard mode", () => {
    const wrapper = mount(CuiBadge, { slots: { default: "New" } });
    expect(wrapper.text()).toContain("New");
  });

  it("renders a dot (no remove button, no content) in dot mode", () => {
    const wrapper = mount(CuiBadge, {
      props: { dot: true, removable: true },
      slots: { default: "ignored" },
    });
    expect(wrapper.find(".cui-badge__dot").exists()).toBe(true);
    // dot template branch has no remove button regardless of removable
    expect(wrapper.find(".cui-badge__remove").exists()).toBe(false);
  });
});
