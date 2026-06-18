import { describe, it, expect, beforeEach } from "vitest";
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
