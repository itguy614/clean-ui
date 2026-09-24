import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import CuiCopyButton from "../CuiCopyButton.vue";

/**
 * #150 — the default is icon-only, so the button had no accessible name at all: empty
 * text, no `aria-label`, no `aria-describedby`, no `title`. The `tooltip` prop looks like
 * it covers this but does not — `CuiTooltip` never points the trigger at its panel, and a
 * tooltip is a description rather than a name in any case.
 */
describe("CuiCopyButton is announced", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });
  afterEach(() => vi.restoreAllMocks());

  it("names the icon-only button from its tooltip text", () => {
    const w = mount(CuiCopyButton, { props: { value: "x" } });
    expect(w.find("button").attributes("aria-label")).toBe("Copy");
  });

  it("uses a custom tooltip as the name", () => {
    const w = mount(CuiCopyButton, { props: { value: "x", tooltip: "Copy API key" } });
    expect(w.find("button").attributes("aria-label")).toBe("Copy API key");
  });

  it("drops the aria-label once there is a visible label to read", () => {
    // A redundant aria-label would override the visible text rather than add to it.
    const w = mount(CuiCopyButton, { props: { value: "x", showLabel: true } });
    expect(w.find("button").attributes("aria-label")).toBeUndefined();
    expect(w.find("button").text()).toContain("Copy");
  });

  it("announces the copy through a live region, not just colour and an icon", async () => {
    const w = mount(CuiCopyButton, { props: { value: "x", copiedTooltip: "Copied!" } });
    const status = w.find(".cui-copy-button__status");

    expect(status.attributes("role")).toBe("status");
    expect(status.attributes("aria-live")).toBe("polite");
    expect(status.text()).toBe("");

    await w.find("button").trigger("click");
    await flushPromises();
    expect(status.text()).toBe("Copied!");
  });
});
