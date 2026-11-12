import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { EditorSelection, EditorState, type Extension } from "@codemirror/state";
import { Decoration, EditorView, type DecorationSet, type ViewPlugin } from "@codemirror/view";
import { ensureSyntaxTree, forceParsing, syntaxTree } from "@codemirror/language";
import { cuiMarkdownLanguage } from "../../language/markdown-language";
import { revealExtension } from "..";
import { revealPlugin } from "../reveal-plugin";
import { listBulletPlugin } from "../list-bullet-plugin";
import { decorationViewPlugin } from "../decoration-view-plugin";
import { codeBackgroundPlugin } from "../../theme/code-decorations";
import { createCommandContext, peekedUnsettled, peeking } from "../../plugins/command-context";
import { definePlugin, type CommandContext } from "../../plugins";
import { codeFencePlugin } from "../../plugins/builtin/code-fence";
import { boldPlugin } from "../../plugins/builtin/bold";
import { italicPlugin } from "../../plugins/builtin/italic";

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

/** How far the parser itself has got. `syntaxTree(state)` lags behind it:
 * `ensureSyntaxTree` advances the parse without dispatching the result. */
function parsedSoFar(v: EditorView): number {
  return ensureSyntaxTree(v.state, 0, 0)!.length;
}

/** Runs `act` on a machine so slow that every clock read is half a second later. */
function onASlowMachine<T>(act: () => T): T {
  let now = Date.now();
  const clock = vi.spyOn(Date, "now").mockImplementation(() => (now += 500));
  try {
    return act();
  } finally {
    clock.mockRestore();
  }
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

  it("rebuilds when the tree already reached past the viewport but its last block was cut inside it", () => {
    // A blockquote from the top of the document to well past the initial parse: the parse
    // stops inside it, past the viewport, so the block the viewport shows is provisional.
    const doc = `${"> a line of quoted text\n>\n".repeat(1000)}\n${DOC}`;
    let builds = 0;
    const plugin = decorationViewPlugin(() => {
      builds++;
      return Decoration.none;
    });
    view = new EditorView({
      state: EditorState.create({ doc, extensions: [cuiMarkdownLanguage, plugin] }),
      parent: document.body,
    });
    const before = syntaxTree(view.state);
    expect(before.length).toBeGreaterThanOrEqual(view.viewport.to);
    expect(before.length).toBeLessThan(doc.indexOf("\n\n"));
    expect(before.topNode.lastChild!.from).toBeLessThan(view.viewport.to);
    const initialBuilds = builds;

    forceParsing(view, doc.length, 10_000);

    expect(builds).toBeGreaterThan(initialBuilds);
  });
});

