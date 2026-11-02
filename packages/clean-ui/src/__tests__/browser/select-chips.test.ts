import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import CuiSelect from "../../components/CuiSelect.vue";
import CuiCombobox from "../../components/CuiCombobox.vue";
import { frames, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";

// #301: CuiSelect hand-rolled its multi-select chips, so they neither looked nor themed
// like CuiCombobox's and CuiTagInput's CuiBadge chips. Real browser, because the claim is
// about what the cascade resolves — jsdom applies no stylesheet and resolves no var().
describe("CuiSelect chips match CuiCombobox's (real browser)", () => {
  let teardown: () => void;
  beforeAll(() => {
    teardown = installTokens(main);
  });
  afterAll(() => teardown());

  const { host, track, cleanup } = mountHosts();
  afterEach(cleanup);

  const options = [
    { value: "a", label: "Apple" },
    { value: "b", label: "Banana" },
  ];
  const PROPS = ["backgroundColor", "color", "borderTopColor", "borderTopWidth", "borderTopStyle", "borderRadius", "fontSize"] as const;

  const chipOf = (root: HTMLElement) => root.querySelector<HTMLElement>(".cui-select__value .cui-badge")!;
  const paint = (el: HTMLElement) => {
    const cs = getComputedStyle(el);
    return { ...Object.fromEntries(PROPS.map((p) => [p, cs[p]])), height: el.getBoundingClientRect().height };
  };

  it.each(["sm", "md", "lg"] as const)("at size %s: same background, colour, border and height", async (size) => {
    const a = host({ position: "fixed", left: "20px", top: "20px", width: "320px" });
    const b = host({ position: "fixed", left: "20px", top: "120px", width: "320px" });
    track(mount(CuiSelect, { attachTo: a, props: { options, multiple: true, modelValue: ["a"], size } }));
    track(mount(CuiCombobox, { attachTo: b, props: { options, multiple: true, modelValue: ["a"], size } }));
    await frames(2);

    const selectChip = chipOf(a);
    const comboChip = b.querySelector<HTMLElement>(".cui-badge")!;
    expect(selectChip).toBeTruthy();
    expect(comboChip).toBeTruthy();
    expect(paint(selectChip)).toEqual(paint(comboChip));
  });

  it("follows the select's color, as Combobox's chips do", async () => {
    const a = host({ position: "fixed", left: "20px", top: "20px", width: "320px" });
    const b = host({ position: "fixed", left: "20px", top: "120px", width: "320px" });
    track(mount(CuiSelect, { attachTo: a, props: { options, multiple: true, modelValue: ["a"], color: "success" } }));
    track(mount(CuiCombobox, { attachTo: b, props: { options, multiple: true, modelValue: ["a"], color: "success" } }));
    await frames(2);
    expect(paint(chipOf(a))).toEqual(paint(b.querySelector<HTMLElement>(".cui-badge")!));
  });

  // Review of #301: CuiBadge never wraps, so a long label would spill out of the trigger.
  it("cuts a long label short instead of overflowing the trigger", async () => {
    const a = host({ position: "fixed", left: "20px", top: "20px", width: "200px" });
    const long = [{ value: "x", label: "Department of Infrastructure and Regional Development" }];
    track(mount(CuiSelect, { attachTo: a, props: { options: long, multiple: true, modelValue: ["x"] } }));
    await frames(2);
    const value = a.querySelector<HTMLElement>(".cui-select__value")!.getBoundingClientRect();
    const chip = chipOf(a).getBoundingClientRect();
    expect(chip.right).toBeLessThanOrEqual(value.right + 0.5);
    const label = a.querySelector<HTMLElement>(".cui-select__chip-label")!;
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth); // truncated, not hidden
    expect(getComputedStyle(label).textOverflow).toBe("ellipsis");
  });

  // Review of #301: Enter on a chip's remove button bubbled to the trigger, which opened the
  // panel instead of removing the chip.
  it("Enter on a focused remove button removes that chip and keeps the panel closed", async () => {
    const a = host({ position: "fixed", left: "20px", top: "20px", width: "320px" });
    const w = track(mount(CuiSelect, { attachTo: a, props: { options, multiple: true, modelValue: ["a", "b"] } }));
    a.querySelector<HTMLElement>(".cui-badge__remove")!.focus();
    await userEvent.keyboard("{Enter}");
    await frames(2);
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual([["b"]]);
    expect(a.querySelector('[role="combobox"]')!.getAttribute("aria-expanded")).toBe("false");
  });
});
