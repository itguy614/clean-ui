# Phase 01 Journal: API Seams

Progress, decisions and notes logged as tasks are addressed. Entries are appended by whoever works
a task — the tasks file tracks status, this file records why things happened.

## Log

### 2026-07-29 - Task 1.1.1–1.1.3: Message namespace augmentation
**Agent:** claude (direct implementation, no subagent delegation)  **Status:** Completed

**Work Done:**
- Added an empty `CuiMessageNamespaces` interface to `messages.ts`; `CuiMessages extends`
  it. Exported the new interface from the barrel alongside `CuiMessages`.
- Added a "satellite package" card to `LocalizationPage.vue` with a copyable `declare module`
  example, and mentioned satellite namespaces in the existing namespace list.
- Added `src/messages.test-d.ts`, a Vitest type-level test (`expectTypeOf`/`@ts-expect-error`)
  wired via `test.typecheck` in `vitest.config.ts` with a dedicated `tsconfig.typecheck.json`.

**Decisions Made:**
- The type-test fixture augments `CuiMessageNamespaces` against **`../dist/messages`** (the built
  declarations), not the `./messages` source. Declaration merging is whole-program: augmenting the
  interface from a file that shares a program with `messages.ts`'s own `defaultMessages` literal
  makes that literal fail its own type-check (a required property appears missing), which doesn't
  happen for a real satellite package because it only ever sees the compiled `.d.ts`, never that
  literal. Consequence: this one test file requires `pnpm build` to have run first. CI already
  builds before testing, so this is transparent there; noted with a comment in the fixture for
  local development.
- `tsconfig.typecheck.json` sets `noEmit: true` but does NOT try to turn off the inherited
  `declaration`/`declarationDir`/`declarationMap` — TypeScript rejects `declarationDir`/`Map`
  without `declaration` (or `composite`) also being truthy, so overriding `declaration: false`
  alone breaks config validation. Left the inherited values in place; `noEmit` makes them moot.
- `**/*.test-d.ts` added to the package tsconfig's `exclude` alongside `**/*.test.ts`, so the
  fixture never gets emitted into `dist` by the normal build's `vue-tsc --emitDeclarationOnly`.

**Files Created/Modified:**
- `packages/clean-ui/src/messages.ts`, `packages/clean-ui/src/index.ts`
- `apps/docs/src/pages/LocalizationPage.vue`
- `packages/clean-ui/src/messages.test-d.ts` (new)
- `packages/clean-ui/tsconfig.json`, `packages/clean-ui/tsconfig.typecheck.json` (new)
- `packages/clean-ui/vitest.config.ts`

