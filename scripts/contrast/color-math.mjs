/**
 * WCAG contrast math + color parsing — generic, no package-specific
 * knowledge. Shared by every package's contrast-check module under
 * scripts/contrast/.
 */

export function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function linearize(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(r, g, b) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function contrastRatio(hex1, hex2) {
  if (!hex1?.startsWith("#") || !hex2?.startsWith("#")) return NaN;
  const c1 = hexToRgb(hex1),
    c2 = hexToRgb(hex2);
  const l1 = luminance(c1.r, c1.g, c1.b),
    l2 = luminance(c2.r, c2.g, c2.b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function srgbTransfer(x) {
  return x >= 0.0031308 ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055 : 12.92 * x;
}

export function oklchToHex(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let b2 = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const R = Math.round(Math.min(255, Math.max(0, srgbTransfer(r) * 255)));
  const G = Math.round(Math.min(255, Math.max(0, srgbTransfer(g) * 255)));
  const B = Math.round(Math.min(255, Math.max(0, srgbTransfer(b2) * 255)));
  return (
    "#" +
    [R, G, B]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

export function toHex(val) {
  if (!val) return null;
  val = val.trim();
  if (val.startsWith("#")) return val.toUpperCase();
  const m = val.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (m) return oklchToHex(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
  return null;
}

export function grade(ratio, threshold) {
  if (isNaN(ratio)) return "⬜ SKIP";
  if (ratio >= threshold) return "✅ PASS";
  if (ratio >= 3.0 && threshold > 3.0) return "⚠️  ~LG ";
  return "❌ FAIL";
}
