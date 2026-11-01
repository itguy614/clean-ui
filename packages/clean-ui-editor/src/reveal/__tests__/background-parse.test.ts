import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
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
 *
 * The clock is frozen: CodeMirror's parse budgets read `Date.now()`, so no budget can run
 * out and a slow runner parses exactly as far as a fast one.
 */
const BLOCK = "- item with `code` and *emphasis*\n\nA paragraph of filler text to push the list further down.\n\n";
const DOC = BLOCK.repeat(1000); // ~100k chars, far past one parse chunk

type DecorationPlugin = ViewPlugin<{ decorations: DecorationSet }>;

let view: EditorView | undefined;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
});
afterEach(() => {
  view?.destroy();
  view = undefined;
  vi.useRealTimers();
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
    // Inside an "*emphasis*" in the middle of the document.
    const pos = DOC.indexOf("*emphasis*", DOC.length / 2) + 3;
    view.dispatch({ selection: EditorSelection.cursor(pos) });
    expect(syntaxTree(view.state).length).toBeLessThan(pos);

    const range = createCommandContext(() => view!).findConstructRange("Emphasis");

    expect(range).toEqual({ from: pos - 3, to: pos - 3 + "*emphasis*".length });
    // Bounded by the cursor's block, not the document: nowhere near the end was parsed.
    expect(syntaxTree(view.state).length).toBeLessThan(DOC.length - 10_000);
  });

  it("parses on to the end of a block that runs past the cursor's line", () => {
    // A fenced block, far down, whose closing fence is ~20k chars below the cursor:
    // stopping at the cursor's line would cut the block short there.
    const body = "const x = 1;\n".repeat(1500);
    const doc = `${DOC}\`\`\`js\n${body}\`\`\`\n\nafter\n`;
    view = new EditorView({
      state: EditorState.create({ doc, extensions: [cuiMarkdownLanguage] }),
      parent: document.body,
    });
    const fenceFrom = doc.indexOf("```js");
    const pos = fenceFrom + 10;
    view.dispatch({ selection: EditorSelection.cursor(pos) });
    expect(syntaxTree(view.state).length).toBeLessThan(pos);

    const range = createCommandContext(() => view!).findConstructRange("FencedCode");

    expect(range).toEqual({ from: fenceFrom, to: doc.indexOf("\n\nafter") });
  });

  it("past the time cap, reports a cut-short block as absent, never as a shorter range", () => {
    const body = "const x = 1;\n".repeat(1500);
    const doc = `${DOC}\`\`\`js\n${body}\`\`\`\n\nafter\n`;
    view = new EditorView({
      state: EditorState.create({ doc, extensions: [cuiMarkdownLanguage] }),
      parent: document.body,
    });
    const fenceFrom = doc.indexOf("```js");
    view.dispatch({ selection: EditorSelection.cursor(fenceFrom + 10) });

    // A machine so slow that every clock read is half a second later.
    let now = Date.now();
    vi.spyOn(Date, "now").mockImplementation(() => (now += 500));
    const range = createCommandContext(() => view!).findConstructRange("FencedCode");

    // The parse gives up inside the block, so the only safe answer is "not found".
    expect(range).toBeNull();
  });
});
