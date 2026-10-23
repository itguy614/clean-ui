import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiToast from "../CuiToast.vue";

/**
 * #344 — a toast paused its countdown on hover only, so a keyboard user on its dismiss
 * button could lose it mid-read (WCAG 2.2.1), and removing a focused toast dropped focus to
 * <body> (WCAG 2.4.3); that half is a browser test, toast-focus.test.ts, since it runs on the
 * TransitionGroup's leave.
 */
let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("CuiToast countdown", () => {
  it("pauses while focus is in the toast, and resumes when it leaves", async () => {
    vi.useFakeTimers();
    w = mount(CuiToast, { props: { toastId: "t", title: "Saved", autoDismiss: 1000, active: true }, attachTo: document.body });
    const dismiss = w.find(".cui-toast__dismiss");
    await w.find(".cui-toast").trigger("focusin");
    vi.advanceTimersByTime(3000);
    expect(w.emitted("dismiss"), "not while focused").toBeUndefined();
    await w.find(".cui-toast").trigger("focusout", { relatedTarget: document.body });
    vi.advanceTimersByTime(1100);
    expect(w.emitted("dismiss")).toHaveLength(1);
    expect(dismiss.exists()).toBe(true);
  });

  it("stays paused while focus moves between the toast's own buttons", async () => {
    vi.useFakeTimers();
    w = mount(CuiToast, { props: { toastId: "t", title: "Saved", autoDismiss: 1000, active: true }, attachTo: document.body });
    const root = w.find(".cui-toast");
    await root.trigger("focusin");
    await root.trigger("focusout", { relatedTarget: w.find(".cui-toast__dismiss").element });
    vi.advanceTimersByTime(3000);
    expect(w.emitted("dismiss")).toBeUndefined();
  });
});
