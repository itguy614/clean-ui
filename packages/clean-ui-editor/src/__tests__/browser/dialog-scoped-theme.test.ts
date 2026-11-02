import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiMarkdownEditor from "../../components/CuiMarkdownEditor.vue";
import { linkPlugin } from "../../plugins/builtin/link";
import {
  frames,
  mountHosts,
  themeTokensOn as tokensOn,
  themeTokensUnder as tokensUnder,
} from "../../../../../config/test/browser-helpers";

/**
 * #399 — the link and image dialogs mount as their own app on `document.body`, and their
 * CuiModal teleports there too, so a scoped theme around the editor never reached them:
 * `<div class="cui-theme-violet">` gave a violet editor and a navy dialog. The dialog now
 * takes the editor's nearest `cui-theme-*` class, and a scoped `dark`: since #418 through
 * clean-ui's own teleport scope, which `context.cleanUI` hands on to the dialog's app, and
 * live rather than as a snapshot taken at mount.
 *
 * Real browser: what is measured is the token the cascade resolves on the dialog panel.
 */
describe("a plugin dialog in a scoped theme (real browser)", () => {
  const fixtures = mountHosts();
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    fixtures.cleanup();
    cleanups.splice(0).forEach((c) => c());
  });

  /** Opens the link dialog of an editor nested in one element per class, outermost first,
   * and returns the dialog panel. */
  async function openLinkDialog(...classes: string[]): Promise<HTMLElement> {
    const host = fixtures.host();
    let parent = host;
    for (const name of classes) {
      const el = document.createElement("div");
      el.className = name;
      parent = parent.appendChild(el);
    }
    const wrapper: VueWrapper = fixtures.track(
      mount(CuiMarkdownEditor, { props: { modelValue: "", plugins: [linkPlugin] }, attachTo: parent }),
    );
    await frames(2);
    (wrapper.vm as unknown as { runCommand: (id: string) => boolean }).runCommand("link");
    await frames(2);
    const panel = document.querySelector<HTMLElement>(".cui-url-dialog");
    if (!panel) throw new Error("the link dialog did not open");
    // It belongs to no host, so it must be closed with the editor.
    expect(host.contains(panel)).toBe(false);
    return panel;
  }

  it("draws the dialog in the violet theme around the editor", async () => {
    const violet = tokensUnder("cui-theme-violet");
    // Precondition: violet is not what the page would give it anyway.
    expect(violet.primary).not.toBe(tokensUnder("").primary);

    const panel = await openLinkDialog("cui-theme-violet");
    expect(tokensOn(panel).primary).toBe(violet.primary);
  });

  it("draws the dialog dark under a scoped dark class", async () => {
    const dark = tokensUnder("dark");
    expect(dark.surface).not.toBe(tokensUnder("").surface);

    const panel = await openLinkDialog("dark");
    expect(tokensOn(panel).surface).toBe(dark.surface);
  });

  it("combines a scoped theme with a scoped dark class further out", async () => {
    const panel = await openLinkDialog("dark", "cui-theme-violet");
    const expected = tokensUnder("dark cui-theme-violet");
    expect(expected.primary).not.toBe(tokensUnder("cui-theme-violet").primary);
    expect(tokensOn(panel)).toEqual(expected);
  });

  it("copies nothing for a theme on <html>, which already reaches the dialog", async () => {
    const root = document.documentElement;
    root.classList.add("cui-theme-violet");
    cleanups.push(() => root.classList.remove("cui-theme-violet"));
    const violet = tokensUnder("");

    const panel = await openLinkDialog();
    expect(panel.closest(".cui-modal-overlay")!.className).not.toMatch(/cui-theme-/);
    expect(tokensOn(panel).primary).toBe(violet.primary);
  });

  it("follows a theme changed around the editor while the dialog is open", async () => {
    const panel = await openLinkDialog("cui-theme-violet");
    const scope = document.querySelector(".cui-theme-violet")!;
    scope.classList.replace("cui-theme-violet", "cui-theme-forest");
    await frames(1);
    const forest = tokensUnder("cui-theme-forest");
    expect(forest.primary).not.toBe(tokensUnder("cui-theme-violet").primary);
    expect(tokensOn(panel).primary).toBe(forest.primary);
  });
});
