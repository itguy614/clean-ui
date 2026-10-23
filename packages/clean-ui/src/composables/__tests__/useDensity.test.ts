import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { nextTick } from "vue";
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

// #389 — importing the library ran applyDensity: it stripped a density class the consumer
// put on <html>, and wrote "cui-density=default" into their localStorage.
describe("useDensity at import", () => {
  async function freshImport() {
    vi.resetModules();
    return (await import("../useDensity")).useDensity;
  }
  // Earlier tests in this file store a density; each of these starts from nothing stored.
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("leaves <html> and localStorage alone when nothing is stored", async () => {
    document.documentElement.className = "cui-density-compact";
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    await freshImport();
    expect(document.documentElement.className, "the consumer's own class").toBe("cui-density-compact");
    expect(setItem).not.toHaveBeenCalled();
  });

  it("leaves the consumer's class alone when the stored value isn't a density", async () => {
    localStorage.setItem("cui-density", "huge");
    document.documentElement.className = "cui-density-compact";
    await freshImport();
    expect(document.documentElement.className).toBe("cui-density-compact");
    expect(localStorage.getItem("cui-density"), "not overwritten").toBe("huge");
  });

  it("still restores a density stored earlier", async () => {
    localStorage.setItem("cui-density", "comfortable");
    await freshImport();
    expect(densityClasses()).toEqual(["cui-density-comfortable"]);
  });
});
