import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { defineComponent, h, nextTick } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import { motionDuration } from "../../utils/motion";
import CuiToastProvider from "../../components/CuiToastProvider.vue";
import { useToast } from "../../composables/useToast";

/**
 * #345 — action toasts through useToast(). Real browser for what jsdom can't show: a
 * collapsed toast's action clipped out of sight while focused, a real hover, real time.
 */
describe("toast actions (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => (removeTokens = installTokens(main)));
  afterAll(() => removeTokens());

  let w: VueWrapper | undefined;
  let api: ReturnType<typeof useToast>;
  afterEach(() => {
    w?.unmount();
    w = undefined;
  });

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  function mountStack(props: Record<string, unknown> = {}) {
    const Grab = defineComponent({ setup: () => ((api = useToast()), () => h("button", { id: "opener" }, "Open")) });
    w = mount({ render: () => h(CuiToastProvider, props, () => h(Grab)) }, { attachTo: document.body });
    return document.getElementById("opener") as HTMLButtonElement;
  }
  const toastOf = (title: string) =>
    [...document.querySelectorAll<HTMLElement>(".cui-toast-wrapper")].find(
      (t) => t.textContent?.includes(title) && !t.classList.contains("cui-toast-leave-active"),
    );

  it("unclips a collapsed toast while focus is in it, so its action is visible", async () => {
    const opener = mountStack({ stackMode: "collapsed", position: "top-right" });
    api.toast({
      title: "Upload failed",
      description: "The file could not be uploaded. Please try again.",
      autoDismiss: 0,
      action: { label: "Retry", onClick: () => {}, dismissOnClick: false },
    });
    api.toast({ title: "Newer", autoDismiss: 0 });
    await nextTick();
    await wait(motionDuration("slow") + 100);

    const older = toastOf("Upload failed")!;
    const peek = older.querySelector<HTMLElement>(".cui-toast-wrapper__peek")!;
    const action = older.querySelector<HTMLButtonElement>(".cui-toast-action")!;
    expect(older.classList.contains("cui-toast-wrapper--collapsed")).toBe(true);
    // Overflow, not the button's rect: focusing it scrolls the clipping peek to bring it in.
    const clipped = () => peek.scrollHeight > peek.clientHeight + 0.5;
    expect(clipped(), "the peek clips the action while collapsed").toBe(true);

    opener.focus();
    await userEvent.tab(); // the collapsed toast comes first in the DOM: its action
    expect(document.activeElement).toBe(action);
    await wait(motionDuration("slow") + 100);
    expect(clipped(), "focused: the whole toast shows").toBe(false);
    expect(getComputedStyle(peek).opacity).toBe("1");

    await userEvent.keyboard("{Enter}");
    await nextTick();
    expect(toastOf("Upload failed"), "dismissOnClick: false keeps it").toBeDefined();
  });

  it("an inactive, hovered, focused toast with every pause off goes on time", async () => {
    mountStack({ position: "top-right" });
    api.toast({
      title: "Undo window",
      autoDismiss: 1000,
      pauseOnHover: false,
      pauseOnFocus: false,
      pauseWhenInactive: false,
      action: { label: "Undo", onClick: () => {} },
    });
    const raisedAt = performance.now();
    const until = (t: number) => wait(Math.max(0, raisedAt + t - performance.now()));
    api.toast({ title: "On top", autoDismiss: 0 });
    await nextTick();
    const undo = toastOf("Undo window")!;
    await userEvent.hover(undo.querySelector(".cui-toast")!);
    undo.querySelector<HTMLButtonElement>(".cui-toast-action")!.focus();
    await until(700);
    expect(toastOf("Undo window"), "still inside its window").toBeDefined();
    await until(1300);
    expect(toastOf("Undo window"), "gone at its deadline").toBeUndefined();
  });

  it("the same toast with the default pauses waits while hovered", async () => {
    mountStack({ position: "top-right" });
    api.toast({ title: "Saved", autoDismiss: 400, action: { label: "View", onClick: () => {} } });
    await nextTick();
    await userEvent.hover(toastOf("Saved")!.querySelector(".cui-toast")!);
    await wait(600);
    expect(toastOf("Saved")).toBeDefined();
  });
});
