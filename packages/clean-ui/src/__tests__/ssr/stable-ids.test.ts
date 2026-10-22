import { describe, it, expect } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "@vue/server-renderer";
import CuiFormField from "../../components/CuiFormField.vue";
import CuiRadioGroup from "../../components/CuiRadioGroup.vue";
import CuiRadio from "../../components/CuiRadio.vue";
import CuiDivider from "../../components/CuiDivider.vue";
import CuiSlider from "../../components/CuiSlider.vue";

/**
 * #182 — components built their ids from `Math.random()`, so the server rendered one id
 * and the client hydrated with another: a hydration mismatch, and an `aria-labelledby` /
 * `<label for>` pointing at nothing until the client re-rendered. `useCuiId()` derives
 * them from Vue's `useId()`, which is the same on both sides. Rendering the same app twice
 * must therefore produce byte-identical markup — a random suffix never would.
 */
const app = () =>
  createSSRApp({
    render: () =>
      h("div", [
        h(CuiFormField, { label: "Email" }, { default: (f: Record<string, unknown>) => h("input", { id: f.id }) }),
        h(CuiRadioGroup, { modelValue: "a" }, () => [h(CuiRadio, { value: "a", label: "A" }), h(CuiRadio, { value: "b", label: "B" })]),
        h(CuiDivider, { label: "OR" }),
        h(CuiSlider, { label: "Volume" }),
      ]),
  });

describe("generated ids are stable across renders (node environment)", () => {
  it("renders identical markup, ids included, on every render", async () => {
    const first = await renderToString(app());
    const second = await renderToString(app());
    expect(first).toContain('id="cui-field-');
    expect(first).toContain('name="cui-radio-');
    expect(first).toContain('id="cui-divider-label-');
    expect(first).toContain('id="cui-slider-');
    expect(second).toBe(first);
  });
});
