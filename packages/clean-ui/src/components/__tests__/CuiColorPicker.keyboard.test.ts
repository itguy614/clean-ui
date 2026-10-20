import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiColorPicker from "../CuiColorPicker.vue";
import { describeRovingFocusContract } from "../../composables/__tests__/roving-focus-contract";

/**
 * #177 — the gradient, hue and alpha surfaces and the swatches were pointer-only, and
 * `disabled` didn't reach the text input. Every visual control is now a slider (the
 * gradient a pair sharing one tab stop), and the swatches a radiogroup.
 */

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
});

function mountPicker(props: Record<string, unknown> = {}) {
  // hsv(0, 50%, 50%) = #804040
  w = mount(CuiColorPicker, { props: { modelValue: "#804040", ...props }, attachTo: document.body });
  return w;
}

const slider = (name: string) => w!.find(`[role="slider"][aria-label="${name}"]`);
const press = (el: Element, key: string, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }));
const lastEmit = () => w!.emitted("update:modelValue")!.at(-1)![0] as string;

describe("CuiColorPicker keyboard and ARIA", () => {
  it("exposes the gradient as a saturation/brightness pair with one tab stop, and hue as a slider", async () => {
    mountPicker();
    await nextTick();
    const sat = slider("Saturation");
    const bri = slider("Brightness");
    expect(sat.attributes()).toMatchObject({ "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "50", "aria-valuetext": "50%", tabindex: "0" });
    expect(bri.attributes()).toMatchObject({ "aria-valuenow": "50", tabindex: "-1" });
    expect(slider("Hue").attributes()).toMatchObject({ "aria-valuemax": "360", "aria-valuenow": "0", "aria-valuetext": "0 degrees" });
  });

  it("moves saturation with Left/Right and brightness with Up/Down, focusing the axis that changed", async () => {
    mountPicker();
    await nextTick();
    const sat = slider("Saturation").element as HTMLElement;
    const bri = slider("Brightness").element as HTMLElement;
    sat.focus();
    press(sat, "ArrowRight");
    await nextTick();
    expect(slider("Saturation").attributes("aria-valuenow")).toBe("51");
    expect(document.activeElement).toBe(sat);

    press(sat, "ArrowUp", { shiftKey: true });
    await nextTick();
    expect(slider("Brightness").attributes("aria-valuenow")).toBe("60");
    expect(document.activeElement).toBe(bri);

    // Home/End act on the focused axis.
    press(bri, "End");
    await nextTick();
    expect(slider("Brightness").attributes("aria-valuenow")).toBe("100");
    expect(slider("Saturation").attributes("aria-valuenow")).toBe("51");
  });

  it("steps hue in degrees and alpha in percent", async () => {
    mountPicker({ showAlpha: true });
    await nextTick();
    press(slider("Hue").element, "ArrowRight", { shiftKey: true });
    await nextTick();
    expect(slider("Hue").attributes("aria-valuenow")).toBe("10");
    press(slider("Opacity").element, "ArrowLeft");
    await nextTick();
    expect(slider("Opacity").attributes("aria-valuenow")).toBe("99");
    expect(lastEmit()).toMatch(/^#|rgba?/);
  });

  it("makes the swatches a radiogroup named by hex, where the arrows move and select", async () => {
    mountPicker({ palette: ["#ff0000", "#00ff00", "#0000ff"], modelValue: "#00ff00" });
    await nextTick();
    const group = w!.find('[role="radiogroup"]');
    expect(group.attributes("aria-label")).toBe("Preset colors");
    const radios = group.findAll('[role="radio"]');
    expect(radios.map((r) => r.attributes("aria-label"))).toEqual(["#ff0000", "#00ff00", "#0000ff"]);
    expect(radios.map((r) => r.attributes("aria-checked"))).toEqual(["false", "true", "false"]);
    expect(radios.map((r) => r.attributes("tabindex"))).toEqual(["-1", "0", "-1"]);

    (radios[1].element as HTMLElement).focus();
    press(radios[1].element, "ArrowRight");
    await nextTick();
    expect(document.activeElement).toBe(radios[2].element);
    expect(lastEmit()).toBe("#0000ff");
  });

  it("a click on a swatch emits once, and tabbing into the group selects nothing", async () => {
    mountPicker({ palette: ["#ff0000", "#00ff00", "#0000ff"], modelValue: "#123456" });
    await nextTick();
    const radios = w!.findAll('[role="radio"]');
    (radios[0].element as HTMLElement).focus(); // a Tab into the group
    await nextTick();
    expect(w!.emitted("update:modelValue")).toBeUndefined();
    await radios[2].trigger("click");
    expect(w!.emitted("update:modelValue")).toEqual([["#0000ff"]]);
  });

  it("PageUp and PageDown take ten steps", async () => {
    mountPicker();
    await nextTick();
    press(slider("Hue").element, "PageUp");
    await nextTick();
    expect(slider("Hue").attributes("aria-valuenow")).toBe("10");
    press(slider("Saturation").element, "PageDown");
    await nextTick();
    expect(slider("Saturation").attributes("aria-valuenow")).toBe("40");
  });

  it("disabled reaches the text input, the format toggle, the sliders and the swatches", async () => {
    mountPicker({ disabled: true, palette: ["#ff0000"] });
    await nextTick();
    expect((w!.find("input").element as HTMLInputElement).disabled).toBe(true);
    expect((w!.find("button.cui-button").element as HTMLButtonElement).disabled).toBe(true);
    expect(slider("Saturation").attributes("tabindex")).toBeUndefined();
    expect(slider("Saturation").attributes("aria-disabled")).toBe("true");
    expect((w!.find('[role="radio"]').element as HTMLButtonElement).disabled).toBe(true);
    press(slider("Hue").element, "ArrowRight");
    await nextTick();
    expect(w!.emitted("update:modelValue")).toBeUndefined();
  });
});

describeRovingFocusContract("CuiColorPicker swatches", {
  mount: () =>
    mount(CuiColorPicker, {
      props: { palette: ["#ff0000", "#00ff00", "#0000ff", "#ffff00"], modelValue: "#ff0000", swatchOnly: true, showInput: false },
      attachTo: document.body,
    }),
  items: () => [...document.querySelectorAll<HTMLElement>(".cui-color-picker__swatch")],
  orientation: "horizontal",
  wrap: true,
});
