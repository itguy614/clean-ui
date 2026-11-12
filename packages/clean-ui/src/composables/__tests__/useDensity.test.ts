import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { nextTick } from "vue";
import { spyStorage } from "../../__tests__/storage-spy";
import { useDensity, DENSITY_PRESETS } from "../useDensity";

const densityClasses = () =>
  [...document.documentElement.classList].filter((c) => c.startsWith("cui-density-"));

describe("useDensity", () => {
  beforeEach(async () => {
    useDensity().setDensity("default");
    await nextTick();
  });

  it("exposes the three presets in order", () => {
    expect(DENSITY_PRESETS.map((p) => p.id)).toEqual(["compact", "default", "comfortable"]);
  });

  it("applies a density class to documentElement", async () => {
    const { setDensity, density } = useDensity();
    setDensity("compact");
    await nextTick();
    expect(density.value).toBe("compact");
    expect(document.documentElement.classList.contains("cui-density-compact")).toBe(true);
  });

  it("default applies no class (baseline equals :root)", async () => {
    const { setDensity } = useDensity();
    setDensity("comfortable");
    await nextTick();
    setDensity("default");
    await nextTick();
    expect(densityClasses()).toEqual([]);
  });

  it("keeps only one density class at a time", async () => {
    const { setDensity } = useDensity();
    setDensity("compact");
    await nextTick();
    setDensity("comfortable");
    await nextTick();
    expect(densityClasses()).toEqual(["cui-density-comfortable"]);
  });

  it("persists the selection to localStorage", async () => {
    useDensity().setDensity("compact");
    await nextTick();
    expect(localStorage.getItem("cui-density")).toBe("compact");
  });

  it("is a shared singleton — separate calls see the same state", async () => {
    useDensity().setDensity("comfortable");
    await nextTick();
    expect(useDensity().getDensity()).toBe("comfortable");
  });
});

// #389, #209 — importing the library ran applyDensity: it stripped a density class the
// consumer put on <html>, and wrote "cui-density=default" into their localStorage. Now nothing
// happens until the first useDensity() / restoreDensity().
describe("useDensity at import and first use", () => {
  async function freshImport() {
    vi.resetModules();
    return await import("../useDensity");
  }
  // Earlier tests in this file store a density; each of these starts from nothing stored.
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("does nothing at import, even with a density stored", async () => {
    localStorage.setItem("cui-density", "comfortable");
    document.documentElement.className = "cui-density-compact";
    const getItem = spyStorage("getItem");
    const setItem = spyStorage("setItem");
    await freshImport();
    expect(document.documentElement.className, "the consumer's own class").toBe("cui-density-compact");
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("leaves <html> and localStorage alone on first use when nothing is stored", async () => {
    document.documentElement.className = "cui-density-compact";
    const setItem = spyStorage("setItem");
    const { useDensity } = await freshImport();
    useDensity();
    await nextTick();
    expect(document.documentElement.className).toBe("cui-density-compact");
    expect(setItem).not.toHaveBeenCalled();
  });

  it("leaves the consumer's class alone when the stored value isn't a density", async () => {
    localStorage.setItem("cui-density", "huge");
    document.documentElement.className = "cui-density-compact";
    const { useDensity } = await freshImport();
    useDensity();
    await nextTick();
    expect(document.documentElement.className).toBe("cui-density-compact");
    expect(localStorage.getItem("cui-density"), "not overwritten").toBe("huge");
  });

  it("restores a stored density on first useDensity()", async () => {
    localStorage.setItem("cui-density", "comfortable");
    const { useDensity } = await freshImport();
    expect(useDensity().getDensity()).toBe("comfortable");
    expect(densityClasses()).toEqual(["cui-density-comfortable"]);
  });

  it("restoreDensity() applies a stored density without useDensity(), once", async () => {
    localStorage.setItem("cui-density", "compact");
    const { restoreDensity } = await freshImport();
    restoreDensity();
    expect(densityClasses()).toEqual(["cui-density-compact"]);
    document.documentElement.className = "";
    restoreDensity();
    expect(densityClasses(), "a second call does nothing").toEqual([]);
  });

  it("a stored default strips a stale density class", async () => {
    localStorage.setItem("cui-density", "default");
    document.documentElement.className = "cui-density-compact consumer-class";
    const { restoreDensity } = await freshImport();
    restoreDensity();
    expect(document.documentElement.className).toBe("consumer-class");
  });

  it("a stored default with no class to strip changes nothing", async () => {
    localStorage.setItem("cui-density", "default");
    document.documentElement.className = "consumer-class";
    const { restoreDensity } = await freshImport();
    restoreDensity();
    expect(document.documentElement.className).toBe("consumer-class");
  });

  it("a script-set class matching the stored density stays, once", async () => {
    localStorage.setItem("cui-density", "compact");
    document.documentElement.className = "cui-density-compact";
    const { restoreDensity } = await freshImport();
    restoreDensity();
    expect(document.documentElement.className).toBe("cui-density-compact");
  });

  it("persists a change made after the first caller's component unmounted", async () => {
    const { useDensity } = await freshImport();
    const { mount } = await import("@vue/test-utils");
    const wrapper = mount({ setup: () => ({ d: useDensity() }), template: "<i />" });
    wrapper.unmount();
    useDensity().setDensity("compact");
    await nextTick();
    expect(localStorage.getItem("cui-density")).toBe("compact");
    expect(densityClasses()).toEqual(["cui-density-compact"]);
  });
});
