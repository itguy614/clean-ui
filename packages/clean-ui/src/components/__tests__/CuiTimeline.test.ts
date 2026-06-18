import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import CuiTimeline from "../CuiTimeline.vue";
import CuiTimelineItem from "../CuiTimelineItem.vue";

function makeHost(extra: { firstExtra?: string; secondExtra?: string } = {}) {
  return defineComponent({
    components: { CuiTimeline, CuiTimelineItem },
    template: `
      <CuiTimeline>
        <CuiTimelineItem title="First" ${extra.firstExtra ?? ""}>Body one</CuiTimelineItem>
        <CuiTimelineItem title="Second" ${extra.secondExtra ?? ""} last>Body two</CuiTimelineItem>
      </CuiTimeline>
    `,
  });
}

describe("CuiTimeline + CuiTimelineItem", () => {
  it("renders the timeline as a list with one listitem per child", () => {
    const wrapper = mount(makeHost());
    expect(wrapper.find('[role="list"]').exists()).toBe(true);
    const items = wrapper.findAll('[role="listitem"]');
    expect(items).toHaveLength(2);
    wrapper.unmount();
  });

  it("renders each item's title and default-slot body content", () => {
    const wrapper = mount(makeHost());
    const items = wrapper.findAll('[role="listitem"]');
    expect(items[0].text()).toContain("First");
    expect(items[0].text()).toContain("Body one");
    expect(items[1].text()).toContain("Second");
    expect(items[1].text()).toContain("Body two");
    wrapper.unmount();
  });

  it("renders items in source order", () => {
    const wrapper = mount(makeHost());
    const titles = wrapper
      .findAll('[role="listitem"]')
      .map((i) => i.text().replace(/Body (one|two)/, "").trim());
    expect(titles).toEqual(["First", "Second"]);
    wrapper.unmount();
  });

  it("applies the per-item color to the dot background", () => {
    const wrapper = mount(makeHost({ secondExtra: 'color="success"' }));
    const items = wrapper.findAll('[role="listitem"]');
    // first item defaults to primary; dot is the first descendant div with a border-radius:50% style
    const firstDot = items[0].findAll("div").find((d) => d.attributes("style")?.includes("border-radius: 50%"));
    const secondDot = items[1].findAll("div").find((d) => d.attributes("style")?.includes("border-radius: 50%"));
    expect(firstDot?.attributes("style")).toContain("var(--cui-primary)");
    expect(secondDot?.attributes("style")).toContain("var(--cui-success)");
    wrapper.unmount();
  });

  it("renders a CuiIcon in place of the plain dot when icon prop is set", () => {
    const wrapper = mount(makeHost({ firstExtra: 'icon="check"' }));
    const items = wrapper.findAll('[role="listitem"]');
    expect(items[0].find(".cui-icon").exists()).toBe(true);
    // the non-icon item has no icon rendered
    expect(items[1].find(".cui-icon").exists()).toBe(false);
    wrapper.unmount();
  });

  it("omits the connector line on the item marked last", () => {
    // first item is not last (has connector), second item has last prop (no connector)
    const wrapper = mount(makeHost());
    const items = wrapper.findAll('[role="listitem"]');
    const connectorsFirst = items[0].findAll("div").filter((d) => d.attributes("style")?.includes("width: 2px"));
    const connectorsSecond = items[1].findAll("div").filter((d) => d.attributes("style")?.includes("width: 2px"));
    expect(connectorsFirst.length).toBe(1);
    expect(connectorsSecond.length).toBe(0);
    wrapper.unmount();
  });
});
