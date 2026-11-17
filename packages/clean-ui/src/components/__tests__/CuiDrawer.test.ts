import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import CuiDrawer from "../CuiDrawer.vue";

// Timers are faked so the open's requestAnimationFrame/nextTick steps are deterministic.
describe("CuiDrawer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.style.overflow = "";
  });

  const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]');

  it("renders nothing while closed", () => {
    const w = mount(CuiDrawer, { props: { visible: false } });
    expect(dialog()).toBeNull();
    w.unmount();
  });

  it("teleports a labelled modal dialog to the body when opened", async () => {
    const w = mount(CuiDrawer, { props: { visible: false, title: "Share" }, slots: { default: "Body text" } });
    await w.setProps({ visible: true });
    await vi.runAllTimersAsync();
    const el = dialog()!;
    expect(el).not.toBeNull();
    expect(el.getAttribute("aria-modal")).toBe("true");
    expect(el.classList.contains("cui-drawer__panel")).toBe(true);
    // Named by its title: the id it points at exists.
    const labelledby = el.getAttribute("aria-labelledby")!;
    expect(document.getElementById(labelledby)?.textContent).toContain("Share");
    expect(el.textContent).toContain("Body text");
    w.unmount();
  });

  it("puts a class and an aria-label from the consumer on the panel", async () => {
    const w = mount(CuiDrawer, { props: { visible: true }, attrs: { class: "mine", "aria-label": "Confirm" } });
    await vi.runAllTimersAsync();
    expect(dialog()!.classList.contains("mine")).toBe(true);
    expect(dialog()!.getAttribute("aria-label")).toBe("Confirm");
    w.unmount();
  });

  it("closes from the X button, reporting update:visible and close", async () => {
    const w = mount(CuiDrawer, { props: { visible: true, title: "Share" } });
    await vi.runAllTimersAsync();
    document.body.querySelector<HTMLButtonElement>(".cui-modal-header__close")!.click();
    await vi.runAllTimersAsync();
    expect(w.emitted("update:visible")?.at(-1)).toEqual([false]);
    expect(w.emitted("close")).toHaveLength(1);
    expect(dialog()).toBeNull();
    w.unmount();
  });

  it("closes on Escape, unless persistent", async () => {
    const w = mount(CuiDrawer, { props: { visible: true, persistent: true } });
    await vi.runAllTimersAsync();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await vi.runAllTimersAsync();
    expect(w.emitted("close")).toBeUndefined();
    await w.setProps({ persistent: false });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await vi.runAllTimersAsync();
    expect(w.emitted("close")).toHaveLength(1);
    w.unmount();
  });

  it("renders the grab handle as decorative, and omits it with noHandle", async () => {
    const w = mount(CuiDrawer, { props: { visible: true, title: "x" } });
    await vi.runAllTimersAsync();
    const handle = document.body.querySelector(".cui-drawer__handle")!;
    expect(handle.getAttribute("aria-hidden")).toBe("true");
    await w.setProps({ noHandle: true });
    expect(document.body.querySelector(".cui-drawer__handle")).toBeNull();
    w.unmount();
  });

  it("sizes the panel to its tallest snap point and rests at the first listed", async () => {
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);
    const w = mount(CuiDrawer, { props: { visible: true, title: "x", snapPoints: [0.25, 1] } });
    await vi.runAllTimersAsync();
    const style = dialog()!.style;
    expect(style.getPropertyValue("--_drawer-height")).toBe("800px");
    // Opens at 0.25: 200px of 800 showing, so 600 down.
    expect(style.getPropertyValue("--_drawer-snap-offset")).toBe("600px");
    await w.setProps({ activeSnapPoint: 1 });
    expect(dialog()!.style.getPropertyValue("--_drawer-snap-offset")).toBe("0px");
    w.unmount();
    vi.restoreAllMocks();
  });

  it("reads px and fraction snap points", async () => {
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(1000);
    const w = mount(CuiDrawer, { props: { visible: true, title: "x", snapPoints: ["300px", 500] } });
    await vi.runAllTimersAsync();
    // Tallest is 500; the first listed (300px) shows 300, so 200 down.
    expect(dialog()!.style.getPropertyValue("--_drawer-height")).toBe("500px");
    expect(dialog()!.style.getPropertyValue("--_drawer-snap-offset")).toBe("200px");
    w.unmount();
    vi.restoreAllMocks();
  });

  it("has no snap variables without snap points", async () => {
    const w = mount(CuiDrawer, { props: { visible: true, title: "x" } });
    await vi.runAllTimersAsync();
    expect(dialog()!.getAttribute("style") ?? "").not.toContain("--_drawer-snap-offset");
    w.unmount();
  });
});

describe("CuiDrawer's motion", () => {
  const css = readFileSync(resolve(__dirname, "../CuiDrawer.vue"), "utf8");

  it("opens over twice the slow token on the drawer curve: the documented exception to the 300ms ceiling (#268)", () => {
    expect(css).toMatch(/\.cui-drawer__panel--visible\s*\{[^}]*transition-duration:\s*calc\(var\(--cui-duration-slow\)\s*\*\s*2\)/);
    expect(css).toMatch(/transition:\s*transform var\(--cui-duration-fast\) var\(--cui-ease-drawer\)/);
  });

  it("transitions only transform, and stops the transition while a drag writes the transform itself", () => {
    expect(css).not.toMatch(/transition:[^;]*\ball\b/);
    // The drag sets transition: none inline; nothing in the stylesheet may out-rank that.
    expect(css).not.toMatch(/transition[^;]*!important/);
  });
});
