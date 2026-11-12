import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref, shallowRef, Transition, vShow, withDirectives } from "vue";
import { useOverlay } from "../useOverlay";
import { subtreeTransition } from "../../utils/motion";

/**
 * #339 — on an Escape or backdrop close, `close` fired twice: the consumer's v-model echo
 * of the close (`open` turning false) started a second close. And the focus trap let
 * Shift+Tab leave right after opening, didn't trap a dialog with nothing focusable, and
 * counted disabled or hidden controls as its ends.
 */
let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  vi.useRealTimers();
});

/** A dialog on useOverlay, with its open state echoed back through v-model as a consumer would. */
async function mountDialog(children: () => ReturnType<typeof h>[] = () => [h("button", "One"), h("button", "Two")]) {
  const open = ref(true);
  const closes: number[] = [];
  const Dialog = defineComponent({
    setup() {
      const dialogRef = shallowRef<HTMLElement | null>(null);
      const overlay = useOverlay({
        open: () => open.value,
        dialogRef,
        persistent: () => false,
        onUpdateOpen: (v) => (open.value = v),
        onClose: () => closes.push(1),
      });
      return () =>
        h(Transition, { ...subtreeTransition, onAfterLeave: overlay.onAfterLeave }, () =>
          overlay.mounted.value
            ? withDirectives(
                h("div", { ref: dialogRef, tabindex: -1, role: "dialog", onKeydown: overlay.onKeydown }, children()),
                [[vShow, overlay.isVisible.value]],
              )
            : null,
        );
    },
  });
  w = mount(Dialog, { attachTo: document.body });
  await nextTick();
  return { open, closes, dialog: () => document.querySelector<HTMLElement>('[role="dialog"]')! };
}

const tab = (shift = false) => {
  const e = new KeyboardEvent("keydown", { key: "Tab", shiftKey: shift, bubbles: true, cancelable: true });
  (document.activeElement ?? document.body).dispatchEvent(e);
  return e;
};

describe("useOverlay close", () => {
  it("reports one close when the consumer's v-model echoes it", async () => {
    vi.useFakeTimers();
    const { open, closes } = await mountDialog();
    await vi.advanceTimersByTimeAsync(50);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await vi.advanceTimersByTimeAsync(100);
    expect(open.value).toBe(false);
    expect(closes).toHaveLength(1);
  });
});

describe("useOverlay exit", () => {
  it("is a transition only: the close is reported once the panel has left, and it unmounts", async () => {
    const { open, closes, dialog } = await mountDialog();
    expect(dialog()).not.toBeNull();
    open.value = false;
    await nextTick();
    await nextTick();
    expect(closes).toHaveLength(1);
    expect(dialog()).toBeNull();
  });

  it("has no timer-mode options left", async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(globalThis, "setTimeout");
    const { open } = await mountDialog();
    spy.mockClear();
    open.value = false;
    await nextTick();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

/**
 * #374 — `onOpened` / `onClosed` and `initialFocus` / `returnFocus`. In jsdom the transition
 * hooks finish at once; the real-transition cases are in the browser suite
 * (overlay-focus-events.test.ts).
 */
describe("useOverlay lifecycle and focus targets", () => {
  it("focuses initialFocus, then reports opened; returns focus to returnFocus, then reports closed", async () => {
    vi.useFakeTimers();
    const opener = document.createElement("button");
    const target = document.createElement("button");
    document.body.append(opener, target);
    opener.focus();
    const open = ref(false);
    const log: string[] = [];
    const Dialog = defineComponent({
      setup() {
        const dialogRef = shallowRef<HTMLElement | null>(null);
        const overlay = useOverlay({
          open: () => open.value,
          dialogRef,
          persistent: () => false,
            initialFocus: () => ".second",
          returnFocus: () => target,
          onUpdateOpen: (v) => (open.value = v),
          onClose: () => log.push("close"),
          onOpened: () => log.push(`opened:${(document.activeElement as HTMLElement).className}`),
          onClosed: () => log.push(`closed:${document.activeElement === target}`),
        });
        return () =>
          h(Transition, { ...subtreeTransition, onAfterLeave: overlay.onAfterLeave }, () =>
            overlay.mounted.value
              ? withDirectives(
                  h("div", { ref: dialogRef, tabindex: -1 }, [h("button", { class: "first" }), h("button", { class: "second" })]),
                  [[vShow, overlay.isVisible.value]],
                )
              : null,
          );
      },
    });
    w = mount(Dialog, { attachTo: document.body });
    open.value = true;
    await vi.advanceTimersByTimeAsync(50);
    open.value = false;
    await vi.advanceTimersByTimeAsync(50);
    expect(log).toEqual(["opened:second", "close", "closed:true"]);
    opener.remove();
    target.remove();
  });
});

describe("useOverlay focus trap", () => {
  it("sends Shift+Tab from the dialog itself, where it opens, to the last control", async () => {
    const { dialog } = await mountDialog();
    dialog().focus();
    const e = tab(true);
    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement?.textContent).toBe("Two");
  });

  it("wraps Tab from the last control to the first", async () => {
    const { dialog } = await mountDialog();
    (dialog().querySelectorAll("button")[1] as HTMLElement).focus();
    tab();
    expect(document.activeElement?.textContent).toBe("One");
  });

  it("keeps focus on a dialog with nothing focusable", async () => {
    const { dialog } = await mountDialog(() => [h("p", "Just text")]);
    dialog().focus();
    expect(tab().defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(dialog());
  });

  it("skips disabled and hidden controls at the ends", async () => {
    const { dialog } = await mountDialog(() => [
      h("button", "One"),
      h("button", "Two"),
      h("button", { disabled: true }, "Off"),
      h("button", { hidden: true }, "Hidden"),
    ]);
    (dialog().querySelectorAll("button")[1] as HTMLElement).focus();
    expect(tab().defaultPrevented, "Two is the last that Tab reaches").toBe(true);
    expect(document.activeElement?.textContent).toBe("One");
  });
});
