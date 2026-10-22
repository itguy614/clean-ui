import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "./helpers";
import { motionDuration } from "../../utils/motion";
import CuiModal from "../../components/CuiModal.vue";
import CuiDropdown from "../../components/CuiDropdown.vue";
import CuiDropdownTrigger from "../../components/CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../../components/CuiDropdownMenu.vue";
import CuiDropdownItem from "../../components/CuiDropdownItem.vue";
import CuiPopover from "../../components/CuiPopover.vue";
import CuiSelect from "../../components/CuiSelect.vue";
import CuiTooltip from "../../components/CuiTooltip.vue";
import CuiButton from "../../components/CuiButton.vue";
import CuiAlert from "../../components/CuiAlert.vue";
import CuiToastProvider from "../../components/CuiToastProvider.vue";
import { useToast } from "../../composables/useToast";

/**
 * #263 — overlays left the DOM the instant they closed, and the four that animated out did
 * it each with its own close timer. Exits now run through <Transition>: panels play an exit
 * and unmount after it, a re-open mid-exit reverses the same element, Select animates in,
 * and removing a toast moves the rest into place.
 */
describe("exit transitions (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => (removeTokens = installTokens(main)));
  afterAll(() => removeTokens());

  const mounted: VueWrapper[] = [];
  afterEach(() => {
    mounted.splice(0).forEach((w) => w.unmount());
    document.querySelectorAll("#exit-host").forEach((el) => el.remove());
  });
  const host = () => {
    const el = document.createElement("div");
    el.id = "exit-host";
    el.style.cssText = "position: fixed; left: 160px; top: 40px;";
    document.body.append(el);
    return el;
  };
  const track = <T extends VueWrapper>(w: T) => (mounted.push(w), w);
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const frame = () => new Promise((r) => requestAnimationFrame(r));

  function dropdown() {
    return track(
      mount(
        {
          render: () =>
            h(CuiDropdown, null, () => [
              h(CuiDropdownTrigger, null, () => h(CuiButton, () => "Menu")),
              h(CuiDropdownMenu, null, () => [h(CuiDropdownItem, null, () => "One"), h(CuiDropdownItem, null, () => "Two")]),
            ]),
        },
        { attachTo: host() },
      ),
    );
  }
  const menu = () => document.querySelector<HTMLElement>(".cui-dropdown-menu");

  it("plays a menu's exit, then unmounts it", async () => {
    const w = dropdown();
    await w.find(".cui-button").trigger("click");
    await wait(motionDuration("base") + 50);
    await w.find(".cui-button").trigger("click");
    await frame();
    expect(menu(), "still in the DOM while it leaves").not.toBeNull();
    expect(menu()!.getAttribute("data-cui-panel")).toBe("hidden");
    await wait(motionDuration("fast") + 100);
    expect(menu(), "unmounted after its exit").toBeNull();
  });

  it("reverses a re-open mid-exit on the same element, without fading from nothing", async () => {
    const w = dropdown();
    await w.find(".cui-button").trigger("click");
    await wait(motionDuration("base") + 50);
    const panel = menu()!;
    await w.find(".cui-button").trigger("click");
    await wait(motionDuration("fast") / 2);
    const midExit = Number(getComputedStyle(panel).opacity);
    expect(midExit).toBeLessThan(1);
    await w.find(".cui-button").trigger("click");
    const samples: number[] = [];
    for (let i = 0; i < 6; i++) {
      await frame();
      samples.push(Number(getComputedStyle(panel).opacity));
    }
    expect(menu(), "the same element, not a new one").toBe(panel);
    // Turning straight back: never further out than where it was. (A v-if toggled mid-leave
    // drops the panel and fades a new one in from 0; Vue's CSS mode dips towards 0 first.)
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(midExit - 0.02);
    await wait(motionDuration("base") + 50);
    expect(Number(getComputedStyle(panel).opacity)).toBe(1);
  });

  it("plays a popover's exit, then unmounts it", async () => {
    const w = track(
      mount(CuiPopover, { props: { title: "Panel" }, slots: { default: () => h(CuiButton, () => "Open"), content: () => "Body" }, attachTo: host() }),
    );
    await w.find(".cui-button").trigger("click");
    await wait(motionDuration("base") + 50);
    const panel = () => document.querySelector<HTMLElement>(".cui-popover__panel");
    await w.find(".cui-button").trigger("click");
    // Its hideDelay (100ms) first, then the exit.
    await wait(100 + 20);
    expect(panel()?.getAttribute("data-cui-panel")).toBe("hidden");
    await wait(motionDuration("fast") + 100);
    expect(panel()).toBeNull();
  });

  // The state was a class once: a panel whose own `:class` changed mid-exit (a colour, a
  // side flipped) had it stripped by Vue's className rewrite, and vanished at once.
  it("keeps playing a panel's exit when its own class binding changes mid-way", async () => {
    const w = track(mount(CuiTooltip, { props: { text: "Tip", visible: true }, slots: { default: () => h("button", "Tip") }, attachTo: host() }));
    await wait(motionDuration("fast") + 100);
    const panel = document.querySelector<HTMLElement>(".cui-tooltip")!;
    await w.setProps({ visible: false });
    await frame();
    await w.setProps({ color: "error" });
    await frame();
    expect(panel.isConnected, "still leaving").toBe(true);
    expect(panel.getAnimations().length, "its exit still running").toBeGreaterThan(0);
    await wait(motionDuration("fast") + 100);
    expect(panel.isConnected).toBe(false);
  });

  it("animates a Select's listbox in, and out", async () => {
    const w = track(mount(CuiSelect, { props: { options: [{ value: "a", label: "Alpha" }], modelValue: null }, attachTo: host() }));
    await w.find(".cui-select__trigger").trigger("click");
    await nextTick();
    await frame();
    const panel = document.querySelector<HTMLElement>(".cui-listbox-panel")!;
    expect(panel.getAnimations().length, "growing in").toBeGreaterThan(0);
    await wait(motionDuration("base") + 50);
    await w.find(".cui-select__trigger").trigger("click");
    await frame();
    expect(panel.getAttribute("data-cui-panel")).toBe("hidden");
    expect(panel.getAnimations().length, "leaving").toBeGreaterThan(0);
  });

  it("keeps the scroll lock until the last of two stacked modals has closed", async () => {
    const first = track(mount(CuiModal, { props: { visible: true, title: "First" } }));
    const second = track(mount(CuiModal, { props: { visible: true, title: "Second" } }));
    await wait(motionDuration("slow") + 100);
    expect(document.body.style.overflow).toBe("hidden");

    await second.setProps({ visible: false });
    await wait(motionDuration("slow") + 150);
    expect(second.emitted("close")).toHaveLength(1);
    expect(document.body.style.overflow, "the first is still open").toBe("hidden");

    await first.setProps({ visible: false });
    await wait(motionDuration("slow") + 150);
    expect(first.emitted("close")).toHaveLength(1);
    expect(document.body.style.overflow).toBe("");
    expect(document.querySelectorAll(".cui-modal-overlay")).toHaveLength(0);
  });

  it("reverses a modal re-opened mid-exit, without reporting a close", async () => {
    const opener = document.createElement("button");
    opener.textContent = "Opener";
    host().append(opener);
    opener.focus();
    const w = track(mount(CuiModal, { props: { visible: true, title: "Modal" } }));
    await wait(motionDuration("slow") + 100);
    const overlay = document.querySelector<HTMLElement>(".cui-modal-overlay")!;
    await w.setProps({ visible: false });
    await wait(motionDuration("slow") / 2);
    await w.setProps({ visible: true });
    await wait(motionDuration("slow") + 100);
    expect(document.querySelector(".cui-modal-overlay"), "the same element").toBe(overlay);
    expect(w.emitted("close"), "no close reported for the cancelled one").toBeUndefined();
    expect(document.body.style.overflow).toBe("hidden");

    await w.setProps({ visible: false });
    await wait(motionDuration("slow") + 150);
    expect(w.emitted("close")).toHaveLength(1);
    expect(document.activeElement, "focus back to the first opener").toBe(opener);
  });

  it("reports an alert's dismiss once its exit has played", async () => {
    const w = track(mount(CuiAlert, { props: { title: "Saved", dismissible: true }, attachTo: host() }));
    await wait(motionDuration("slow") + 50);
    await w.find(".cui-alert__dismiss").trigger("click");
    await frame();
    expect(w.emitted("dismiss"), "not before its exit").toBeUndefined();
    expect(document.querySelector(".cui-alert")).not.toBeNull();
    await wait(motionDuration("slow") + 150);
    expect(w.emitted("dismiss")).toHaveLength(1);
    expect(document.querySelector(".cui-alert")).toBeNull();
  });

  it("moves the remaining toasts into place when one in the middle is removed", async () => {
    let api: ReturnType<typeof useToast> | undefined;
    const Grab = defineComponent({ setup: () => ((api = useToast()), () => null) });
    track(mount({ render: () => h(CuiToastProvider, { position: "top-right" }, () => h(Grab)) }, { attachTo: host() }));
    const ids = ["One", "Two", "Three"].map((title) => api!.toast({ title, autoDismiss: 0 }));
    await wait(motionDuration("slow") + 100);
    const wrappers = () => [...document.querySelectorAll<HTMLElement>(".cui-toast-wrapper")];
    const third = wrappers()[2];
    const before = third.getBoundingClientRect().top;
    api!.dismiss(ids[1]);
    await nextTick();
    await frame();
    // The leaver stays while it fades, out of the flow; the toast below it moves up.
    expect(wrappers()).toHaveLength(3);
    expect(third.classList.contains("cui-toast-move")).toBe(true);
    await wait(motionDuration("slow") + 100);
    expect(wrappers()).toHaveLength(2);
    expect(third.getBoundingClientRect().top).toBeLessThan(before);
  });
});
