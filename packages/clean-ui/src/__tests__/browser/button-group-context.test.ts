import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick } from "vue";
import CuiButtonGroup from "../../components/CuiButtonGroup.vue";
import CuiButton from "../../components/CuiButton.vue";
import CuiInput from "../../components/CuiInput.vue";
import CuiRadio from "../../components/CuiRadio.vue";
import CuiRadioGroup from "../../components/CuiRadioGroup.vue";
import { useButtonGroupContext } from "../../composables/useButtonGroup";

/**
 * #444: a button sets its own corners from the group context it injects, instead of
 * CuiButtonGroup and CuiInput reaching into it with `:deep()` selectors. These measure the
 * radius the browser actually computes, per corner, so a regression to either side shows.
 */
describe("button group context (real browser)", () => {
  let wrapper: VueWrapper | undefined;
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  const CORNERS = ["border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius"];
  /** [top-left, top-right, bottom-right, bottom-left] in px. */
  const radii = (el: Element) => CORNERS.map((p) => parseFloat(getComputedStyle(el).getPropertyValue(p)));
  const R = 6; // the default `md` radius, 0.375rem
  const mounted = async (render: () => ReturnType<typeof h>) => {
    wrapper = mount(render, { attachTo: document.body });
    await nextTick();
    return [...wrapper.element.querySelectorAll<HTMLElement>(".cui-button")];
  };
  const buttons = (n: number) => () => Array.from({ length: n }, (_, i) => h(CuiButton, { key: i }, () => `B${i}`));

  it("rounds the outer corners of the first and last, and none of the middle", async () => {
    const [first, middle, last] = await mounted(() => h(CuiButtonGroup, { label: "g" }, buttons(3)));
    expect(radii(first)).toEqual([R, 0, 0, R]);
    expect(radii(middle)).toEqual([0, 0, 0, 0]);
    expect(radii(last)).toEqual([0, R, R, 0]);
  });

  it("does the same down a vertical group", async () => {
    const [top, middle, bottom] = await mounted(() => h(CuiButtonGroup, { label: "g", orientation: "vertical" }, buttons(3)));
    expect(radii(top)).toEqual([R, R, 0, 0]);
    expect(radii(middle)).toEqual([0, 0, 0, 0]);
    expect(radii(bottom)).toEqual([0, 0, R, R]);
  });

  it("leaves a lone button in a group fully rounded", async () => {
    const [only] = await mounted(() => h(CuiButtonGroup, { label: "g" }, buttons(1)));
    expect(radii(only)).toEqual([R, R, R, R]);
  });

  it("leaves a standalone button, even beside others, fully rounded", async () => {
    const all = await mounted(() => h("div", buttons(2)()));
    for (const b of all) {
      expect(radii(b)).toEqual([R, R, R, R]);
      expect(b.className).not.toContain("cui-button--grouped");
    }
  });

  it("follows a button's own radius token", async () => {
    const [first] = await mounted(() =>
      h("div", { style: "--cui-button-radius: 10px" }, [h(CuiButtonGroup, { label: "g" }, buttons(2))]),
    );
    expect(radii(first)).toEqual([10, 0, 0, 10]);
  });

  it("updates positions when a button is added or removed", async () => {
    let count = 2;
    wrapper = mount({ render: () => h(CuiButtonGroup, { label: "g" }, buttons(count)) }, { attachTo: document.body });
    await nextTick();
    const items = () => [...wrapper!.element.querySelectorAll<HTMLElement>(".cui-button")];
    expect(radii(items()[1]!)).toEqual([0, R, R, 0]);
    count = 3;
    await wrapper.vm.$forceUpdate();
    await nextTick();
    expect(radii(items()[1]!)).toEqual([0, 0, 0, 0]);
    expect(radii(items()[2]!)).toEqual([0, R, R, 0]);
  });

  it("overlaps the shared border from the second button on", async () => {
    const [first, second] = await mounted(() => h(CuiButtonGroup, { label: "g" }, buttons(2)));
    expect(getComputedStyle(first).marginLeft).toBe("0px");
    expect(getComputedStyle(second).marginLeft).toBe("-1px");
  });

  it("merges the radio buttons of a button-variant RadioGroup", async () => {
    wrapper = mount(
      () => h(CuiRadioGroup, { variant: "buttons", modelValue: "a" }, () => ["a", "b", "c"].map((v) => h(CuiRadio, { value: v, label: v }))),
      { attachTo: document.body },
    );
    await nextTick();
    const [a, b, c] = [...wrapper.element.querySelectorAll(".cui-radio-button")];
    expect(radii(a!)).toEqual([R, 0, 0, R]);
    expect(radii(b!)).toEqual([0, 0, 0, 0]);
    expect(radii(c!)).toEqual([0, R, R, 0]);
  });

  describe("CuiInput attached buttons", () => {
    it("rounds the outer corner of each, less the input's border, and squares the inner one", async () => {
      const [prefix, suffix] = await mounted(() =>
        h(CuiInput, { modelValue: "" }, { "prefix-button": () => h(CuiButton, () => "P"), "suffix-button": () => h(CuiButton, () => "S") }),
      );
      expect(radii(prefix!)).toEqual([R - 1, 0, 0, R - 1]);
      expect(radii(suffix!)).toEqual([0, R - 1, R - 1, 0]);
    });
  });

  it("throws from the required form outside a group, and returns nothing from the optional one", async () => {
    let optional: unknown = "unset";
    let required: unknown;
    wrapper = mount(
      {
        setup() {
          optional = useButtonGroupContext();
          try {
            useButtonGroupContext({ required: true });
          } catch (e) {
            required = e;
          }
          return () => h("div");
        },
      },
      { attachTo: document.body },
    );
    expect(optional).toBeUndefined();
    expect(String(required)).toContain("useButtonGroupContext() must be used inside a CuiButtonGroup");
  });
});
