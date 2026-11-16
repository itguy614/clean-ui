import { describe, it, expect } from "vitest";
import { GRAIN_LAYER, resolveGradient } from "../gradient";

describe("resolveGradient (#406)", () => {
  it("returns null without a gradient to paint", () => {
    expect(resolveGradient({})).toBeNull();
    expect(resolveGradient({ from: "primary" })).toBeNull();
    expect(resolveGradient({ to: "primary" })).toBeNull();
    expect(resolveGradient({ via: "info", smooth: true })).toBeNull();
    expect(resolveGradient({ gradient: "   " })).toBeNull();
  });

  it("maps roles to their token and passes raw CSS through", () => {
    const g = resolveGradient({ from: "primary", to: "#ff0066", angle: 90 })!;
    expect(g.fallback).toBe("linear-gradient(90deg, var(--cui-primary), #ff0066)");
    expect(g.modern).toBe("linear-gradient(in oklch shorter hue 90deg, var(--cui-primary), #ff0066)");
  });

  it("defaults the angle to 180", () => {
    expect(resolveGradient({ from: "info", to: "success" })!.fallback).toMatch(/^linear-gradient\(180deg,/);
  });

  it("keeps angle 0 (not treated as unset)", () => {
    expect(resolveGradient({ from: "info", to: "success", angle: 0 })!.fallback).toMatch(/^linear-gradient\(0deg,/);
  });

  it("emits two stops without via and three with it, in order", () => {
    const two = resolveGradient({ from: "primary", to: "info" })!;
    const three = resolveGradient({ from: "primary", via: "success", to: "info" })!;
    expect(two.fallback).toBe("linear-gradient(180deg, var(--cui-primary), var(--cui-info))");
    expect(three.fallback).toBe("linear-gradient(180deg, var(--cui-primary), var(--cui-success), var(--cui-info))");
    expect(three.modern).toContain("in oklch shorter hue 180deg, var(--cui-primary), var(--cui-success), var(--cui-info)");
  });

  it("the fallback is plain sRGB and the modern form interpolates in oklch", () => {
    const g = resolveGradient({ from: "primary", to: "info" })!;
    expect(g.fallback).not.toContain("oklch");
    expect(g.modern).toContain("in oklch shorter hue");
  });

  it("uses a raw gradient as written in both forms, and it wins over the flat props", () => {
    const raw = "radial-gradient(circle at top, red, blue)";
    const g = resolveGradient({ gradient: ` ${raw} `, from: "primary", to: "info", angle: 45 })!;
    expect(g.fallback).toBe(raw);
    expect(g.modern).toBe(raw);
  });

  it("puts the grain above the gradient only when smooth", () => {
    const plain = resolveGradient({ from: "primary", to: "info" })!;
    const smooth = resolveGradient({ from: "primary", to: "info", smooth: true })!;
    expect(plain.fallback).not.toContain("data:image/svg+xml");
    expect(smooth.fallback.startsWith(`${GRAIN_LAYER}, linear-gradient(`)).toBe(true);
    expect(smooth.modern.startsWith(`${GRAIN_LAYER}, linear-gradient(in oklch`)).toBe(true);
    expect(resolveGradient({ gradient: "conic-gradient(red, blue)", smooth: true })!.fallback.startsWith(GRAIN_LAYER)).toBe(true);
  });

  it("the grain is a static feTurbulence data URI with its opacity baked in", () => {
    const svg = decodeURIComponent(GRAIN_LAYER);
    expect(svg).toContain("feTurbulence");
    expect(svg).toContain("opacity='0.18'");
    expect(GRAIN_LAYER).toMatch(/^url\("data:image\/svg\+xml,%3Csvg/);
  });

  it("caches by options: equal inputs share a result, different ones do not", () => {
    const a = resolveGradient({ from: "primary", to: "info", angle: 33 });
    expect(resolveGradient({ to: "info", from: "primary", angle: 33 })).toBe(a);
    expect(resolveGradient({ from: "primary", to: "info", angle: 34 })).not.toBe(a);
    expect(resolveGradient({ from: "primary", to: "info", angle: 33, smooth: true })).not.toBe(a);
  });
});
