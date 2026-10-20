import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiStepper from "../CuiStepper.vue";
import { describeRovingFocusContract } from "../../composables/__tests__/roving-focus-contract";

/**
 * #154 — the steps were click-only divs in a flat role="navigation": not operable from the
 * keyboard, and nothing conveyed "step 2 of 4". They are now an <ol>, and a step that can be
 * navigated to is a <button>.
 */

const steps = [{ label: "Account" }, { label: "Profile" }, { label: "Billing", error: true }, { label: "Done" }];

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
});

function mountStepper(props: Record<string, unknown> = {}) {
  w = mount(CuiStepper, {
    props: { steps, modelValue: 1, ...props, "onUpdate:modelValue": (v: number) => w!.setProps({ modelValue: v }) },
    attachTo: document.body,
  });
  return w;
}

const items = () => w!.findAll("li");
const buttons = () => w!.findAll("button.cui-stepper__button");

describe("CuiStepper semantics", () => {
  it("is a named nav around an ordered list of steps", () => {
    mountStepper();
    expect(w!.find("nav").attributes("aria-label")).toBe("Progress");
    expect(w!.find("nav > ol").exists()).toBe(true);
    expect(items()).toHaveLength(4);
  });

  it("makes reachable steps buttons, and linear-blocked ones plain text", () => {
    mountStepper();
    // Account (complete) and Profile (current) can be reached; Billing and Done are ahead.
    expect(buttons().map((b) => b.text())).toEqual([expect.stringContaining("Account"), expect.stringContaining("Profile")]);
    expect(items()[3].find("button").exists()).toBe(false);
  });

  it("marks the current step and reads the status the icons show", () => {
    mountStepper({ modelValue: 3 });
    expect(items()[3].find('[aria-current="step"]').exists()).toBe(true);
    expect(items()[0].find(".cui-sr-only").text()).toBe(", completed");
    expect(items()[2].find(".cui-sr-only").text()).toBe(", error");
  });

  it("puts the tab stop on the current step", () => {
    mountStepper({ modelValue: 1 });
    expect(buttons().map((b) => b.attributes("tabindex"))).toEqual(["-1", "0"]);
  });

  it("goes back to a step when its button is pressed", async () => {
    mountStepper({ modelValue: 2 });
    await buttons()[0].trigger("click");
    expect(w!.emitted("update:modelValue")).toEqual([[0]]);
  });

  it("renders no buttons when not clickable", () => {
    mountStepper({ clickable: false });
    expect(buttons()).toHaveLength(0);
  });

  it("makes every step a button when not linear", () => {
    mountStepper({ linear: false });
    expect(buttons()).toHaveLength(4);
  });
});

describeRovingFocusContract("CuiStepper", {
  mount: () => mount(CuiStepper, { props: { steps, modelValue: 0, linear: false }, attachTo: document.body }),
  items: () => [...document.querySelectorAll<HTMLElement>(".cui-stepper__button")],
  orientation: "horizontal",
});
