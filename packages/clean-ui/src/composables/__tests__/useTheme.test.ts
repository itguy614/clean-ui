import { describe, it, expect, beforeEach, vi } from "vitest";
import { nextTick } from "vue";

const root = () => document.documentElement;
const hasClass = (c: string) => root().classList.contains(c);
const anyThemeClass = () => [...root().classList].some((c) => c.startsWith("cui-theme-"));

// useTheme is a module-singleton (shared activeTheme + a one-time restore), so
// each test gets a fresh module via vi.resetModules() + dynamic import.
async function freshUseTheme() {
  vi.resetModules();
  return (await import("../useTheme")).useTheme;
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
