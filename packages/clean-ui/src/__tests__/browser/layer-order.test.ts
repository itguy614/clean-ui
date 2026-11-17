import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, reactive } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import { motionDuration } from "../../utils/motion";
import CuiModal from "../../components/CuiModal.vue";
import CuiSlideover from "../../components/CuiSlideover.vue";
import CuiPopover from "../../components/CuiPopover.vue";
import CuiTooltip from "../../components/CuiTooltip.vue";
import CuiSelect from "../../components/CuiSelect.vue";
import CuiDropdown from "../../components/CuiDropdown.vue";
import CuiDropdownTrigger from "../../components/CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../../components/CuiDropdownMenu.vue";
import CuiDropdownItem from "../../components/CuiDropdownItem.vue";
import CuiToastProvider from "../../components/CuiToastProvider.vue";
import CuiCommandPalette from "../../components/CuiCommandPalette.vue";
import { useCommandPalette } from "../../composables/useCommandPalette";
import { useToast } from "../../composables/useToast";

/**
 * #541 — the layering model, measured in a browser: overlays and the panels anchored to a
 * trigger share one open-order sequence (+0..+39 from --cui-z-overlay); a panel open when an
 * overlay opens light-dismisses; the toast region (+48) sits above the sequence and tooltips
 * (+49) above that. What is on top is what `elementFromPoint` finds at a layer's own center.
 */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const settle = () => wait(motionDuration("slow") + 150);
let removeTokens: () => void;
beforeAll(() => (removeTokens = installTokens(main)));
afterAll(() => removeTokens());
let wrapper: VueWrapper | undefined;
const palette = useCommandPalette();
afterEach(() => {
  palette.close();
  wrapper?.unmount();
  wrapper = undefined;
  document.documentElement.classList.remove("dark");
  document.body.innerHTML = "";
  document.body.style.overflow = "";
});

const topAt = (el: Element) => {
  const r = el.getBoundingClientRect();
  return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
};
const paintsOnTop = (el: Element | null | undefined) => !!el && el.contains(topAt(el));
/** The z-index the browser resolved for the positioned layer holding `el`. */
function zOf(el: Element | null): number {
  for (let e = el; e; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (cs.position !== "static" && cs.zIndex !== "auto") return Number(cs.zIndex);
  }
  return NaN;
}
const shown = (el: Element | null) => !!el && getComputedStyle(el).display !== "none";
const overlays = () => [...document.querySelectorAll<HTMLElement>(".cui-modal-overlay")];

const pop = (state: { [k: string]: boolean }, key: string, label = "pop") =>
  h(CuiPopover, { visible: state[key], "onUpdate:visible": (v: boolean) => (state[key] = v), trigger: "manual" as never, noArrow: true, width: "12rem" }, { default: () => h("button", `${label}-anchor`), content: () => h("p", { "data-t": label }, label) });
const modal = (state: { [k: string]: boolean }, key: string, body: () => unknown, extra: Record<string, unknown> = {}) =>
  h(CuiModal, { visible: state[key], "onUpdate:visible": (v: boolean) => (state[key] = v), title: key, ...extra }, { default: body as never });
const dropdown = () =>
  h(CuiDropdown, null, { default: () => [
    h(CuiDropdownTrigger, null, { default: () => h("button", { "data-d": "1" }, "open") }),
    h(CuiDropdownMenu, null, { default: () => h(CuiDropdownItem, null, { default: () => "Item" }) }),
  ] });

/** Runs `fn` in light and in dark. */
function both(name: string, fn: () => Promise<void>) {
  for (const dark of [false, true]) {
    it(`${name} (${dark ? "dark" : "light"})`, async () => {
      document.documentElement.classList.toggle("dark", dark);
      await fn();
    });
  }
}

