import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import CuiModal from "../CuiModal.vue";
import CuiSlideover from "../CuiSlideover.vue";
import { __clearWarned } from "../../utils/devWarn";

// The overlay close path defers update:visible behind a 200ms exit animation,
// so the whole suite runs on fake timers for determinism.
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  document.body.style.overflow = "";
});

describe("CuiModal", () => {
  it("does not render the dialog when visible is false", () => {
    const wrapper = mount(CuiModal, { props: { visible: false } });
    expect(document.body.querySelector(".cui-modal")).toBeNull();
    wrapper.unmount();
  });

  it("renders the teleported dialog with the title when visible", async () => {
    const wrapper = mount(CuiModal, {
      props: { visible: true, title: "Confirm action" },
    });
    await vi.runOnlyPendingTimersAsync();

    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(document.body.textContent).toContain("Confirm action");
    wrapper.unmount();
  });

  it("toggling visible to false emits update:visible=false after the exit animation", async () => {
    const wrapper = mount(CuiModal, { props: { visible: true } });
    await vi.runOnlyPendingTimersAsync();
    expect(document.body.querySelector(".cui-modal")).not.toBeNull();

    await wrapper.setProps({ visible: false });
    await vi.runOnlyPendingTimersAsync();

    expect(wrapper.emitted("update:visible")?.at(-1)).toEqual([false]);
    expect(document.body.querySelector(".cui-modal")).toBeNull();
    wrapper.unmount();
  });

  it("clicking the header close button requests close (update:visible=false + close)", async () => {
    const wrapper = mount(CuiModal, { props: { visible: true, title: "Hi" } });
    await vi.runOnlyPendingTimersAsync();

    const closeBtn = document.body.querySelector<HTMLButtonElement>(
      ".cui-modal-overlay button",
    );
    expect(closeBtn).not.toBeNull();
    closeBtn!.click();
    await vi.runOnlyPendingTimersAsync();

    expect(wrapper.emitted("update:visible")?.at(-1)).toEqual([false]);
    expect(wrapper.emitted("close")).toBeTruthy();
    wrapper.unmount();
  });

  it("clicking the backdrop emits update:visible=false", async () => {
    const wrapper = mount(CuiModal, { props: { visible: true } });
    await vi.runOnlyPendingTimersAsync();

    const backdrop = document.body.querySelector<HTMLElement>(".cui-backdrop");
    expect(backdrop).not.toBeNull();
    backdrop!.click();
    await vi.runOnlyPendingTimersAsync();

    expect(wrapper.emitted("update:visible")?.at(-1)).toEqual([false]);
    wrapper.unmount();
  });

  it("pressing Escape emits update:visible=false", async () => {
    const wrapper = mount(CuiModal, { props: { visible: true } });
    await vi.runOnlyPendingTimersAsync();

    const overlay = document.body.querySelector<HTMLElement>(".cui-modal-overlay");
    expect(overlay).not.toBeNull();
    overlay!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await vi.runOnlyPendingTimersAsync();

    expect(wrapper.emitted("update:visible")?.at(-1)).toEqual([false]);
    wrapper.unmount();
  });

  it("locks body scroll while open and releases it on close", async () => {
    const wrapper = mount(CuiModal, { props: { visible: true } });
    await vi.runOnlyPendingTimersAsync();
    expect(document.body.style.overflow).toBe("hidden");

    await wrapper.setProps({ visible: false });
    await vi.runOnlyPendingTimersAsync();
    expect(document.body.style.overflow).toBe("");
    wrapper.unmount();
  });

  it("releases the lock when unmounted while still open", async () => {
    const wrapper = mount(CuiModal, { props: { visible: true } });
    await vi.runOnlyPendingTimersAsync();
    expect(document.body.style.overflow).toBe("hidden");

    wrapper.unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("keeps the lock until the last of two stacked overlays closes", async () => {
    const first = mount(CuiModal, { props: { visible: true } });
    const second = mount(CuiModal, { props: { visible: true } });
    await vi.runOnlyPendingTimersAsync();
    expect(document.body.style.overflow).toBe("hidden");

    await second.setProps({ visible: false });
    await vi.runOnlyPendingTimersAsync();
    // the first modal is still open — the page must stay locked
    expect(document.body.style.overflow).toBe("hidden");

    await first.setProps({ visible: false });
    await vi.runOnlyPendingTimersAsync();
    expect(document.body.style.overflow).toBe("");

    first.unmount();
    second.unmount();
  });

  // #285 — overlays stack: opening one never closes another. `allowNested` never did anything
  // (it only cleared a set nothing read); it is deprecated and warns.
  it("leaves the first modal open when a second opens on top", async () => {
    const first = mount(CuiModal, { props: { visible: true, title: "First" }, attachTo: document.body });
    const second = mount(CuiModal, { props: { visible: true, title: "Second" }, attachTo: document.body });
    await vi.runOnlyPendingTimersAsync();
    expect(first.emitted("update:visible")).toBeUndefined();
    expect(document.querySelectorAll(".cui-modal")).toHaveLength(2);
    first.unmount();
    second.unmount();
  });

  it.each([
    ["CuiModal", CuiModal],
    ["CuiSlideover", CuiSlideover],
  ])("%s warns that allowNested is deprecated only when it is passed", (_name, component) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const allowNestedWarnings = () => warn.mock.calls.filter((c) => String(c[0]).includes("allowNested")).length;
    __clearWarned();
    mount(component as never, { props: { visible: false } }).unmount();
    expect(allowNestedWarnings()).toBe(0); // absent: silent, not Vue's boolean `false`
    mount(component as never, { props: { visible: false, allowNested: true } }).unmount();
    expect(allowNestedWarnings()).toBe(1);
    warn.mockRestore();
  });

  it("persistent blocks Escape and backdrop close", async () => {
    const wrapper = mount(CuiModal, { props: { visible: true, persistent: true } });
    await vi.runOnlyPendingTimersAsync();

    document.body
      .querySelector<HTMLElement>(".cui-modal-overlay")!
      .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    document.body.querySelector<HTMLElement>(".cui-backdrop")!.click();
    await vi.runOnlyPendingTimersAsync();

    expect(wrapper.emitted("update:visible")).toBeFalsy();
    expect(document.body.querySelector(".cui-modal")).not.toBeNull();
    wrapper.unmount();
  });
});
