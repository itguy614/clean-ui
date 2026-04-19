#!/usr/bin/env node

/**
 * WCAG AA Contrast Checker for Clean UI themes.
 * Run: node scripts/check-contrast.mjs
 *
 * Checks all semantic color roles (primary, secondary, success, error, warning, info)
 * plus border visibility against theme backgrounds.
 * WCAG AA: 4.5:1 normal text, 3:1 large text, 3:1 non-text (borders/icons)
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Color math ---
function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
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
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
  const l1 = luminance(c1.r, c1.g, c1.b), l2 = luminance(c2.r, c2.g, c2.b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function grade(ratio, threshold) {
  if (isNaN(ratio)) return "⬜ SKIP";
  if (ratio >= threshold) return "✅ PASS";
  if (ratio >= 3.0 && threshold > 3.0) return "⚠️  ~LG ";
  return "❌ FAIL";
}

// --- Semantic role colors (consistent across themes — from main.css oklch, converted to hex) ---
const semanticRoles = {
  secondary: { "100": "#EFECF4", "300": "#7B6E96", "500": "#5A4C76", "700": "#443564", "900": "#302440" },
  success:   { "100": "#E8F5EA", "300": "#3D8A54", "500": "#276E38", "700": "#1E5A2C", "900": "#134422" },
  error:     { "100": "#FAE5E5", "300": "#BA4E4E", "500": "#9E2E2E", "700": "#822424", "900": "#6B1C1C" },
  warning:   { "100": "#FBF0DA", "300": "#917030", "500": "#6E5420", "700": "#554016", "900": "#3A2C0C" },
  info:      { "100": "#E5EEF7", "300": "#3D7BA6", "500": "#275F88", "700": "#1E4D6E", "900": "#123A58" },
};

// --- Parse theme primary + surface colors ---
function parseThemes() {
  const css = readFileSync(resolve(__dirname, "../packages/clean-ui/src/styles/themes.css"), "utf-8");
  const themes = [];
  const blockRe = /\.cui-theme-(\w+)\s*\{([^}]+)\}/g;
  let m;
  while ((m = blockRe.exec(css))) {
    if (css.slice(Math.max(0, m.index - 50), m.index).includes("dark")) continue;
    const id = m[1], body = m[2], colors = {};
    for (const [, step, val] of body.matchAll(/--color-(primary|surface)-(\d+)\s*:\s*(#[^;]+);/g)) {
      colors[(step === "surface" ? "surface-" : "") + val.trim()] = ""; // wrong key
    }
    // Redo properly
    const c = {};
    for (const [, kind, step, val] of body.matchAll(/--color-(primary|surface)-(\d+)\s*:\s*(#[^;]+);/g)) {
      c[(kind === "surface" ? "s" : "") + step] = val.trim();
    }
    if (Object.keys(c).length > 0) themes.push({ id, c });
  }

  // Default (Navy) — approximate hex from oklch
  themes.unshift({ id: "default", c: {
    "50": "#F5F3FF", "100": "#E8E4FC", "200": "#C9BFF7", "300": "#9B85ED",
    "400": "#6F4FDB", "500": "#4527A0", "600": "#3B2092", "700": "#301A7D",
    "800": "#231363", "900": "#180D4A", "950": "#0F0833",
    "s50": "#F6F5FA", "s100": "#EDEBF3", "s200": "#B5B0C8", "s300": "#857D98",
  }});

  // Mono
  themes.push({ id: "mono", c: {
    "50": "#F5F5F5", "100": "#E8E8E8", "200": "#C9C9C9", "300": "#888888",
    "400": "#6F6F6F", "500": "#3A3A3A", "600": "#333333", "700": "#2B2B2B",
    "800": "#1F1F1F", "900": "#171717", "950": "#0D0D0D",
    "s50": "#F3F3F3", "s100": "#E8E8E8", "s200": "#B0B0B0", "s300": "#888888",
  }});

  return themes;
}

const nameMap = {
  "default": "Navy", "stock": "Forest", "access": "Amber", "temp": "Azure",
  "dayton": "Teal", "stat": "Violet", "ruby": "Ruby", "mono": "Mono",
};

const WHITE = "#FFFFFF";
const themes = parseThemes();

console.log("╔═══════════════════════════════════════════════════════════════════════════════════╗");
console.log("║                    WCAG AA Contrast Analysis — Clean UI                           ║");
console.log("║    Text: 4.5:1  |  Large text: 3:1  |  Non-text (borders/UI): 3:1                ║");
console.log("╚═══════════════════════════════════════════════════════════════════════════════════╝\n");

let totalFails = 0;

function check(label, fg, bg, threshold) {
  const r = contrastRatio(fg, bg);
  const s = grade(r, threshold);
  if (!isNaN(r) && r < threshold) totalFails++;
  const rStr = isNaN(r) ? "N/A   " : (r.toFixed(2) + ":1").padEnd(8);
  console.log(`│    ${s}  ${rStr}  ${label.padEnd(44)} ${(fg||"?").padEnd(8)} on ${bg||"?"}`);
}

for (const theme of themes) {
  const name = nameMap[theme.id] || theme.id;
  const p = theme.c;
  const sBg = p["s50"] || "#F5F5F5";
  const sBorder = p["s200"] || "#B8B8B8";       // oklch(0.800) ≈ this
  const sBorderStrong = p["s300"] || "#888888";  // oklch(0.650) ≈ this

  console.log(`┌─ ${name} ${"─".repeat(Math.max(0, 80 - name.length))}┐`);

  // Primary
  console.log("│  PRIMARY");
  check("White on solid (500)",            WHITE,  p["500"], 4.5);
  check("Text (500) on subtle bg (100)",   p["500"], p["100"], 4.5);
  check("Text (500) on white",             p["500"], WHITE, 4.5);
  check("Border (300) on white",           p["300"], WHITE, 3.0);
  check("Border (300) on surface-50",      p["300"], sBg, 3.0);
  check("Outline btn border (300) on s-50", p["300"], sBg, 3.0);

  // Each semantic role
  for (const [role, sh] of Object.entries(semanticRoles)) {
    console.log(`│  ${role.toUpperCase()}`);
    check("White on solid (500)",            WHITE,   sh["500"], 4.5);
    check("Text (500) on subtle bg (100)",   sh["500"], sh["100"], 4.5);
    check("Text (500) on white",             sh["500"], WHITE, 4.5);
    check("Text (500) on surface-50",        sh["500"], sBg, 4.5);
    check("Border (300) on white",           sh["300"], WHITE, 3.0);
    check("Border (300) on surface-50",      sh["300"], sBg, 3.0);
  }

  // Generic borders
  console.log("│  BORDERS (surface tokens)");
  check("cui-border (s-200) on white",          sBorder, WHITE, 3.0);
  check("cui-border (s-200) on surface-50",     sBorder, sBg, 3.0);
  check("cui-border-strong (s-300) on white",   sBorderStrong, WHITE, 3.0);
  check("cui-border-strong (s-300) on s-50",    sBorderStrong, sBg, 3.0);

  console.log(`└${"─".repeat(82)}┘\n`);
}

console.log("═".repeat(84));
console.log(totalFails === 0 ? "🎉 All checks pass!" : `⚠️  ${totalFails} check(s) below threshold.`);
console.log("");
