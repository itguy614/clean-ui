import { describe, it, expect } from "vitest";
import { definePlugin } from "../define-plugin";
import { buildRegistry } from "../registry";
import { DEFAULT_PLUGINS } from "../default-plugins";

describe("buildRegistry", () => {
  it("rejects a plugin built against an incompatible API version, naming the mismatch", () => {
    const incompatible = { ...definePlugin({ id: "old", commands: {} }), apiVersion: 999 };

    const result = buildRegistry([incompatible]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("old");
      expect(result.error).toContain("999");
    }
  });

  it("a consumer plugin overriding a built-in command id wins, with a warning naming both", () => {
    const builtIn = definePlugin({ id: "builtin-bold", commands: { bold: { run: () => true } } });
    const override = definePlugin({ id: "custom-bold", commands: { bold: { run: () => false } } });

    const result = buildRegistry([builtIn, override]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.registry.commands.get("bold")?.pluginId).toBe("custom-bold");
    expect(result.registry.warnings.some((w) => w.message.includes("builtin-bold") && w.message.includes("custom-bold"))).toBe(
      true,
    );
  });

  it("two plugins binding the same key resolve by order (later wins), with a warning", () => {
    const first = definePlugin({ id: "a", commands: { cmdA: { run: () => true } }, keymap: [{ key: "Mod-b", command: "cmdA" }] });
    const second = definePlugin({ id: "b", commands: { cmdB: { run: () => true } }, keymap: [{ key: "Mod-b", command: "cmdB" }] });

    const result = buildRegistry([first, second]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.registry.keymap).toHaveLength(1);
    expect(result.registry.keymap[0]).toEqual({ key: "Mod-b", command: "cmdB" });
    expect(result.registry.warnings.some((w) => w.message.includes("Mod-b") && w.message.includes('"a"') && w.message.includes('"b"'))).toBe(
      true,
    );
  });

  it("a duplicate plugin id: the later registration replaces the earlier one entirely, with a warning", () => {
    const v1 = definePlugin({ id: "dup", commands: { onlyInV1: { run: () => true } } });
    const v2 = definePlugin({ id: "dup", commands: { onlyInV2: { run: () => true } } });

    const result = buildRegistry([v1, v2]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.registry.commands.has("onlyInV1")).toBe(false);
    expect(result.registry.commands.has("onlyInV2")).toBe(true);
    expect(result.registry.warnings.some((w) => w.message.includes('"dup"'))).toBe(true);
  });

  it("collects toolbar, constructs, paste, decorations and extensions across every plugin", () => {
    const a = definePlugin({
      id: "a",
      commands: { cmdA: { run: () => true } },
      toolbar: [{ command: "cmdA" }],
      constructs: ["Emphasis"],
      paste: [{ selector: "em", toMarkdown: (_el, c) => `*${c}*`, produces: "Emphasis", degradeTo: "plainText" }],
      decorations: [{ node: "Emphasis" }],
      extensions: [],
    });
    const b = definePlugin({
      id: "b",
      commands: { cmdB: { run: () => true } },
      toolbar: [{ command: "cmdB" }],
      constructs: ["StrongEmphasis"],
    });

    const result = buildRegistry([a, b]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.registry.toolbar).toEqual([{ command: "cmdA" }, { command: "cmdB" }]);
    expect([...result.registry.constructs]).toEqual(["Emphasis", "StrongEmphasis"]);
    expect(result.registry.paste).toHaveLength(1);
    expect(result.registry.decorations).toEqual([{ node: "Emphasis" }]);
  });

  it("a raw extension using an explicit Prec override is passed through untouched (escapes the precedence model)", () => {
    const marker = {};
    const withRaw = definePlugin({ id: "raw", commands: {}, extensions: [marker as never] });

    const result = buildRegistry([withRaw]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Grouped per plugin (nested), not flattened — see registry.ts.
    expect(result.registry.extensions).toEqual([[marker]]);
  });

  it("the shipped default preset has no internal conflict", () => {
    const result = buildRegistry(DEFAULT_PLUGINS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.registry.warnings).toEqual([]);
  });
});
