import { describe, it, expect } from "vitest";
import { formatColor, hexToRgb, parseColor } from "../color";

/**
 * #309 — `formatColor(…, "hex")` dropped alpha, so a CuiColorPicker with `show-alpha` and
 * the default hex format emitted an opaque colour. Hex now carries an alpha byte
 * (`#rrggbbaa`) whenever it is below ff, and `parseColor` reads it back.
 */
describe("formatColor hex alpha", () => {
  it("keeps six digits for an opaque colour", () => {
    expect(formatColor(128, 75, 64, 1, "hex")).toBe("#804b40");
  });

  it("appends the alpha byte below 1", () => {
    expect(formatColor(128, 75, 64, 0.5, "hex")).toBe("#804b4080");
    expect(formatColor(128, 75, 64, 0.75, "hex")).toBe("#804b40bf");
  });

  it("writes a fully transparent colour as 00, not as opaque", () => {
    expect(formatColor(255, 0, 0, 0, "hex")).toBe("#ff000000");
  });

  it("rounds the alpha to the nearest byte, and stays opaque when that is ff", () => {
    expect(formatColor(255, 0, 0, 0.01, "hex")).toBe("#ff000003"); // 2.55 → 3
    expect(formatColor(255, 0, 0, 0.999, "hex")).toBe("#ff0000"); // 254.7 → 255
  });
});

describe("parseColor hex alpha", () => {
  it("reads six and three digits as opaque", () => {
    expect(parseColor("#804b40")).toEqual({ r: 128, g: 75, b: 64, a: 1 });
    expect(parseColor("#f00")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it("reads the alpha byte of eight digits", () => {
    expect(parseColor("#804b4080")).toEqual({ r: 128, g: 75, b: 64, a: 128 / 255 });
    expect(parseColor("#ff000000")?.a).toBe(0);
    expect(parseColor("#ff0000ff")?.a).toBe(1);
  });

  it("reads four digits as #rgba", () => {
    expect(parseColor("#f008")).toEqual({ r: 255, g: 0, b: 0, a: 0x88 / 255 });
  });

  it("round-trips through formatColor, at every alpha byte", () => {
    for (let byte = 0; byte <= 255; byte++) {
      const hex = `#336699${byte.toString(16).padStart(2, "0")}`;
      const c = parseColor(hex)!;
      expect(formatColor(c.r, c.g, c.b, c.a, "hex")).toBe(byte === 255 ? "#336699" : hex);
    }
  });

  it("round-trips the picker's 1% alpha steps", () => {
    for (let pct = 0; pct <= 100; pct++) {
      const out = formatColor(51, 102, 153, pct / 100, "hex");
      const c = parseColor(out)!;
      expect(Math.round(c.a * 100)).toBe(pct);
      expect(formatColor(c.r, c.g, c.b, c.a, "hex")).toBe(out);
    }
  });
});

describe("parseColor malformed hex", () => {
  it("rejects a non-hex digit anywhere instead of reading a prefix", () => {
    for (const bad of ["#ff0000zz", "#f00z", "#12345z", "#ff00001g", "#ff0000-1", "#gg0000"]) {
      expect(parseColor(bad), bad).toBeNull();
    }
  });
});

describe("formatColor rgb/hsl alpha", () => {
  it("is opaque when the alpha rounds to 1.00, never rgba(…, 1.00)", () => {
    expect(formatColor(255, 0, 0, 0.996, "rgb")).toBe("rgb(255, 0, 0)");
    expect(formatColor(255, 0, 0, 0.996, "hsl")).toBe("hsl(0, 100%, 50%)");
    expect(formatColor(255, 0, 0, 0.5, "rgb")).toBe("rgba(255, 0, 0, 0.50)");
  });
});

describe("hexToRgb", () => {
  it("still returns the colour alone, dropping any alpha", () => {
    expect(hexToRgb("#804b4080")).toEqual({ r: 128, g: 75, b: 64 });
    expect(hexToRgb("#f008")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("#12345")).toBeNull();
  });
});
