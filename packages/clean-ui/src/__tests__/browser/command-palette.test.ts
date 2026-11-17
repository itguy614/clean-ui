import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, effectScope, h, ref } from "vue";
import { userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import { motionDuration } from "../../utils/motion";
import CuiCommandPalette from "../../components/CuiCommandPalette.vue";
import CuiModal from "../../components/CuiModal.vue";
import { useCommandPalette } from "../../composables/useCommandPalette";

/**
 * #197 — what jsdom cannot show: real keystrokes (the shortcut from inside a field, arrows,
 * Enter, Escape, Tab), real focus (into the palette, back to the field it came from, before a
 * chosen command runs), and the highlighted row scrolled into view in a laid-out list.
 */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const settle = () => wait(motionDuration("slow") + 150);

let removeTokens: () => void;
beforeAll(() => (removeTokens = installTokens(main)));
afterAll(() => removeTokens());

const palette = useCommandPalette();
const stops: Array<() => void> = [];
let wrapper: VueWrapper | undefined;

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  stops.splice(0).forEach((stop) => stop());
  palette.close();
  palette.clearRecents();
  document.body.innerHTML = "";
});

const input = () => document.querySelector<HTMLInputElement>(".cui-command-palette__input")!;
const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')];
const labels = () => options().map((o) => o.querySelector(".cui-command-palette__label")?.textContent?.trim());
const apple = /mac|iphone|ipad/i.test(navigator.platform);
const MOD = apple ? "Meta" : "Control";

function setup(commands: Parameters<typeof palette.register>[0], props: Record<string, unknown> = {}) {
  const scope = effectScope();
  stops.push(() => scope.stop());
  scope.run(() => palette.register(commands));
  const opened = ref(false);
  const Host = defineComponent({
    setup: () => () => [
      h("input", { "data-t": "field", placeholder: "somewhere to type" }),
      h("button", { "data-t": "opener", onClick: () => palette.open() }, "Open"),
      h(CuiCommandPalette, { ...props, "onUpdate:visible": (v: boolean) => (opened.value = v) }),
    ],
  });
  wrapper = mount(Host, { attachTo: document.body });
  return { opened, field: () => document.querySelector<HTMLInputElement>('[data-t="field"]')! };
}

