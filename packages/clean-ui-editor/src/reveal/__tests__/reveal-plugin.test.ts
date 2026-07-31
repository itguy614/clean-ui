import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { EditorSelection } from "@codemirror/state";
import CuiMarkdownEditor from "../../components/CuiMarkdownEditor.vue";
import { setGranularityEffect, granularityField } from "../granularity";

function getView(wrapper: VueWrapper) {
  return (wrapper.vm as unknown as { getView: () => import("@codemirror/view").EditorView }).getView()!;
}

function hiddenMarkerTexts(view: import("@codemirror/view").EditorView): string[] {
  return [...view.contentDOM.querySelectorAll(".cui-md-marker-hidden")].map((el) => el.textContent ?? "");
}

// jsdom has no PointerEvent constructor — `inputTypeGranularityExtension`'s
// listener only reads `event.pointerType`, so a plain Event with that
// property attached exercises the real DOM-event-observer code path (as
// opposed to dispatching `setGranularityEffect` directly, which bypasses it).
function pointerDownEvent(pointerType: "touch" | "mouse"): Event {
  const event = new Event("pointerdown", { bubbles: true });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  return event;
}

describe("reveal layer", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  // Every test below mounts `attachTo: document.body` and calls
  // `view.focus()` — reveal only ever applies to a *focused* editor (see
  // the "not revealed before the editor is ever focused" test), matching
  // how a real user always focuses the editor before their cursor position
  // means anything. `document.body` is required for jsdom's own
  // `document.activeElement` tracking to work at all; a detached mount
  // leaves `view.hasFocus` permanently false regardless of `.focus()`.

  it("hides markers for constructs the cursor is away from, and reveals them on entry", async () => {
    const doc = "before **bold** after";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();

    // Cursor at the very start — away from the construct.
    view.dispatch({ selection: EditorSelection.cursor(0) });
    expect(hiddenMarkerTexts(view)).toEqual(["**", "**"]);

    // Move the cursor inside "**bold**" (construct spans 8..16).
    view.dispatch({ selection: EditorSelection.cursor(10) });
    expect(hiddenMarkerTexts(view)).toEqual([]);

    // Move away again.
    view.dispatch({ selection: EditorSelection.cursor(0) });
    expect(hiddenMarkerTexts(view)).toEqual(["**", "**"]);
  });

  it("is not revealed before the editor is ever focused, even if the default cursor position sits inside a construct", async () => {
    // Regression test: a freshly created EditorState with no explicit
    // selection defaults its cursor to position 0 — a technical
    // placeholder, not a sign the user is "looking there." A document
    // starting with a supported construct (most commonly a heading) used
    // to render that construct revealed on first paint, before the user
    // ever clicked into the editor — found by loading a real page with no
    // interaction at all and checking decorations, not assumed from
    // reading the code.
    const doc = "**bold at the very start** and more text after it";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);

    // No focus() call — this is the state a page load leaves the editor in.
    expect(view.hasFocus).toBe(false);
    expect(hiddenMarkerTexts(view)).toEqual(["**", "**"]);

    view.focus();
    await nextTick();
    expect(hiddenMarkerTexts(view)).toEqual([]); // cursor (position 0) is now meaningfully "in" the construct

    view.contentDOM.blur();
    await nextTick();
    expect(hiddenMarkerTexts(view)).toEqual(["**", "**"]); // blurring hides again, cursor position notwithstanding
  });

  it("never removes the marker text from the DOM — only re-styles it", async () => {
    const doc = "*hidden-away-text*";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();

    view.dispatch({ selection: EditorSelection.cursor(0) });
    // The full document text is still present in the content DOM, marker
    // characters included, regardless of the hidden styling.
    expect(view.contentDOM.textContent).toBe(doc);
  });

  it("hides nothing in source mode", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "**bold**", mode: "source" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);

    expect(hiddenMarkerTexts(view)).toEqual([]);
  });

  it("hides a bulleted/numbered list's marker, one level deeper than the construct itself via the structural ListItem wrapper", async () => {
    // Regression test: BulletList/OrderedList's own direct children are
    // ListItem nodes, never a marker directly — the marker (ListMark) lives
    // one level deeper, inside each ListItem. Without accounting for that
    // indirection, these constructs being in activeConstructs found nothing
    // to hide at all.
    // Each hidden marker's text includes its one mandatory trailing space
    // ("- ", not just "-") — see "sweeps a construct's mandatory trailing
    // space into the same hidden decoration as its marker" below.
    const bulletDoc = "- one\n- two\n\nfar away paragraph";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: bulletDoc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    let view = getView(wrapper);
    view.focus();
    view.dispatch({ selection: EditorSelection.cursor(bulletDoc.length) });
    expect(hiddenMarkerTexts(view)).toEqual(["- ", "- "]);
    wrapper.unmount();

    const orderedDoc = "1. one\n2. two\n\nfar away paragraph";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: orderedDoc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    view = getView(wrapper);
    view.focus();
    view.dispatch({ selection: EditorSelection.cursor(orderedDoc.length) });
    expect(hiddenMarkerTexts(view)).toEqual(["1. ", "2. "]);
  });

  it("hides a GFM task list's checkbox marker (TaskMarker), the one node name that breaks the generic *Mark suffix rule", async () => {
    // Regression test: @lezer/markdown names this node "TaskMarker", not
    // "...Mark" like every other marker — isMarkerNodeName's generic suffix
    // rule silently excluded it.
    const doc = "- [ ] todo\n- [x] done\n\nfar away paragraph";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();
    view.dispatch({ selection: EditorSelection.cursor(doc.length) });

    // Both the list bullet ("- ") and the checkbox ("[ ] "/"[x] ") hide,
    // each sweeping in its own mandatory trailing space.
    expect(hiddenMarkerTexts(view)).toEqual(["- ", "[ ] ", "- ", "[x] "]);
  });

  it("does not hide a list's marker when the cursor is inside that item", async () => {
    const doc = "- one\n- two";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();

    view.dispatch({ selection: EditorSelection.cursor(3) }); // inside "- one"
    expect(hiddenMarkerTexts(view)).toEqual(["- "]); // only "two"'s marker hidden
  });

  it("sweeps a construct's mandatory trailing space into the same hidden decoration as its marker", async () => {
    // Regression test: collapsing only the marker itself to zero-width left
    // the mandatory separating space behind at full (heading-sized, for
    // headings) width, reading as a stray gap before the content instead of
    // a flush WYSIWYG line — found by measuring actual rendered layout in a
    // real browser, not from the jsdom suite (which only ever asserted a
    // class was present, never the resulting size/gap).
    const doc = "# Heading\n\n> Quote\n\nfar away paragraph";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();
    view.dispatch({ selection: EditorSelection.cursor(doc.length) });

    expect(hiddenMarkerTexts(view)).toEqual(["# ", "> "]);
    // The space is hidden, not deleted — still real, still in the document.
    expect(view.state.doc.toString()).toBe(doc);
  });

  it("hides a link's URL destination alongside its brackets/parens, not just the marker punctuation", async () => {
    // Regression test: URL is its own node (sibling to LinkMark, not itself
    // Mark-suffixed), so the generic marker-hiding rule left it fully
    // visible even once "[", "]", "(", ")" all hid — the link text then sat
    // directly against the raw URL with no separator at all (e.g.
    // "documenthttps://example.com"), found from a real screenshot, not
    // assumed.
    const doc = "A [document](https://example.com) link.\n\nfar away paragraph";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();
    view.dispatch({ selection: EditorSelection.cursor(doc.length) });

    expect(hiddenMarkerTexts(view)).toEqual(["[", "]", "(", "https://example.com", ")"]);
    // The link text itself stays fully visible, unlike its markers/URL.
    expect(view.contentDOM.textContent).toContain("document");
    // Nothing was deleted from the underlying document.
    expect(view.state.doc.toString()).toBe(doc);
  });

  it("reveals a link's full raw markdown, URL included, once the cursor enters it", async () => {
    const doc = "A [document](https://example.com) link.";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();
    view.dispatch({ selection: EditorSelection.cursor(doc.indexOf("document")) });

    expect(hiddenMarkerTexts(view)).toEqual([]);
  });

  it("does not sweep a space into inline markers that sit directly against their content", async () => {
    // CodeMark has no CommonMark requirement for a separating space, unlike
    // HeaderMark/ListMark/TaskMarker/QuoteMark — a leading space right after
    // an opening backtick is meaningful content the user typed (it's part of
    // CommonMark's own single-space-stripping convention for inline code,
    // itself a rendering concern, not this reveal layer's), so it must never
    // be swallowed into the hidden decoration alongside the marker.
    const doc = "far away paragraph\n\n` code`";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();
    view.dispatch({ selection: EditorSelection.cursor(0) });

    expect(hiddenMarkerTexts(view)).toEqual(["`", "`"]);
  });

  it("recomputes decorations on a granularity change alone, with no document or selection change", async () => {
    const doc = "line one **bold** end";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();

    // Cursor elsewhere on the line, but away from the construct itself.
    view.dispatch({ selection: EditorSelection.cursor(0) });
    expect(hiddenMarkerTexts(view)).toEqual(["**", "**"]);

    // Switching to line granularity, with NO document/selection change,
    // reveals the construct because the cursor's line contains it — this is
    // the exact case the prototype spike found broken (a granularity change
    // sets none of ViewUpdate's own docChanged/selectionSet/viewportChanged
    // flags).
    view.dispatch({ effects: setGranularityEffect.of("line") });
    expect(hiddenMarkerTexts(view)).toEqual([]);
  });

  it("line granularity reveals every marker on the caret's line; construct granularity reveals only the containing construct", async () => {
    const doc = "**a** plain **b**";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();

    // Cursor inside the first bold construct ("**a**", positions 0-5).
    view.dispatch({ selection: EditorSelection.cursor(2) });

    view.dispatch({ effects: setGranularityEffect.of("construct") });
    expect(hiddenMarkerTexts(view)).toEqual(["**", "**"]); // only "**b**" hidden

    view.dispatch({ effects: setGranularityEffect.of("line") });
    expect(hiddenMarkerTexts(view)).toEqual([]); // whole line revealed
  });

  it("a real touch pointerdown switches to line granularity; a real mouse pointerdown switches back", async () => {
    const doc = "**a** plain **b**";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();

    // Cursor inside the first construct only.
    view.dispatch({ selection: EditorSelection.cursor(2) });
    expect(hiddenMarkerTexts(view)).toEqual(["**", "**"]); // "**b**" hidden, construct granularity by default

    view.contentDOM.dispatchEvent(pointerDownEvent("touch"));
    expect(view.state.field(granularityField)).toBe("line");
    expect(hiddenMarkerTexts(view)).toEqual([]); // whole line revealed

    view.contentDOM.dispatchEvent(pointerDownEvent("mouse"));
    expect(view.state.field(granularityField)).toBe("construct");
    expect(hiddenMarkerTexts(view)).toEqual(["**", "**"]); // back to construct-only reveal
  });

  it("stays fast on a 10,000-line document — decoration work is bounded by the viewport, not the document", async () => {
    const doc = Array.from({ length: 10_000 }, (_, i) => `line ${i} **bold** text`).join("\n");
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();

    const start = performance.now();
    view.dispatch({ selection: EditorSelection.cursor(0) });
    view.dispatch({ selection: EditorSelection.cursor(doc.length) });
    const elapsedMs = performance.now() - start;

    // computeDecorations iterates view.visibleRanges (bounded by the
    // rendered viewport), not the full 10,000-line syntax tree — if it ever
    // regressed to walking the whole document per keystroke, this would be
    // orders of magnitude slower than this threshold.
    expect(elapsedMs).toBeLessThan(500);
  });

  it("suspends decoration recomputation entirely while an IME composition is active", async () => {
    const doc = "before **bold** after";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();

    view.dispatch({ selection: EditorSelection.cursor(0) });
    expect(hiddenMarkerTexts(view)).toEqual(["**", "**"]);

    view.contentDOM.dispatchEvent(new CompositionEvent("compositionstart"));
    // A selection change that would normally reveal the construct — must be
    // ignored while composing.
    view.dispatch({ selection: EditorSelection.cursor(10) });
    expect(hiddenMarkerTexts(view)).toEqual(["**", "**"]);

    view.contentDOM.dispatchEvent(new CompositionEvent("compositionend"));
    // The next state change after composition ends recomputes normally.
    view.dispatch({ selection: EditorSelection.cursor(10) });
    expect(hiddenMarkerTexts(view)).toEqual([]);
  });
});
