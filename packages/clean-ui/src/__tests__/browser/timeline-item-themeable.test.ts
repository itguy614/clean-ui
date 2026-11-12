import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens, mountHosts } from "../../../../../config/test/browser-helpers";
import CuiTimelineItem from "../../components/CuiTimelineItem.vue";

/**
 * #489 — a consumer restyles CuiTimelineItem without `!important`: a plain class rule at
 * (0,1,0), or a public `--cui-timeline-item-*` token on a container. The paint sits in the
 * component's stylesheet at zero specificity; the only inline values are the dot's private
 * `--_timeline-item-*` colours, which follow the `color` prop and whether there is an icon.
 */
describe("CuiTimelineItem is themeable (real browser, #489)", () => {
  let removeTokens: () => void;
  beforeAll(() => {
    removeTokens = installTokens(main);
  });
  afterAll(() => removeTokens());

  const dom = mountHosts();
  const rules: HTMLStyleElement[] = [];
  afterEach(() => {
    dom.cleanup();
    rules.splice(0).forEach((r) => r.remove());
  });

  function consumerRule(css: string) {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.append(style);
    rules.push(style);
  }

  async function render(props: Record<string, unknown> = {}, hostStyle = "") {
    const host = dom.host();
    host.setAttribute("style", hostStyle);
    const w = dom.track(mount(CuiTimelineItem, { props: { title: "Release", timestamp: "now", ...props }, slots: { default: "Body" }, attachTo: host }));
    await nextTick();
    const root = w.element as HTMLElement;
    const part = (name: string) => root.querySelector<HTMLElement>(`.cui-timeline-item__${name}`)!;
    return { root, rail: part("rail"), dot: part("dot"), line: part("line"), content: part("content"), head: part("head"), title: part("title"), timestamp: part("timestamp"), body: part("body") };
  }

  const inline = (el: HTMLElement) => [...Array(el.style.length).keys()].map((i) => el.style.item(i));

  it("writes only private properties inline", async () => {
    for (const props of [{}, { icon: "check", color: "error" }, { last: true }]) {
      const p = await render(props);
      expect(inline(p.root).filter((n) => n !== "display")).toEqual([]);
      expect(inline(p.dot).filter((n) => !n.startsWith("--_timeline-item-"))).toEqual([]);
      for (const el of [p.rail, p.line, p.content, p.head, p.title, p.timestamp, p.body].filter(Boolean)) expect(el.getAttribute("style") ?? "", el.className).toBe("");
      dom.cleanup();
    }
  });

  it("takes a plain class rule on every part", async () => {
    consumerRule(`
      .cui-timeline-item { padding-bottom: 41px; gap: 13px; }
      .cui-timeline-item__dot { background: rgb(9, 9, 9); border-color: rgb(19, 19, 19); color: rgb(29, 29, 29); }
      .cui-timeline-item__line { background: rgb(39, 39, 39); }
      .cui-timeline-item__title { color: rgb(49, 49, 49); font-size: 21px; }
      .cui-timeline-item__timestamp { color: rgb(59, 59, 59); }
      .cui-timeline-item__body { color: rgb(69, 69, 69); font-size: 15px; }
    `);
    const p = await render();
    expect(getComputedStyle(p.root).paddingBottom).toBe("41px");
    expect(getComputedStyle(p.root).columnGap).toBe("13px");
    expect(getComputedStyle(p.dot).backgroundColor).toBe("rgb(9, 9, 9)");
    expect(getComputedStyle(p.dot).borderTopColor).toBe("rgb(19, 19, 19)");
    expect(getComputedStyle(p.dot).color).toBe("rgb(29, 29, 29)");
    expect(getComputedStyle(p.line).backgroundColor).toBe("rgb(39, 39, 39)");
    expect(getComputedStyle(p.title).color).toBe("rgb(49, 49, 49)");
    expect(getComputedStyle(p.title).fontSize).toBe("21px");
    expect(getComputedStyle(p.timestamp).color).toBe("rgb(59, 59, 59)");
    expect(getComputedStyle(p.body).color).toBe("rgb(69, 69, 69)");
    expect(getComputedStyle(p.body).fontSize).toBe("15px");
  });

  it("takes the public tokens from a container, with a dot and with an icon", async () => {
    const hostStyle = ["--cui-timeline-item-bg: rgb(61, 61, 61)", "--cui-timeline-item-color: rgb(62, 62, 62)", "--cui-timeline-item-border: rgb(63, 63, 63)", "--cui-timeline-item-gap: 17px"].join(";");
    for (const props of [{}, { icon: "check", color: "error" }]) {
      const p = await render(props, hostStyle);
      expect(getComputedStyle(p.dot).backgroundColor).toBe("rgb(61, 61, 61)");
      expect(getComputedStyle(p.dot).color).toBe("rgb(62, 62, 62)");
      expect(getComputedStyle(p.dot).borderTopColor).toBe("rgb(63, 63, 63)");
      expect(getComputedStyle(p.root).columnGap).toBe("17px");
      dom.cleanup();
    }
  });

  it("still paints the dot from the color prop", async () => {
    const primary = await render();
    const error = await render({ color: "error" });
    expect(getComputedStyle(error.dot).backgroundColor).not.toBe(getComputedStyle(primary.dot).backgroundColor);
  });
});