describe("CuiCommandPalette (real browser)", () => {
  it("opens on the platform's Mod-K from inside a text field, and Escape gives the field its focus back", async () => {
    const t = setup([{ id: "a", label: "Alpha" }]);
    t.field().focus();
    await userEvent.keyboard(`{${MOD}>}k{/${MOD}}`);
    await settle();
    expect(document.activeElement, "focus moves into the search field").toBe(input());
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(document.querySelector(".cui-command-palette")).toBeNull();
    expect(document.activeElement, "and returns to the field it left").toBe(t.field());
  });

  it("closes on the same shortcut, and is reachable without it", async () => {
    setup([{ id: "a", label: "Alpha" }]);
    await userEvent.click(document.querySelector('[data-t="opener"]')!);
    await settle();
    expect(input()).not.toBeNull();
    await userEvent.keyboard(`{${MOD}>}k{/${MOD}}`);
    await settle();
    expect(document.querySelector(".cui-command-palette")).toBeNull();
  });

  it("filters as you type, and Enter on the arrow-moved highlight runs it with focus already back on the opener", async () => {
    const seen: Array<{ id: string; focusedField: boolean }> = [];
    const t = setup(
      ["Alpha", "Beta", "Gamma"].map((label) => ({
        id: label,
        label,
        action: () => seen.push({ id: label, focusedField: document.activeElement === t.field() }),
      })),
    );
    t.field().focus();
    await userEvent.keyboard(`{${MOD}>}k{/${MOD}}`);
    await settle();
    await userEvent.keyboard("a");
    // An earlier "a" ranks higher: Gamma's is second letter, Beta's the last.
    expect(labels()).toEqual(["Alpha", "Gamma", "Beta"]);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(input().getAttribute("aria-activedescendant")).toBe(options()[2].id);
    await userEvent.keyboard("{Enter}");
    await vi.waitFor(() => expect(seen).toHaveLength(1), { timeout: 3000 });
    expect(seen[0]).toEqual({ id: "Beta", focusedField: true });
  });

  it("keeps Tab inside the dialog", async () => {
    setup([{ id: "a", label: "Alpha" }]);
    await userEvent.click(document.querySelector('[data-t="opener"]')!);
    await settle();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(input());
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(input());
  });

  it("scrolls the highlighted row into view in a long list", async () => {
    setup(Array.from({ length: 60 }, (_, i) => ({ id: `c${i}`, label: `Command ${String(i).padStart(2, "0")}` })));
    await userEvent.click(document.querySelector('[data-t="opener"]')!);
    await settle();
    const list = document.querySelector<HTMLElement>(".cui-command-palette__list")!;
    expect(list.scrollHeight, "the list overflows, so the test means something").toBeGreaterThan(list.clientHeight);
    for (let i = 0; i < 30; i++) await userEvent.keyboard("{ArrowDown}");
    const active = document.getElementById(input().getAttribute("aria-activedescendant")!)!;
    const a = active.getBoundingClientRect();
    const l = list.getBoundingClientRect();
    expect(a.top).toBeGreaterThanOrEqual(l.top - 1);
    expect(a.bottom).toBeLessThanOrEqual(l.bottom + 1);
    expect(list.scrollTop).toBeGreaterThan(0);
  });

  it("opens over a modal that is already open, and Escape closes the palette before the modal", async () => {
    setup([{ id: "a", label: "Alpha" }]);
    const modal = mount(CuiModal, { props: { visible: true, title: "Underneath" }, attachTo: document.body });
    await settle();
    await userEvent.keyboard(`{${MOD}>}k{/${MOD}}`);
    await settle();
    expect(document.activeElement).toBe(input());
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(document.querySelector(".cui-command-palette")).toBeNull();
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain("Underneath");
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    modal.unmount();
  });

  it("underlines the matched letters, and the highlighted row has a visible tint", async () => {
    setup([{ id: "a", label: "Toggle dark mode" }]);
    await userEvent.click(document.querySelector('[data-t="opener"]')!);
    await settle();
    await userEvent.keyboard("tdm");
    const match = document.querySelector<HTMLElement>(".cui-command-palette__match")!;
    expect(getComputedStyle(match).textDecorationLine).toBe("underline");
    expect(Number(getComputedStyle(match).fontWeight)).toBeGreaterThanOrEqual(600);
    const bg = getComputedStyle(options()[0]).backgroundColor;
    expect(bg).not.toBe("rgba(0, 0, 0, 0)");
    // The interior reads as the panel's own surface: only the highlighted row is tinted.
    // No internal rules: the regions are told apart by spacing, and only the outer border remains.
    expect(getComputedStyle(document.querySelector(".cui-command-palette__search")!).borderBottomWidth).toBe("0px");
    expect(getComputedStyle(document.querySelector(".cui-command-palette__footer")!).borderTopWidth).toBe("0px");
    // The key hints sit at the right of the footer, apart from the results.
    const footer = document.querySelector(".cui-command-palette__footer")!.getBoundingClientRect();
    const firstHint = document.querySelector(".cui-command-palette__hint")!.getBoundingClientRect();
    expect(firstHint.left - footer.left, "right-aligned").toBeGreaterThan(footer.width / 3);
    for (const sel of [".cui-command-palette__search", ".cui-command-palette__footer", ".cui-command-palette__list"]) {
      expect(getComputedStyle(document.querySelector(sel)!).backgroundColor, `${sel} has no fill of its own`).toBe("rgba(0, 0, 0, 0)");
    }
  });

  it("searches a server as you type: fast typing sends one search, slow typing aborts the earlier, and the highlight stays put when results land", async () => {
    const calls: Array<{ query: string; signal: AbortSignal; resolve: (r: Array<{ id: string; label: string }>) => void }> = [];
    setup(
      [
        { id: "a", label: "Alpha one" },
        { id: "b", label: "Alpha two" },
      ],
      {
        debounce: 80,
        fetchCommands: (query: string, { signal }: { signal: AbortSignal }) =>
          new Promise((resolve) => calls.push({ query, signal, resolve })),
      },
    );
    await userEvent.click(document.querySelector('[data-t="opener"]')!);
    await settle();
    await userEvent.keyboard("alph");
    await wait(300);
    expect(calls.map((c) => c.query), "four keystrokes inside the debounce make one search").toEqual(["alph"]);
    await userEvent.keyboard("a");
    await wait(300);
    expect(calls.map((c) => c.query)).toEqual(["alph", "alpha"]);
    expect(calls[0].signal.aborted, "the earlier search is aborted in a real browser").toBe(true);
    expect(document.querySelector('[role="listbox"]')!.getAttribute("aria-busy")).toBe("true");

    await userEvent.keyboard("{ArrowDown}");
    const active = () => document.getElementById(input().getAttribute("aria-activedescendant")!)!.textContent;
    expect(active()).toContain("Alpha two");
    calls[1].resolve([{ id: "r1", label: "Alpha from the server" }]);
    await vi.waitFor(() => expect(labels()).toContain("Alpha from the server"));
    expect(active(), "the highlight did not move").toContain("Alpha two");
    expect(document.querySelector('[role="listbox"]')!.getAttribute("aria-busy")).toBeNull();
  });

  it("shows focus on the search field as one quiet edge, not a box: no outline, a colored bottom edge on the row", async () => {
    setup([{ id: "a", label: "Alpha" }]);
    await userEvent.click(document.querySelector('[data-t="opener"]')!);
    await settle();
    expect(document.activeElement).toBe(input());
    expect(getComputedStyle(input()).outlineStyle).toBe("none");
    expect(getComputedStyle(document.querySelector(".cui-command-palette__search")!).boxShadow).not.toBe("none");
  });

  // The look (#197 review): it has to stand off the page in dark mode, not only light.
  const rgba = (css: string): [number, number, number, number] => {
    const c = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
    c.clearRect(0, 0, 1, 1);
    c.fillStyle = css;
    c.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = c.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const over = (top: number[], under: number[]) => top.slice(0, 3).map((v, i) => v * top[3] + under[i] * (1 - top[3]));
  const luminance = (c: number[]) => {
    const [r, g, b] = c.map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a: number[], b: number[]) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  it.each([
    ["light", false, [255, 255, 255]],
    ["dark", true, [9, 9, 11]],
  ])("is a rounded, translucent, role-tinted panel with AA text in %s mode, on the worst page behind it", async (_name, dark, page) => {
    document.documentElement.classList.toggle("dark", dark);
    // installTokens stubs only some scale steps, and the dark slots read others.
    const steps = document.createElement("style");
    steps.textContent = `:root { ${[50, 200, 400, 800, 950].map((n) => `--color-primary-${n}: #6366f1;`).join(" ")} }`;
    document.head.append(steps);
    try {
      setup([{ id: "a", label: "Toggle", description: "Described", group: "g" }], { groups: [{ id: "g", label: "Group" }] });
      await userEvent.click(document.querySelector('[data-t="opener"]')!);
      await settle();
      const panel = document.querySelector<HTMLElement>(".cui-command-palette")!;
      const st = getComputedStyle(panel);
      expect(parseFloat(st.borderTopLeftRadius), "larger than the scale's lg").toBeGreaterThanOrEqual(16);
      expect(st.backdropFilter).toContain("blur");
      expect(st.boxShadow).not.toBe("none");
      expect(st.borderTopWidth).toBe("1px");
      const fill = rgba(st.backgroundColor);
      expect(fill[3], "translucent, but not see-through").toBeGreaterThan(0.6);
      expect(fill[3]).toBeLessThan(1);
      // The panel against the page: a border or glow has to separate them as well as the fill.
      expect(st.borderTopColor).not.toBe(st.backgroundColor);
      const surface = over(fill, page);
      expect(luminance(surface), "a light card in both modes, so it is findable over a dark page").toBeGreaterThan(0.8);
      // The icon, the placeholder, the kbd chips and the dividers flip with it.
      const secondary = rgba(getComputedStyle(document.querySelector(".cui-command-palette__input")!).color);
      expect(contrast(secondary, surface), "typed text").toBeGreaterThanOrEqual(4.5);
      const hint = rgba(getComputedStyle(document.querySelector(".cui-command-palette__footer")!).color);
      expect(contrast(hint, surface), "footer hints").toBeGreaterThanOrEqual(4.5);
      const text = (sel: string) => rgba(getComputedStyle(document.querySelector(sel)!).color);
      for (const sel of [".cui-command-palette__label", ".cui-command-palette__description", ".cui-command-palette__heading"]) {
        expect(contrast(text(sel), surface), `${sel} on the panel`).toBeGreaterThanOrEqual(4.5);
      }
    } finally {
      document.documentElement.classList.remove("dark");
      steps.remove();
    }
  });
});
