import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import CuiModal from "../CuiModal.vue";

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
