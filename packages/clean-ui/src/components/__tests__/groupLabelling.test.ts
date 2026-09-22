import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import CuiRadioGroup from "../CuiRadioGroup.vue";
import CuiCheckboxGroup from "../CuiCheckboxGroup.vue";
import CuiToggleGroup from "../CuiToggleGroup.vue";
import CuiButtonGroup from "../CuiButtonGroup.vue";
import CuiDropdownRadioGroup from "../CuiDropdownRadioGroup.vue";
import CuiFormField from "../CuiFormField.vue";
import CuiRadio from "../CuiRadio.vue";

/**
 * #103 — a group cannot be named by `<label for>`: there is no single control to
 * point at, and a container div is not a *labelable* element, so the
 * association is silently never formed. The groups had the right roles but took
 * no `aria-labelledby`, so a `CuiFormField`'s visible label reached them not at
 * all — #78 deliberately left them out for this reason.
 */
const GROUPS = [
  { name: "CuiRadioGroup", component: CuiRadioGroup, role: "radiogroup" },
  { name: "CuiCheckboxGroup", component: CuiCheckboxGroup, role: "group" },
  { name: "CuiToggleGroup", component: CuiToggleGroup, role: "group" },
  { name: "CuiButtonGroup", component: CuiButtonGroup, role: "group" },
  { name: "CuiDropdownRadioGroup", component: CuiDropdownRadioGroup, role: "radiogroup" },
];

describe("group controls are nameable", () => {
  for (const { name, component, role } of GROUPS) {
    describe(name, () => {
      const mountGroup = (props: Record<string, unknown> = {}) =>
        mount(component as never, { props });

      it(`announces itself as role="${role}"`, () => {
        expect(mountGroup().find(`[role="${role}"]`).exists()).toBe(true);
      });

      it("takes aria-labelledby, which is the only thing that can name it", () => {
        const group = mountGroup({ ariaLabelledby: "lbl" }).find(`[role="${role}"]`);
        expect(group.attributes("aria-labelledby")).toBe("lbl");
      });

      it("falls back to its own label prop when there is no element to point at", () => {
        const group = mountGroup({ label: "Choose one" }).find(`[role="${role}"]`);
        expect(group.attributes("aria-label")).toBe("Choose one");
      });

      it("does not set both — aria-labelledby wins, so aria-label is noise", () => {
        const group = mountGroup({ label: "Choose one", ariaLabelledby: "lbl" }).find(`[role="${role}"]`);
        expect(group.attributes("aria-labelledby")).toBe("lbl");
        expect(group.attributes("aria-label")).toBeUndefined();
      });

      it("takes id and aria-describedby on the container", () => {
        const group = mountGroup({ id: "g1", ariaDescribedby: "hint" }).find(`[role="${role}"]`);
        expect(group.attributes("id")).toBe("g1");
        expect(group.attributes("aria-describedby")).toBe("hint");
      });
    });
  }
});

describe("CuiFormField names a group end to end", () => {
  function field(fieldProps: Record<string, unknown> = {}) {
    return mount(CuiFormField, {
      props: { label: "Size", ...fieldProps },
      slots: {
        default: (f: Record<string, unknown>) =>
          h(CuiRadioGroup, f, () => [
            h(CuiRadio, { value: "s", label: "Small" }),
            h(CuiRadio, { value: "m", label: "Medium" }),
          ]),
      },
    });
  }

  it("points the group at the rendered label", () => {
    const wrapper = field();
    const labelId = wrapper.find("label").attributes("id");

    expect(labelId).toBeTruthy();
    expect(wrapper.find('[role="radiogroup"]').attributes("aria-labelledby")).toBe(labelId);
  });

  it("points the group at its help text", () => {
    const wrapper = field({ helpText: "Pick a size" });
    const helpId = wrapper.find(".cui-form-field__help").attributes("id");

    expect(helpId).toBeTruthy();
    expect(wrapper.find('[role="radiogroup"]').attributes("aria-describedby")).toBe(helpId);
  });

  it("points the group at its error message instead, when erroring", () => {
    const wrapper = field({ error: true, errorMessage: "Required" });
    const errorId = wrapper.find(".cui-form-field__error").attributes("id");

    expect(errorId).toBeTruthy();
    expect(wrapper.find('[role="radiogroup"]').attributes("aria-describedby")).toBe(errorId);
  });

  it("leaves the group's own aria-label off, so the visible label is the name", () => {
    // Two names would be a conflict; aria-labelledby wins and points at text
    // the user can actually see.
    const wrapper = field();
    expect(wrapper.find('[role="radiogroup"]').attributes("aria-label")).toBeUndefined();
  });
});
