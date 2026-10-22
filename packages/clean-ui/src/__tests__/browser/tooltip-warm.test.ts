import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "./helpers";
import CuiTooltip from "../../components/CuiTooltip.vue";
import { __resetTooltipGroup } from "../../composables/useTooltipGroup";

/**
 * #264 — moving the pointer along a row of tooltipped buttons waited out each one's delay.
 * The first still waits; the next, opened right after, shows at once with no entry animation.
 */
describe("tooltip warm window (real browser, real hover)", () => {
  let removeTokens: () => void;
  beforeAll(() => (removeTokens = installTokens(main)));
  afterAll(() => removeTokens());

  let wrapper: VueWrapper | undefined;
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.getElementById("warm-host")?.remove();
    __resetTooltipGroup();
  });

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const tooltip = (text: string) =>
    [...document.querySelectorAll<HTMLElement>(".cui-tooltip")].find((el) => el.textContent?.includes(text) && el.style.display !== "none");

  it("waits on the first button, then opens the next instantly", async () => {
    const host = document.createElement("div");
    host.id = "warm-host";
    host.style.cssText = "position: fixed; top: 120px; left: 120px; display: flex; gap: 4px;";
    document.body.append(host);
    wrapper = mount(
      {
        render: () =>
          ["Bold", "Italic"].map((label) => h(CuiTooltip, { text: label }, () => h("button", { "data-label": label }, label))),
      },
      { attachTo: host },
    );
    const [bold, italic] = [...host.querySelectorAll<HTMLElement>("button")];

    await userEvent.hover(bold);
    await wait(60);
    expect(tooltip("Bold"), "the first waits its showDelay").toBeUndefined();
    await wait(250);
    expect(tooltip("Bold")).toBeDefined();

    await userEvent.hover(italic);
    await wait(40);
    const second = tooltip("Italic");
    expect(second, "no wait on the next").toBeDefined();
    expect(second!.dataset.instant).toBe("true");
    expect(getComputedStyle(second!).transitionDuration.split(", ").every((d) => d === "0s"), "no entry animation").toBe(true);
    // The one it replaced doesn't wait out its hideDelay and fade beside it: it's gone.
    expect(tooltip("Bold"), "only one showing").toBeUndefined();
  });

  // Crossing slower than the hideDelay: the first has closed and is fading out when the
  // next opens. That fade is cut short too, not left beside the new one.
  it("cuts short the exit of one already fading when the next opens", async () => {
    const host = document.createElement("div");
    host.id = "warm-host";
    host.style.cssText = "position: fixed; top: 120px; left: 120px; display: flex; gap: 40px;";
    document.body.append(host);
    wrapper = mount(
      { render: () => ["Bold", "Italic"].map((label) => h(CuiTooltip, { text: label }, () => h("button", label))) },
      { attachTo: host },
    );
    const [bold, italic] = [...host.querySelectorAll<HTMLElement>("button")];
    // A long exit, so it is plainly still running however long the next hover takes.
    document.body.style.setProperty("--cui-duration-fast", "1000ms");
    await userEvent.hover(bold);
    await wait(1300);
    await userEvent.unhover(bold);
    await wait(100 + 40); // its hideDelay, then partway into its exit
    const leaving = [...document.querySelectorAll<HTMLElement>(".cui-tooltip")].find((el) => el.textContent?.includes("Bold"));
    expect(leaving?.getAttribute("data-cui-panel"), "mid-exit").toBe("hidden");
    await userEvent.hover(italic);
    await wait(40);
    expect(leaving!.isConnected, "gone, not fading beside the next").toBe(false);
    expect(tooltip("Italic")?.dataset.instant).toBe("true");
    document.body.style.removeProperty("--cui-duration-fast");
  });
});
