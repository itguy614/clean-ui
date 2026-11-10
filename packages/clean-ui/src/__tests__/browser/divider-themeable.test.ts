import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens, mountHosts } from "../../../../../config/test/browser-helpers";
import CuiDivider from "../../components/CuiDivider.vue";

/**
 * #489 — a consumer restyles CuiDivider without `!important`: a plain class rule at (0,1,0),
 * or a public `--cui-divider-*` token on a container. The paint sits in the component's
 * stylesheet at zero specificity; the only inline values are the private `--_divider-*`
 * properties (the line's style and colour, the spacing), which the stylesheet reads through
 * the public tokens.
 */
describe("CuiDivider is themeable (real browser, #489)", () => {
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
    const w = dom.track(mount(CuiDivider, { props, attachTo: host }));
    await nextTick();
    // Several roots (the template's comments make a fragment in dev): the host holds the divider.
    const root = host.querySelector<HTMLElement>(".cui-divider")!;
    return {
      root,
      lines: [...root.querySelectorAll<HTMLElement>(".cui-divider__line")],
      label: root.querySelector<HTMLElement>(".cui-divider__label"),
    };
  }

  const inline = (el: HTMLElement) => [...Array(el.style.length).keys()].map((i) => el.style.item(i));

  it("writes only private properties inline, on every branch", async () => {
    for (const props of [{}, { orientation: "vertical" }, { label: "Or" }, { label: "Or", orientation: "vertical", color: "error", spacing: "1rem" }]) {
      const p = await render(props);
      expect(inline(p.root).filter((n) => !n.startsWith("--_divider-") && n !== "display"), JSON.stringify(props)).toEqual([]);
      for (const el of [...p.lines, ...(p.label ? [p.label] : [])]) expect(el.getAttribute("style") ?? "").toBe("");
      dom.cleanup();
    }
  });

  it("takes a plain class rule on the bare line, the labelled lines and the label", async () => {
    consumerRule(`
      hr.cui-divider { border-top: 5px dotted rgb(9, 9, 9); margin-top: 13px; }
      .cui-divider__line { border-top: 3px solid rgb(19, 19, 19); }
      .cui-divider__label { color: rgb(29, 29, 29); font-size: 21px; padding-left: 31px; }
    `);
    const bare = await render({ color: "error", spacing: "1rem" });
    expect(getComputedStyle(bare.root).borderTopWidth).toBe("5px");
    expect(getComputedStyle(bare.root).borderTopStyle).toBe("dotted");
    expect(getComputedStyle(bare.root).borderTopColor).toBe("rgb(9, 9, 9)");
    expect(getComputedStyle(bare.root).marginTop).toBe("13px");
    dom.cleanup();
    const labelled = await render({ label: "Or", color: "error" });
    expect(getComputedStyle(labelled.lines[0]).borderTopWidth).toBe("3px");
    expect(getComputedStyle(labelled.lines[0]).borderTopColor).toBe("rgb(19, 19, 19)");
    expect(getComputedStyle(labelled.label!).color).toBe("rgb(29, 29, 29)");
    expect(getComputedStyle(labelled.label!).fontSize).toBe("21px");
    expect(getComputedStyle(labelled.label!).paddingLeft).toBe("31px");
  });

  it("takes the public tokens from a container, the line and the label", async () => {
    const hostStyle = ["--cui-divider-border: 4px dashed rgb(61, 61, 61)", "--cui-divider-color: rgb(62, 62, 62)", "--cui-divider-font-size: 19px"].join(";");
    const bare = await render({ color: "error" }, hostStyle);
    expect(getComputedStyle(bare.root).borderTopWidth).toBe("4px");
    expect(getComputedStyle(bare.root).borderTopStyle).toBe("dashed");
    expect(getComputedStyle(bare.root).borderTopColor).toBe("rgb(61, 61, 61)");
    dom.cleanup();
    const vertical = await render({ orientation: "vertical" }, hostStyle);
    expect(getComputedStyle(vertical.root).borderLeftColor).toBe("rgb(61, 61, 61)");
    dom.cleanup();
    const labelled = await render({ label: "Or", color: "error" }, hostStyle);
    expect(getComputedStyle(labelled.lines[0]).borderTopColor).toBe("rgb(61, 61, 61)");
    expect(getComputedStyle(labelled.label!).color).toBe("rgb(62, 62, 62)");
    expect(getComputedStyle(labelled.label!).fontSize).toBe("19px");
  });

  it("still paints a role and a raw CSS colour from the prop", async () => {
    const role = await render({ color: "error", label: "Or" });
    expect(getComputedStyle(role.lines[0]).borderTopColor).toBe(getComputedStyle(role.label!).color);
    expect(getComputedStyle(role.label!).color).not.toBe("rgb(0, 0, 0)");
    dom.cleanup();
    const raw = await render({ color: "rgb(10, 200, 30)", label: "Or" });
    expect(getComputedStyle(raw.lines[0]).borderTopColor).toBe("rgb(10, 200, 30)");
    expect(getComputedStyle(raw.label!).color).toBe("rgb(10, 200, 30)");
  });
});
