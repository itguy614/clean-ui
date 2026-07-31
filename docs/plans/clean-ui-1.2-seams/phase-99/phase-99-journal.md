# Phase 99 Journal: Cross-Cutting Concerns

Progress, decisions and notes logged as tasks are addressed. Entries are appended by whoever works
a task — the tasks file tracks status, this file records why things happened.

## Log

### 2026-07-29 - Task 99.1.1: Extend the contrast audit beyond one package
**Agent:** claude (direct implementation)  **Status:** Completed

**Work Done:**
- Split the monolithic `scripts/check-contrast.mjs` (487 lines, entirely clean-ui-specific: hardcoded
  file paths, hardcoded theme list, an inline-duplicated semantic color scale) into:
  - `scripts/contrast/color-math.mjs` — the generic WCAG contrast math + oklch/hex parsing, no
    package-specific knowledge, shared by every package's check module.
  - `scripts/contrast/clean-ui.mjs` — everything clean-ui-specific (theme CSS parsing, the actual
    check list, per-theme pretty-printing), restructured to export `run()` instead of executing at
    import time, returning `{ failures, infoCount, totalChecks }` instead of printing its own
    summary.
  - `scripts/check-contrast.mjs` — now a thin generic runner: a `SOURCES` array (today one entry,
    clean-ui), calls each source's `run()`, and prints one combined summary where each failure is
    tagged with which source it came from.

**Decisions Made:**
- Did not invent a second package's token structure to "prove" multi-package support — the
  editor package doesn't exist yet and its actual CSS shape (theme scale? syntax-highlighting
  token pairs? something else entirely) isn't known. Proved the *mechanism* instead: verified the
  aggregation/failure-reporting logic correctly attributes a failure to its source by simulating a
  second source with a deliberately-failing pair, without fabricating a permanent fake package.
- Never added a `process.exit(1)` on failure — confirmed the original script never had one (this
  has always been a manual/local audit tool, not a CI gate) and preserved that exactly; adding one
  would have been an unrequested behavior change.

**Tests:** Ran the refactored script and diffed its output byte-for-byte against the original
(via `git stash`) — **identical**, confirming zero behavioral drift for clean-ui's existing
coverage. Separately simulated a second source with one deliberately-failing pair and confirmed the
combined summary names it correctly (`[@itguy614/clean-ui-editor] [DARK] Editor ...`).

---

### 2026-07-29 - Task 99.1.2: Record the global-install exception in CLAUDE.md
**Agent:** claude (direct implementation)  **Status:** Completed

**Work Done:** Added the exception directly under checklist step 10 (`Register in index.ts:
... app.component() in plugin`) in `CLAUDE.md` — states that a satellite package with a heavy
dependency graph must NOT do a global `app.component()` install (it would put the whole dependency
tree in every consumer's main bundle and defeat route-level code splitting), with a named-export +
`defineAsyncComponent` usage example for both sides (the satellite package's own `index.ts`, and a
consuming app loading it only where needed).

---

### 2026-07-29 - Task 99.1.3: Reconcile the docs with reality
**Agent:** claude (direct implementation)  **Status:** Completed

**Work Done:**
- The two claims explicitly named by this task ("CONTRIBUTING.md says the docs site consumes the
  built library", "the release instructions predate the matrix") were already fixed incidentally
  by Phase 02 Task 2.3.3 and Phase 03 Task 3.2.2 respectively. This task's remaining scope was the
  broader sanity-check pass across the rest of the contributor documentation.
- Found and fixed a real drift **introduced by this plan's own earlier phases**: Phase 03 changed
  `packages/clean-ui`'s `"test"` script to exclude the browser project (`vitest run --project
  jsdom --project ssr`), but `CONTRIBUTING.md`'s Tests section still said "`pnpm test` runs all of
  them [three projects]" — no longer true. Fixed the wording, and pointed the browser-test
  instructions at the new `pnpm --filter @itguy614/clean-ui test:browser` script instead of the
  longer spelled-out `vitest run --project browser` invocation it referenced before that script
  existed.
- Fixed the "Common commands" comments for `pnpm build`/`pnpm test` (previously said "build the
  library" / "run the test suite" — both now workspace-recursive, not clean-ui-only).
- `CLAUDE.md`'s "Build & Dev" section had the same two issues: `pnpm build` described as building
  "the library" specifically, and "after rebuild, clear docs cache" implying a rebuild is normally
  needed to see docs changes (false — docs aliases to source; the cache only goes stale in the
  rare case of a new file appearing under an aliased path). Rewrote both to match the accurate
  language already established in `CONTRIBUTING.md`.
- Cross-checked `scripts/new-component.mjs`'s actual argument parsing (`GROUPS` array, `--context`/
  `--group` flags) against `CONTRIBUTING.md`'s documented usage and valid `--group` values — exact
  match, no drift found there.

**Tests:** Actually ran the commands rather than just reading them: `pnpm dev` (boots the Vite dev
server correctly), `pnpm build`, `pnpm test`, `pnpm check:contrast`, `pnpm verify:fixture` — all as
documented, all green.

---

### 2026-07-29 - Phase 99 complete — plan complete
**Status:** All 3 tasks complete. This closes out `docs/plans/clean-ui-1.2-seams` — all 4 phases
(25 tasks) done. Final full-workspace verification: `pnpm -r build`, `pnpm -r --if-present test`,
`pnpm check:contrast`, all green, no stray build artifacts in the working tree.
