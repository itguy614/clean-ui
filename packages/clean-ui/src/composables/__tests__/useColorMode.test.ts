import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { defineComponent, nextTick, useTemplateRef } from "vue";
import { mount } from "@vue/test-utils";
import { spyStorage } from "../../__tests__/storage-spy";
import { COLOR_MODE_STORAGE_KEY, DARK_SCHEME_QUERY } from "../../ssr-constants";

const root = () => document.documentElement;

/** A controllable `matchMedia` for the dark-scheme query. */
function stubMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<(e: { matches: boolean }) => void>();
  const add = vi.fn((_: string, fn: (e: { matches: boolean }) => void) => listeners.add(fn));
  const remove = vi.fn((_: string, fn: (e: { matches: boolean }) => void) => listeners.delete(fn));
  const matchMedia = vi.fn((query: string) => ({
    get matches() {
      return query === DARK_SCHEME_QUERY && matches;
    },
    addEventListener: add,
    removeEventListener: remove,
  }));
  vi.stubGlobal("matchMedia", matchMedia);
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: matchMedia });
  return {
    add,
    remove,
    listeners,
    /** The OS changes its appearance. */
    flip(next: boolean) {
      matches = next;
      for (const fn of [...listeners]) fn({ matches: next });
    },
  };
}

async function fresh() {
  vi.resetModules();
  const mod = await import("../useColorMode");
  mod.disposeColorMode();
  return mod;
}

beforeEach(() => {
  localStorage.clear();
  root().className = "";
});
afterEach(async () => {
  // Release the singleton's listener, whichever module instance made it.
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (window as { matchMedia?: unknown }).matchMedia;
  localStorage.clear();
  root().className = "";
});

describe("useColorMode: restoring", () => {
  it.each([
    ["dark", true],
    ["light", false],
  ])("a stored %s applies, and wins over a stale class", async (stored, dark) => {
    stubMatchMedia(!dark); // the OS disagrees: the stored choice still wins
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, stored);
    root().className = dark ? "consumer" : "consumer dark";
    const { useColorMode } = await fresh();
    const { mode, isDark } = useColorMode();
    expect(mode.value).toBe(stored);
    expect(isDark.value).toBe(dark);
    expect(root().classList.contains("dark")).toBe(dark);
    expect(root().classList.contains("consumer")).toBe(true);
  });

  it.each([["system"], ["garbage"], ["Dark"], [null]])("%j resolves from the OS", async (stored) => {
    stubMatchMedia(true);
    if (stored != null) localStorage.setItem(COLOR_MODE_STORAGE_KEY, stored);
    const { useColorMode } = await fresh();
    const { mode, isDark } = useColorMode();
    expect(mode.value).toBe("system");
    expect(isDark.value).toBe(true);
    expect(root().classList.contains("dark")).toBe(true);
  });

  it("system with a light OS removes a stale dark class", async () => {
    stubMatchMedia(false);
    root().className = "dark";
    const { restoreColorMode } = await fresh();
    restoreColorMode();
    expect(root().classList.contains("dark")).toBe(false);
  });

  it("without matchMedia, system leaves <html> alone and is light", async () => {
    root().className = "dark";
    const { useColorMode } = await fresh();
    expect(useColorMode().isDark.value).toBe(false);
    expect(root().className).toBe("dark");
  });

  it("is once: a second restoreColorMode() changes nothing", async () => {
    stubMatchMedia(false);
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, "dark");
    const { restoreColorMode } = await fresh();
    restoreColorMode();
    root().className = "";
    restoreColorMode();
    expect(root().className).toBe("");
  });

  it("restoreColorMode() applies without useColorMode()", async () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, "dark");
    const { restoreColorMode } = await fresh();
    restoreColorMode();
    expect(root().classList.contains("dark")).toBe(true);
  });

  it("tolerates storage that throws on read and write", async () => {
    const mm = stubMatchMedia(true);
    spyStorage("getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    spyStorage("setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { useColorMode } = await fresh();
    const c = useColorMode();
    expect(c.mode.value).toBe("system");
    expect(c.isDark.value).toBe(true);
    c.setMode("light");
    await nextTick();
    expect(c.isDark.value).toBe(false);
    expect(mm.listeners.size).toBe(0);
  });

  it("retries after a failure, since restored is set last", async () => {
    stubMatchMedia(false);
    const { restoreColorMode } = await fresh();
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, "dark");
    const toggle = vi.spyOn(DOMTokenList.prototype, "toggle").mockImplementationOnce(() => {
      throw new Error("boom");
    });
    expect(() => restoreColorMode()).toThrow("boom");
    toggle.mockRestore();
    restoreColorMode();
    expect(root().classList.contains("dark")).toBe(true);
  });

  it("persists a change made after the first caller's component unmounted", async () => {
    stubMatchMedia(false);
    const { useColorMode } = await fresh();
    const wrapper = mount({ setup: () => ({ c: useColorMode() }), template: "<i />" });
    wrapper.unmount();
    useColorMode().setMode("dark");
    await nextTick();
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("dark");
    expect(root().classList.contains("dark")).toBe(true);
  });
});

