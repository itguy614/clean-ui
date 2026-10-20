import { describe, it, expect, afterEach } from "vitest";
import { RESTORE_FOCUS_ATTR, RESTORE_FOCUS_EVENT, restoreKeyOf, returnFocus } from "../focusRestore";

/** #232 — an overlay's opener that has unmounted is asked back for by key. */
describe("focusRestore", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reads the restore key from the element or an ancestor", () => {
    document.body.innerHTML = `<div ${RESTORE_FOCUS_ATTR}="grid:7"><button id="b"></button></div>`;
    expect(restoreKeyOf(document.getElementById("b"))).toBe("grid:7");
    expect(restoreKeyOf(document.body)).toBeNull();
  });

  it("focuses a connected opener, and asks by key for one that has gone", () => {
    document.body.innerHTML = `<button id="b"></button>`;
    const b = document.getElementById("b")!;
    returnFocus(b, "grid:1");
    expect(document.activeElement).toBe(b);

    const asked: string[] = [];
    const listen = (e: CustomEvent<string>) => asked.push(e.detail);
    document.addEventListener(RESTORE_FOCUS_EVENT, listen);
    b.remove();
    returnFocus(b, "grid:1");
    returnFocus(b, null); // no key: nothing to ask for
    document.removeEventListener(RESTORE_FOCUS_EVENT, listen);
    expect(asked).toEqual(["grid:1"]);
  });
});
