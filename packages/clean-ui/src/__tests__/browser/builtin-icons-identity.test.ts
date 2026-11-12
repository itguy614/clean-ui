import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import type { Component } from "vue";
import * as phosphor from "@phosphor-icons/vue";
import CuiIcon from "../../components/CuiIcon.vue";
import { BUILTIN_ICONS } from "../../icons/generated";
import { registerBuiltinIcons } from "../../icons/builtin";

/**
 * #207 — the built-in icons are generated from Phosphor's SVG assets and carry only the
 * weights the library draws. They must look EXACTLY like the full Phosphor components they
 * replaced, so every icon the library draws, at every weight it draws it, is rasterised in a
 * real browser through `CuiIcon` and compared pixel for pixel with the Phosphor component
 * (the same package version the library used before, kept as a dev dependency for this).
 */
const pascal = (name: string) => "Ph" + name.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("");
const SIZE = 48;
const modules = import.meta.glob<Record<string, Component>>("../../icons/generated/*.ts", { eager: true });
const ALL_GENERATED: Record<string, Component> = Object.fromEntries(
  Object.entries(modules)
    .filter(([path]) => !path.endsWith("/index.ts"))
    .map(([path, mod]) => [path.match(/([^/]+)\.ts$/)![1], Object.values(mod)[0]]),
);
const mounted: { unmount(): void }[] = [];
afterEach(() => mounted.splice(0).forEach((w) => w.unmount()));

/** Rasterise an svg element at SIZE x SIZE, in black, as RGBA bytes. */
async function pixels(svg: SVGSVGElement): Promise<Uint8ClampedArray> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(SIZE));
  clone.setAttribute("height", String(SIZE));
  clone.setAttribute("fill", "#000");
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("svg failed to load"));
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  return ctx.getImageData(0, 0, SIZE, SIZE).data;
}

function render(icon: Component, weight: string): SVGSVGElement {
  const w = mount(CuiIcon, { props: { icon, weight: weight as never, size: `${SIZE}px` }, attachTo: document.body });
  mounted.push(w);
  return w.find("svg").element as SVGSVGElement;
}

describe("built-in icons are pixel-identical to the Phosphor icons they replace (real browser)", () => {
  registerBuiltinIcons();
  // Every generated icon: the built-ins and the markdown editor's.
  const cases = Object.entries(ALL_GENERATED).flatMap(([name, icon]) =>
    ((icon as { iconWeights: string[] }).iconWeights).map((weight) => [name, weight] as const),
  );

  it.each(cases)("%s at %s", async (name, weight) => {
    const original = (phosphor as unknown as Record<string, Component>)[pascal(name)];
    const mine = await pixels(render(ALL_GENERATED[name], weight));
    const theirs = await pixels(render(original, weight));
    // Not a blank raster on both sides.
    expect(mine.some((v, i) => i % 4 === 3 && v > 0), `${name} drew nothing`).toBe(true);
    expect(mine.every((v, i) => v === theirs[i]), `${name} (${weight}) differs`).toBe(true);
  });

  it("the library's own components draw the same svg through a component prop as through its name", () => {
    // The structure change (#207): `<CuiIcon :icon="IconCaretDown" />` replaces the name.
    const byName = mount(CuiIcon, { props: { name: "caret-down", size: "1rem" } }).html();
    const byIcon = mount(CuiIcon, { props: { icon: BUILTIN_ICONS["caret-down"], size: "1rem" } }).html();
    expect(byIcon).toBe(byName);
  });
});
