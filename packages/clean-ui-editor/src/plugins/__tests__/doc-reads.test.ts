import { describe, it, expect, afterEach, vi } from "vitest";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { createCommandContext } from "../command-context";
import { DEFAULT_PLUGINS } from "../default-plugins";
import { cuiMarkdownLanguage } from "../../language/markdown-language";

// The regression guard for #230: an `isActive` runs for every toolbar command on
// every keystroke and selection change, so a built-in that flattens the document
// there copies it once per command. Built-ins read through `sliceDoc`/`lineAt`.

const DOC = ["# Title", "", "> quoted", "", "- [ ] task", "1. one", "---", "**bold** text"].join("\n").repeat(50);

let view: EditorView | undefined;
afterEach(() => {
  view?.destroy();
  view = undefined;
  vi.restoreAllMocks();
});

function setup(anchor: number, head?: number) {
  view = new EditorView({
    state: EditorState.create({ doc: DOC, selection: EditorSelection.single(anchor, head), extensions: [cuiMarkdownLanguage.extension] }),
    parent: document.body,
  });
  // DOC spans many lines, so this is the multi-node `Text` that real documents are.
  const proto = Object.getPrototypeOf(view.state.doc);
  const toString = vi.spyOn(proto, "toString");
  // A flatten by another route (`sliceDoc(0)`, `sliceString`) is a read of the whole document too.
  const sliceString = vi.spyOn(proto, "sliceString");
  const wholeDocSlices = () => sliceString.mock.calls.filter(([from = 0, to = DOC.length]) => to - from >= DOC.length);
  return { context: createCommandContext(() => view!), toString, wholeDocSlices };
}

const commands = DEFAULT_PLUGINS.flatMap((plugin) => Object.entries(plugin.commands));

describe("whole-document reads", () => {
  it("covers every default command, so a new built-in is guarded too", () => {
    expect(commands.filter(([, spec]) => spec.isActive).length).toBeGreaterThanOrEqual(15);
  });

  it.each([
    ["a collapsed cursor", 20, undefined],
    ["a multi-line selection", 3, 400],
  ])("no built-in isActive copies the document, for %s", (_name, anchor, head) => {
    const { context, toString, wholeDocSlices } = setup(anchor, head);
    for (const [, spec] of commands) spec.isActive?.(context);
    expect(toString).not.toHaveBeenCalled();
    expect(wholeDocSlices()).toEqual([]);
  });

  it("no built-in command copies the document when it runs", () => {
    for (const [id, spec] of commands) {
      if (id === "link" || id === "image") continue; // open a dialog
      const { context, toString, wholeDocSlices } = setup(12, 30);
      spec.run(context);
      expect(toString, id).not.toHaveBeenCalled();
      expect(wholeDocSlices(), id).toEqual([]);
      view!.destroy();
    }
  });

  it("context.doc remains the escape hatch, and does copy", () => {
    const { context, toString } = setup(0);
    expect(context.doc).toBe(DOC);
    expect(toString).toHaveBeenCalledTimes(1);
  });
});
