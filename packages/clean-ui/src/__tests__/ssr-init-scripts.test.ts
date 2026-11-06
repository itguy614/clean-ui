import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { nextTick } from "vue";
import { ssrDensityInitScript } from "../ssr-density-init";
import { ssrThemeInitScript } from "../ssr-theme-init";
import { DENSITY_PRESETS, useDensity } from "../composables/useDensity";
import { CLASS_PREFIX, useTheme } from "../composables/useTheme";
import {
  DENSITY_CLASS_PREFIX,
  DENSITY_IDS,
  DENSITY_STORAGE_KEY,
  THEME_CLASS_PREFIX,
  THEME_STORAGE_KEY,
} from "../ssr-constants";

const root = () => document.documentElement;
const run = (script: string) => new Function(script)();

beforeEach(() => {
  localStorage.clear();
  root().className = "";
});
afterEach(() => {
  localStorage.clear();
  root().className = "";
});

describe("ssrDensityInitScript (#463)", () => {
  it.each(["compact", "comfortable"])("applies a stored %s density before first paint", (id) => {
    localStorage.setItem("cui-density", id);
    run(ssrDensityInitScript);
    expect(root().className).toBe(`cui-density-${id}`);
  });

  it.each(["default", "huge", "__proto__", "compact "])("ignores a stored %j", (value) => {
    localStorage.setItem("cui-density", value);
    root().className = "consumer-class";
    run(ssrDensityInitScript);
    expect(root().className).toBe("consumer-class");
  });

  it("does nothing, and does not throw, with no stored value", () => {
    run(ssrDensityInitScript);
    expect(root().className).toBe("");
  });

  it("does not throw when storage throws", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    try {
      expect(() => run(ssrDensityInitScript)).not.toThrow();
    } finally {
      Object.defineProperty(window, "localStorage", original);
    }
  });

  it("agrees with useDensity on key, class names and ids", async () => {
    expect(DENSITY_PRESETS.map((p) => p.id)).toEqual([...DENSITY_IDS]);
    for (const id of DENSITY_IDS.filter((i) => i !== "default")) {
      root().className = "";
      localStorage.setItem(DENSITY_STORAGE_KEY, id);
      run(ssrDensityInitScript);
      const fromScript = root().className;
      root().className = "";
      useDensity().setDensity(id);
      await nextTick();
      // The composable writes the same key and the same class the script read and added.
      expect(localStorage.getItem(DENSITY_STORAGE_KEY)).toBe(id);
      expect(root().className).toBe(fromScript);
      expect(fromScript).toBe(DENSITY_CLASS_PREFIX + id);
    }
  });
});

describe("ssrThemeInitScript and useTheme share constants (#463)", () => {
  it("adds the class useTheme would, from the key useTheme writes", async () => {
    useTheme().setTheme("forest");
    await nextTick();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("forest");
    root().className = "";
    run(ssrThemeInitScript);
    expect(root().className).toBe(`${THEME_CLASS_PREFIX}forest`);
    expect(CLASS_PREFIX).toBe(THEME_CLASS_PREFIX);
  });
});
