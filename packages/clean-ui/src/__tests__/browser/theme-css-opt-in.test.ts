import { describe, it, expect, afterEach, vi } from "vitest";
import { nextTick } from "vue";
import main from "../../styles/main.css?inline";
import navyScale from "../../styles/theme.css?raw";
import { themeCss } from "./theme-css";
import { useTheme } from "../../composables/useTheme";
import { __clearWarned } from "../../utils/devWarn";

/**
 * #220 — the non-default palettes are opt-in files. A themed region must resolve its colours
 * from exactly the files loaded: with its file it is that theme in light and dark, in any order
 * relative to the other theme files, and without it the class is inert and the region stays on
 * the page's Navy. Real browser: the cascade and computed values.
 *
 * `main.css?inline` is the default stylesheet (Navy's dark block and the semantic slots; its
 * `@theme` scale is dropped by the inliner, so the scale is restated as `:root`, as
 * list-inset.test.ts does). Theme files are appended one at a time, as `<style>`s in the order
 * a consumer's imports would give.
 */
const FOREST = { light: "#2B5C3C", dark: "#A8D6B5" }; // forest's primary-500 and primary-200
const RUBY = { light: "#9B1F23", dark: "#F9BCBD" }; // ruby's primary-500 and primary-200

const sheets: HTMLStyleElement[] = [];
function load(...css: string[]) {
  for (const text of css) {
    const style = document.createElement("style");
    style.textContent = text;
    document.head.append(style);
    sheets.push(style);
  }
}
const loadBase = () => load(`${main}\n${navyScale.replace(/^@theme/m, ":root")}`);

afterEach(() => {
  sheets.splice(0).forEach((s) => s.remove());
  document.getElementById("fixture")?.remove();
  document.documentElement.className = "";
});

/** The colour a probe paints with `background: <value>` inside an element of class `className`. */
function paint(value: string, className: string): string {
  const host = document.createElement("div");
  host.id = "fixture";
  host.className = className;
  const probe = document.createElement("div");
  probe.style.background = value;
  host.append(probe);
  document.body.append(host);
  const out = getComputedStyle(probe).backgroundColor;
  host.remove();
  return out;
}
const slot = (className: string, dark = false) => {
  if (dark) document.documentElement.classList.add("dark");
  const out = paint("var(--cui-primary)", className);
  document.documentElement.classList.remove("dark");
  return out;
};
const hex = (value: string) => paint(value, "");

describe("a scoped theme with only its own file loaded (real browser)", () => {
  it("resolves the theme's colours in light and dark", () => {
    loadBase();
    load(themeCss.forest);
    expect(slot("cui-theme-forest")).toBe(hex(FOREST.light));
    expect(slot("cui-theme-forest", true)).toBe(hex(FOREST.dark));
    expect(slot("cui-theme-forest dark")).toBe(hex(FOREST.dark)); // the theme element is itself dark
  });

  // The dark surface scale is the part that differs per form: forest's dark surface-800 is
  // `oklch(0.380 0.012 150)`, its light one `0.010`, Navy's dark hue 270. A computed oklch()
  // keeps what was written, so the strings tell them apart.
  it.each([
    ["a dark ancestor", `<div class="dark"><div class="cui-theme-forest"><i></i></div></div>`],
    ["the same element", `<div class="cui-theme-forest dark"><i></i></div>`],
    ["a dark descendant", `<div class="cui-theme-forest"><div class="dark"><i></i></div></div>`],
  ])("takes forest's dark surfaces from %s", (_label, html) => {
    loadBase();
    load(themeCss.forest);
    const host = document.createElement("div");
    host.id = "fixture";
    host.innerHTML = html;
    document.body.append(host);
    const leaf = host.querySelector("i") as HTMLElement;
    leaf.style.background = "var(--cui-surface-bg)";
    const got = getComputedStyle(leaf).backgroundColor;
    expect(got).toBe(hex("oklch(0.380 0.012 150)"));
    expect(got).not.toBe(hex("oklch(0.380 0.010 150)"));
  });

  it("is a theme per file: each of the seven resolves a primary of its own, none Navy's", () => {
    loadBase();
    load(...Object.values(themeCss));
    const navy = slot("");
    const seen = new Set<string>();
    for (const name of Object.keys(themeCss)) {
      const colour = slot(`cui-theme-${name}`);
      expect(colour, name).not.toBe(navy);
      seen.add(colour);
    }
    expect(seen.size).toBe(Object.keys(themeCss).length);
  });

  it("stays on the page's Navy when its file is not loaded", () => {
    loadBase();
    load(themeCss.ruby); // some other theme's file is no help to forest
    expect(slot("cui-theme-forest")).toBe(slot(""));
    expect(slot("cui-theme-forest", true)).toBe(slot("", true));
    expect(slot("cui-theme-forest")).not.toBe(hex(FOREST.light));
  });

  it.each([
    ["forest then ruby", ["forest", "ruby"]],
    ["ruby then forest", ["ruby", "forest"]],
  ])("two theme files load in any order: %s", (_label, order) => {
    loadBase();
    load(...order.map((n) => themeCss[n]));
    expect(slot("cui-theme-forest")).toBe(hex(FOREST.light));
    expect(slot("cui-theme-ruby")).toBe(hex(RUBY.light));
    expect(slot("cui-theme-forest", true)).toBe(hex(FOREST.dark));
    expect(slot("cui-theme-ruby", true)).toBe(hex(RUBY.dark));
  });

  it("a theme file loaded after the consumer's own override leaves it winning", () => {
    loadBase();
    load(".my-box { --cui-primary: rgb(1, 2, 3); }", themeCss.forest);
    expect(slot("my-box cui-theme-forest")).toBe("rgb(1, 2, 3)");
  });
});

describe("the marker each theme file declares", () => {
  const marker = (className: string, name: string) => {
    const el = document.createElement("div");
    el.className = className;
    document.body.append(el);
    const value = getComputedStyle(el).getPropertyValue(`--cui-theme-${name}`).trim();
    el.remove();
    return value;
  };

  it("reads 1 once the file is loaded, and nothing before", () => {
    loadBase();
    expect(marker("cui-theme-forest", "forest")).toBe("");
    load(themeCss.forest);
    expect(marker("cui-theme-forest", "forest")).toBe("1");
    expect(marker("cui-theme-ruby", "ruby")).toBe(""); // a different file's marker stays unset
  });
});

describe("useTheme's development warning, against real stylesheets", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    __clearWarned();
    localStorage.clear();
  });

  it("warns for a theme whose file is missing, and not for one that is loaded", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    loadBase();
    load(themeCss.ruby);
    const { setTheme } = useTheme();
    setTheme("ruby");
    await nextTick();
    expect(warn).not.toHaveBeenCalled();
    setTheme("violet");
    await nextTick();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("@itguy614/clean-ui/themes/violet.css");
    setTheme("default");
    await nextTick();
  });
});
