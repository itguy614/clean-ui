import { describe, it, expect, afterEach } from "vitest";
import { EditorSelection, EditorState, type Extension } from "@codemirror/state";
import { EditorView, type DecorationSet, type ViewPlugin } from "@codemirror/view";
import { forceParsing, syntaxTree } from "@codemirror/language";
import { cuiMarkdownLanguage } from "../../language/markdown-language";
import { revealExtension } from "..";
import { revealPlugin } from "../reveal-plugin";
import { listBulletPlugin } from "../list-bullet-plugin";
import { codeBackgroundPlugin } from "../../theme/code-decorations";
import { createCommandContext } from "../../plugins/command-context";

/**
 * #256 — CodeMirror parses a long document to a time budget and finishes it in the
 * background, handing the larger tree over in an update that changes nothing else: not the
 * document, the viewport, the selection or focus. A decoration plugin that rebuilt only on
 * those left everything past the first parse chunk undecorated until the next keystroke or
 * scroll.
 *
 * The setup is deterministic, not timing-dependent: a fresh state parses only its initial
 * viewport (~3000 chars), and scrolling to the end of a long document moves the viewport
 * past the parsed tree without parsing any further. `forceParsing` then completes the tree
 * and dispatches exactly the update a background parse would.
 */
const BLOCK = "- item with `code` and *emphasis*\n\nA paragraph of filler text to push the list further down.\n\n";
const DOC = BLOCK.repeat(1000); // ~100k chars, far past one parse chunk

type DecorationPlugin = ViewPlugin<{ decorations: DecorationSet }>;

let view: EditorView | undefined;
afterEach(() => {
  view?.destroy();
  view = undefined;
});

/** A view scrolled to the end of `DOC`, whose syntax tree stops well short of it. */
function scrolledPastTheParse(extensions: Extension): EditorView {
  const state = EditorState.create({
    doc: DOC,
    selection: EditorSelection.cursor(DOC.length),
    extensions: [cuiMarkdownLanguage, extensions],
  });
  const v = new EditorView({ state, parent: document.body });
  v.dispatch({ effects: EditorView.scrollIntoView(DOC.length) });
  // Precondition: the viewport is at the end and the tree does not reach it.
  expect(v.viewport.from).toBeGreaterThan(DOC.length / 2);
  expect(syntaxTree(v.state).length).toBeLessThan(v.viewport.from);
  return v;
}

function decorationCount(v: EditorView, plugin: DecorationPlugin): number {
  let count = 0;
  v.plugin(plugin)!.decorations.between(v.viewport.from, v.viewport.to, () => {
    count++;
  });
  return count;
}

describe("decoration plugins rebuild when a background parse completes (#256)", () => {
  it.each([
    ["revealPlugin (hidden markers)", revealPlugin as DecorationPlugin],
    ["listBulletPlugin (bullet widgets)", listBulletPlugin as DecorationPlugin],
  ])("%s", (_name, plugin) => {
    view = scrolledPastTheParse(revealExtension(new Set(["BulletList", "Emphasis", "InlineCode"])));
    expect(decorationCount(view, plugin)).toBe(0);

    forceParsing(view, DOC.length, 10_000);

    expect(syntaxTree(view.state).length).toBe(DOC.length);
    expect(decorationCount(view, plugin)).toBeGreaterThan(0);
  });

  it("codeBackgroundPlugin (code backgrounds)", () => {
    view = scrolledPastTheParse(codeBackgroundPlugin);
    expect(decorationCount(view, codeBackgroundPlugin as DecorationPlugin)).toBe(0);

    forceParsing(view, DOC.length, 10_000);

    expect(decorationCount(view, codeBackgroundPlugin as DecorationPlugin)).toBeGreaterThan(0);
  });
});

describe("a command's construct lookup past the parsed tree (#256)", () => {
  it("parses up to the cursor rather than reading a short tree as 'not inside'", () => {
    view = scrolledPastTheParse([]);
    // Inside the last "*emphasis*" in the document.
    const pos = DOC.lastIndexOf("*emphasis*") + 3;
    view.dispatch({ selection: EditorSelection.cursor(pos) });
    expect(syntaxTree(view.state).length).toBeLessThan(pos);

    const range = createCommandContext(() => view!).findConstructRange("Emphasis");

    expect(range).toEqual({ from: pos - 3, to: pos - 3 + "*emphasis*".length });
  });
});
