import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { nextTick } from "vue";
import { spyStorage } from "../../__tests__/storage-spy";

const root = () => document.documentElement;
const hasClass = (c: string) => root().classList.contains(c);
const anyThemeClass = () => [...root().classList].some((c) => c.startsWith("cui-theme-"));

// useTheme is a module-singleton (shared activeTheme + a one-time restore), so
// each test gets a fresh module via vi.resetModules() + dynamic import.
async function freshModule() {
  vi.resetModules();
  return await import("../useTheme");
}
async function freshUseTheme() {
  return (await freshModule()).useTheme;
}

describe("useTheme (#85)", () => {
  beforeEach(() => {
    localStorage.clear();
    root().className = "";
  });

  it("does not strip a consumer's custom cui-theme-* class", async () => {
    root().classList.add("cui-theme-acme");
    const useTheme = await freshUseTheme();
    useTheme(); // engaging the composable must not touch the custom class
    expect(hasClass("cui-theme-acme")).toBe(true);
    expect(hasClass("cui-theme-mono")).toBe(false);
  });

  it("applies no theme class when nothing is stored (no-op default)", async () => {
    const useTheme = await freshUseTheme();
    const { theme } = useTheme();
    expect(theme.value).toBe("default");
    expect(anyThemeClass()).toBe(false);
  });

  it("restores a previously-stored theme on first use", async () => {
    localStorage.setItem("cui-theme", "violet");
    const useTheme = await freshUseTheme();
    const { theme } = useTheme();
    expect(theme.value).toBe("violet");
    expect(hasClass("cui-theme-violet")).toBe(true);
  });

  it("setTheme swaps preset classes but leaves a custom class intact", async () => {
    root().classList.add("cui-theme-acme");
    const useTheme = await freshUseTheme();
    const { setTheme } = useTheme();

    setTheme("forest");
    await nextTick();
    expect(hasClass("cui-theme-forest")).toBe(true);
    expect(hasClass("cui-theme-acme")).toBe(true);

    setTheme("teal");
    await nextTick();
    expect(hasClass("cui-theme-teal")).toBe(true);
    expect(hasClass("cui-theme-forest")).toBe(false); // old preset removed
    expect(hasClass("cui-theme-acme")).toBe(true); // custom still survives
  });

  // #330 — cui-theme-navy is a class now, carrying the default scale for a subtree. On
  // <html> its literals would shadow a consumer's own :root palette, so it never stays there.
  it("treats setTheme('navy') as the default, and clears a Navy class from <html>", async () => {
    root().classList.add("cui-theme-navy");
    const useTheme = await freshUseTheme();
    const { setTheme } = useTheme();
    setTheme("forest");
    await nextTick();
    expect(hasClass("cui-theme-navy"), "a switch clears it").toBe(false);
    setTheme("navy");
    await nextTick();
    expect(hasClass("cui-theme-forest")).toBe(false);
    expect(hasClass("cui-theme-navy"), "and 'navy' adds none").toBe(false);
  });

  it("setTheme('default') removes preset classes and adds none", async () => {
    const useTheme = await freshUseTheme();
    const { setTheme } = useTheme();
    setTheme("ruby");
    await nextTick();
    expect(hasClass("cui-theme-ruby")).toBe(true);
    setTheme("default");
    await nextTick();
    expect(anyThemeClass()).toBe(false);
  });
});

// #463 — like density (#209), importing the module did work: it read cui-theme, and the
// module-level watcher outlived everything. Now nothing happens until the first
// useTheme() / restoreTheme().
describe("useTheme at import and first use (#463)", () => {
  beforeEach(() => {
    localStorage.clear();
    root().className = "";
  });
  afterEach(() => vi.restoreAllMocks());

  it("does nothing at import, even with a theme stored", async () => {
    localStorage.setItem("cui-theme", "forest");
    root().className = "consumer-class";
    const getItem = spyStorage("getItem");
    const setItem = spyStorage("setItem");
    await freshModule();
    expect(root().className).toBe("consumer-class");
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("leaves <html> and localStorage alone on first use when nothing is stored", async () => {
    root().className = "cui-theme-acme";
    const setItem = spyStorage("setItem");
    const useTheme = await freshUseTheme();
    useTheme();
    await nextTick();
    expect(root().className).toBe("cui-theme-acme");
    expect(setItem).not.toHaveBeenCalled();
  });

  it("restoreTheme() applies a stored theme without useTheme(), once", async () => {
    localStorage.setItem("cui-theme", "ruby");
    const { restoreTheme } = await freshModule();
    restoreTheme();
    expect(hasClass("cui-theme-ruby")).toBe(true);
    root().className = "";
    restoreTheme();
    expect(anyThemeClass(), "a second call does nothing").toBe(false);
  });

  it("keeps a class the init script already set, without adding it twice", async () => {
    localStorage.setItem("cui-theme", "forest");
    const { ssrThemeInitScript } = await import("../../ssr-theme-init");
    new Function(ssrThemeInitScript)();
    expect(root().className).toBe("cui-theme-forest");
    const { restoreTheme } = await freshModule();
    restoreTheme();
    expect(root().className).toBe("cui-theme-forest");
  });

  it.each(["default", "navy"])("a stored %s strips a stale preset class", async (stored) => {
    localStorage.setItem("cui-theme", stored);
    root().className = "cui-theme-forest consumer-class cui-theme-acme";
    const { restoreTheme } = await freshModule();
    restoreTheme();
    expect(root().className).toBe("consumer-class cui-theme-acme");
  });

  it("a stored default with no class to strip changes nothing", async () => {
    localStorage.setItem("cui-theme", "default");
    root().className = "consumer-class";
    const { restoreTheme } = await freshModule();
    restoreTheme();
    expect(root().className).toBe("consumer-class");
  });

  it("a script-set class matching the stored theme stays, once", async () => {
    localStorage.setItem("cui-theme", "violet");
    root().className = "cui-theme-violet";
    const { restoreTheme } = await freshModule();
    restoreTheme();
    expect(root().className).toBe("cui-theme-violet");
  });

  it("persists a change made after the first caller's component unmounted", async () => {
    const useTheme = await freshUseTheme();
    const { mount } = await import("@vue/test-utils");
    const wrapper = mount({ setup: () => ({ t: useTheme() }), template: "<i />" });
    wrapper.unmount();
    useTheme().setTheme("teal");
    await nextTick();
    expect(localStorage.getItem("cui-theme")).toBe("teal");
    expect(hasClass("cui-theme-teal")).toBe(true);
  });
});
