import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiSelect from "../../components/CuiSelect.vue";
import CuiCombobox from "../../components/CuiCombobox.vue";
import CuiTagInput from "../../components/CuiTagInput.vue";
import preflight from "../../styles/preflight.css?inline";

// CuiCombobox and CuiTagInput measured their WRAPPER to position the dropdown.
// The wrapper also holds the label above the control and the error message
// below it, so an upward-opening panel was anchored 4px above the *label* —
// a gap the height of the label, which reads as the dropdown detaching from the
// field. CuiSelect measures its trigger and has always looked right, so it is
// the reference here.
//
// Real Chromium: the bug is entirely in measured layout, which jsdom reports as
// zero for everything.
describe("dropdown anchoring near the viewport bottom (real browser)", () => {
  let wrapper: VueWrapper | undefined;


  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.getElementById("spacer")?.remove();
  });

  const options = Array.from({ length: 12 }, (_, i) => ({
    value: `v${i}`,
    label: `Option ${i + 1}`,
  }));

  /** Push the field to the bottom of the viewport so its dropdown must open upward. */
  function bottomHost() {
    const host = document.createElement("div");
    host.id = "spacer";
    host.style.cssText = "position: fixed; left: 24px; width: 260px; bottom: 0; height: 90px;";
    document.body.append(host);
    return host;
  }

  async function settle(w: VueWrapper) {
    await w.vm.$nextTick();
    await w.vm.$nextTick();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  }

  /** The gap between the control's top edge and the panel's bottom edge. */
  function gapAboveControl(controlSelector: string, panelSelector: string) {
    const control = document.querySelector<HTMLElement>(controlSelector);
    const panel = document.querySelector<HTMLElement>(panelSelector);
    expect(control, `missing ${controlSelector}`).toBeTruthy();
    expect(panel, `missing ${panelSelector} — dropdown not open`).toBeTruthy();
    return control!.getBoundingClientRect().top - panel!.getBoundingClientRect().bottom;
  }

  it("CuiSelect sits just above its control (the reference)", async () => {
    wrapper = mount(CuiSelect, {
      attachTo: bottomHost(),
      props: { label: "Pick one", options },
    });
    await wrapper.find(".cui-select__trigger").trigger("click");
    await settle(wrapper);

    expect(gapAboveControl(".cui-select__trigger", ".cui-select__dropdown")).toBeCloseTo(4, 0);
  });

  it("CuiCombobox sits just above its control, not above its label", async () => {
    wrapper = mount(CuiCombobox, {
      attachTo: bottomHost(),
      props: { label: "Pick one", options },
    });
    await wrapper.find("input").trigger("focus");
    await settle(wrapper);

    // Was anchored to the wrapper, so the gap was the label's height plus 4px.
    expect(gapAboveControl(".cui-combobox__control", ".cui-combobox__dropdown")).toBeCloseTo(4, 0);
  });

  it("CuiTagInput sits just above its control, not above its label", async () => {
    wrapper = mount(CuiTagInput, {
      attachTo: bottomHost(),
      props: {
        label: "Add tags",
        suggestions: options.map((o) => ({ value: o.value, label: o.label })),
      },
    });
    const input = wrapper.find("input");
    await input.trigger("focus");
    await input.setValue("Option");
    await settle(wrapper);

    expect(gapAboveControl(".cui-tag-input__control", ".cui-tag-input__dropdown")).toBeCloseTo(4, 0);
  });

  it("bounds an upward panel by the room above, not the roomier side", async () => {
    // Opened upward with little room above, the panel used to be sized from
    // `Math.max(spaceBelow, spaceAbove)` and could run off the top of the screen.
    wrapper = mount(CuiCombobox, {
      attachTo: bottomHost(),
      props: { label: "Pick one", options },
    });
    await wrapper.find("input").trigger("focus");
    await settle(wrapper);

    const panel = document.querySelector<HTMLElement>(".cui-combobox__dropdown")!;
    expect(panel.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
  });
});
