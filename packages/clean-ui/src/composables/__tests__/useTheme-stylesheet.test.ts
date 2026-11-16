import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { nextTick } from "vue";

// #220 — the seven non-default palettes are opt-in stylesheets, each declaring a
// `--cui-theme-<id>` marker on its class. jsdom can't resolve a stylesheet's custom
// properties, so `getComputedStyle` is what is stubbed: the marker present is "the file is
// loaded". useTheme is a module singleton, so each test imports a fresh copy.
const root = () => document.documentElement;
const hasClass = (c: string) => root().classList.contains(c);
async function freshUseTheme() {
  vi.resetModules();
  return (await import("../useTheme")).useTheme;
}

describe("a theme whose stylesheet is not loaded (#220)", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  const markers = (loaded: string[]) =>
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      () =>
        ({
          getPropertyValue: (name: string) => (loaded.some((id) => name === `--cui-theme-${id}`) ? " 1" : ""),
        }) as unknown as CSSStyleDeclaration,
    );
  const messages = () => warn.mock.calls.map((c: unknown[]) => String(c[0]));

  beforeEach(() => {
    localStorage.clear();
    root().className = "";
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("warns once, naming the theme and the file to import", async () => {
    markers([]);
    const { setTheme } = (await freshUseTheme())();
    setTheme("forest");
    await nextTick();
    setTheme("teal");
    await nextTick();
    setTheme("forest");
    await nextTick();
    expect(messages().filter((m) => m.includes('"forest"'))).toHaveLength(1);
    expect(messages()[0]).toContain("@itguy614/clean-ui/themes/forest.css");
    expect(messages()[0]).toContain("@itguy614/clean-ui/styles/all.css");
    expect(messages().some((m) => m.includes('"teal"'))).toBe(true);
    expect(hasClass("cui-theme-forest")).toBe(true); // the class still applies: only the file is missing
  });

  it("warns for a stored theme restored at startup", async () => {
    markers([]);
    localStorage.setItem("cui-theme", "ruby");
    (await freshUseTheme())();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(messages()[0]).toContain("themes/ruby.css");
  });

  it("is silent when the theme's stylesheet is loaded", async () => {
    markers(["forest"]);
    const { setTheme } = (await freshUseTheme())();
    setTheme("forest");
    await nextTick();
    expect(warn).not.toHaveBeenCalled();
  });

  it("is silent for the default and for a consumer's own theme", async () => {
    markers([]);
    const { setTheme } = (await freshUseTheme())();
    setTheme("acme");
    await nextTick();
    setTheme("default");
    await nextTick();
    setTheme("navy");
    await nextTick();
    expect(warn).not.toHaveBeenCalled();
  });

  it("is silent, and never looks, in a production build", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const computed = markers([]);
    const { setTheme } = (await freshUseTheme())();
    setTheme("forest");
    await nextTick();
    expect(warn).not.toHaveBeenCalled();
    expect(computed).not.toHaveBeenCalled();
  });
});
