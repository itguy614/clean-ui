import { describe, it, expect } from "vitest";
import { buildRegistry } from "../registry";
import { slashMenuCommandIds } from "../slash-menu";
import { definePlugin } from "../define-plugin";
import { boldPlugin } from "../builtin/bold";
import { italicPlugin } from "../builtin/italic";

// The full interactive path (typing "/", filtering as you type, arrow-key
// navigation, Enter to run, Escape to dismiss leaving the typed text) is
// CodeMirror's own `autocompletion()` machinery, layered on top of this
// selection logic — and needs real focus/layout jsdom's contenteditable
// support can't reliably provide (confirmed empirically: even after
// `view.focus()`, `view.hasFocus` stayed `false` in jsdom, and
// `closeOnBlur` — correct, desired production behaviour — then closes the
// menu before its query resolves). That interactive path is verified in a
// real browser instead; this covers the part that's actually this file's
// own logic: which commands qualify (FR20) and in what order.
describe("slashMenuCommandIds", () => {
  it("includes only commands carrying both a label and an icon", () => {
    const withBoth = definePlugin({ id: "a", commands: { withBoth: { run: () => true, label: "With Both", icon: "bold" } } });
    const labelOnly = definePlugin({ id: "b", commands: { labelOnly: { run: () => true, label: "Label Only" } } });
    const iconOnly = definePlugin({ id: "c", commands: { iconOnly: { run: () => true, icon: "italic" } } });
    const neither = definePlugin({ id: "d", commands: { neither: { run: () => true } } });

    const result = buildRegistry([withBoth, labelOnly, iconOnly, neither]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(slashMenuCommandIds(result.registry)).toEqual([{ id: "withBoth", label: "With Both" }]);
  });

  it("a third-party plugin's command appears with no extra declaration beyond label+icon", () => {
    const thirdParty = definePlugin({
      id: "third-party",
      commands: { thirdPartyThing: { run: () => true, label: "Third Party Thing", icon: "link" } },
    });

    const result = buildRegistry([boldPlugin, thirdParty]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const ids = slashMenuCommandIds(result.registry).map((c) => c.id);
    expect(ids).toContain("thirdPartyThing");
  });

  it("an excluded construct's command does not appear (it was never loaded)", () => {
    const result = buildRegistry([boldPlugin]); // italic not loaded
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const ids = slashMenuCommandIds(result.registry).map((c) => c.id);
    expect(ids).toContain("bold");
    expect(ids).not.toContain("italic");
  });

  it("matches the same qualifying set the default preset's toolbar uses", () => {
    const result = buildRegistry([boldPlugin, italicPlugin]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const slashIds = slashMenuCommandIds(result.registry).map((c) => c.id).sort();
    const toolbarIds = result.registry.toolbar.map((entry) => entry.command).sort();
    expect(slashIds).toEqual(toolbarIds);
  });
});
