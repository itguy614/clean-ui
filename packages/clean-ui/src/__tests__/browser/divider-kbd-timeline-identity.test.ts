import { describe, it, expect, beforeAll, afterAll } from "vitest";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import { capture, SCENARIOS } from "./divider-kbd-timeline-capture";
import baselineJson from "./divider-kbd-timeline-identity.baseline.json";

/**
 * #489 — CuiDivider, CuiKbd and CuiTimelineItem moved their paint from inline style objects to
 * stylesheets. Nothing about how they look may change. The baseline holds the computed style
 * and geometry of every element of each scenario, recorded from the inline-style build
 * (the tip of #492's branch) BEFORE the conversion: every Divider orientation, line style,
 * label position and colour (each role, a raw CSS colour), every Kbd size inside and outside
 * `.cui-typography`, every TimelineItem colour with a dot or an icon, first and last, in light
 * and dark and at both densities. Real browser: jsdom computes none of this.
 */
describe("CuiDivider, CuiKbd and CuiTimelineItem render as they did before the stylesheet conversion (#489)", () => {
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
      expect(await capture(scenario)).toEqual(baseline[name]);
    });
  }
});
