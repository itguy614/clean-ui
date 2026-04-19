export interface RGB { r: number; g: number; b: number }
export interface HSV { h: number; s: number; v: number }
export interface HSL { h: number; s: number; l: number }
export interface RGBA extends RGB { a: number }

export function hsvToRgb(h: number, s: number, v: number): RGB {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  v = Math.max(0, Math.min(1, v));

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;

  return {
    h,
    s: max === 0 ? 0 : d / max,
    v: max,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export function hexToRgb(hex: string): RGB | null {
  const m = hex.replace("#", "");
  if (m.length === 3) {
    return {
      r: parseInt(m[0] + m[0], 16),
      g: parseInt(m[1] + m[1], 16),
      b: parseInt(m[2] + m[2], 16),
    };
  }
  if (m.length === 6 || m.length === 8) {
    return {
      r: parseInt(m.slice(0, 2), 16),
      g: parseInt(m.slice(2, 4), 16),
      b: parseInt(m.slice(4, 6), 16),
    };
  }
  return null;
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function parseColor(input: string): RGBA | null {
  if (!input) return null;
  input = input.trim();

  // HEX
  if (input.startsWith("#")) {
    const rgb = hexToRgb(input);
    if (rgb) return { ...rgb, a: 1 };
    return null;
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = input.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
      a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1,
    };
  }

  // hsl(h, s%, l%) or hsla(h, s%, l%, a)
  const hslMatch = input.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*(?:,\s*([\d.]+))?\s*\)/);
  if (hslMatch) {
    const rgb = hslToRgb(parseInt(hslMatch[1]), parseInt(hslMatch[2]), parseInt(hslMatch[3]));
    return { ...rgb, a: hslMatch[4] !== undefined ? parseFloat(hslMatch[4]) : 1 };
  }

  return null;
}

export type ColorFormat = "hex" | "rgb" | "hsl";

export function formatColor(r: number, g: number, b: number, a: number, format: ColorFormat): string {
  if (format === "hex") {
    return rgbToHex(r, g, b);
  }
  if (format === "rgb") {
    return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})` : `rgb(${r}, ${g}, ${b})`;
  }
  if (format === "hsl") {
    const hsl = rgbToHsl(r, g, b);
    return a < 1
      ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a.toFixed(2)})`
      : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  }
  return rgbToHex(r, g, b);
}

// Built-in palettes
export const PALETTE_BASIC = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff",
  "#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
];

export const PALETTE_MATERIAL = [
  "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50",
  "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#795548", "#9e9e9e", "#607d8b",
];

export const PALETTE_TAILWIND = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#d946ef", "#ec4899", "#f43f5e", "#64748b", "#78716c",
];

/**
 * Reads the current theme's semantic colors from live CSS custom properties.
 * Uses --cui-{role} semantic tokens (always on :root) and surface scale.
 * Converts oklch values to hex via a temp DOM element.
 */
export function getThemePalette(): string[] {
  if (typeof window === "undefined") return [];

  const roles = ["primary", "secondary", "success", "error", "warning", "info"];
  const slots = ["bg", "border", "", "hover", "active"]; // "" = base color (--cui-primary)
  const colors: string[] = [];

  const el = document.createElement("div");
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  document.body.appendChild(el);

  function readColor(cssValue: string): string | null {
    el.style.color = cssValue;
    const c = getComputedStyle(el).color;
    const m = c.match(/(\d+)/g);
    if (m && m.length >= 3) {
      return rgbToHex(parseInt(m[0]), parseInt(m[1]), parseInt(m[2]));
    }
    return null;
  }

  // Semantic role colors
  for (const role of roles) {
    for (const slot of slots) {
      const token = slot ? `var(--cui-${role}-${slot})` : `var(--cui-${role})`;
      const hex = readColor(token);
      if (hex && !colors.includes(hex)) colors.push(hex);
    }
  }

  // Surface neutrals
  for (const step of ["50", "200", "400", "600", "800", "950"]) {
    const hex = readColor(`var(--color-surface-${step})`);
    if (hex && !colors.includes(hex)) colors.push(hex);
  }

  document.body.removeChild(el);
  return colors;
}
