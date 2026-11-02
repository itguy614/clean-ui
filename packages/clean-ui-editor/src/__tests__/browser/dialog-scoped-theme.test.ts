import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiMarkdownEditor from "../../components/CuiMarkdownEditor.vue";
import { linkPlugin } from "../../plugins/builtin/link";
import { frames, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #399 — the link and image dialogs mount as their own app on `document.body`, and their
 * CuiModal teleports there too, so a scoped theme around the editor never reached them:
 * `<div class="cui-theme-violet">` gave a violet editor and a navy dialog. The dialog now
 * takes the editor's nearest `cui-theme-*` class, and a scoped `dark`.
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

  /** `--cui-primary` and `--cui-surface-base` as resolved on an element with `className`,
   * where nothing but the page itself sits above it. */
  function tokensUnder(className: string) {
    const probe = document.createElement("div");
    probe.className = className;
    document.body.append(probe);
    const s = getComputedStyle(probe);
    const tokens = { primary: s.getPropertyValue("--cui-primary"), surface: s.getPropertyValue("--cui-surface-base") };
    probe.remove();
    return tokens;
  }

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

  function tokensOn(el: HTMLElement) {
    const s = getComputedStyle(el);
    return { primary: s.getPropertyValue("--cui-primary"), surface: s.getPropertyValue("--cui-surface-base") };
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
    expect(panel.className).not.toMatch(/cui-theme-/);
    expect(tokensOn(panel).primary).toBe(violet.primary);
  });
});
