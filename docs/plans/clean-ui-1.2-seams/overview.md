# clean-ui 1.2.0 Implementation Plan

## Overview

Everything clean-ui must ship before a second published package can exist. Two kinds of work:
three small API seams the editor cannot fake, and the repository machinery that currently
assumes exactly one published package.

This release is a **hard prerequisite** for the editor's first publish. The editor's peer range
resolves against the registry, not the workspace, so 1.2.0 must be on npm before
`@itguy614/clean-ui-editor` is published (platform requirement P16).

## Specification Source

- `docs/platform/multi-package-build-and-release.md` — requirements P1 to P19
- `docs/features/markdown-editor.md` — NFR2 (peer floor and why), NFR5 (message namespace),
  NFR6 (colour-scheme signal)

## Status

| Status      | Count |
| ----------- | ----- |
| Complete    | 17    |
| In Progress | 0     |
| Not Started | 8     |
| Blocked     | 0     |
| Deferred    | 0     |

**Overall Progress:** 68%

## Phases

| #   | Phase                                                        | Status      | Progress |
| --- | ------------------------------------------------------------ | ----------- | -------- |
| 01  | [API Seams](./phase-01/)                                     | Complete    | 8/8      |
| 02  | [Build, Dependencies and Verification](./phase-02/)          | Complete    | 9/9      |
| 03  | [Release Machinery and Docs Deploy](./phase-03/)             | Not Started | 0/5      |
| 99  | [Cross-Cutting Concerns](./phase-99/)                        | Not Started | 0/3      |

## Architecture Decisions

- **Message namespaces are opened by declaration merging, not by an index signature.** An index
  signature would make every message key `any`-ish and lose the type safety the catalog exists
  for. An empty `CuiMessageNamespaces` interface that `CuiMessages` extends lets a satellite
  package augment it and keep full checking.
- **The colour-scheme signal observes an ancestor, not the document.** clean-ui's dark mode is a
  class on any element and may be scoped to a subtree, so a global boolean would be wrong for
  scoped usage. The composable resolves per call site.
- **Dependencies are externalized by rule, never by a maintained list.** The current
  four-specifier literal works only because clean-ui has two dependencies; it silently inlines
  anything a future package forgets to add.
- **Verification happens in a consumer build.** Every guarantee this library advertises has been
  broken at least once (#42, #62) and neither was caught by this repository's own builds, which
  alias the library to source.
- **Versions stay lockstep.** Chosen deliberately over independent versioning: the root
  `VERSION`, root `CHANGELOG.md` and `vX.Y.Z` tags all survive, at the cost of version churn on
  packages that did not change. A changed-files guard stops that churn from republishing
  identical artifacts.

## Dependencies

- No external blockers. All work is inside this repository.
- Phase 03 depends on Phase 02's build changes being in place, since the publish matrix packs
  what the build produces.
- The editor plan (`docs/plans/markdown-editor-phase-1/`) depends on Phase 01 landing, and on
  Phase 02 and 03 before its own publish.
