import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import { motionDuration } from "../../utils/motion";
import type { OverlayFocusProps } from "../../types/common";
import CuiConfirmDialog from "../../components/CuiConfirmDialog.vue";

/**
 * #437 — CuiConfirmDialog wraps CuiModal and forwards `initialFocus`, `returnFocus`,
 * `after-enter` and `after-leave` to it (#374). Real browser, real transitions.
 */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const settle = () => wait(motionDuration("slow") + 150);

let removeTokens: () => void;
beforeAll(() => (removeTokens = installTokens(main)));
afterAll(() => removeTokens());

let wrapper: VueWrapper | undefined;
afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = "";
});

function setup(props: OverlayFocusProps = {}) {
  const visible = ref(false);
  const events: { name: string; focus: Element | null }[] = [];
  const record = (name: string) => () => events.push({ name, focus: document.activeElement });
  const Host = defineComponent({
    setup: () => () => [
      h("button", { "data-t": "opener", onClick: () => (visible.value = true) }, "Open"),
      h("button", { "data-t": "next" }, "Next"),
      h(CuiConfirmDialog, {
        visible: visible.value,
        title: "Sure?",
        confirmText: "Go",
        ...props,
        "onUpdate:visible": (v: boolean) => (visible.value = v),
        onAfterEnter: record("after-enter"),
        onAfterLeave: record("after-leave"),
      }),
    ],
  });
  wrapper = mount(Host, { attachTo: document.body });
  const byT = (t: string) => document.querySelector<HTMLElement>(`[data-t="${t}"]`)!;
  return {
    visible,
    events,
    names: () => events.map((e) => e.name),
    byT,
    async open() {
      byT("opener").focus();
      byT("opener").click();
      await nextTick();
    },
  };
}

describe("CuiConfirmDialog focus and lifecycle events (real browser)", () => {
  it("fires after-enter once the entry has finished, and after-leave once focus is back on the opener", async () => {
    const t = setup();
    await t.open();
    await settle();
    expect(t.names()).toEqual(["after-enter"]);
    expect(t.events[0].focus, "the panel is focused by default").toBe(document.querySelector(".cui-modal"));
    t.visible.value = false;
    await settle();
    await settle();
    expect(t.names(), "once each").toEqual(["after-enter", "after-leave"]);
    expect(t.events[1].focus).toBe(t.byT("opener"));
  });

  it("focuses initialFocus, scoped to the dialog", async () => {
    const t = setup({ initialFocus: ".cui-modal-footer button" });
    await t.open();
    await settle();
    const first = document.querySelector<HTMLElement>(".cui-modal-footer button")!;
    expect(first).not.toBeNull();
    expect(t.events[0].focus).toBe(first);
  });

  it("returns focus to returnFocus in place of the opener", async () => {
    const t = setup({ returnFocus: "[data-t='next']" });
    await t.open();
    await settle();
    t.visible.value = false;
    await settle();
    await settle();
    expect(document.activeElement).toBe(t.byT("next"));
    expect(t.events.at(-1)).toMatchObject({ name: "after-leave", focus: t.byT("next") });
  });
});
