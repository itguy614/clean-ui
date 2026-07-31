# Feature: Markdown Editor, Phase 1.5 and Beyond

**Status**: Not started — successor scope, extracted from the v1 specification
**Created**: 2026-07-31
**Predecessor**: `docs/features/markdown-editor.md` (v1, implemented)

## Purpose

Everything deliberately excluded from the editor's v1, held here so the v1 specification describes
only what was built. Nothing in this document has been planned or scheduled; picking any of it up
starts with a plan, as v1 did.

Read the v1 specification first. Its requirements still hold — this is additive scope, and the
invariants listed below are the ones later phases must not quietly break.

## State at Hand-off

v1 shipped: markdown-as-truth editing in CodeMirror 6, marker reveal on caret entry with
construct granularity for pointer input and line granularity for touch, `wysiwyg` and `source`
modes over one buffer, the plugin API with its declarative and raw tiers, every built-in
formatting action written as an ordinary plugin, the slash menu, HTML-to-markdown paste under the
construct policy, form-control integration with a refusing `maxLength`, a localised message
namespace, the opt-in render subpath, and a documentation site.

Two things a successor phase inherits:

- **Deferred verification.** Two v1 tasks were formally deferred because they need hardware and
  software the implementing environment lacked: touch behaviour on a physical device, and a real
  screen-reader pass. Automated proxies did cover what they could — real `pointerType: "touch"`
  events switching reveal granularity, and an accessibility-tree extraction confirming the
  markdown including markers is exposed as static text beneath the editor's textbox role — and
  those results should not be re-derived. What remains is device- and assistive-technology
  specific: selection handles, caret placement by tap, on-screen keyboard behaviour, and how the
  exposed markers actually sound.
- **No committed bundle budget for the editor.** `fixtures/size-budget.json` carries an entry for
  clean-ui only. The editor's own budget (the v1 specification set 130 kB gzip) is not yet gated
  in CI, so nothing currently fails when the editor grows. Every phase below adds weight —
  uploads, table widgets, rendered blocks — so this should be closed before, not after, that
  weight arrives.

## Invariants Later Phases Must Preserve

These are v1 guarantees that widget and upload work is most likely to erode.

- **No markdown-to-HTML renderer or sanitiser in the core entry, at any phase.** Widgets are built
  by constructing DOM from the parse tree, never by producing HTML strings. The moment a table
  widget takes a shortcut through HTML, the guarantee is gone and the render subpath's isolation
  becomes decorative.
- **Hiding stays visual only.** Characters remain in the DOM and therefore in the accessibility
  tree. A widget that replaces a range removes its text from both, so any widget must decide
  deliberately what a screen reader encounters in its place.
- **Commands stay synchronous, returning a boolean.** Asynchronous work goes through seams the
  editor owns. The reservation seam described under uploads is the one v1 anticipated but did not
  ship.
- **The construct policy remains derived from the loaded plugin set**, and covers commands, the
  slash menu, paste conversion and decoration. A new construct means a plugin that declares it,
  not a special case.
- **A single CodeMirror instance.** Plugin authors take CodeMirror from this package's subpath.
  New dependencies must not reintroduce a second copy.
- **Lockstep versioning.** These packages share one version; a satellite release depending on a
  new clean-ui seam must not reach `master` before the clean-ui release providing it.

## Phase 1.5: Split Preview

Source and rendered preview side by side. Deferred from v1 only because it needs a renderer, which
the render subpath now provides.

- Requires a `render` adapter to be supplied or the render subpath imported; the mode must not be
  offered when neither is present, rather than being offered and failing.
- Scroll synchronisation between source and preview is the substantive design question — line
  mapping is approximate for any construct that does not render one-to-one, and getting it subtly
  wrong is worse than not syncing at all.
- The existing mode model is a two-value union with a built-in toggle; adding a third value affects
  the toggle, the announced mode change, and any consumer driving `mode` themselves.

## Phase 2

In the order agreed during v1 specification. Image upload heads the list because pasting a
screenshot is the most likely first request from the first integration.

### Image upload

The interaction was designed during v1 specification and deliberately not built; it is recorded
here so it is not re-litigated.

- An `upload` prop receives the file and resolves with a URL. Its absence keeps v1's behaviour:
  the file is refused with a localised message.
- On paste or drop, insert a localised placeholder immediately, then replace exactly that range on
  success. The range is mapped through subsequent edits, so the image lands correctly even if the
  user keeps typing — this is the reservation seam the command context anticipated.
- On failure the placeholder is removed and an error surfaces. Nothing is left orphaned in the
  document.
- An `uploading` state is exposed so a form can block submission while a placeholder exists, which
  is what stops a placeholder ever being saved.
- Open questions for the plan: concurrent uploads and their ordering, retry affordance, whether the
  placeholder is editable text or an atomic range, and what happens when a user deletes a
  placeholder whose upload is still in flight.

### Tables as a complete feature

v1 parses, highlights and renders tables but ships no table plugin, deliberately: an insert button
without cell navigation advertises an experience that is not there. Everything arrives together.

- Insert action, Tab and Shift-Tab between cells, a new row at the last cell, row and column
  insertion and deletion, and alignment.
- A rendered table widget, with its own edit and exit-to-source interaction.
- Keeping pipe alignment tolerable while typing is the fiddly part; ragged rows and multi-byte
  characters both break naive column counting.

### Remaining rendered widgets

Inline images, clickable task checkboxes, and syntax-highlighted code fences.

- Each needs an answer to "how do I edit this?" — clicking into it, arrow-keying across it,
  selecting across its boundary, and undo all need per-widget handling. This is where editors of
  this kind accumulate defects, which is why v1 stopped short.
- A clickable checkbox must rewrite the underlying text, so its click is a document edit and one
  undo step like any command.
- Syntax-highlighted fences need language modes, which is new dependency weight: the v1 language
  is built from the markdown parser directly precisely to avoid pulling in HTML, JavaScript and
  CSS grammars. Any fence highlighting must load languages on demand rather than statically, or it
  will undo that 70 kB saving.
- Whether plugins can contribute widgets is an open API question. The raw tier already permits it;
  whether the declarative tier should is a design decision, and it interacts with the construct
  policy.

## Phase 3: Custom Markdown Syntax

A plugin tier for new inline or block constructs with their own grammar extension — the third
option considered and declined for v1.

- Each construct needs a grammar extension plus decoration and serialisation, which is a real jump
  in authoring difficulty from the declarative tier.
- The harder question is degradation: a document containing custom syntax is still markdown for
  every other consumer of that content, including a server-side renderer. The tier must define what
  those consumers see, and the answer cannot be "it depends on the plugin".

## Out of Scope Indefinitely

Not planned, and not expected to be:

- Collaborative or multi-cursor editing, comments, suggestions, revision history. Collaboration is
  technically feasible on this foundation, but it is a different product.
- Footnotes, math and frontmatter as core constructs. Candidates for plugins.
- Image editing, cropping, or media library management beyond the upload hook.

## Where the Detail Lives

- v1 requirements, decisions and their reasoning: `docs/features/markdown-editor.md`
- Packaging, dependency, release and verification requirements:
  `docs/platform/multi-package-build-and-release.md`
- What was actually built, and why decisions changed during implementation:
  `docs/plans/markdown-editor-phase-1/phase-*/phase-*-journal.md`
- The two deferred verification tasks, with their deferral reasons:
  `docs/plans/markdown-editor-phase-1/phase-02/phase-02-tasks.md`