**Tests:**
- `messages.test-d.ts` (2 type-level tests via `vitest`'s `typecheck` runner, checker `vue-tsc`): Pass
- `pnpm --filter @itguy614/clean-ui-docs exec vue-tsc --noEmit`: Pass

---

### 2026-07-29 - Task 1.2.1–1.2.3: `useColorScheme` composable
**Agent:** claude (direct implementation)  **Status:** Completed

**Work Done:**
- Added `composables/useColorScheme.ts`: takes the calling component's root template ref, walks
  its ancestor chain for a `.dark` class, and stays reactive via a `MutationObserver` on
  `document.documentElement` (`subtree: true`, `attributeFilter: ["class"]`), filtered to mutations
  whose target is one of the component's own ancestors. Exported from the barrel.
- Audited the codebase for existing hand-rolled dark-mode detection in JS (`grep` for
  `MutationObserver`, `classList.contains("dark")`, `prefers-color-scheme`, `isDark`,
  `getComputedStyle`): none found. `CuiColorPicker`'s existing `MutationObserver` watches for
  *theme-preset* class changes (`cui-theme-*`), a different concern, and was left untouched.
  Task 1.2.2's acceptance criteria hold trivially — no migration needed, no visual change, since
  nothing changed.
- Added `useColorScheme.test.ts` covering: no dark ancestor, a dark ancestor, two differently-
  scoped subtrees disagreeing, toggling a class after mount, and observer disconnection on
  unmount (via a `MutationObserver.prototype.disconnect` spy).

**Decisions Made:**
- Followed this codebase's existing composable convention (`useClickOutside`) of taking an
  explicit `Ref<HTMLElement | ...>` rather than introspecting the caller via `getCurrentInstance()`
  — more explicit, more testable, and consistent.
- Deferred the literal "renders without DOM access" SSR assertion to Phase 02 Task 2.3.1 (the
  node-environment vitest project), per that task's own framing — jsdom always provides a DOM, so
  it cannot prove the no-DOM-access property; only a real node-environment render can. The
  composable is written to be SSR-safe by construction (all `document`/`MutationObserver` access
  is inside `onMounted`, which never runs during server rendering) and is covered by jsdom tests
  for the reactive/scoping/cleanup behaviour now.

**Files Created/Modified:**
- `packages/clean-ui/src/composables/useColorScheme.ts` (new)
- `packages/clean-ui/src/composables/__tests__/useColorScheme.test.ts` (new)
- `packages/clean-ui/src/index.ts`

**Tests:**
- `useColorScheme.test.ts` (5 tests): Pass

---

### 2026-07-29 - Task 1.3.1–1.3.2: `version` export and duplicate-instance guard
**Agent:** claude (direct implementation)  **Status:** Completed

**Work Done:**
- Added `src/version.ts` exporting `version`, backed by a `__CUI_VERSION__` identifier replaced at
  build time via Vite's `define` (both `vite.config.ts` and `vitest.config.ts`, reading
  `package.json` with `node:fs` rather than importing it — importing JSON directly from `src`
  would put `package.json` under `vue-tsc`'s `rootDir`-checked program and violate `rootDir`).
- Added `src/duplicate-guard.ts`: `registerInstance(current, g = globalThis)` stamps
  `g.__CUI_INSTANCE__` on first load and calls the existing `warnOnce` (from `utils/devWarn.ts`,
  already used by `CuiIcon`/`warnVariantColor`) on a version mismatch, naming both versions and
  suggesting dedupe-or-widen-the-peer-range. Wired into the barrel as `import "./duplicate-guard"`
  (side-effect only, runs before any component import) at the very top of `index.ts`.
- Added `version.test.ts` (compares against `package.json` via `node:fs`, matching the
  `builtin.test.ts` convention of `resolve(__dirname, ...)` rather than `import.meta.url` — the
  latter threw `TypeError: The URL must be of scheme file` under this Vitest/jsdom setup) and
  `duplicate-guard.test.ts` (silent on first use, silent on a repeated identical version, warns
  exactly once naming both versions on mismatch, no re-warn on a repeated identical mismatch).

**Decisions Made:**
- **Real bug found and fixed during this task, worth flagging for Phase 02 Task 2.1.3's
  `sideEffects` audit:** adding `"./dist/duplicate-guard.js"` to `package.json`'s `sideEffects`
  array was not sufficient to keep the module in clean-ui's *own* build — Vite/Rollup's internal
  tree-shaking, when a `sideEffects` array is present at all, treats any module not matching one
  of its globs as pure, and matches against the **source** path being bundled (`src/duplicate-
  guard.ts`), not the eventual dist path. The bare `import "./duplicate-guard"` (no bindings used)
  was silently dropped from `dist/index.js` — confirmed by importing the built output directly
  (`globalThis.__CUI_INSTANCE__` stayed `undefined`) and bisected by setting `sideEffects: true`
  (file reappeared), then narrowing to adding `"./src/duplicate-guard.ts"` alongside the dist
  entry (fixed, file reappeared with the array still present). Both entries are now in
  `sideEffects`: the `dist` one for downstream consumers' bundlers, the `src` one for clean-ui's
  own build. Verified end-to-end with a Node script dynamically importing the real
  `dist/index.js` and reading `globalThis.__CUI_INSTANCE__` after import.
- `registerInstance` takes an injectable `g` parameter (defaulting to `globalThis`) specifically
  so tests can pass isolated plain objects instead of mutating real `globalThis` — no
  `vi.resetModules()` gymnastics needed to simulate "two copies."

**Files Created/Modified:**
- `packages/clean-ui/src/version.ts`, `packages/clean-ui/src/duplicate-guard.ts` (new)
- `packages/clean-ui/src/__tests__/version.test.ts`, `packages/clean-ui/src/__tests__/duplicate-guard.test.ts` (new)
- `packages/clean-ui/src/index.ts`
- `packages/clean-ui/vite.config.ts`, `packages/clean-ui/vitest.config.ts`
- `packages/clean-ui/package.json` (`sideEffects`)

**Tests:**
- `version.test.ts` (1 test): Pass
- `duplicate-guard.test.ts` (4 tests): Pass
- Manual: `node -e "import('./packages/clean-ui/dist/index.js')..."` — confirms `version` export
  and `globalThis.__CUI_INSTANCE__` stamping work against the real built artifact.

---

### 2026-07-29 - /simplify pass
**Status:** Completed

Reviewed the full Phase 01 diff for reuse, simplification, efficiency, and altitude issues.

**Fixed:** `useColorScheme.ts` gave every call site its own `MutationObserver`, each observing the
*entire* document subtree (`subtree: true` on `document.documentElement`) — on a page with many
dark-aware components (the composable's whole use case: e.g. several syntax-highlighted code
blocks), that's N redundant native observers all watching the same tree. Replaced with one shared
module-scope `MutationObserver` and a subscriber set, mirroring the existing shared-listener
pattern in `useBreakpoint.ts`; the observer is created lazily on first subscriber and disconnected
when the last one unsubscribes. Also dropped the per-instance ancestor-`Set` mutation filtering
(each subscriber's resync is a cheap, idempotent ancestor walk, so broadcasting to all subscribers
on any class mutation is simpler than filtering per-instance) and the `watch(target, ...)`
re-observe path (untested, not required by any acceptance criterion, and a template ref does not
change to a different element for this composable's intended usage). Re-ran the full build + test
suite after the change; all 438 tests (including `useColorScheme.test.ts`) still pass.

**Considered, not changed:** `vite.config.ts` and `vitest.config.ts` both read + `JSON.parse`
`package.json` in an identical two-line snippet. Left as-is — two call sites, two lines, and the
files are conceptually independent build/test configs; extracting a shared helper module for this
would be the premature abstraction this repo's conventions explicitly avoid.

**Considered, not changed:** the `sideEffects` array's two entries for `duplicate-guard` (one
`src`, one `dist`) look like a special case rather than a general policy. Correct to leave
special-cased here — generalizing "how does a bare side-effect-only module in `src/` get declared"
into a documented rule is explicitly Phase 02 Task 2.1.3's remit, already cross-referenced above;
doing it now would preempt that task.

---

### 2026-07-29 - Phase 01 complete
**Status:** All 8 tasks complete. Full suite: `pnpm --filter @itguy614/clean-ui build` and
`pnpm --filter @itguy614/clean-ui test` (438 tests + 2 type-level tests, 18 pre-existing skips,
all green) and `pnpm --filter @itguy614/clean-ui-docs exec vue-tsc --noEmit` all pass.

**Note for Phase 02 (Task 2.1.3, sideEffects audit):** the `src`-path `sideEffects` entry
discovered above is worth generalizing/documenting — any future bare side-effect-only import
inside `src/` will need the same treatment, or it will silently vanish from `dist` the same way.

**Note for Phase 02 (Task 2.3.1, node-environment tests):** `useColorScheme`'s "no DOM access
during SSR" property is asserted by construction and jsdom-level cleanup tests here, but not yet
by an actual server-render. Once the node-environment vitest project exists, add a case rendering
a component that calls `useColorScheme` through `@vue/server-renderer`'s `renderToString`.