describe("a command's construct lookup past the parsed tree (#256)", () => {
  it("parses up to the cursor rather than reading a short tree as 'not inside'", () => {
    view = scrolledPastTheParse([]);
    // Inside an "*emphasis*" in the middle of the document.
    const pos = DOC.indexOf("*emphasis*", DOC.length / 2) + 3;
    view.dispatch({ selection: EditorSelection.cursor(pos) });
    expect(syntaxTree(view.state).length).toBeLessThan(pos);

    const found = createCommandContext(() => view!).lookupConstruct("Emphasis");
    const range = found.status === "inside" ? found.range : null;

    expect(range).toEqual({ from: pos - 3, to: pos - 3 + "*emphasis*".length });
    // Bounded by the cursor's block, not the document: nowhere near the end was parsed.
    expect(parsedSoFar(view)).toBeLessThan(DOC.length - 10_000);
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

    const found = createCommandContext(() => view!).lookupConstruct("FencedCode");
    const range = found.status === "inside" ? found.range : null;

    expect(range).toEqual({ from: fenceFrom, to: doc.indexOf("\n\nafter") });
  });

  it("parses on past a list cut at the cursor's line, rather than returning its first item", () => {
    const tail = "- a *b*\n- c\n- d\n\nafter\n";
    const doc = DOC + tail;
    view = new EditorView({
      state: EditorState.create({ doc, extensions: [cuiMarkdownLanguage] }),
      parent: document.body,
    });
    const listFrom = DOC.length;
    view.dispatch({ selection: EditorSelection.cursor(listFrom + 5) }); // in item 1

    const found = createCommandContext(() => view!).lookupConstruct("BulletList");
    const range = found.status === "inside" ? found.range : null;

    expect(range).toEqual({ from: listFrom, to: doc.indexOf("\n\nafter") });
  });

  describe("past the time cap, inside a block still cut short", () => {
    const body = "const x = **1**;\n".repeat(1500);
    const doc = `${DOC}\`\`\`js\n${body}\`\`\`\n\nafter\n`;
    const fenceFrom = doc.indexOf("```js");

    beforeEach(() => {
      view = new EditorView({
        state: EditorState.create({ doc, selection: EditorSelection.cursor(fenceFrom + 10), extensions: [cuiMarkdownLanguage] }),
        parent: document.body,
      });
    });

    it("lookupConstruct reports unknown, never outside or a shorter range (#405)", () => {
      const found = onASlowMachine(() => createCommandContext(() => view!).lookupConstruct("FencedCode"));
      expect(found).toEqual({ status: "unknown" });
    });

    it("lets a third-party command do nothing rather than wrap (#405)", () => {
      // Written as a plugin author would, against the public API only.
      const calloutPlugin = definePlugin({
        id: "docs-callout",
        commands: {
          callout: {
            run(context: CommandContext) {
              const found = context.lookupConstruct("FencedCode");
              if (found.status === "unknown") return true;
              if (found.status === "inside") context.replaceRange(found.range.from, found.range.to, "");
              else context.wrapSelection(":::\n", "\n:::");
              return true;
            },
          },
        },
      });
      const context = createCommandContext(() => view!);
      expect(onASlowMachine(() => calloutPlugin.commands.callout.run(context))).toBe(true);
      expect(view!.state.doc.toString()).toBe(doc);
      // With time to parse, the same command finds the block and acts on it.
      calloutPlugin.commands.callout.run(context);
      expect(view!.state.doc.toString()).not.toContain("```js");
    });

    it.each([
      ["Code block", codeFencePlugin.commands.codeFence],
      ["Bold", boldPlugin.commands.bold],
    ])("%s does nothing rather than wrap inside the open block", (_name, command) => {
      const context = createCommandContext(() => view!);
      const handled = onASlowMachine(() => command.run(context));
      expect(handled).toBe(true); // handled, so a shortcut doesn't fall through to the browser
      expect(view!.state.doc.toString()).toBe(doc);
    });
  });
});

describe("toolbar queries parse only briefly (#256)", () => {
  function italicQuery() {
    view = scrolledPastTheParse([]);
    const pos = DOC.indexOf("*emphasis*", DOC.length / 2) + 3;
    view.dispatch({ selection: EditorSelection.cursor(pos) });
    const context = createCommandContext(() => view!);
    return { context, ask: () => peeking(context, () => italicPlugin.commands.italic.isActive!(context)) };
  }

  it("reads as inactive, and flags it, when the short budget runs out first", () => {
    const { context, ask } = italicQuery();
    expect(onASlowMachine(ask)).toBe(false);
    expect(peekedUnsettled(context)).toBe(true);
  });

  it("answers in full when the budget suffices", () => {
    const { context, ask } = italicQuery();
    expect(ask()).toBe(true);
    expect(peekedUnsettled(context)).toBe(false);
  });
});

describe("a state with no language", () => {
  it("finds no construct, and returns at once rather than waiting out the cap", () => {
    // The clock is frozen, so a loop waiting on the cap would never end.
    view = new EditorView({ state: EditorState.create({ doc: "*emphasis*", selection: EditorSelection.cursor(3) }), parent: document.body });
    const context = createCommandContext(() => view!);
    expect(context.lookupConstruct("Emphasis")).toEqual({ status: "outside" });
  });
});
