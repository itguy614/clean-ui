import { describe, it, expect } from "vitest";
import { definePlugin } from "../define-plugin";
import { PLUGIN_API_VERSION } from "../types";

describe("definePlugin", () => {
  it("stamps the current plugin API version", () => {
    const plugin = definePlugin({ id: "test", commands: {} });
    expect(plugin.apiVersion).toBe(PLUGIN_API_VERSION);
  });

  it("declaring every field preserves them all on the returned record", () => {
    const run = () => true;
    const plugin = definePlugin({
      id: "kitchen-sink",
      commands: { doThing: { run, label: "Do thing", icon: "PhStar" } },
      toolbar: [{ command: "doThing" }],
      keymap: [{ key: "Mod-k", command: "doThing" }],
      constructs: ["Emphasis"],
      paste: [{ selector: "em", toMarkdown: (_el, children) => `*${children}*`, produces: "Emphasis", degradeTo: "plainText" }],
      decorations: [{ node: "Emphasis" }],
      extensions: [],
    });

    expect(plugin.id).toBe("kitchen-sink");
    expect(plugin.commands.doThing.run).toBe(run);
    expect(plugin.toolbar).toEqual([{ command: "doThing" }]);
    expect(plugin.keymap).toEqual([{ key: "Mod-k", command: "doThing" }]);
    expect(plugin.constructs).toEqual(["Emphasis"]);
    expect(plugin.paste).toHaveLength(1);
    expect(plugin.decorations).toEqual([{ node: "Emphasis" }]);
    expect(plugin.extensions).toEqual([]);
  });
});
