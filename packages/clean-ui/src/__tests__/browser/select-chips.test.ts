import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
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

  const chipOf = (root: HTMLElement) => root.querySelector<HTMLElement>(".cui-select__value > *, .cui-badge")!;
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
});
