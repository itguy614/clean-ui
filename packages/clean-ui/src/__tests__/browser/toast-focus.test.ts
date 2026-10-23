import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { defineComponent, h, nextTick } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "./helpers";
import CuiToastProvider from "../../components/CuiToastProvider.vue";
import { useToast } from "../../composables/useToast";

/**
 * #344 — removing a toast that held focus (dismissed, timed out or pushed out by maxToasts)
 * dropped focus to <body>, so the next Tab started over from the top of the page (WCAG
 * 2.4.3). Focus now moves to the next toast, or the one before, or back to where it was.
 * Real browser: it happens on the TransitionGroup's leave, which jsdom's stub never runs.
 */
describe("toast focus when a toast goes (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => (removeTokens = installTokens(main)));
  afterAll(() => removeTokens());

  let w: VueWrapper | undefined;
  let api: ReturnType<typeof useToast>;
  afterEach(() => {
    w?.unmount();
    w = undefined;
  });

  function mountStack(props: Record<string, unknown> = {}) {
    const Grab = defineComponent({ setup: () => ((api = useToast()), () => h("button", { id: "opener" }, "Open")) });
    w = mount({ render: () => h(CuiToastProvider, props, () => h(Grab)) }, { attachTo: document.body });
    return document.getElementById("opener") as HTMLButtonElement;
  }
  const dismissOf = (title: string) =>
    [...document.querySelectorAll<HTMLElement>(".cui-toast-wrapper")]
      .find((t) => t.textContent?.includes(title) && !t.classList.contains("cui-toast-leave-active"))!
      .querySelector<HTMLButtonElement>(".cui-toast__dismiss")!;

  it("moves focus to the next toast when the focused one is dismissed, then back to the opener", async () => {
    const opener = mountStack();
    opener.focus();
    api.toast({ title: "One", autoDismiss: 0 });
    api.toast({ title: "Two", autoDismiss: 0 });
    await nextTick();
    await userEvent.tab(); // from the opener into the stack
    const first = document.activeElement as HTMLElement;
    expect(first.classList.contains("cui-toast__dismiss")).toBe(true);
    await userEvent.keyboard("{Enter}");
    await nextTick();
    expect(document.activeElement?.classList.contains("cui-toast__dismiss"), "on the toast that's left").toBe(true);
    expect(document.activeElement).not.toBe(first);

    await userEvent.keyboard("{Enter}");
    await nextTick();
    expect(document.activeElement, "back to the opener, not <body>").toBe(opener);
  });

  it("moves focus on when a focused toast is dismissed in code", async () => {
    const opener = mountStack();
    opener.focus();
    api.toast({ title: "Stays", autoDismiss: 0 });
    const id = api.toast({ title: "Goes", autoDismiss: 0 });
    await nextTick();
    dismissOf("Goes").focus();
    api.dismiss(id);
    await nextTick();
    expect(document.activeElement).toBe(dismissOf("Stays"));
  });

  it("leaves focus alone when it isn't in the toast that goes", async () => {
    const opener = mountStack();
    opener.focus();
    const id = api.toast({ title: "One", autoDismiss: 0 });
    await nextTick();
    api.dismiss(id);
    await nextTick();
    expect(document.activeElement).toBe(opener);
  });

  it("moves focus on when a focused toast is pushed out by maxToasts", async () => {
    const opener = mountStack({ maxToasts: 2 });
    opener.focus();
    api.toast({ title: "Oldest", autoDismiss: 0 });
    api.toast({ title: "Middle", autoDismiss: 0 });
    await nextTick();
    dismissOf("Oldest").focus();
    api.toast({ title: "Newest", autoDismiss: 0 });
    await nextTick();
    expect(document.activeElement).toBe(dismissOf("Middle"));
  });

  it("goes back to the opener when every toast is cleared at once", async () => {
    const opener = mountStack();
    opener.focus();
    for (const title of ["One", "Two", "Three"]) api.toast({ title, autoDismiss: 0 });
    await nextTick();
    await userEvent.tab();
    api.dismissAll();
    await nextTick();
    expect(document.activeElement).toBe(opener);
  });
});
