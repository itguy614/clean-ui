import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, reactive, nextTick } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import { motionDuration } from "../../utils/motion";
import CuiModal from "../../components/CuiModal.vue";
import CuiPopover from "../../components/CuiPopover.vue";
import CuiTooltip from "../../components/CuiTooltip.vue";
import CuiSelect from "../../components/CuiSelect.vue";
import CuiDropdown from "../../components/CuiDropdown.vue";
import CuiDropdownTrigger from "../../components/CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../../components/CuiDropdownMenu.vue";
import CuiDropdownItem from "../../components/CuiDropdownItem.vue";
import CuiSlideover from "../../components/CuiSlideover.vue";
import CuiToastProvider from "../../components/CuiToastProvider.vue";
import CuiCommandPalette from "../../components/CuiCommandPalette.vue";
import { useCommandPalette } from "../../composables/useCommandPalette";
import { useToast } from "../../composables/useToast";

/** Audit (#541): what is on top when a floating thing and an overlay meet. Measures, then asserts the desired model. */
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
  document.body.innerHTML = "";
  document.body.style.overflow = "";
});

const center = (el: Element) => {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2] as const;
};
const topAt = (el: Element) => document.elementFromPoint(...center(el));
/** The z-index the browser resolved for the fixed layer holding `el`. */
function zOf(el: Element | null): string {
  for (let e = el; e; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (cs.position !== "static" && cs.zIndex !== "auto") return cs.zIndex;
  }
  return "?";
}
const log = (name: string, a: Element, b: Element) =>
  console.log(`[audit] ${name}: A z=${zOf(a)}, B z=${zOf(b)}, top at A's center is ${a.contains(topAt(a) ?? null) ? "A" : b.contains(topAt(a) ?? null) ? "B" : "other"}`);

