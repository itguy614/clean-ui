# Markdown Editor Phase 1 Implementation Plan

## Overview

The v1 editor: `@itguy614/clean-ui-editor`, a markdown editor where markdown text is the document,
CodeMirror 6 provides the buffer, and syntax markers hide until the caret enters the construct.
Ships with a plugin API expressive enough that its own built-in actions use it, an injectable
render adapter so no renderer lands in the core bundle, and a construct policy that makes
excluding a plugin mean the construct cannot enter the document.

Out of scope for this plan, in the order they follow: image upload, tables as a complete feature,
rendered widgets, split preview, and a plugin tier for custom markdown syntax.

## Specification Source

- `docs/features/markdown-editor.md` — 44 functional and 12 non-functional requirements
- `docs/platform/multi-package-build-and-release.md` — packaging and verification requirements

## Status

| Status      | Count |
| ----------- | ----- |
| Complete    | 42    |
| In Progress | 0     |
| Not Started | 0     |
| Blocked     | 0     |
| Deferred    | 2     |

**Overall Progress:** 100% (42/44 complete, 2 deferred — plan complete)

## Phases

| #   | Phase                                                    | Status      | Progress |
| --- | -------------------------------------------------------- | ----------- | -------- |
| 01  | [Package Scaffold and Editor Foundation](./phase-01/)    | Complete    | 7/7      |
| 02  | [Reveal Layer and Theming](./phase-02/)                  | Complete    | 5/7 (2 deferred) |
| 03  | [Plugin System](./phase-03/)                             | Complete    | 8/8      |
| 04  | [Built-in Plugins, Slash Menu and Paste](./phase-04/)    | Complete    | 8/8      |
| 05  | [Form Integration, Limits and Messages](./phase-05/)     | Complete    | 5/5      |
| 06  | [Render Subpath](./phase-06/)                            | Complete    | 4/4      |
| 07  | [Documentation Site](./phase-07/)                        | Complete    | 5/5      |

## Architecture Decisions

Settled during specification; recorded here because a task list read on its own invites
re-litigating them.

- **Markdown is the document.** No rich-text model, so no conversion and no round-trip drift.
  Source mode is the same buffer with decorations off.
- **The markdown language is built from `@lezer/markdown` with GFM**, not from
  `@codemirror/lang-markdown`, whose static dependency on the HTML language costs 70 kB gzip for
  embedded-HTML support this editor does not use. Its list-continuation commands are imported
  separately, which measurably tree-shakes free of that graph.
- **Hiding uses a mark decoration, never `Decoration.replace()`.** Replace removes characters from
  the DOM and so from the accessibility tree, which the spec forbids.
- **Reveal granularity follows input type:** construct-level for a pointer, whole-line for touch.
- **Commands are synchronous and return a boolean.** Async work goes through seams the editor owns,
  so position validity and undo grouping are solved once rather than per plugin author.
- **The declarative plugin tier must express everything the built-ins need.** If a built-in needs
  privileged access, the tier is wrong — that is a design signal, not an implementation shortcut.
- **CodeMirror is a runtime dependency, re-exported through a subpath.** Plugin authors get
  CodeMirror from this package so a single instance is the default rather than something consumers
  must arrange.

## Dependencies

- **Blocking:** clean-ui 1.2.0 must be published before this package is
  (`docs/plans/clean-ui-1.2-seams/`). Phase 01 can begin against the workspace link, but the
  message namespace (Phase 05) and dark-mode signal (Phase 02) need the seams to exist.
- **Blocking for publish:** the platform plan's Phase 02 and 03 — the fixture verification and the
  publish matrix.
- Phases 02, 03 and 06 are independent of each other once Phase 01 lands and could run in
  parallel; Phase 04 depends on Phase 03, and Phase 05 on Phase 01.

## Verification Debt Carried From the Spike

The prototype validated reveal, accessibility-tree exposure, touch granularity and IME composition
in headless Chrome. It did **not** prove: touch behaviour on a physical device (selection handles,
on-screen keyboard), composition through a real input method, or how the exposed markdown sounds in
a screen reader. Those are tasks in Phase 99 of the platform plan's browser runner and in this
plan's Phase 02, not assumptions.

**Update (Phase 02 complete):** the headless-Chrome-provable half of this debt was discharged with
real Playwright verification — real `pointerType: "touch"` events, a CDP accessibility-tree
extraction proving markers are exposed as `StaticText` regardless of caret position, and dark-mode
compartment reconfiguration without a remount. What no headless environment can provide — a
physical device and a real screen reader — was formally deferred (tasks 2.3.1 and 2.3.2, see
`phase-02/phase-02-tasks.md`) rather than claimed complete. This remains outstanding for a later
pass with the right hardware/software available.
