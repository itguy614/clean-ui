import { vi } from "vitest";

/**
 * jsdom doesn't implement these browser APIs that layout/observer/DOM-
 * measuring components use. Stub them so components mount cleanly under
 * test. Shared by every package's jsdom test setup (`test-setup.ts`), so a
 * gap fixed once doesn't need rediscovering per package — clean-ui-editor
 * needs the Range polyfill from day one; clean-ui needed it only once an
 * editor existed to need it.
 */
export function installJsdomPolyfills(): void {
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
  // --localstorage-file (no getItem), and it shadows jsdom's Storage. Swap in
  // a working in-memory one so tests exercise real persistence rather than a
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
  // on every call. Overlay scroll locks restore the scroll position through it,
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

  // jsdom doesn't implement Range's client-rect measurement at all — calling
  // either method throws "is not a function" — which a DOM-measuring editor
  // needs to mount under jsdom at all (cursor/selection positioning reads these
  // to place itself). Without this stub the failure looks like "this cannot be
  // tested," not a missing polyfill.
  function zeroRect(): DOMRect {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON() {
        return this;
      },
    };
  }

  if (typeof Range !== "undefined" && !Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = zeroRect;
  }
  if (typeof Range !== "undefined" && !Range.prototype.getClientRects) {
    Range.prototype.getClientRects = function (): DOMRectList {
      const rects: DOMRect[] = [];
      return Object.assign(rects, {
        item: (index: number) => rects[index] ?? null,
      }) as unknown as DOMRectList;
    };
  }
}