describe("a panel open when an overlay opens light-dismisses", () => {
  both("popover open, then the command palette opens: the popover closes, the palette is on top, focus is in it", async () => {
    palette.register([{ id: "a", label: "Alpha" }]);
    const state = reactive({ pop: true });
    wrapper = mount(defineComponent({ render: () => [pop(state, "pop"), h(CuiCommandPalette)] }), { attachTo: document.body });
    await settle();
    expect(shown(document.querySelector(".cui-popover__panel"))).toBe(true);
    palette.open();
    await settle();
    expect(state.pop, "the popover's v-model followed the close").toBe(false);
    expect(document.querySelector(".cui-popover__panel")).toBeNull();
    const pal = document.querySelector<HTMLElement>(".cui-command-palette")!;
    expect(paintsOnTop(pal)).toBe(true);
    expect(document.activeElement).toBe(document.querySelector(".cui-command-palette__input"));
  });

  it("a click-opened popover closes when a modal opens from code, and focus lands in the modal", async () => {
    const state = reactive({ m: false });
    wrapper = mount(defineComponent({ render: () => [
      h(CuiPopover, { noArrow: true }, { default: () => h("button", { "data-p": "1" }, "anchor"), content: () => "body" }),
      modal(state, "m", () => h("p", "m")),
    ] }), { attachTo: document.body });
    document.querySelector<HTMLElement>('[data-p="1"]')!.click();
    await settle();
    expect(shown(document.querySelector(".cui-popover__panel"))).toBe(true);
    state.m = true;
    await settle();
    expect(document.querySelector(".cui-popover__panel")).toBeNull();
    expect(document.querySelector(".cui-modal")!.contains(document.activeElement)).toBe(true);
  });

  it("a dropdown menu closes when a modal opens, and focus lands in the modal", async () => {
    const state = reactive({ m: false });
    wrapper = mount(defineComponent({ render: () => [dropdown(), modal(state, "m", () => h("p", "m"))] }), { attachTo: document.body });
    document.querySelector<HTMLElement>('[data-d="1"]')!.click();
    await settle();
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
    state.m = true;
    await settle();
    expect(document.querySelector('[role="menu"]')).toBeNull();
    expect(document.querySelector(".cui-modal")!.contains(document.activeElement)).toBe(true);
  });

  it("a select list closes when a modal opens, and the select keeps its value", async () => {
    const state = reactive({ m: false, v: "x" as string | null });
    wrapper = mount(defineComponent({ render: () => [
      h(CuiSelect, { options: ["x", "y"], modelValue: state.v, "onUpdate:modelValue": (v: string) => (state.v = v) }),
      modal(state, "m", () => h("p", "m")),
    ] }), { attachTo: document.body });
    document.querySelector<HTMLElement>('.cui-select [tabindex="0"]')!.click();
    await settle();
    expect(shown(document.querySelector('[role="listbox"]'))).toBe(true);
    state.m = true;
    await settle();
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(state.v).toBe("x");
  });

  it("a popover inside modal A closes when modal B opens over A, and B is on top", async () => {
    const state = reactive({ a: true, b: false, pop: true });
    wrapper = mount(defineComponent({ render: () => [
      modal(state, "a", () => pop(state, "pop")),
      modal(state, "b", () => h("p", "b")),
    ] }), { attachTo: document.body });
    await settle();
    expect(shown(document.querySelector(".cui-popover__panel"))).toBe(true);
    state.b = true;
    await settle();
    expect(state.pop).toBe(false);
    expect(paintsOnTop(overlays().at(-1))).toBe(true);
  });

  it("a panel opened from inside the overlay is not touched by it: the overlay was there first", async () => {
    const state = reactive({ m: true, pop: false });
    wrapper = mount(defineComponent({ render: () => [modal(state, "m", () => pop(state, "pop"))] }), { attachTo: document.body });
    await settle();
    state.pop = true;
    await settle();
    expect(shown(document.querySelector(".cui-popover__panel"))).toBe(true);
  });
});

