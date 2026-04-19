#!/usr/bin/env node

/**
 * WCAG AA Contrast Checker for Clean UI themes.
 * Run: node scripts/check-contrast.mjs
 *
 * Reads theme hex colors from themes.css and checks critical color pairs.
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
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const l1 = luminance(c1.r, c1.g, c1.b);
  const l2 = luminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function grade(ratio) {
  if (ratio >= 4.5) return "✅ AA";
  if (ratio >= 3.0) return "⚠️  lg only";
  return "❌ FAIL";
}

// --- Parse themes ---
function parseThemes() {
  const themesPath = resolve(__dirname, "../packages/clean-ui/src/styles/themes.css");
  const css = readFileSync(themesPath, "utf-8");

  const themes = [];

  // Match theme blocks: .cui-theme-{id} { ... }
  const blockRe = /\.cui-theme-(\w+)\s*\{([^}]+)\}/g;
  let match;
  while ((match = blockRe.exec(css))) {
    const id = match[1];
    const body = match[2];

    // Skip dark mode blocks
    if (css.slice(Math.max(0, match.index - 50), match.index).includes("dark")) continue;

    const colors = {};
    const propRe = /--color-primary-(\d+)\s*:\s*([^;]+);/g;
    let pm;
    while ((pm = propRe.exec(body))) {
      colors[pm[1]] = pm[2].trim();
    }

    // Only add if colors are hex (skip oklch-only themes parsed from dark blocks)
    const hasHex = Object.values(colors).some(v => v.startsWith("#"));
    if (Object.keys(colors).length > 0 && hasHex) {
      themes.push({ id, colors });
    }
  }

  // Add default (Navy) — hardcoded since it uses oklch in @theme
  // These are approximate hex conversions of the oklch values
  themes.unshift({
    id: "default (Navy)",
    colors: {
      "50":  "#F5F3FF",
      "100": "#E8E4FC",
      "200": "#C9BFF7",
      "300": "#9B85ED",
      "400": "#6F4FDB",
      "500": "#4527A0",
      "600": "#3B2092",
      "700": "#301A7D",
      "800": "#231363",
      "900": "#180D4A",
      "950": "#0F0833",
    },
  });

  // Add Mono (hardcoded hex approximations of oklch values)
  themes.push({
    id: "mono (Mono)",
    colors: {
      "50":  "#F5F5F5",
      "100": "#E8E8E8",
      "200": "#C9C9C9",
      "300": "#888888",
      "400": "#6F6F6F",
      "500": "#3A3A3A",
      "600": "#333333",
      "700": "#2B2B2B",
      "800": "#1F1F1F",
      "900": "#171717",
      "950": "#0D0D0D",
    },
  });

  return themes;
}

// --- Map theme IDs to display names ---
const nameMap = {
  "default (Navy)": "Navy",
  "stock": "Forest",
  "access": "Amber",
  "temp": "Azure",
  "dayton": "Teal",
  "stat": "Violet",
  "ruby": "Ruby",
  "mono (Mono)": "Mono",
};

// --- Run checks ---
const themes = parseThemes();
const WHITE = "#FFFFFF";

console.log("╔══════════════════════════════════════════════════════════════════════════════╗");
console.log("║               WCAG AA Contrast Analysis — Clean UI Themes                   ║");
console.log("║  AA normal text: 4.5:1  |  AA large text: 3:1  |  Non-text (borders): 3:1  ║");
console.log("╚══════════════════════════════════════════════════════════════════════════════╝");
console.log("");

let totalFails = 0;

for (const theme of themes) {
  const name = nameMap[theme.id] || theme.id;
  const c = theme.colors;

  const checks = [
    { label: "White on solid (500)",       fg: WHITE,  bg: c["500"], type: "text" },
    { label: "Primary (500) on subtle bg (100)", fg: c["500"], bg: c["100"], type: "text" },
    { label: "Primary (500) on white",     fg: c["500"], bg: WHITE,   type: "text" },
    { label: "Primary (700) on white",     fg: c["700"], bg: WHITE,   type: "text" },
    { label: "Border (300) on white",      fg: c["300"], bg: WHITE,   type: "non-text" },
    { label: "Primary (500) on subtle bg (200)", fg: c["500"], bg: c["200"], type: "text" },
  ];

  console.log(`┌─ ${name} ${"─".repeat(Math.max(0, 72 - name.length))}┐`);

  for (const check of checks) {
    if (!check.fg || !check.bg) { console.log(`│  ${check.label}: SKIPPED (missing color)`); continue; }
    const ratio = contrastRatio(check.fg, check.bg);
    const threshold = check.type === "non-text" ? 3.0 : 4.5;
    const status = ratio >= threshold ? "✅ PASS" : ratio >= 3.0 ? "⚠️  LARGE" : "❌ FAIL";
    if (ratio < threshold) totalFails++;
    console.log(`│  ${status}  ${ratio.toFixed(2)}:1  ${check.label.padEnd(38)} ${check.fg} on ${check.bg}`);
  }

  console.log(`└${"─".repeat(76)}┘`);
  console.log("");
}

console.log("═".repeat(78));
if (totalFails === 0) {
  console.log("🎉 All checks pass!");
} else {
  console.log(`⚠️  ${totalFails} check(s) below threshold. Review and fix.`);
}
console.log("");
