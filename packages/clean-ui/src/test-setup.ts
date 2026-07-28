import { vi } from "vitest";

// jsdom doesn't implement these browser APIs that layout/observer components use.
// Stub them so components mount cleanly under test.

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Node >= 22 ships a global `localStorage` that is inert without
// --localstorage-file (no getItem), and it shadows jsdom's Storage. Swap in a
// working in-memory one so tests exercise real persistence rather than the
// library's no-storage fallback path.
if (typeof globalThis.localStorage?.getItem !== "function") {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => void store.delete(key),
    setItem: (key, value) => void store.set(key, String(value)),
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: memoryStorage,
    configurable: true,
    writable: true,
  });
}

// jsdom ships window.scrollTo as a stub that logs "Not implemented: window.scrollTo"
// on every call. The overlay scroll lock restores the scroll position through it,
// so replace it with a silent no-op (still spy-able) instead of drowning the output.
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (!("IntersectionObserver" in globalThis)) {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds = [];
  } as unknown as typeof IntersectionObserver;
}
