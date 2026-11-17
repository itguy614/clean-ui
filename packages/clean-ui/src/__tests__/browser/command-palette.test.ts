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
  });
});
