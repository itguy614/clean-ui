import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import { cdp, userEvent } from "@vitest/browser/context";
import CuiPinInput from "../../components/CuiPinInput.vue";
import main from "../../styles/main.css?inline";
import { frames, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #196 — one real input is the control and the boxes are drawn over by it. What jsdom
 * cannot show: the boxes' layout, real typing through `beforeinput`, where a click puts
 * the caret, the focus ring, and the caret's blink stopping under reduced motion.
 */
describe("CuiPinInput (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(main)));
  afterAll(() => teardown());
  afterEach(cleanup);

  function mountPin(props: Record<string, unknown> = {}) {
    const el = host({ width: "500px" });
    const before = document.createElement("button");
    before.textContent = "before";
    el.append(before);
    const wrapper = track(mount(CuiPinInput, { props: { label: "Code", ...props }, attachTo: el }));
    const input = wrapper.element.querySelector<HTMLInputElement>("input")!;
    const boxes = () => [...wrapper.element.querySelectorAll<HTMLElement>(".cui-pin-input__box")];
    return { wrapper, input, boxes, before };
  }

  it("lays the boxes out in a row of equal squares, with the input covering them", async () => {
    const { input, boxes } = mountPin({ length: 6 });
    await frames(1);
    const rects = boxes().map((b) => b.getBoundingClientRect());
    expect(rects).toHaveLength(6);
    for (const r of rects) {
      expect(r.width).toBeGreaterThan(20);
      expect(r.width).toBeCloseTo(r.height, 0);
      expect(r.top).toBe(rects[0].top);
    }
    for (let i = 1; i < rects.length; i++) expect(rects[i].left).toBeGreaterThan(rects[i - 1].right);
    const field = input.getBoundingClientRect();
    expect(field.left).toBeCloseTo(rects[0].left, 0);
    expect(field.right).toBeCloseTo(rects[5].right, 0);
    expect(getComputedStyle(input).opacity).toBe("0");
  });

  it("narrows the boxes rather than overflow a narrow container", async () => {
    const el = host({ width: "200px" });
    const wrapper = track(mount(CuiPinInput, { props: { length: 8 }, attachTo: el }));
    await frames(1);
    const last = [...wrapper.element.querySelectorAll<HTMLElement>(".cui-pin-input__box")].at(-1)!;
    expect(last.getBoundingClientRect().right).toBeLessThanOrEqual(el.getBoundingClientRect().right + 0.5);
  });

  it("shows real typing in the boxes and rejects a letter in a digits code", async () => {
    const { wrapper, input, boxes } = mountPin({ length: 4 });
    input.focus();
    await userEvent.keyboard("1a2");
    await frames(1);
    expect(boxes().map((b) => b.textContent!.trim())).toEqual(["1", "2", "", ""]);
    expect(wrapper.emitted("update:modelValue")!.at(-1)).toEqual(["12"]);
    // Stopped at beforeinput: the letter never edits the input, even over a filled box.
    let edits = 0;
    input.addEventListener("input", () => edits++);
    await userEvent.keyboard("{Home}b");
    expect(edits).toBe(0);
    expect(input.value).toBe("12");
  });

  it("overwrites in place and completes on the last character", async () => {
    const { wrapper, input } = mountPin({ length: 4 });
    input.focus();
    await userEvent.keyboard("1234");
    expect(wrapper.emitted("complete")).toEqual([["1234"]]);
    // Full, the caret is on the last box: two lefts reach the second.
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}9");
    expect(input.value).toBe("1934");
  });

  it("puts the caret in the box clicked, or the first empty one", async () => {
    const { input, boxes } = mountPin({ length: 6, modelValue: "1234" });
    await frames(1);
    // The input lies over the boxes, so a real click lands on it, over box i.
    const clickBox = (i: number) => {
      const field = input.getBoundingClientRect();
      const box = boxes()[i].getBoundingClientRect();
      return userEvent.click(input, { position: { x: box.left - field.left + box.width / 2, y: field.height / 2 } });
    };
    await clickBox(1);
    expect(document.activeElement).toBe(input);
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 2]);
    expect(boxes()[1].classList).toContain("cui-pin-input__box--active");
    await clickBox(5);
    expect([input.selectionStart, input.selectionEnd]).toEqual([4, 4]);
    expect(boxes()[4].querySelector(".cui-pin-input__caret")).not.toBeNull();
  });

  it("draws a focus ring on the caret's box only while focused", async () => {
    const { input, boxes, before } = mountPin({ length: 4, color: "success" });
    await frames(1);
    expect(getComputedStyle(boxes()[0]).boxShadow).toBe("none");
    before.focus();
    await userEvent.tab();
    await frames(1);
    expect(document.activeElement).toBe(input);
    const active = getComputedStyle(boxes()[0]);
    expect(active.boxShadow).not.toBe("none");
    expect(active.borderTopColor).not.toBe(getComputedStyle(boxes()[1]).borderTopColor);
    expect(getComputedStyle(boxes()[1]).boxShadow).toBe("none");
  });

  it("lands Tab focus on the first empty box, not a select-all", async () => {
    const { input, before } = mountPin({ length: 6, modelValue: "12" });
    before.focus();
    await userEvent.tab();
    await frames(2);
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 2]);
    await userEvent.keyboard("3");
    expect(input.value).toBe("123");
  });

  it("lets a public token restyle the boxes", async () => {
    const { wrapper, boxes } = mountPin();
    (wrapper.element as HTMLElement).style.setProperty("--cui-pin-input-height", "60px");
    await frames(1);
    expect(boxes()[0].getBoundingClientRect().height).toBe(60);
  });

  describe("caret blink", () => {
    const setReduced = (reduce: boolean) =>
      cdp().send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "" }] });
    afterEach(() => setReduced(false));

    it("blinks normally", async () => {
      const { wrapper, input } = mountPin();
      input.focus();
      await frames(1);
      const caret = wrapper.element.querySelector<HTMLElement>(".cui-pin-input__caret")!;
      expect(getComputedStyle(caret).animationName).not.toBe("none");
    });

    it("holds still under reduced motion", async () => {
      await setReduced(true);
      const { wrapper, input } = mountPin();
      input.focus();
      await frames(1);
      const caret = wrapper.element.querySelector<HTMLElement>(".cui-pin-input__caret")!;
      expect(getComputedStyle(caret).animationName).toBe("none");
      expect(getComputedStyle(caret).opacity).toBe("1");
    });
  });
});
