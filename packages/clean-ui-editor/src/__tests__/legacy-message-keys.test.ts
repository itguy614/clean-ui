import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defaultMarkdownEditorMessages } from "../messages";

// The once-per-key memory is module state, so each test loads a fresh copy of the module.
async function load() {
  vi.resetModules();
  return (await import("../messages")).mergeMarkdownEditorMessages;
}

const LEGACY = {
  linkDialogCancel: "urlDialogCancel",
  imageDialogCancel: "urlDialogCancel",
  linkDialogInsert: "urlDialogInsert",
  imageDialogInsert: "urlDialogInsert",
  linkDialogUrlRequired: "urlDialogUrlRequired",
  imageDialogUrlRequired: "urlDialogUrlRequired",
  linkDialogUrlSchemeNotAllowed: "urlDialogUrlSchemeNotAllowed",
  imageDialogUrlSchemeNotAllowed: "urlDialogUrlSchemeNotAllowed",
} as const;

describe("legacy dialog message keys (#398)", () => {
  const originalEnv = process.env.NODE_ENV;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    warn.mockRestore();
  });

  it.each(Object.entries(LEGACY))("warns in development about %s, naming %s", async (removed, replacement) => {
    const merge = await load();
    // A removed key is a type error; a JS or loosely typed consumer can still pass it.
    const merged = merge({ [removed]: "Annuler" } as never);
    expect(warn).toHaveBeenCalledTimes(1);
    const text = String(warn.mock.calls[0][0]);
    expect(text).toContain(`"${removed}"`);
    expect(text).toContain(`"${replacement}"`);
    // Still ignored: no mapping onto the new key.
    expect(merged[replacement]).toBe(defaultMarkdownEditorMessages[replacement]);
  });

  it("warns once per key, however often the messages are merged", async () => {
    const merge = await load();
    for (let i = 0; i < 3; i++) merge({ linkDialogCancel: "a", imageDialogInsert: "b" } as never);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("is silent in production, whether the mode is known at load or only when called", async () => {
    // The call-site guard (dead code in a consumer's build) is enforced by clean-ui's dev-warnings.test.ts
    // and the fixture's no-dev-warnings guarantee; this is the behaviour.
    const merge = await load();
    process.env.NODE_ENV = "production";
    merge(Object.fromEntries(Object.keys(LEGACY).map((k) => [k, "x"])) as never);
    expect(warn).not.toHaveBeenCalled();
  });

  it("is silent when no legacy key is passed", async () => {
    const merge = await load();
    merge({ toolbarBold: "Gras", urlDialogCancel: "Annuler" });
    merge(undefined);
    expect(warn).not.toHaveBeenCalled();
  });
});