describe("a panel opened over an overlay is above it, whatever sits beneath", () => {
  both("a popover opened inside a modal paints above the modal", async () => {
    const state = reactive({ m: true, pop: false });
    wrapper = mount(defineComponent({ render: () => [modal(state, "m", () => pop(state, "pop"))] }), { attachTo: document.body });
    await settle();
    state.pop = true;
    await settle();
    const panel = document.querySelector<HTMLElement>(".cui-popover__panel")!;
    expect(zOf(panel)).toBeGreaterThan(zOf(overlays()[0]));
    expect(paintsOnTop(panel)).toBe(true);
  });

  both("a dropdown menu opened in a modal that sits over another overlay paints above its modal", async () => {
    const state = reactive({ a: true, b: false });
    wrapper = mount(defineComponent({ render: () => [modal(state, "a", () => h("p", "a")), modal(state, "b", () => dropdown())] }), { attachTo: document.body });
    await settle();
    state.b = true;
    await settle();
    document.querySelector<HTMLElement>('[data-d="1"]')!.click();
    await settle();
    const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
    expect(zOf(menu)).toBeGreaterThan(zOf(overlays().at(-1)!));
    expect(paintsOnTop(menu)).toBe(true);
  });

  both("a select list opened in a modal that sits over another overlay paints above its modal", async () => {
    const state = reactive({ a: true, b: false });
    wrapper = mount(defineComponent({ render: () => [modal(state, "a", () => h("p", "a")), modal(state, "b", () => h(CuiSelect, { options: ["x", "y"], modelValue: null }))] }), { attachTo: document.body });
    await settle();
    state.b = true;
    await settle();
    document.querySelector<HTMLElement>('.cui-select [tabindex="0"]')!.click();
    await settle();
    const panel = document.querySelector<HTMLElement>('[role="listbox"]')!;
    expect(zOf(panel)).toBeGreaterThan(zOf(overlays().at(-1)!));
    expect(paintsOnTop(panel)).toBe(true);
  });

  it("a select list opened in a slideover that sits over a modal paints above its slideover", async () => {
    const state = reactive({ a: true, s: false });
    wrapper = mount(defineComponent({ render: () => [
      modal(state, "a", () => h("p", "a")),
      h(CuiSlideover, { visible: state.s, "onUpdate:visible": (v: boolean) => (state.s = v) }, { default: () => h(CuiSelect, { options: ["x", "y"], modelValue: null }) }),
    ] }), { attachTo: document.body });
    await settle();
    state.s = true;
    await settle();
    document.querySelector<HTMLElement>('.cui-select [tabindex="0"]')!.click();
    await settle();
    expect(paintsOnTop(document.querySelector('[role="listbox"]'))).toBe(true);
  });
});

describe("toasts and tooltips sit above the sequence", () => {
  function toastHost(kind: "modal" | "slideover" | "palette", state: { open: boolean }) {
    const Inner = defineComponent({ setup() { const t = useToast(); return () => h("button", { "data-toast": "1", onClick: () => t.toast({ title: "Saved", duration: 0 } as never) }, "t"); } });
    wrapper = mount(defineComponent({ render: () => h(CuiToastProvider, null, { default: () => [
      h(Inner),
      kind === "palette" ? h(CuiCommandPalette)
        : kind === "modal" ? modal(state as never, "open", () => h("p", "m"))
        : h(CuiSlideover, { visible: state.open }, { default: () => h("p", "s") }),
    ] }) }), { attachTo: document.body });
  }
  for (const kind of ["modal", "slideover", "palette"] as const) {
    for (const order of ["toast-first", "overlay-first"] as const) {
      both(`${order}: a toast and a ${kind}: the toast paints above the overlay`, async () => {
        palette.register([{ id: "a", label: "Alpha" }]);
        const state = reactive({ open: false });
        toastHost(kind, state);
        const fire = async () => { document.querySelector<HTMLElement>('[data-toast="1"]')!.click(); await settle(); };
        const openIt = async () => { if (kind === "palette") palette.open(); else state.open = true; await settle(); };
        if (order === "toast-first") { await fire(); await openIt(); } else { await openIt(); await fire(); }
        expect(paintsOnTop([...document.querySelectorAll<HTMLElement>(".cui-toast")].at(-1))).toBe(true);
      });
    }
  }

  it("the toast region no longer ties with a popover: it is above it", async () => {
    const state = reactive({ pop: true });
    const Inner = defineComponent({ setup() { const t = useToast(); return () => h("button", { "data-toast": "1", onClick: () => t.toast({ title: "Saved", duration: 0 } as never) }, "t"); } });
    wrapper = mount(defineComponent({ render: () => h(CuiToastProvider, null, { default: () => [h(Inner), pop(state, "pop")] }) }), { attachTo: document.body });
    document.querySelector<HTMLElement>('[data-toast="1"]')!.click();
    await settle();
    const region = document.querySelector<HTMLElement>(".cui-toast-container")!;
    expect(zOf(region)).toBeGreaterThan(zOf(document.querySelector(".cui-popover__panel")));
  });

  both("a tooltip shown while a modal is open paints above it, and above the toast region", async () => {
    const state = reactive({ m: true });
    wrapper = mount(defineComponent({ render: () => h(CuiToastProvider, null, { default: () => [
      modal(state, "m", () => h(CuiTooltip, { visible: true, content: "tip" }, { default: () => h("button", "anchor") })),
    ] }) }), { attachTo: document.body });
    await settle();
    const tip = document.querySelector<HTMLElement>(".cui-tooltip")!;
    expect(paintsOnTop(tip)).toBe(true);
    const region = document.querySelector<HTMLElement>(".cui-toast-container");
    if (region) expect(zOf(tip)).toBeGreaterThan(zOf(region));
    expect(zOf(tip)).toBeGreaterThan(zOf(overlays()[0]));
  });
});
