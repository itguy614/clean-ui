import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CuiProgress from "../CuiProgress.vue";

// #390 — an indeterminate bar with show-label showed a percentage there is none of; the
// circle didn't. Both now hide the default percentage, and both keep a label slot.
describe("CuiProgress label while indeterminate", () => {
  it.each(["bar", "circle"] as const)("%s: no percentage", (variant) => {
    const w = mount(CuiProgress, { props: { variant, indeterminate: true, showLabel: true, value: 40 } });
    expect(w.text()).not.toContain("%");
  });

  it.each(["bar", "circle"] as const)("%s: a label slot still shows", (variant) => {
    const w = mount(CuiProgress, { props: { variant, indeterminate: true }, slots: { label: "Uploading…" } });
    expect(w.text()).toContain("Uploading…");
  });

  it("shows the percentage when determinate", () => {
    const w = mount(CuiProgress, { props: { showLabel: true, value: 40 } });
    expect(w.text()).toContain("40%");
  });
});
