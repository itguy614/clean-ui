import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import CuiAccordion from "../CuiAccordion.vue";
import CuiAccordionItem from "../CuiAccordionItem.vue";

function makeAccordion(accordionProps: Record<string, unknown> = {}) {
  return mount(CuiAccordion, {
    props: accordionProps,
    slots: {
      default: () => [
        h(CuiAccordionItem, { value: "a", label: "First" }, () => "Panel A"),
        h(CuiAccordionItem, { value: "b", label: "Second" }, () => "Panel B"),
        h(CuiAccordionItem, { value: "c", label: "Third" }, () => "Panel C"),
      ],
    },
  });
}

describe("CuiAccordion", () => {
  it("expands an item on header (trigger) click", async () => {
    const wrapper = makeAccordion();
    const triggers = wrapper.findAll(".cui-accordion-item__trigger");
    expect(triggers[0].attributes("aria-expanded")).toBe("false");

    await triggers[0].trigger("click");

    expect(triggers[0].attributes("aria-expanded")).toBe("true");
    expect(wrapper.findAll(".cui-accordion-item")[0].classes()).toContain(
      "cui-accordion-item--open",
    );
  });

  it("collapses an open item when its trigger is clicked again", async () => {
    const wrapper = makeAccordion();
    const trigger = wrapper.findAll(".cui-accordion-item__trigger")[0];

    await trigger.trigger("click");
    expect(trigger.attributes("aria-expanded")).toBe("true");

    await trigger.trigger("click");
    expect(trigger.attributes("aria-expanded")).toBe("false");
  });

  it("only keeps one item open at a time by default (single mode)", async () => {
    const wrapper = makeAccordion();
    const triggers = wrapper.findAll(".cui-accordion-item__trigger");

    await triggers[0].trigger("click");
    await triggers[1].trigger("click");

    expect(triggers[0].attributes("aria-expanded")).toBe("false");
    expect(triggers[1].attributes("aria-expanded")).toBe("true");
  });

  it("keeps multiple items open when multiple is true", async () => {
    const wrapper = makeAccordion({ multiple: true });
    const triggers = wrapper.findAll(".cui-accordion-item__trigger");

    await triggers[0].trigger("click");
    await triggers[1].trigger("click");

    expect(triggers[0].attributes("aria-expanded")).toBe("true");
    expect(triggers[1].attributes("aria-expanded")).toBe("true");
  });

  it("emits update:modelValue with the open values on toggle", async () => {
    const wrapper = makeAccordion({ multiple: true });
    const triggers = wrapper.findAll(".cui-accordion-item__trigger");

    await triggers[2].trigger("click");
    await triggers[0].trigger("click");

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    expect(emitted![emitted!.length - 1][0]).toEqual(["c", "a"]);
  });

  it("respects an externally controlled v-model (modelValue prop)", async () => {
    const wrapper = makeAccordion({ modelValue: ["b"] });
    const triggers = wrapper.findAll(".cui-accordion-item__trigger");

    expect(triggers[1].attributes("aria-expanded")).toBe("true");
    expect(triggers[0].attributes("aria-expanded")).toBe("false");

    await wrapper.setProps({ modelValue: ["a"] });

    expect(triggers[0].attributes("aria-expanded")).toBe("true");
    expect(triggers[1].attributes("aria-expanded")).toBe("false");
  });

  it("does not toggle a disabled item", async () => {
    const wrapper = mount(CuiAccordion, {
      slots: {
        default: () => [
          h(CuiAccordionItem, { value: "a", label: "First", disabled: true }, () => "Panel A"),
        ],
      },
    });
    const trigger = wrapper.find(".cui-accordion-item__trigger");

    await trigger.trigger("click");

    expect(trigger.attributes("aria-expanded")).toBe("false");
    expect(wrapper.emitted("update:modelValue")).toBeFalsy();
  });
});

// #272: item ids were built from `value` alone, so two accordions sharing item values
// rendered duplicate ids and their ARIA references resolved to the wrong accordion.
describe("CuiAccordion ids across instances", () => {
  it("gives each item its own ids, and its references resolve within its own accordion", () => {
    const wrapper = mount(
      defineComponent(() => () =>
        ["First", "Second"].map((name) =>
          h(CuiAccordion, { "data-name": name }, () => [
            h(CuiAccordionItem, { value: "1", label: `${name} one` }, () => "a"),
            h(CuiAccordionItem, { value: "2", label: `${name} two` }, () => "b"),
          ]),
        ),
      ),
      { attachTo: document.body },
    );
    const ids = [...document.querySelectorAll("[id]")].map((el) => el.id).filter((id) => id.startsWith("cui-accordion"));
    expect(ids.length).toBeGreaterThanOrEqual(8);
    expect(new Set(ids).size).toBe(ids.length);

    for (const acc of wrapper.findAll("[data-name]")) {
      for (const trigger of acc.findAll("[aria-controls]")) {
        const panel = document.getElementById(trigger.attributes("aria-controls")!);
        expect(panel, "aria-controls resolves").not.toBeNull();
        expect(acc.element.contains(panel)).toBe(true);
        expect(document.getElementById(panel!.getAttribute("aria-labelledby")!)).toBe(trigger.element);
      }
    }
    wrapper.unmount();
  });
});
