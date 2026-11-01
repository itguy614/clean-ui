import { describe, it, expect, afterEach } from "vitest";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { createCommandContext } from "../../command-context";
import { toggleLinePrefixCommand } from "../toggle-line-prefix";

let view: EditorView | undefined;
afterEach(() => {
  view?.destroy();
  view = undefined;
});

function contextFor(doc: string, from: number, to = from) {
  view = new EditorView({ state: EditorState.create({ doc, selection: EditorSelection.range(from, to) }), parent: document.body });
  return createCommandContext(() => view!);
}

describe("toggleLinePrefixCommand", () => {
  it("inserts the literal match when no insert is given", () => {
    const context = contextFor("one\ntwo", 0, 7);
    toggleLinePrefixCommand({ match: "> " }).run(context);
    expect(context.doc).toBe("> one\n> two");
  });

  it("treats only a match at the line start as a prefix, even without ^", () => {
    const command = toggleLinePrefixCommand({ match: /\d+\.\s/, insert: (i) => `${i + 1}. ` });
    const context = contextFor("Step 1. foo", 0);
    expect(command.isActive!(context)).toBe(false);
    command.run(context);
    expect(context.doc).toBe("1. Step 1. foo");
  });

  it.each([["g"], ["y"], ["gy"]])("ignores a pattern's %s flag, matching each line on its own", (flags) => {
    const command = toggleLinePrefixCommand({ match: new RegExp("\\d+\\.\\s", flags), insert: (i) => `${i + 1}. ` });
    const context = contextFor("1. one\n2. two\n3. three", 0, 21);
    expect(command.isActive!(context)).toBe(true);
    command.run(context);
    expect(context.doc).toBe("one\ntwo\nthree");
  });
});
