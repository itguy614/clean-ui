import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import CuiBreadcrumb from "../CuiBreadcrumb.vue";
import CuiBreadcrumbItem from "../CuiBreadcrumbItem.vue";

// CuiBreadcrumbItem detects whether it is the last item via a querySelectorAll
// on its parent <ol> in onMounted, so the component must be attached to a real
// document, and the reactive isLast update needs a couple of ticks to flush.
function makeHost(extra: { breadcrumbProps?: string } = {}) {
  return defineComponent({
    components: { CuiBreadcrumb, CuiBreadcrumbItem },
    template: `
      <CuiBreadcrumb ${extra.breadcrumbProps ?? ""}>
        <CuiBreadcrumbItem href="/">Home</CuiBreadcrumbItem>
        <CuiBreadcrumbItem href="/library">Library</CuiBreadcrumbItem>
        <CuiBreadcrumbItem>Current</CuiBreadcrumbItem>
      </CuiBreadcrumb>
    `,
  });
}

async function mountHost(extra: { breadcrumbProps?: string } = {}) {
  const wrapper = mount(makeHost(extra), { attachTo: document.body });
  await nextTick();
  await nextTick();
  return wrapper;
}

describe("CuiBreadcrumb + CuiBreadcrumbItem", () => {
  it("renders a nav with the breadcrumb aria-label and one li per item", async () => {
    const wrapper = await mountHost();

    const nav = wrapper.find("nav.cui-breadcrumb");
    expect(nav.attributes("aria-label")).toBe("Breadcrumb");

    const items = wrapper.findAll("li.cui-breadcrumb-item");
    expect(items).toHaveLength(3);

    wrapper.unmount();
  });

  it("renders non-last items as links with their href", async () => {
    const wrapper = await mountHost();

    const links = wrapper.findAll("a.cui-breadcrumb-item__link");
    expect(links).toHaveLength(2);
    expect(links[0].attributes("href")).toBe("/");
    expect(links[0].text()).toBe("Home");
    expect(links[1].attributes("href")).toBe("/library");

    wrapper.unmount();
  });

  it("marks only the last item as current (aria-current=page, current class, span tag)", async () => {
    const wrapper = await mountHost();

    const currents = wrapper.findAll('[aria-current="page"]');
    expect(currents).toHaveLength(1);
    expect(currents[0].text()).toBe("Current");
    expect(currents[0].classes()).toContain("cui-breadcrumb-item__link--current");
    expect(currents[0].element.tagName).toBe("SPAN");

    wrapper.unmount();
  });

  it("renders a separator after every item except the last", async () => {
    const wrapper = await mountHost();

    const seps = wrapper.findAll(".cui-breadcrumb-item__separator");
    expect(seps).toHaveLength(2);
    expect(seps[0].text()).toBe("/");
    expect(seps[0].attributes("aria-hidden")).toBe("true");

    wrapper.unmount();
  });

  it("honors a custom separator provided via the breadcrumb context", async () => {
    const wrapper = await mountHost({ breadcrumbProps: 'separator="›"' });

    const seps = wrapper.findAll(".cui-breadcrumb-item__separator");
    expect(seps).toHaveLength(2);
    expect(seps.map((s) => s.text())).toEqual(["›", "›"]);

    wrapper.unmount();
  });
});
