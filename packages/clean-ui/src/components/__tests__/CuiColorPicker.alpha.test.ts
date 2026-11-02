import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiColorPicker from "../CuiColorPicker.vue";

/**
 * #309 — with `show-alpha` and the default `format="hex"`, the picker emitted `#rrggbb` and
 * threw the opacity away. It now emits `#rrggbbaa` below full opacity, and reads it back.
 */

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
});

function mountPicker(props: Record<string, unknown>) {
  w = mount(CuiColorPicker, { props: { showAlpha: true, ...props }, attachTo: document.body });
  return w;
}

const opacity = () => w!.find('[role="slider"][aria-label="Opacity"]');
const press = (el: Element, key: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
const lastEmit = () => w!.emitted("update:modelValue")!.at(-1)![0] as string;

describe("CuiColorPicker hex with alpha", () => {
  it("emits the alpha byte when the opacity slider moves below 100%", async () => {
    mountPicker({ modelValue: "#804040" });
    await nextTick();
    press(opacity().element, "PageDown"); // 100% → 90%
    await nextTick();
    expect(lastEmit()).toBe("#804040e6");
    expect(w!.find("input").element.value).toBe("#804040e6");
  });

  it("emits six digits again at full opacity", async () => {
    mountPicker({ modelValue: "#80404080" });
    await nextTick();
    press(opacity().element, "End");
    await nextTick();
    expect(lastEmit()).toBe("#804040");
  });

  it("reads the alpha of an 8-digit model value", async () => {
    mountPicker({ modelValue: "#80404080" });
    await nextTick();
    expect(opacity().attributes("aria-valuenow")).toBe("50");
    expect(w!.find("input").element.value).toBe("#80404080");
  });

  it("takes an 8-digit value typed into the text field", async () => {
    mountPicker({ modelValue: "#804040" });
    await nextTick();
    const input = w!.find("input");
    await input.setValue("#ff000040");
    await input.trigger("keydown", { key: "Enter" });
    expect(lastEmit()).toBe("#ff000040");
    expect(opacity().attributes("aria-valuenow")).toBe("25");
  });
});
