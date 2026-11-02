import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, flushPromises, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import CuiToastProvider from "../CuiToastProvider.vue";
import { useToast } from "../../composables/useToast";

/**
 * #345 — a toast raised through useToast() had no way to carry a button ("Undo", "Retry"),
 * so consumers rebuilt the provider by hand to get one.
 */
let w: VueWrapper | undefined;
let api: ReturnType<typeof useToast>;
afterEach(() => {
  w?.unmount();
  w = undefined;
  vi.useRealTimers();
  document.body.innerHTML = "";
});

function mountProvider(props: Record<string, unknown> = {}) {
  const Grab = defineComponent({ setup: () => ((api = useToast()), () => null) });
  w = mount({ render: () => h(CuiToastProvider, props, () => h(Grab)) }, { attachTo: document.body });
}
/** Toasts still in the stack, not ones playing their leave. */
const staying = () =>
  [...document.querySelectorAll<HTMLElement>(".cui-toast-wrapper")].filter((t) => !t.classList.contains("cui-toast-leave-active"));
const actionButton = () => document.querySelector<HTMLButtonElement>(".cui-toast-action");
const settle = async () => {
  await nextTick();
  await flushPromises();
};

describe("CuiToastProvider action", () => {
  it("renders the action as a <button> inside the toast's live region", async () => {
    mountProvider();
    api.toast({ title: "Switched to Design", action: { label: "Undo", onClick: () => {} } });
    await nextTick();
    const button = actionButton()!;
    expect(button.tagName).toBe("BUTTON");
    expect(button.textContent?.trim()).toBe("Undo");
    expect(button.closest('[role="status"]')).not.toBeNull();
  });

  it("is accepted by the colour helpers, and an error toast keeps role=alert", async () => {
    mountProvider();
    api.toast.error("Upload failed", { action: { label: "Retry", onClick: () => {} } });
    await nextTick();
    expect(actionButton()!.closest('[role="alert"]')).not.toBeNull();
  });

  it("is a small ghost button by default, never a solid fill on a subtle toast", async () => {
    mountProvider();
    api.toast.success("Saved", { action: { label: "View", onClick: () => {} } });
    await nextTick();
    const button = actionButton()!;
    expect(button.classList.contains("cui-button--ghost")).toBe(true);
    expect(button.style.getPropertyValue("--_button-color")).toBe("var(--cui-success)");
  });

  it("matches a solid toast's own fill, so its text stays the toast's text colour", async () => {
    mountProvider();
    api.toast.success("Saved", { variant: "solid", action: { label: "View", onClick: () => {} } });
    await nextTick();
    expect(actionButton()!.style.getPropertyValue("--_button-color")).toBe("var(--cui-success-text)");
  });

  it("renders no action area without an action", async () => {
    mountProvider();
    api.toast({ title: "Saved" });
    await nextTick();
    expect(document.querySelector(".cui-toast__actions")).toBeNull();
  });

  it("runs onClick and dismisses the toast by default", async () => {
    mountProvider();
    const onClick = vi.fn();
    api.toast({ title: "Deleted", autoDismiss: 0, action: { label: "Undo", onClick } });
    await nextTick();
    actionButton()!.click();
    await settle();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(staying()).toHaveLength(0);
  });

  it("leaves the toast open with dismissOnClick: false", async () => {
    mountProvider();
    const onClick = vi.fn();
    api.toast({ title: "Upload failed", autoDismiss: 0, action: { label: "Retry", onClick, dismissOnClick: false } });
    await nextTick();
    actionButton()!.click();
    await settle();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(staying()).toHaveLength(1);
  });

  it("passes the pause options through to the toast", async () => {
    vi.useFakeTimers();
    mountProvider();
    api.toast({ title: "Undo window", autoDismiss: 1000, pauseOnHover: false });
    await nextTick();
    document.querySelector(".cui-toast")!.dispatchEvent(new MouseEvent("mouseenter"));
    await nextTick();
    vi.advanceTimersByTime(1100);
    await nextTick();
    expect(staying()).toHaveLength(0);
  });
});

describe("CuiToastProvider action in stackMode=collapsed", () => {
  it("an action click on a collapsed toast isn't taken as the wrapper's dismiss click", async () => {
    mountProvider({ stackMode: "collapsed" });
    const onClick = vi.fn();
    api.toast({ title: "Upload failed", autoDismiss: 0, action: { label: "Retry", onClick, dismissOnClick: false } });
    api.toast({ title: "Newer", autoDismiss: 0 });
    await nextTick();
    expect(staying()[0].classList.contains("cui-toast-wrapper--collapsed")).toBe(true);
    actionButton()!.click();
    await settle();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(staying(), "both toasts still there").toHaveLength(2);
  });

  it("a click elsewhere on a collapsed toast still dismisses it", async () => {
    mountProvider({ stackMode: "collapsed" });
    api.toast({ title: "Older", autoDismiss: 0, action: { label: "Retry", onClick: () => {}, dismissOnClick: false } });
    api.toast({ title: "Newer", autoDismiss: 0 });
    await nextTick();
    staying()[0].querySelector<HTMLElement>(".cui-toast__title")!.click();
    await settle();
    expect(staying()).toHaveLength(1);
    expect(staying()[0].textContent).toContain("Newer");
  });
});
