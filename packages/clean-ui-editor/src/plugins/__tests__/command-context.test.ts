import { describe, it, expect, afterEach } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { history, undo } from "@codemirror/commands";
import { createCommandContext } from "../command-context";

function makeView(doc: string): EditorView {
  return new EditorView({ state: EditorState.create({ doc, extensions: [history()] }), parent: document.body });
}

describe("createCommandContext", () => {
  let view: EditorView | undefined;

  afterEach(() => {
    view?.destroy();
    view = undefined;
  });

  it("throws a clear error when invoked after the view is gone, rather than a generic null-access failure", () => {
    const context = createCommandContext(() => null);
    expect(() => context.doc).toThrow(/unmounted/);
  });

  describe("insertAtCursor", () => {
    it("inserts at an empty (collapsed) selection and places the cursor after the insertion", () => {
      view = makeView("ab");
      view.dispatch({ selection: { anchor: 1 } });
      const context = createCommandContext(() => view!);

      context.insertAtCursor("X");

      expect(view.state.doc.toString()).toBe("aXb");
      expect(view.state.selection.main.head).toBe(2);
    });

    it("replaces a partial selection", () => {
      view = makeView("hello world");
      view.dispatch({ selection: { anchor: 0, head: 5 } });
      const context = createCommandContext(() => view!);

      context.insertAtCursor("hi");

      expect(view.state.doc.toString()).toBe("hi world");
    });

    it("replaces a multi-line selection", () => {
      view = makeView("line one\nline two\nline three");
      view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } });
      const context = createCommandContext(() => view!);

      context.insertAtCursor("replaced");

      expect(view.state.doc.toString()).toBe("replaced");
    });
  });

  describe("wrapSelection", () => {
    it("with an empty selection, inserts both markers and places the cursor between them (FR13)", () => {
      view = makeView("hello");
      view.dispatch({ selection: { anchor: 5 } });
      const context = createCommandContext(() => view!);

      context.wrapSelection("**", "**");

      expect(view.state.doc.toString()).toBe("hello****");
      expect(view.state.selection.main.head).toBe(7); // between the two "**" pairs
      expect(view.state.selection.main.anchor).toBe(7);
    });

    it("with a partial selection, wraps it and re-selects the wrapped text", () => {
      view = makeView("hello world");
      view.dispatch({ selection: { anchor: 0, head: 5 } });
      const context = createCommandContext(() => view!);

      context.wrapSelection("**", "**");

      expect(view.state.doc.toString()).toBe("**hello** world");
      expect(view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to)).toBe("hello");
    });

    it("with a multi-line selection, wraps the whole block", () => {
      view = makeView("one\ntwo");
      view.dispatch({ selection: { anchor: 0, head: 7 } });
      const context = createCommandContext(() => view!);

      context.wrapSelection("<<", ">>");

      expect(view.state.doc.toString()).toBe("<<one\ntwo>>");
    });
  });

  describe("replaceRange", () => {
    it("replaces an explicit range independent of the current selection", () => {
      view = makeView("abcdef");
      view.dispatch({ selection: { anchor: 0 } }); // selection elsewhere
      const context = createCommandContext(() => view!);

      context.replaceRange(2, 4, "XY");

      expect(view.state.doc.toString()).toBe("abXYef");
    });
  });

  describe("replaceRanges", () => {
    it("applies several non-overlapping edits as a single transaction — one undo restores all of them (FR15)", () => {
      const original = "- one\n- two\n- three";
      view = makeView(original);
      const context = createCommandContext(() => view!);

      context.replaceRanges([
        { from: 0, to: 1, text: "*" },
        { from: 6, to: 7, text: "*" },
        { from: 12, to: 13, text: "*" },
      ]);
      expect(view.state.doc.toString()).toBe("* one\n* two\n* three");

      undo(view);

      expect(view.state.doc.toString()).toBe(original);
    });
  });

  describe("collect", () => {
    it("resolves with the value passed to settle.resolve", async () => {
      view = makeView("");
      const context = createCommandContext(() => view!);

      const result = context.collect<string>((settle) => settle.resolve("chosen"));

      await expect(result).resolves.toBe("chosen");
    });

    it("resolves null when settle.cancel is called", async () => {
      view = makeView("");
      const context = createCommandContext(() => view!);

      const result = context.collect<string>((settle) => settle.cancel());

      await expect(result).resolves.toBeNull();
    });

    it("selection/doc read after an edit made during the awaited collect reflect that edit, not a stale snapshot", async () => {
      view = makeView("before");
      const context = createCommandContext(() => view!);

      const collected = context.collect<string>((settle) => {
        // Simulate the user typing while a dialog is "open" — an edit made
        // during the await, before the command's continuation runs.
        view!.dispatch({ changes: { from: 6, to: 6, insert: " typed" } });
        settle.resolve("value");
      });

      await collected;
      expect(context.doc).toBe("before typed");
    });

    it("cancelling leaves the document untouched", async () => {
      view = makeView("untouched");
      const context = createCommandContext(() => view!);

      await context.collect<string>((settle) => settle.cancel());

      expect(view.state.doc.toString()).toBe("untouched");
    });
  });
});
