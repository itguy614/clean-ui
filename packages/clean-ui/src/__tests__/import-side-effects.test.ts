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
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it("reads and writes no storage and changes no class on <html>", async () => {
    localStorage.setItem("cui-density", "compact");
    localStorage.setItem("cui-theme", "forest");
    localStorage.setItem("cui-color-mode", "dark");
    // A matchMedia that records any listener: importing must not ask for one.
    const matchMedia = vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: matchMedia });
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
    // No colour-mode listener or query either (#487).
    expect(matchMedia).not.toHaveBeenCalled();
    // A stored density, theme or colour mode waits for first use (#209, #463): no cui-* key is read at import.
    expect(getItem.mock.calls.filter(([key]) => String(key).startsWith("cui-"))).toEqual([]);
  });
});
