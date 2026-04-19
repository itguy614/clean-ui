#!/usr/bin/env node

/**
 * WCAG AA Contrast Checker for Clean UI themes — Light & Dark mode.
 * Run: node scripts/check-contrast.mjs
 *
 * Checks all 8 themes in both light and dark mode:
 * - Primary + 5 semantic roles (secondary, success, error, warning, info)
 * - Solid button text on bg (resting + hover) — uses -solid tokens in dark mode
 * - Outline/ghost button text on surface (resting + hover)
 * - Text on subtle backgrounds
 * - Border visibility against backgrounds
 * - Surface border tokens
 *
 * WCAG AA: 4.5:1 normal text, 3:1 large text, 3:1 non-text (borders/icons)
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════
// Color Math
// ═══════════════════════════════════════════════════════════════

function hexToRgb(hex) {
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

function contrastRatio(hex1, hex2) {
  if (!hex1?.startsWith("#") || !hex2?.startsWith("#")) return NaN;
  const c1 = hexToRgb(hex1),
    c2 = hexToRgb(hex2);
  const l1 = luminance(c1.r, c1.g, c1.b),
    l2 = luminance(c2.r, c2.g, c2.b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function srgbTransfer(x) {
  return x >= 0.0031308
    ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055
    : 12.92 * x;
}

function oklchToHex(L, C, H) {
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

function toHex(val) {
  if (!val) return null;
  val = val.trim();
  if (val.startsWith("#")) return val.toUpperCase();
  const m = val.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (m) return oklchToHex(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
  return null;
}

function grade(ratio, threshold) {
  if (isNaN(ratio)) return "⬜ SKIP";
  if (ratio >= threshold) return "✅ PASS";
  if (ratio >= 3.0 && threshold > 3.0) return "⚠️  ~LG ";
  return "❌ FAIL";
}

// ═══════════════════════════════════════════════════════════════
// CSS Parsing
// ═══════════════════════════════════════════════════════════════

function extractColorVars(cssBlock) {
  const vars = {};
  const re = /--(color-[\w]+-\d+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(cssBlock))) {
    const hex = toHex(m[2]);
    if (hex) vars[m[1]] = hex;
  }
  return vars;
}

function buildScale(vars, prefix) {
  const scale = {};
  for (const [key, val] of Object.entries(vars)) {
    if (key.startsWith(prefix)) {
      scale[key.replace(prefix, "")] = val;
    }
  }
  return scale;
}

function parseAllThemes() {
  const mainCss = readFileSync(
    resolve(__dirname, "../packages/clean-ui/src/styles/main.css"),
    "utf-8",
  );
  const themesCss = readFileSync(
    resolve(__dirname, "../packages/clean-ui/src/styles/themes.css"),
    "utf-8",
  );

  const themeBlockMatch = mainCss.match(/@theme\s*\{([\s\S]*?)\}/);
  const defaultVars = themeBlockMatch
    ? extractColorVars(themeBlockMatch[1])
    : {};

  const defaultDarkMatch = themesCss.match(
    /^:where\(\.dark,\s*\.dark\s*\*\)\s*\{([\s\S]*?)\}/m,
  );
  const defaultDarkVars = defaultDarkMatch
    ? extractColorVars(defaultDarkMatch[1])
    : {};

  const themes = [];

  themes.push({
    id: "default",
    name: "Navy",
    primary: buildScale(defaultVars, "color-primary-"),
    surface: buildScale(defaultVars, "color-surface-"),
    darkSurface: buildScale(defaultDarkVars, "color-surface-"),
  });

  const themeConfigs = [
    { id: "stock", name: "Forest" },
    { id: "access", name: "Amber" },
    { id: "temp", name: "Azure" },
    { id: "dayton", name: "Teal" },
    { id: "stat", name: "Violet" },
    { id: "ruby", name: "Ruby" },
    { id: "mono", name: "Mono" },
  ];

  for (const cfg of themeConfigs) {
    const allBlocks = [
      ...themesCss.matchAll(
        new RegExp(
          `\\.cui-theme-${cfg.id}[^{]*\\{([\\s\\S]*?)\\}`,
          "g",
        ),
      ),
    ];

    let lightBody = "";
    let darkBody = "";

    for (const match of allBlocks) {
      const prefix = themesCss.slice(
        Math.max(0, match.index - 120),
        match.index,
      );
      if (prefix.includes(".dark")) {
        if (!darkBody) darkBody = match[1];
      } else {
        if (!lightBody) lightBody = match[1];
      }
    }

    const lightVars = extractColorVars(lightBody);
    const darkVars = extractColorVars(darkBody);

    const theme = {
      id: cfg.id,
      name: cfg.name,
      primary: buildScale(lightVars, "color-primary-"),
      surface: buildScale(lightVars, "color-surface-"),
      darkSurface: buildScale(darkVars, "color-surface-"),
    };

    if (Object.keys(theme.darkSurface).length === 0) {
      theme.darkSurface = { ...themes[0].darkSurface };
    }

    themes.push(theme);
  }

  return themes;
}

// ═══════════════════════════════════════════════════════════════
// Semantic Colors (theme-independent, from @theme / main.css)
// ═══════════════════════════════════════════════════════════════

// Light mode scale values (from @theme)
const semantic = {
  secondary: {
    100: toHex("oklch(0.94 0.015 270)"),
    300: toHex("oklch(0.58 0.05 270)"),
    500: toHex("oklch(0.45 0.06 270)"),
    700: toHex("oklch(0.35 0.05 270)"),
    900: toHex("oklch(0.25 0.03 270)"),
  },
  success: {
    100: toHex("oklch(0.95 0.04 150)"),
    300: toHex("oklch(0.58 0.12 150)"),
    500: toHex("oklch(0.45 0.14 150)"),
    700: toHex("oklch(0.36 0.12 150)"),
    900: toHex("oklch(0.28 0.08 150)"),
  },
  error: {
    100: toHex("oklch(0.95 0.04 25)"),
    300: toHex("oklch(0.60 0.14 25)"),
    500: toHex("oklch(0.50 0.20 25)"),
    700: toHex("oklch(0.40 0.16 25)"),
    900: toHex("oklch(0.28 0.10 25)"),
  },
  warning: {
    100: toHex("oklch(0.96 0.04 80)"),
    300: toHex("oklch(0.62 0.12 80)"),
    500: toHex("oklch(0.52 0.13 80)"),
    700: toHex("oklch(0.42 0.12 80)"),
    900: toHex("oklch(0.30 0.08 80)"),
  },
  info: {
    100: toHex("oklch(0.95 0.03 230)"),
    300: toHex("oklch(0.58 0.10 230)"),
    500: toHex("oklch(0.45 0.13 230)"),
    700: toHex("oklch(0.36 0.10 230)"),
    900: toHex("oklch(0.28 0.07 230)"),
  },
};

// Dark mode: text/outline values (same for all themes)
// "color" = --cui-{role} (text in outline/ghost, NOT used for solid bg anymore)
// "hover" = --cui-{role}-hover (text hover in outline/ghost)
// "bg"    = --cui-{role}-bg (subtle variant background)
// "border"= --cui-{role}-border
// "solid" = --cui-{role}-solid (solid button bg — falls back to 500-level)
// "solidHover" = --cui-{role}-solid-hover (solid button hover bg — 700-level)
const semanticDark = {
  secondary: {
    color: toHex("oklch(0.58 0.05 270)"),     // secondary-300
    hover: toHex("oklch(0.94 0.015 270)"),     // secondary-100
    bg: toHex("oklch(0.25 0.03 270)"),         // secondary-900
    border: toHex("oklch(0.58 0.05 270)"),     // secondary-300 (brighter for visibility)
    solid: toHex("oklch(0.45 0.06 270)"),      // secondary-500
    solidHover: toHex("oklch(0.35 0.05 270)"), // secondary-700
  },
  success: {
    color: toHex("oklch(0.65 0.15 150)"),
    hover: toHex("oklch(0.76 0.14 150)"),
    bg: toHex("oklch(0.22 0.06 150)"),
    border: toHex("oklch(0.60 0.12 150)"),     // oklch 0.60 for 3:1+ visibility
    solid: toHex("oklch(0.45 0.14 150)"),      // success-500
    solidHover: toHex("oklch(0.36 0.12 150)"), // success-700
  },
  error: {
    color: toHex("oklch(0.68 0.18 25)"),
    hover: toHex("oklch(0.76 0.12 25)"),
    bg: toHex("oklch(0.22 0.08 25)"),
    border: toHex("oklch(0.60 0.16 25)"),      // oklch 0.60 for 3:1+ visibility
    solid: toHex("oklch(0.50 0.20 25)"),       // error-500
    solidHover: toHex("oklch(0.40 0.16 25)"),  // error-700
  },
  warning: {
    color: toHex("oklch(0.80 0.14 80)"),
    hover: toHex("oklch(0.84 0.12 80)"),
    bg: toHex("oklch(0.22 0.06 80)"),
    border: toHex("oklch(0.55 0.12 80)"),
    solid: null,  // warning uses dark text, not white — no separate solid needed
    solidHover: null,
  },
  info: {
    color: toHex("oklch(0.65 0.11 230)"),
    hover: toHex("oklch(0.76 0.09 230)"),
    bg: toHex("oklch(0.22 0.05 230)"),
    border: toHex("oklch(0.60 0.10 230)"),     // oklch 0.60 for 3:1+ visibility
    solid: toHex("oklch(0.45 0.13 230)"),      // info-500
    solidHover: toHex("oklch(0.36 0.10 230)"), // info-700
  },
};

const WHITE = "#FFFFFF";

// ═══════════════════════════════════════════════════════════════
// Run Checks
// ═══════════════════════════════════════════════════════════════

const themes = parseAllThemes();

console.log(
  "╔══════════════════════════════════════════════════════════════════════════════════════════════╗",
);
console.log(
  "║                          WCAG AA Contrast Analysis — Clean UI                               ║",
);
console.log(
  "║    Text: 4.5:1  |  Large text: 3:1  |  Non-text (borders/UI): 3:1  |  Light + Dark mode    ║",
);
console.log(
  "╚══════════════════════════════════════════════════════════════════════════════════════════════╝\n",
);

let totalFails = 0;
const failures = [];

function check(mode, theme, label, fg, bg, threshold) {
  const r = contrastRatio(fg, bg);
  const s = grade(r, threshold);
  if (!isNaN(r) && r < threshold) {
    totalFails++;
    failures.push({ mode, theme, label, fg, bg, ratio: r, threshold });
  }
  const rStr = isNaN(r) ? "N/A   " : (r.toFixed(2) + ":1").padEnd(8);
  console.log(
    `│    ${s}  ${rStr}  ${label.padEnd(48)} ${(fg || "?").padEnd(9)} on ${bg || "?"}`,
  );
}

for (const theme of themes) {
  const p = theme.primary;
  const sf = theme.surface;
  const ds = theme.darkSurface;

  const sBg = sf["50"] || "#F5F5F5";
  const sBorder = sf["500"] || "#A0A0A0";         // cui-border = surface-500
  const sBorderStrong = sf["600"] || "#888888";    // cui-border-strong = surface-600

  const dsBg = ds["900"] || "#333333";
  const dsTableHead = ds["800"] || "#444444";
  const dsBorder = ds["600"] || "#666666";        // cui-border in dark = s-600
  const dsBorderStrong = ds["500"] || "#777777";  // cui-border-strong in dark = s-500
  const dsWarningText = ds["950"] || "#1A1A1A";

  // ═════════════════════════════════════════════════════════
  // LIGHT MODE
  // ═════════════════════════════════════════════════════════
  console.log(
    `┌─ ${theme.name} — LIGHT MODE ${"─".repeat(Math.max(0, 71 - theme.name.length))}┐`,
  );

  console.log("│  PRIMARY");
  check("light", theme.name, "Solid btn: white on 500", WHITE, p["500"], 4.5);
  check("light", theme.name, "Solid btn hover: white on 700", WHITE, p["700"], 4.5);
  check("light", theme.name, "Outline btn: 500 on white", p["500"], WHITE, 4.5);
  check("light", theme.name, "Outline btn hover: 700 on white", p["700"], WHITE, 4.5);
  check("light", theme.name, "Text 500 on surface-50", p["500"], sBg, 4.5);
  check("light", theme.name, "Hover text 700 on surface-50", p["700"], sBg, 4.5);
  check("light", theme.name, "Text 500 on subtle bg (100)", p["500"], p["100"], 4.5);
  check("light", theme.name, "Border 300 on white", p["300"], WHITE, 3.0);
  check("light", theme.name, "Border 300 on surface-50", p["300"], sBg, 3.0);

  for (const [role, sh] of Object.entries(semantic)) {
    // Warning uses white text now (was dark text)
    const solidText = WHITE;
    console.log(`│  ${role.toUpperCase()}`);
    check("light", theme.name, "Solid btn: white on 500", solidText, sh["500"], 4.5);
    check("light", theme.name, "Solid btn hover: white on 700", solidText, sh["700"], 4.5);
    check("light", theme.name, "Outline btn: 500 on white", sh["500"], WHITE, 4.5);
    check("light", theme.name, "Outline btn hover: 700 on white", sh["700"], WHITE, 4.5);
    check("light", theme.name, "Text 500 on surface-50", sh["500"], sBg, 4.5);
    check("light", theme.name, "Text 500 on subtle bg (100)", sh["500"], sh["100"], 4.5);
    check("light", theme.name, "Border 300 on white", sh["300"], WHITE, 3.0);
    check("light", theme.name, "Border 300 on surface-50", sh["300"], sBg, 3.0);
  }

  console.log("│  BORDERS (surface tokens)");
  check("light", theme.name, "cui-border (s-500) on white", sBorder, WHITE, 3.0);
  check("light", theme.name, "cui-border (s-500) on surface-50", sBorder, sBg, 3.0);
  check("light", theme.name, "cui-border-strong (s-600) on white", sBorderStrong, WHITE, 3.0);
  check("light", theme.name, "cui-border-strong (s-600) on s-50", sBorderStrong, sBg, 3.0);

  console.log(`└${"─".repeat(92)}┘\n`);

  // ═════════════════════════════════════════════════════════
  // DARK MODE
  // ═════════════════════════════════════════════════════════
  console.log(
    `┌─ ${theme.name} — DARK MODE ${"─".repeat(Math.max(0, 72 - theme.name.length))}┐`,
  );

  // Primary dark: text=300, solid=600, hover-text=200, solid-hover=700
  console.log("│  PRIMARY");
  check("dark", theme.name, "Solid btn: white on p-600 (solid)", WHITE, p["600"], 4.5);
  check("dark", theme.name, "Solid btn hover: white on p-700", WHITE, p["700"], 4.5);
  check("dark", theme.name, "Outline text: p-300 on s-900", p["300"], dsBg, 4.5);
  check("dark", theme.name, "Outline hover: p-200 on s-900", p["200"], dsBg, 4.5);
  check("dark", theme.name, "Text p-300 on s-800 (table head)", p["300"], dsTableHead, 4.5);
  check("dark", theme.name, "Text on subtle bg: p-300 on p-900", p["300"], p["900"], 4.5);
  check("dark", theme.name, "Border p-400 on s-900", p["400"], dsBg, 3.0);
  check("dark", theme.name, "Border p-400 on s-800", p["400"], dsTableHead, 3.0);

  for (const [role, dk] of Object.entries(semanticDark)) {
    const useDarkText = role === "warning";
    const solidText = useDarkText ? dsWarningText : WHITE;
    const solidLabel = useDarkText ? "Dark text" : "White";
    // For solid: use -solid token if available, otherwise the main color
    const solidBg = dk.solid || dk.color;
    const solidHoverBg = dk.solidHover || dk.hover;
    console.log(`│  ${role.toUpperCase()}`);
    check("dark", theme.name, `Solid btn: ${solidLabel} on solid bg`, solidText, solidBg, 4.5);
    check("dark", theme.name, `Solid btn hover: ${solidLabel} on solid`, solidText, solidHoverBg, 4.5);
    check("dark", theme.name, "Outline text: color on s-900", dk.color, dsBg, 4.5);
    check("dark", theme.name, "Outline hover: hover on s-900", dk.hover, dsBg, 4.5);
    check("dark", theme.name, "Text on subtle bg", dk.color, dk.bg, 4.5);
    check("dark", theme.name, "Border on s-900", dk.border, dsBg, 3.0);
  }

  console.log("│  BORDERS (surface tokens)");
  check("dark", theme.name, "cui-border (s-600) on s-900", dsBorder, dsBg, 3.0);
  check("dark", theme.name, "cui-border-strong (s-500) on s-900", dsBorderStrong, dsBg, 3.0);
  check("dark", theme.name, "cui-border-strong (s-500) on s-800", dsBorderStrong, dsTableHead, 3.0);

  console.log(`└${"─".repeat(92)}┘\n`);
}

// ═══════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════

console.log("═".repeat(94));
if (totalFails === 0) {
  console.log("🎉 All checks pass!");
} else {
  console.log(`⚠️  ${totalFails} check(s) below threshold.\n`);
  console.log("FAILURES:");
  console.log("─".repeat(94));
  for (const f of failures) {
    console.log(
      `  [${f.mode.toUpperCase()}] ${f.theme.padEnd(8)} ${f.label.padEnd(48)} ${f.ratio.toFixed(2)}:1 (need ${f.threshold}:1)  ${f.fg} on ${f.bg}`,
    );
  }
}
console.log("");
