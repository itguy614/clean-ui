import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiTextarea from "../../components/CuiTextarea.vue";

// This project runs under Vitest's real-browser mode (see vitest.config.ts) —
// a genuine Chromium instance via Playwright, not jsdom. CuiTextarea's
// autoResize reads `scrollHeight` and real computed line-height/padding/
// border to size itself; jsdom's layout engine is a no-op and always reports
// zero for these, so it cannot verify the resize actually happens. Several
// other layout/selection/input-method-dependent behaviours in this repo have
// only ever been checked by hand-driving Chrome — this is that capability
// made standing instead of ad hoc.
describe("CuiTextarea autoResize (real browser)", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  it("grows to fit content typed by the user, and shrinks back when it's cleared", async () => {
    wrapper = mount(CuiTextarea, {
      props: { autoResize: true, modelValue: "" },
      attachTo: document.body,
    });

    const textarea = wrapper.find("textarea");
    const initialHeight = textarea.element.getBoundingClientRect().height;
    expect(initialHeight).toBeGreaterThan(0);

    const manyLines = Array.from({ length: 15 }, (_, i) => `line ${i}`).join("\n");
    await textarea.setValue(manyLines);
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const grownHeight = textarea.element.getBoundingClientRect().height;
    expect(grownHeight).toBeGreaterThan(initialHeight);

    await textarea.setValue("");
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const shrunkHeight = textarea.element.getBoundingClientRect().height;
    expect(shrunkHeight).toBeLessThan(grownHeight);
  });
});
