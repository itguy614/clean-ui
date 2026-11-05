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
    w = mount(CuiToast, { props: { title: "Saved", autoDismiss: 1000, active: true }, attachTo: document.body });
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
    w = mount(CuiToast, { props: { title: "Saved", autoDismiss: 1000, active: true }, attachTo: document.body });
    const root = w.find(".cui-toast");
    await root.trigger("focusin");
    await root.trigger("focusout", { relatedTarget: w.find(".cui-toast__dismiss").element });
    vi.advanceTimersByTime(3000);
    expect(w.emitted("dismiss")).toBeUndefined();
  });
});

/**
 * #345 — each pause can be turned off, so a toast with a genuinely essential time limit (a
 * server-side undo window) can't outlive it; with all three off, autoDismiss is a deadline.
 */
describe("CuiToast pause opt-outs", () => {
  const base = { title: "Undo?", autoDismiss: 1000 };

  it("pauses on hover by default, and not with pauseOnHover: false", async () => {
    vi.useFakeTimers();
    w = mount(CuiToast, { props: { ...base, active: true }, attachTo: document.body });
    await w.find(".cui-toast").trigger("mouseenter");
    vi.advanceTimersByTime(2000);
    expect(w.emitted("dismiss"), "paused by default").toBeUndefined();
    w.unmount();

    w = mount(CuiToast, { props: { ...base, active: true, pauseOnHover: false }, attachTo: document.body });
    await w.find(".cui-toast").trigger("mouseenter");
    vi.advanceTimersByTime(1100);
    expect(w.emitted("dismiss")).toHaveLength(1);
  });

  it("doesn't pause on focus with pauseOnFocus: false", async () => {
    vi.useFakeTimers();
    w = mount(CuiToast, { props: { ...base, active: true, pauseOnFocus: false }, attachTo: document.body });
    await w.find(".cui-toast").trigger("focusin");
    vi.advanceTimersByTime(1100);
    expect(w.emitted("dismiss")).toHaveLength(1);
  });

  it("waits while inactive by default, and counts down with pauseWhenInactive: false", async () => {
    vi.useFakeTimers();
    w = mount(CuiToast, { props: { ...base, active: false }, attachTo: document.body });
    vi.advanceTimersByTime(2000);
    expect(w.emitted("dismiss"), "waits behind the topmost toast").toBeUndefined();
    expect(w.find(".cui-toast__progress").exists(), "no bar while waiting").toBe(false);
    w.unmount();

    w = mount(CuiToast, { props: { ...base, active: false, pauseWhenInactive: false }, attachTo: document.body });
    expect(w.find(".cui-toast__progress").exists(), "its bar runs too").toBe(true);
    vi.advanceTimersByTime(1100);
    expect(w.emitted("dismiss")).toHaveLength(1);
  });

  it("is a wall-clock deadline with all three off: hovered, focused and inactive", async () => {
    vi.useFakeTimers();
    w = mount(CuiToast, {
      props: { ...base, active: false, pauseOnHover: false, pauseOnFocus: false, pauseWhenInactive: false },
      attachTo: document.body,
    });
    const root = w.find(".cui-toast");
    await root.trigger("mouseenter");
    await root.trigger("focusin");
    vi.advanceTimersByTime(950);
    expect(w.emitted("dismiss")).toBeUndefined();
    vi.advanceTimersByTime(100);
    expect(w.emitted("dismiss")).toHaveLength(1);
  });

  it("loses no time to a pause: it resumes with exactly what was left", async () => {
    vi.useFakeTimers();
    w = mount(CuiToast, { props: { ...base, active: true }, attachTo: document.body });
    const root = w.find(".cui-toast");
    vi.advanceTimersByTime(430);
    await root.trigger("mouseenter");
    vi.advanceTimersByTime(5000);
    await root.trigger("mouseleave");
    vi.advanceTimersByTime(560);
    expect(w.emitted("dismiss"), "570ms were left").toBeUndefined();
    vi.advanceTimersByTime(10);
    expect(w.emitted("dismiss")).toHaveLength(1);
  });

  it("dismisses once: a hover after it has gone doesn't re-arm the countdown", async () => {
    vi.useFakeTimers();
    w = mount(CuiToast, { props: { ...base, active: true }, attachTo: document.body });
    vi.advanceTimersByTime(1000);
    const root = w.find(".cui-toast");
    await root.trigger("mouseenter");
    await root.trigger("mouseleave");
    vi.advanceTimersByTime(1000);
    expect(w.emitted("dismiss")).toHaveLength(1);
  });

  it("follows a change to autoDismiss", async () => {
    vi.useFakeTimers();
    w = mount(CuiToast, { props: { ...base, autoDismiss: 0, active: true }, attachTo: document.body });
    await w.setProps({ autoDismiss: 500 });
    vi.advanceTimersByTime(510);
    expect(w.emitted("dismiss")).toHaveLength(1);
  });
});
