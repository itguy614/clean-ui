import { describe, it, expect, vi, afterEach } from "vitest";

// Importing the library must not touch the consumer's page (#209, #389): no localStorage
// access and no class on <html>. This is the generalising guard — a composable that does
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
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const removeItem = vi.spyOn(Storage.prototype, "removeItem");
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
    // A read at import is the lazy-init regression too: the stored value must wait for use.
    expect(getItem.mock.calls.filter(([key]) => String(key).startsWith("cui-"))).toEqual([]);
  });
});
