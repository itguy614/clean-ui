import { describe, it, expect, afterEach } from "vitest";
import { mount, enableAutoUnmount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import CuiDivider from "../CuiDivider.vue";

/**
 * #157 — ARIA defaults `separator` to horizontal, and none of the four branches set
 * aria-orientation, so vertical dividers were announced as horizontal. And a label
 * rendered inside `role="separator"` is presentational, so "OR" or a section title was
 * likely announced as nothing; it is now the separator's name via aria-labelledby.
 */
describe("CuiDivider semantics", () => {
  enableAutoUnmount(afterEach);

  const separator = (wrapper: ReturnType<typeof mount>) => wrapper.get('[role="separator"]').element;

  /** The text aria-labelledby points at, asserting it resolves inside the separator. */
  function labelOf(wrapper: ReturnType<typeof mount>): string {
    const el = separator(wrapper);
    const label = document.getElementById(el.getAttribute("aria-labelledby")!);
    expect(label, "aria-labelledby resolves").not.toBeNull();
    expect(el.contains(label)).toBe(true);
    return label!.textContent!.trim();
  }

  it.each([
    ["horizontal", {}],
    ["horizontal", { label: "OR" }],
    ["vertical", { orientation: "vertical" }],
    ["vertical", { orientation: "vertical", label: "OR" }],
  ])("announces %s for %o", (expected, props) => {
    const wrapper = mount(CuiDivider, { props });
    expect(separator(wrapper).getAttribute("aria-orientation")).toBe(expected);
  });

  it.each([{}, { orientation: "vertical" }])("is named by its label prop (%o)", (props) => {
    const wrapper = mount(CuiDivider, { props: { ...props, label: "OR" }, attachTo: document.body });
    expect(labelOf(wrapper)).toBe("OR");
  });

  it("is named by default-slot content", () => {
    const wrapper = mount(CuiDivider, { slots: { default: "<strong>Section</strong>" }, attachTo: document.body });
    expect(labelOf(wrapper)).toBe("Section");
  });

  it("hides the decorative lines either side of the label", () => {
    const wrapper = mount(CuiDivider, { props: { label: "OR" } });
    const lines = [...separator(wrapper).children].filter((c) => !c.id);
    expect(lines).toHaveLength(2);
    expect(lines.every((l) => l.getAttribute("aria-hidden") === "true")).toBe(true);
  });

  it("has no aria-labelledby without a label", () => {
    const wrapper = mount(CuiDivider);
    expect(separator(wrapper).hasAttribute("aria-labelledby")).toBe(false);
  });

  it("picks up a label slot the parent adds after first render", async () => {
    // hasLabel used to be a computed over the non-reactive `slots`, caching the first answer.
    const withLabel = ref(false);
    const wrapper = mount(
      defineComponent(() => () => h(CuiDivider, null, withLabel.value ? { default: () => "Late" } : undefined)),
      { attachTo: document.body },
    );
    withLabel.value = true;
    await nextTick();
    expect(labelOf(wrapper)).toBe("Late");
  });

  it("gives each labelled divider its own label id", () => {
    const wrapper = mount(
      defineComponent(() => () => [h(CuiDivider, { label: "One" }), h(CuiDivider, { label: "Two" })]),
    );
    const ids = wrapper.findAll('[role="separator"]').map((s) => s.attributes("aria-labelledby"));
    expect(new Set(ids).size).toBe(2);
  });
});
