import { describe, it, expect, vi, afterEach } from "vitest";

// Importing the library must not touch the consumer's page (#209, #389): no localStorage write
// and no class change on <html> (plus no density read). This is the generalising guard — a composable that does
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
    // A stored density waits for first use (#209). Not asserted for every key: useTheme still
    // reads its stored theme at import, which is harmless (it neither writes nor adds a class).
    expect(getItem.mock.calls.filter(([key]) => key === "cui-density")).toEqual([]);
  });
});
