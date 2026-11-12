import { describe, it, expect, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { h, type Component } from "vue";
import * as phosphor from "@phosphor-icons/vue";
import CuiIcon from "../../components/CuiIcon.vue";
import { BUILTIN_ICONS } from "../generated";
import { IconCaretDown } from "../generated/caret-down";
import { IconCheck } from "../generated/check";
import { IconCircle } from "../generated/circle";
import { registerBuiltinIcons } from "../builtin";
import { registerIcons, __clearRegisteredIcons } from "../registry";
import { __clearWarned } from "../../utils/devWarn";

type Weighted = Component & { iconWeights: string[] };
const pascal = (name: string) => "Ph" + name.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("");
const phosphorIcon = (name: string) => (phosphor as unknown as Record<string, Component>)[pascal(name)];

const CASES = Object.entries(BUILTIN_ICONS).flatMap(([name, icon]) =>
  (icon as Weighted).iconWeights.map((weight) => [name, weight] as const),
);

afterEach(() => {
  __clearRegisteredIcons();
  __clearWarned();
  vi.restoreAllMocks();
});

/**
 * #207: the built-ins replace the full Phosphor components, so each must draw EXACTLY what
 * the Phosphor one draws at the weights the library uses: same paths, same markup.
 */
describe("generated built-in icons draw what Phosphor draws", () => {
  it("covers the set the library draws", () => {
    expect(CASES.length).toBeGreaterThan(55);
  });

  it.each(CASES)("%s at %s: identical markup to the Phosphor component", (name, weight) => {
    const props = { weight, size: "1.25rem", color: "currentColor" };
    const builtin = mount(BUILTIN_ICONS[name], { props }).html();
    const original = mount(phosphorIcon(name), { props }).html();
    expect(original, `${pascal(name)} not found in @phosphor-icons/vue`).toBeTruthy();
    expect(builtin).toBe(original);
  });

  it("renders the right path data, an svg 256 box, and no other weight's paths", () => {
    const svg = mount(IconCheck, { props: { weight: "bold" } }).find("svg");
    expect(svg.attributes("viewBox")).toBe("0 0 256 256");
    const paths = svg.findAll("path");
    expect(paths).toHaveLength(1);
    expect(paths[0].attributes("d")).toBe(
      mount(phosphor.PhCheck, { props: { weight: "bold" } }).find("path").attributes("d"),
    );
    expect(paths[0].attributes("d")).not.toBe(mount(IconCheck).find("path").attributes("d"));
  });

  it("applies size and color like Phosphor, defaulting to 1em and currentColor", () => {
    const sized = mount(IconCaretDown, { props: { size: 24, color: "red" } }).find("svg");
    expect(sized.attributes("width")).toBe("24");
    expect(sized.attributes("height")).toBe("24");
    expect(sized.attributes("fill")).toBe("red");
    const plain = mount(IconCaretDown).find("svg");
    expect(plain.attributes("width")).toBe("1em");
    expect(plain.attributes("fill")).toBe("currentColor");
  });

  it("passes attributes through to the svg and renders the default slot first", () => {
    const w = mount(IconCaretDown, {
      attrs: { "aria-label": "Open", role: "img", class: "x" },
      slots: { default: () => h("title", "Open") },
    });
    const svg = w.find("svg");
    expect(svg.attributes("aria-label")).toBe("Open");
    expect(svg.attributes("role")).toBe("img");
    expect(svg.classes()).toContain("x");
    expect(svg.element.firstElementChild?.tagName).toBe("title");
  });

  it("mirrors with scale(-1, 1)", () => {
    expect(mount(IconCaretDown, { props: { mirrored: true } }).find("svg").attributes("transform")).toBe("scale(-1, 1)");
    expect(mount(IconCaretDown).find("svg").attributes("transform")).toBeUndefined();
  });

  it("draws the regular weight for a weight it does not carry", () => {
    const regular = mount(IconCaretDown).html();
    expect(mount(IconCaretDown, { props: { weight: "duotone" } }).html()).toBe(regular);
    expect(mount(IconCaretDown, { props: { weight: "bold" } }).html()).toBe(regular);
  });

  it("names the weights it carries", () => {
    expect((IconCheck as Weighted).iconWeights).toEqual(["regular", "bold"]);
    expect((IconCircle as Weighted).iconWeights).toEqual(["regular", "fill"]);
    expect((IconCaretDown as Weighted).iconWeights).toEqual(["regular"]);
  });
});

describe("CuiIcon with built-in icons: name, icon and weight", () => {
  const rendered = (w: ReturnType<typeof mount>) => w.find("svg").html();

  it("draws a supported weight on a name, a supported weight on a component, and regular by default", () => {
    registerBuiltinIcons();
    const bold = mount(CuiIcon, { props: { name: "check", weight: "bold" } });
    expect(rendered(bold)).toBe(rendered(mount(CuiIcon, { props: { icon: IconCheck, weight: "bold" } })));
    expect(rendered(bold)).not.toBe(rendered(mount(CuiIcon, { props: { name: "check" } })));
  });

  it("draws regular, with a development warning, for an unsupported weight on a built-in name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    registerBuiltinIcons();
    const w = mount(CuiIcon, { props: { name: "caret-down", weight: "duotone" } });
    expect(rendered(w)).toBe(rendered(mount(CuiIcon, { props: { name: "caret-down" } })));
    // Not duotone, so the duotone treatment is not applied either.
    expect(w.classes()).not.toContain("cui-icon--duotone");
    const message = warn.mock.calls.flat().join("\n");
    expect(message).toContain('weight="duotone" draws regular');
    expect(message).toContain("registerIcons");
  });

  it("warns once per icon and weight, not per instance", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (let i = 0; i < 3; i++) mount(CuiIcon, { props: { icon: IconCaretDown, weight: "thin" } });
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("does not warn for a supported weight", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mount(CuiIcon, { props: { icon: IconCircle, weight: "fill" } });
    mount(CuiIcon, { props: { icon: IconCheck, weight: "bold" } });
    expect(warn).not.toHaveBeenCalled();
  });

  it("a full Phosphor component registered over the name keeps duotone, with the duotone styling", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    registerBuiltinIcons();
    registerIcons({ "caret-down": phosphor.PhCaretDown });
    const w = mount(CuiIcon, { props: { name: "caret-down", weight: "duotone" } });
    expect(w.find("svg [opacity]").exists()).toBe(true);
    expect(w.classes()).toContain("cui-icon--duotone");
    expect(warn).not.toHaveBeenCalled();
  });

  it("a Phosphor component passed directly keeps every weight it carries", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const w = mount(CuiIcon, { props: { icon: phosphor.PhHouse, weight: "duotone" } });
    expect(w.find("svg [opacity]").exists()).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });

  it("forwards size and color to the svg, and attributes to the wrapper", () => {
    const w = mount(CuiIcon, {
      props: { icon: IconCaretDown, size: "lg", color: "error" },
      attrs: { role: "img", "aria-label": "Expand" },
    });
    const svg = w.find("svg");
    expect(svg.attributes("width")).toBe("1.5rem");
    expect(svg.attributes("fill")).toBe("var(--cui-error)");
    expect(w.attributes("role")).toBe("img");
    expect(w.attributes("aria-label")).toBe("Expand");
  });
});
