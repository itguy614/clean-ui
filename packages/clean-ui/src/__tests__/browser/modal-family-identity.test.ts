import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import { capture, SCENARIOS } from "./modal-family-capture";
import baselineJson from "./modal-family-identity.baseline.json";

/**
 * #489 — CuiModalHeader, CuiModalBody, CuiModalFooter and CuiConfirmDialog's paint moved from
 * inline style objects (and, for the header's close button, mouseenter/mouseleave handlers)
 * to stylesheets. Nothing about how they look may change. `modal-family-identity.baseline.json`
 * holds the computed styles, geometry and transitions of every element of each component,
 * recorded from the inline-style implementation (the tip of #492's branch) BEFORE the
 * conversion: the header with and without actions, a custom slot, no close button and the
 * close button's hover; the body padded, flush and scrolling (and its focusable region); the
 * footer in each alignment; the confirm dialog in each variant, with a confirm word, a custom
 * confirm colour, no icon, a slot message and the loading spinner; each in light and dark
 * where it has colour, and in compact and spacious density. Real browser: jsdom computes none
 * of this.
 */
describe("the modal family renders as it did before the stylesheet conversion (#489)", () => {
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
