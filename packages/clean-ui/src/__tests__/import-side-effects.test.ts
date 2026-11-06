import { describe, it, expect, vi, afterEach } from "vitest";
import { spyStorage } from "./storage-spy";

// Importing the library must not touch the consumer's page (#209, #389): no localStorage read or
// write of a `cui-*` key and no class change on <html>. This is the generalising guard — a composable that does
// work at module load (a stored density restored at import, say) fails it, whichever one.
describe("importing the barrel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("reads and writes no storage and changes no class on <html>", async () => {
    localStorage.setItem("cui-density", "compact");
    localStorage.setItem("cui-theme", "forest");
    document.documentElement.className = "consumer-class";
    const getItem = spyStorage("getItem");
    const setItem = spyStorage("setItem");
    const removeItem = spyStorage("removeItem");
    const add = vi.spyOn(DOMTokenList.prototype, "add");
    const remove = vi.spyOn(DOMTokenList.prototype, "remove");
    const toggle = vi.spyOn(DOMTokenList.prototype, "toggle");

    vi.resetModules();
    await import("../index");

    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(toggle).not.toHaveBeenCalled();
    expect(document.documentElement.className).toBe("consumer-class");
    // A stored density or theme waits for first use (#209, #463): no cui-* key is read at import.
    expect(getItem.mock.calls.filter(([key]) => String(key).startsWith("cui-"))).toEqual([]);
  });
});