describe("layering audit (real browser)", () => {
  it("popover open, then the command palette opens: the palette is on top", async () => {
    palette.register([{ id: "a", label: "Alpha" }]);
    const state = reactive({ pop: true });
    wrapper = mount(defineComponent({ render: () => [
      h(CuiPopover, { visible: state.pop, trigger: "manual" as never, width: "300px", noArrow: true, title: "Pop" }, { default: () => h("button", "anchor"), content: () => "body" }),
      h(CuiCommandPalette),
    ] }), { attachTo: document.body });
    await settle();
    const pop = document.querySelector<HTMLElement>(".cui-popover__panel")!;
    palette.open();
    await settle();
    const pal = document.querySelector<HTMLElement>(".cui-command-palette")!.closest<HTMLElement>(".cui-modal-overlay")!;
    log("popover vs palette", pal, pop);
    // Put the popover where the palette is: the popover is at the palette's center only if it overlaps; probe by z.
    expect(Number(zOf(pal)) || 0, "palette z above the popover's").toBeGreaterThan(Number(zOf(pop)));
  });

  it("popover open, then a modal opens: the modal's z is above the popover's", async () => {
    const state = reactive({ modal: false });
    wrapper = mount(defineComponent({ render: () => [
      h(CuiPopover, { visible: true, trigger: "manual" as never, noArrow: true }, { default: () => h("button", "anchor"), content: () => "body" }),
      h(CuiModal, { visible: state.modal, "onUpdate:visible": (v: boolean) => (state.modal = v), title: "M" }, { default: () => h("p", "m") }),
    ] }), { attachTo: document.body });
    await settle();
    const pop = document.querySelector<HTMLElement>(".cui-popover__panel")!;
    state.modal = true;
    await settle();
    const modal = document.querySelector<HTMLElement>(".cui-modal-overlay")!;
    log("popover vs modal", modal, pop);
    expect(Number(zOf(modal))).toBeGreaterThan(Number(zOf(pop)));
  });

  it("a select opened inside a modal that sits over another overlay: its panel is above its modal", async () => {
    const state = reactive({ a: true, b: false });
    wrapper = mount(defineComponent({ render: () => [
      h(CuiModal, { visible: state.a, title: "A" }, { default: () => h("p", "a") }),
      h(CuiModal, { visible: state.b, title: "B" }, { default: () => h(CuiSelect, { options: ["x", "y"], modelValue: null, "data-s": "1" }) }),
    ] }), { attachTo: document.body });
    await settle();
    state.b = true;
    await settle();
    const trigger = document.querySelector<HTMLElement>('.cui-select [tabindex="0"]')!;
    trigger.click();
    await settle();
    const panel = document.querySelector<HTMLElement>('[role="listbox"]')!;
    const modalB = [...document.querySelectorAll<HTMLElement>(".cui-modal-overlay")].at(-1)!;
    log("select panel vs its modal (modal is 2nd overlay)", panel, modalB);
    expect(Number(zOf(panel))).toBeGreaterThan(Number(zOf(modalB)));
    void trigger;
  });

  it("a dropdown menu opened inside a modal over another overlay: the menu is above its modal", async () => {
    const state = reactive({ a: true, b: false });
    wrapper = mount(defineComponent({ render: () => [
      h(CuiModal, { visible: state.a, title: "A" }, { default: () => h("p", "a") }),
      h(CuiModal, { visible: state.b, title: "B" }, { default: () => h(CuiDropdown, null, { default: () => [
        h(CuiDropdownTrigger, null, { default: () => h("button", { "data-d": "1" }, "open") }),
        h(CuiDropdownMenu, null, { default: () => h(CuiDropdownItem, null, { default: () => "Item" }) }),
      ] }) }),
    ] }), { attachTo: document.body });
    await settle();
    state.b = true;
    await settle();
    document.querySelector<HTMLElement>('[data-d="1"]')!.click();
    await settle();
    const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
    const modalB = [...document.querySelectorAll<HTMLElement>(".cui-modal-overlay")].at(-1)!;
    log("dropdown menu vs its modal", menu, modalB);
    expect(Number(zOf(menu))).toBeGreaterThan(Number(zOf(modalB)));
  });

  it("a popover opened inside modal A, then modal B opens over A: B is above A's popover", async () => {
    const state = reactive({ a: true, b: false });
    wrapper = mount(defineComponent({ render: () => [
      h(CuiModal, { visible: state.a, title: "A" }, { default: () => h(CuiPopover, { visible: true, trigger: "manual" as never, noArrow: true }, { default: () => h("button", "anchor"), content: () => "pop" }) }),
      h(CuiModal, { visible: state.b, title: "B" }, { default: () => h("p", "b") }),
    ] }), { attachTo: document.body });
    await settle();
    const pop = document.querySelector<HTMLElement>(".cui-popover__panel")!;
    state.b = true;
    await settle();
    const modalB = [...document.querySelectorAll<HTMLElement>(".cui-modal-overlay")].at(-1)!;
    log("popover in A vs modal B", modalB, pop);
    expect(Number(zOf(modalB))).toBeGreaterThan(Number(zOf(pop)));
  });

  it("a tooltip shown, then a modal opens: tooltip z vs modal z", async () => {
    const state = reactive({ m: false });
    wrapper = mount(defineComponent({ render: () => [
      h(CuiTooltip, { visible: true, content: "tip" }, { default: () => h("button", "anchor") }),
      h(CuiModal, { visible: state.m, title: "M" }, { default: () => h("p", "m") }),
    ] }), { attachTo: document.body });
    await settle();
    const tip = document.querySelector<HTMLElement>(".cui-tooltip")!;
    state.m = true;
    await settle();
    const modal = document.querySelector<HTMLElement>(".cui-modal-overlay")!;
    log("tooltip vs modal", modal, tip);
    expect(Number(zOf(modal))).toBeGreaterThan(Number(zOf(tip)));
  });

  it("a toast, then a modal opens: toast z vs modal z", async () => {
    const state = reactive({ m: false });
    const Inner = defineComponent({ setup() { const t = useToast(); return () => h("button", { "data-toast": "1", onClick: () => t.toast({ title: "Hi", duration: 0 } as never) }, "t"); } });
    wrapper = mount(defineComponent({ render: () => h(CuiToastProvider, null, { default: () => [
      h(Inner),
      h(CuiModal, { visible: state.m, title: "M" }, { default: () => h("p", "m") }),
    ] }) }), { attachTo: document.body });
    document.querySelector<HTMLElement>('[data-toast="1"]')!.click();
    await settle();
    const toastRegion = [...document.querySelectorAll<HTMLElement>("*")].find((e) => getComputedStyle(e).position === "fixed" && /toast/i.test(e.className))!;
    state.m = true;
    await settle();
    const modal = document.querySelector<HTMLElement>(".cui-modal-overlay")!;
    log("toast vs modal", modal, toastRegion);
    await nextTick();
    expect(Number(zOf(modal))).toBeGreaterThan(Number(zOf(toastRegion)));
  });

  it("a click-opened popover, then the palette opens from code: does the popover light-dismiss?", async () => {
    palette.register([{ id: "a", label: "Alpha" }]);
    wrapper = mount(defineComponent({ render: () => [
      h(CuiPopover, { noArrow: true, title: "Pop" }, { default: () => h("button", { "data-p": "1" }, "anchor"), content: () => "body" }),
      h(CuiCommandPalette),
    ] }), { attachTo: document.body });
    document.querySelector<HTMLElement>('[data-p="1"]')!.click();
    await settle();
    const before = !!document.querySelector(".cui-popover__panel") && getComputedStyle(document.querySelector(".cui-popover__panel")!).display !== "none";
    palette.open();
    await settle();
    const panel = document.querySelector<HTMLElement>(".cui-popover__panel");
    const after = !!panel && getComputedStyle(panel).display !== "none";
    console.log(`[audit] click popover open before palette: ${before}; still open after the palette opened from code: ${after}`);
    expect(after, "popover light-dismisses when a modal-type overlay opens").toBe(false);
  });

  /** A toast and an overlay of `kind`, in either order: what paints at the toast's center. */
  for (const kind of ["modal", "slideover", "palette"] as const) {
    for (const order of ["toast-first", "overlay-first"] as const) {
      it(`${order}: a toast and a ${kind}: the toast paints above the overlay (readable)`, async () => {
        palette.register([{ id: "a", label: "Alpha" }]);
        const state = reactive({ open: false });
        const Inner = defineComponent({ setup() { const t = useToast(); return () => h("button", { "data-toast": "1", onClick: () => t.toast({ title: "Saved", duration: 0 } as never) }, "t"); } });
        wrapper = mount(defineComponent({ render: () => h(CuiToastProvider, null, { default: () => [
          h(Inner),
          kind === "palette" ? h(CuiCommandPalette) : kind === "modal"
            ? h(CuiModal, { visible: state.open, title: "M" }, { default: () => h("p", "m") })
            : h(CuiSlideover, { visible: state.open }, { default: () => h("p", "s") }),
        ] }) }), { attachTo: document.body });
        const fire = async () => { document.querySelector<HTMLElement>('[data-toast="1"]')!.click(); await settle(); };
        const openIt = async () => { if (kind === "palette") palette.open(); else state.open = true; await settle(); };
        if (order === "toast-first") { await fire(); await openIt(); } else { await openIt(); await fire(); }
        const toast = [...document.querySelectorAll<HTMLElement>(".cui-toast")].at(-1)!;
        const root = document.querySelector<HTMLElement>(".cui-modal-overlay, .cui-slideover")!;
        const region = toast.closest<HTMLElement>(".cui-toast-container")!;
        const top = topAt(toast);
        console.log(`[audit] ${order} toast vs ${kind}: toast region z=${zOf(region)}, overlay root z=${zOf(root)}, toast center paints ${toast.contains(top ?? null) ? "toast" : "other: " + (top as HTMLElement | null)?.className}`);
        expect(toast.contains(top ?? null)).toBe(true);
      });
    }
  }
});
