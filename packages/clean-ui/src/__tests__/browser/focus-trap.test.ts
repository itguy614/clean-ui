import { describe, it, expect, afterEach } from "vitest";
import { tabbableIn } from "../../utils/focusable";

/**
 * #339, found in review — the overlay focus trap counted controls Tab never reaches as its
 * ends, and so never wrapped: one in a disabled fieldset, one under `visibility: hidden`, and
 * all but one radio of a group. And it dropped contenteditable (a markdown editor), which Tab
 * does stop on. Real browser: `:disabled` inheritance and `checkVisibility` are layout.
 */
describe("tabbableIn (real browser)", () => {
  let root: HTMLElement;
  afterEach(() => root?.remove());
  const make = (html: string) => {
    root = document.createElement("div");
    root.innerHTML = html;
    document.body.append(root);
    return root;
  };
  const labels = (els: HTMLElement[]) => els.map((el) => el.dataset.t);

  it("leaves out a control in a disabled fieldset", () => {
    make(`<button data-t="a">A</button><fieldset disabled><button data-t="b">B</button></fieldset>`);
    expect(labels(tabbableIn(root))).toEqual(["a"]);
  });

  it("leaves out a control under visibility: hidden, but keeps opacity: 0", () => {
    make(`<button data-t="a">A</button><div style="visibility:hidden"><button data-t="b">B</button></div><button data-t="c" style="opacity:0">C</button>`);
    expect(labels(tabbableIn(root))).toEqual(["a", "c"]);
  });

  it("counts an editable region, which Tab stops on", () => {
    make(`<button data-t="a">A</button><div contenteditable="true" data-t="ed"></div>`);
    expect(labels(tabbableIn(root))).toEqual(["a", "ed"]);
  });

  it("counts a radio group once: its checked radio, else its first", () => {
    make(`<input type="radio" name="g" data-t="r1"><input type="radio" name="g" data-t="r2" checked><input type="radio" name="g" data-t="r3"><input type="radio" name="h" data-t="s1"><input type="radio" name="h" data-t="s2">`);
    expect(labels(tabbableIn(root))).toEqual(["r2", "s1"]);
  });
});
