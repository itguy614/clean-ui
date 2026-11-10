import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import { capture, SCENARIOS } from "./code-block-capture";
import baselineJson from "./code-block-identity.baseline.json";

/**
 * #484 — CuiCodeBlock's paint moved from inline style objects to a stylesheet. Nothing about
 * how it looks may change. `code-block-identity.baseline.json` holds the computed styles and
 * geometry of every part (frame, header, title, copy button, `<pre>`, gutter, each number,
 * `<code>`, each line), recorded from the inline-style implementation (develop at 964ca67)
 * BEFORE the conversion: every size in light and dark, with and without line numbers and
 * highlighted lines; the header variants; a scrolling block; compact and spacious density;
 * the copy button's hover; the focused scroller. Consecutive identical lines are one entry.
 * Real browser: jsdom computes none of this.
 */
describe("CuiCodeBlock renders as it did before the stylesheet conversion (#484)", () => {
  let removeTokens: () => void;
  beforeAll(() => {
    removeTokens = installTokens(main);
  });
  afterAll(() => removeTokens());

  const baseline = baselineJson as Record<string, unknown>;

  it("the baseline covers exactly these scenarios", () => {
    expect(Object.keys(baseline).sort()).toEqual(Object.keys(SCENARIOS).sort());
  });

  for (const [name, scenario] of Object.entries(SCENARIOS)) {
    it(name, async () => {
      // A missing key must fail: `toEqual(undefined)` would pass against an empty capture.
      expect(baseline[name], `no baseline recorded for ${name}`).toBeDefined();
      const got = await capture(scenario, (el) => userEvent.hover(el as HTMLElement));
      expect(got).toEqual(baseline[name]);
    });
  }
});
