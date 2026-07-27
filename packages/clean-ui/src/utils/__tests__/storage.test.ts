import { describe, it, expect, afterEach, vi } from "vitest";
import { safeGetItem, safeSetItem } from "../storage";

const real = globalThis.localStorage;

function stubStorage(value: unknown) {
  Object.defineProperty(globalThis, "localStorage", {
    value,
    configurable: true,
    writable: true,
  });
}

/** A storage whose every access throws, like a sandboxed iframe's. */
function throwingStorage() {
  return {
    getItem() {
      throw new DOMException("The operation is insecure.", "SecurityError");
    },
    setItem() {
      throw new DOMException("The operation is insecure.", "SecurityError");
    },
  };
}

afterEach(() => stubStorage(real));

describe("safe storage helpers", () => {
  it("reads and writes through a working storage", () => {
    expect(safeSetItem("cui-test", "value")).toBe(true);
    expect(safeGetItem("cui-test")).toBe("value");
  });

  it("returns null / false when localStorage is missing", () => {
    stubStorage(undefined);
    expect(safeGetItem("cui-test")).toBeNull();
    expect(safeSetItem("cui-test", "value")).toBe(false);
  });

  it("returns null / false for an inert storage with no getItem", () => {
    // Node >= 22 without --localstorage-file exposes exactly this shape
    stubStorage({});
    expect(safeGetItem("cui-test")).toBeNull();
    expect(safeSetItem("cui-test", "value")).toBe(false);
  });

  it("swallows a throwing storage instead of propagating", () => {
    stubStorage(throwingStorage());
    expect(() => safeGetItem("cui-test")).not.toThrow();
    expect(safeGetItem("cui-test")).toBeNull();
    expect(safeSetItem("cui-test", "value")).toBe(false);
  });

  it("reports a failed write when setItem throws (quota, private mode)", () => {
    stubStorage({
      getItem: () => null,
      setItem: () => {
        throw new DOMException("QuotaExceededError", "QuotaExceededError");
      },
    });
    expect(safeSetItem("cui-test", "value")).toBe(false);
  });
});

describe("module-scope storage access", () => {
  it("imports useDensity without throwing when storage is inert", async () => {
    stubStorage({});
    // Force re-execution so the module-scope `loadDensity()` runs under the
    // inert stub. That call is the regression: an unguarded read there took
    // down every import of the library barrel, not just useDensity.
    vi.resetModules();
    const mod = await import("../../composables/useDensity");
    expect(mod.useDensity).toBeTypeOf("function");
    expect(mod.useDensity().density.value).toBe("default");
  });
});