describe("useColorMode: choosing", () => {
  it("setMode persists, applies, and drives isDark", async () => {
    stubMatchMedia(false);
    const { useColorMode } = await fresh();
    const { mode, isDark, setMode } = useColorMode();
    expect(isDark.value).toBe(false);
    setMode("dark");
    await nextTick();
    expect(mode.value).toBe("dark");
    expect(isDark.value).toBe(true);
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("dark");
    expect(root().classList.contains("dark")).toBe(true);
    setMode("light");
    await nextTick();
    expect(isDark.value).toBe(false);
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("light");
    expect(root().classList.contains("dark")).toBe(false);
  });

  it("ignores a value that isn't a mode", async () => {
    stubMatchMedia(false);
    const { useColorMode } = await fresh();
    const { mode, setMode } = useColorMode();
    setMode("purple" as never);
    await nextTick();
    expect(mode.value).toBe("system");
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBeNull();
  });

  it("does not write storage until something changes", async () => {
    stubMatchMedia(true);
    const setItem = spyStorage("setItem");
    const { useColorMode } = await fresh();
    useColorMode();
    await nextTick();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("toggle flips the resolved scheme and stores an explicit mode", async () => {
    stubMatchMedia(true);
    const { useColorMode } = await fresh();
    const { mode, isDark, toggle } = useColorMode();
    expect(isDark.value).toBe(true); // system + dark
    toggle();
    await nextTick();
    expect(mode.value).toBe("light");
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("light");
    expect(root().classList.contains("dark")).toBe(false);
    toggle();
    await nextTick();
    expect(mode.value).toBe("dark");
    expect(root().classList.contains("dark")).toBe(true);
  });

  it("toggle from system + light goes dark", async () => {
    stubMatchMedia(false);
    const { useColorMode } = await fresh();
    const { mode, toggle } = useColorMode();
    toggle();
    expect(mode.value).toBe("dark");
  });
});

describe("useColorMode: following the system", () => {
  it("adds the listener only in system mode and applies OS changes live", async () => {
    const mm = stubMatchMedia(false);
    const { useColorMode } = await fresh();
    const { isDark } = useColorMode();
    expect(mm.add).toHaveBeenCalledTimes(1);
    mm.flip(true);
    await nextTick();
    expect(isDark.value).toBe(true);
    expect(root().classList.contains("dark")).toBe(true);
    mm.flip(false);
    await nextTick();
    expect(root().classList.contains("dark")).toBe(false);
  });

  it("adds no listener for a stored explicit mode", async () => {
    const mm = stubMatchMedia(false);
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, "dark");
    const { useColorMode } = await fresh();
    useColorMode();
    expect(mm.add).not.toHaveBeenCalled();
  });

  it("removes the listener when the mode changes, and ignores the OS after", async () => {
    const mm = stubMatchMedia(false);
    const { useColorMode } = await fresh();
    const { setMode, isDark } = useColorMode();
    setMode("light");
    await nextTick();
    expect(mm.remove).toHaveBeenCalledTimes(1);
    expect(mm.listeners.size).toBe(0);
    mm.flip(true);
    await nextTick();
    expect(isDark.value).toBe(false);
    expect(root().classList.contains("dark")).toBe(false);
  });

  it("re-reads the OS and re-listens when switching back to system", async () => {
    const mm = stubMatchMedia(false);
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, "light");
    const { useColorMode } = await fresh();
    const { setMode, isDark } = useColorMode();
    mm.flip(true); // no listener: nobody hears it
    setMode("system");
    await nextTick();
    expect(isDark.value).toBe(true);
    expect(root().classList.contains("dark")).toBe(true);
    expect(mm.listeners.size).toBe(1);
  });

  it("removes the listener when the owner scope disposes", async () => {
    const mm = stubMatchMedia(false);
    const { useColorMode, disposeColorMode } = await fresh();
    useColorMode();
    expect(mm.listeners.size).toBe(1);
    disposeColorMode();
    expect(mm.listeners.size).toBe(0);
  });
});

describe("useColorMode with useColorScheme", () => {
  it("useColorScheme observes the class changes made through useColorMode", async () => {
    stubMatchMedia(false);
    const { useColorScheme } = await import("../useColorScheme");
    const { useColorMode } = await fresh();
    const Probe = defineComponent({
      setup() {
        const el = useTemplateRef<HTMLElement>("root");
        return { isDark: useColorScheme(el).isDark };
      },
      template: `<div ref="root">{{ isDark }}</div>`,
    });
    const wrapper = mount(Probe, { attachTo: document.body });
    const { setMode } = useColorMode();
    expect(wrapper.text()).toBe("false");
    setMode("dark");
    await nextTick();
    await new Promise((r) => setTimeout(r, 0));
    expect(wrapper.text()).toBe("true");
    setMode("light");
    await nextTick();
    await new Promise((r) => setTimeout(r, 0));
    expect(wrapper.text()).toBe("false");
    wrapper.unmount();
  });
});
