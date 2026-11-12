import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens, mountHosts } from "../../../../../config/test/browser-helpers";
import CuiKbd from "../../components/CuiKbd.vue";

/**
 * #489 — a consumer restyles CuiKbd without `!important`: a plain class rule at (0,1,0), or a
 * public `--cui-kbd-*` token on a container. The paint sits in the component's stylesheet at
 * zero specificity; the only inline values are the private `--_kbd-*` size-preset properties.
 * CuiKbd shares its `cui-kbd` class with the typography layer's helper, which must not repaint
 * it, and it looks the same inside `.cui-typography`.
 */
describe("CuiKbd is themeable (real browser, #489)", () => {
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

  async function render(props: Record<string, unknown> = {}, hostStyle = "", hostClass = "") {
    const host = dom.host();
    host.setAttribute("style", hostStyle);
    host.className = hostClass;
    const w = dom.track(mount(CuiKbd, { props, slots: { default: "Esc" }, attachTo: host }));
    await nextTick();
    return w.element as HTMLElement;
  }

  it("writes only private properties inline", async () => {
    const kbd = await render({ size: "lg" });
    expect([...Array(kbd.style.length).keys()].map((i) => kbd.style.item(i)).filter((n) => !n.startsWith("--_kbd-"))).toEqual([]);
  });

  it("takes a plain class rule", async () => {
    consumerRule(`.cui-kbd { background: rgb(9, 9, 9); color: rgb(19, 19, 19); border-radius: 11px; font-size: 21px; padding-left: 17px; border-bottom-color: rgb(29, 29, 29); }`);
    const cs = getComputedStyle(await render());
    expect(cs.backgroundColor).toBe("rgb(9, 9, 9)");
    expect(cs.color).toBe("rgb(19, 19, 19)");
    expect(cs.borderTopLeftRadius).toBe("11px");
    expect(cs.fontSize).toBe("21px");
    expect(cs.paddingLeft).toBe("17px");
    expect(cs.borderBottomColor).toBe("rgb(29, 29, 29)");
  });

  it("takes the public tokens from a container", async () => {
    const cs = getComputedStyle(
      await render(
        { size: "lg" },
        [
          "--cui-kbd-bg: rgb(61, 61, 61)",
          "--cui-kbd-color: rgb(62, 62, 62)",
          "--cui-kbd-border: rgb(63, 63, 63)",
          "--cui-kbd-radius: 5px",
          "--cui-kbd-font-size: 19px",
          "--cui-kbd-px: 17px",
          "--cui-kbd-py: 9px",
        ].join(";"),
      ),
    );
    expect(cs.backgroundColor).toBe("rgb(61, 61, 61)");
    expect(cs.color).toBe("rgb(62, 62, 62)");
    expect(cs.borderTopColor).toBe("rgb(63, 63, 63)");
    expect(cs.borderBottomColor).toBe("rgb(63, 63, 63)");
    expect(cs.borderTopLeftRadius).toBe("5px");
    expect(cs.fontSize).toBe("19px");
    expect(cs.paddingLeft).toBe("17px");
    expect(cs.paddingTop).toBe("9px");
  });

  it("is not repainted by the helper class or the prose rule, in light or dark", async () => {
    for (const mode of ["", "dark"]) {
      const bare = await render({}, "", mode);
      const look = (el: HTMLElement) => {
        const s = getComputedStyle(el);
        return [s.backgroundColor, s.color, s.fontFamily, s.borderTopColor, s.boxShadow, s.paddingLeft];
      };
      const bareLook = look(bare);
      // Not the helper's look: that one is the mono face.
      expect(getComputedStyle(bare).fontFamily).not.toMatch(/mono/i);
      dom.cleanup();
      const prose = await render({}, "", `${mode} cui-typography`);
      expect(look(prose)).toEqual(bareLook);
      dom.cleanup();
    }
  });

  it("leaves the helper class on a bare <kbd> alone", () => {
    const host = dom.host();
    host.innerHTML = '<kbd class="cui-kbd">K</kbd>';
    const cs = getComputedStyle(host.firstElementChild!);
    // The helper's look: a dark chip (surface-800) and the mono face.
    expect(cs.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(cs.boxShadow).toContain("inset");
  });
});
