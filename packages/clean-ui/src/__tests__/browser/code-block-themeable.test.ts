import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens, mountHosts } from "../../../../../config/test/browser-helpers";
import CuiCodeBlock from "../../components/CuiCodeBlock.vue";

/**
 * #484 — a consumer restyles CuiCodeBlock without `!important`: a plain class rule at (0,1,0),
 * or a public `--cui-code-block-*` token on a container. The component's own paint sits in its
 * stylesheet at zero specificity, and the only inline values are private `--_code-block-*`
 * properties (and the `max-height` / `min-width` geometry its props decide).
 */
describe("CuiCodeBlock is themeable (real browser, #484)", () => {
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

  const code = "const a = 1;\nconst b = 2;\nconst c = 3;";

  function consumerRule(css: string) {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.append(style);
    rules.push(style);
  }

  async function render(props: Record<string, unknown> = {}, hostStyle = "") {
    const host = dom.host();
    host.setAttribute("style", hostStyle);
    const w = dom.track(mount(CuiCodeBlock, { props: { code, language: "ts", lineNumbers: true, highlightLines: [2], ...props }, attachTo: host }));
    await nextTick();
    const root = w.element as HTMLElement;
    return {
      root,
      header: root.querySelector<HTMLElement>(".cui-code-block__header")!,
      title: root.querySelector<HTMLElement>(".cui-code-block__title")!,
      pre: root.querySelector<HTMLElement>(".cui-code-block__pre")!,
      gutter: root.querySelector<HTMLElement>(".cui-code-block__gutter")!,
      number: root.querySelector<HTMLElement>(".cui-code-block__number")!,
      code: root.querySelector<HTMLElement>(".cui-code-block__code")!,
      lines: [...root.querySelectorAll<HTMLElement>(".cui-code-block__line")],
    };
  }

  it("writes no inline paint: only private properties, max-height and number widths", async () => {
    const p = await render({ maxHeight: "100px" });
    const inline = (el: HTMLElement) => [...Array(el.style.length).keys()].map((i) => el.style.item(i));
    expect(inline(p.root).filter((n) => !n.startsWith("--_code-block-") && n !== "display")).toEqual([]);
    // `useScrollArea` also writes `scroll-padding-*` (scroll behaviour, not paint).
    expect(inline(p.pre).filter((n) => !n.startsWith("scroll-padding"))).toEqual(["max-height"]);
    expect(inline(p.number)).toEqual(["min-width"]);
    for (const el of [p.header, p.title, p.gutter, p.code, ...p.lines]) expect(el.getAttribute("style") ?? "", el.className).toBe("");
  });

  it("takes a plain class rule on the frame, the header, the gutter and the lines", async () => {
    consumerRule(`
      .cui-code-block { background: rgb(9, 9, 9); border-radius: 11px; border: 3px solid rgb(19, 19, 19); }
      .cui-code-block__header { padding-top: 13px; background: rgb(29, 29, 29); }
      .cui-code-block__title { color: rgb(39, 39, 39); font-size: 21px; }
      .cui-code-block__pre { padding-top: 17px; }
      .cui-code-block__gutter { padding-left: 23px; }
      .cui-code-block__code { padding-right: 27px; }
      .cui-code-block__line { font-size: 15px; color: rgb(49, 49, 49); }
      .cui-code-block__line--highlight { background: rgb(59, 59, 59); }
    `);
    const p = await render();
    const root = getComputedStyle(p.root);
    expect(root.backgroundColor).toBe("rgb(9, 9, 9)");
    expect(root.borderTopLeftRadius).toBe("11px");
    expect(root.borderTopColor).toBe("rgb(19, 19, 19)");
    expect(getComputedStyle(p.header).paddingTop).toBe("13px");
    expect(getComputedStyle(p.header).backgroundColor).toBe("rgb(29, 29, 29)");
    expect(getComputedStyle(p.title).color).toBe("rgb(39, 39, 39)");
    expect(getComputedStyle(p.title).fontSize).toBe("21px");
    expect(getComputedStyle(p.pre).paddingTop).toBe("17px");
    expect(getComputedStyle(p.gutter).paddingLeft).toBe("23px");
    expect(getComputedStyle(p.code).paddingRight).toBe("27px");
    expect(getComputedStyle(p.lines[0]).fontSize).toBe("15px");
    expect(getComputedStyle(p.lines[0]).color).toBe("rgb(49, 49, 49)");
    expect(getComputedStyle(p.lines[1]).backgroundColor).toBe("rgb(59, 59, 59)");
  });

  it("takes the public tokens from a container", async () => {
    const p = await render(
      {},
      [
        "--cui-code-block-bg: rgb(61, 61, 61)",
        "--cui-code-block-border: rgb(62, 62, 62)",
        "--cui-code-block-radius: 5px",
        "--cui-code-block-color: rgb(63, 63, 63)",
        "--cui-code-block-font-size: 19px",
        "--cui-code-block-px: 17px",
        "--cui-code-block-py: 9px",
      ].join(";"),
    );
    const root = getComputedStyle(p.root);
    expect(root.backgroundColor).toBe("rgb(61, 61, 61)");
    expect(root.borderTopColor).toBe("rgb(62, 62, 62)");
    expect(root.borderTopLeftRadius).toBe("5px");
    expect(getComputedStyle(p.lines[0]).color).toBe("rgb(63, 63, 63)");
    expect(getComputedStyle(p.lines[0]).fontSize).toBe("19px");
    expect(getComputedStyle(p.number).fontSize).toBe("19px");
    expect(getComputedStyle(p.header).paddingLeft).toBe("17px");
    expect(getComputedStyle(p.gutter).paddingLeft).toBe("17px");
    expect(getComputedStyle(p.pre).paddingTop).toBe("9px");
    expect(getComputedStyle(p.pre).paddingBottom).toBe("9px");
  });

  it("takes the px token on the code when there is no gutter", async () => {
    const p = await render({ lineNumbers: false }, "--cui-code-block-px: 17px");
    expect(getComputedStyle(p.code).paddingLeft).toBe("17px");
    expect(getComputedStyle(p.code).paddingRight).toBe("17px");
  });

  it("takes the focus ring token", async () => {
    const p = await render({ code: Array.from({ length: 30 }, (_, i) => `const v${i} = ${i};`).join("\n"), maxHeight: "60px" }, "--cui-code-block-focus-ring: rgb(71, 71, 71)");
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    p.pre.focus();
    expect(getComputedStyle(p.pre).outlineColor).toBe("rgb(71, 71, 71)");
  });
});
