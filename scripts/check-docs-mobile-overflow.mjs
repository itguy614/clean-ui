// Fails when any docs route scrolls sideways at a phone width (#523). Manual check, not in CI:
// the docs app has no browser test harness, so this drives the packages/clean-ui Playwright.
//
//   pnpm --filter @itguy614/clean-ui-docs dev --port 5173     (in one shell)
//   node scripts/check-docs-mobile-overflow.mjs [baseUrl] [width]
//
// A page overflows when the document is wider than the viewport. The first elements poking out
// past the right edge (outside any scrolling ancestor) are printed to point at the cause.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const { chromium } = createRequire(`${root}packages/clean-ui/package.json`)("playwright");

const base = process.argv[2] ?? "http://localhost:5173";
const width = Number(process.argv[3] ?? 390);

const router = readFileSync(`${root}apps/docs/src/router/index.ts`, "utf8");
const routes = [...router.matchAll(/path: '([^']+)'/g)].map((m) => m[1]).filter((p) => !/[:*]/.test(p));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 800 } });
const failures = [];

for (const route of routes) {
  await page.goto(base + route, { waitUntil: "networkidle" });
  const found = await page.evaluate(() => {
    if (document.documentElement.scrollWidth <= innerWidth) return null;
    const culprits = [];
    for (const el of document.querySelectorAll("body *")) {
      if (el.getBoundingClientRect().right <= innerWidth + 1) continue;
      let clipped = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        if (getComputedStyle(a).overflowX !== "visible") clipped = true;
      }
      if (!clipped) culprits.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)}`);
    }
    return { scrollWidth: document.documentElement.scrollWidth, culprits: culprits.slice(0, 5) };
  });
  if (found) failures.push(`${route}: ${found.scrollWidth}px > ${width}px  ${found.culprits.join(", ")}`);
}

await browser.close();
console.log(`${routes.length} routes at ${width}px, ${failures.length} overflowing`);
for (const f of failures) console.error(f);
process.exit(failures.length ? 1 : 0);
