# Phase 05 Journal: Form Integration, Limits and Messages

Progress, decisions and notes logged as tasks are addressed. Entries are appended by whoever works
a task — the tasks file tracks status, this file records why things happened.

## Log

### 2026-07-29 - All tasks: form control props, placeholder, maxLength, message namespace
**Agent:** frontend work (self, not delegated)  **Status:** Completed

**Work Done:** All five tasks — see `phase-05-tasks.md`'s per-task **Note** blocks for full detail.
Summary of what shipped:
- `id`/`error`/`errorMessage`/`required` props on `CuiMarkdownEditor`, applied (with
  `aria-invalid`/`aria-required`) to the editable surface itself via a new
  `contentAttrsCompartment` — not the outer wrapper, so `<label for>` actually works.
- `maxLength`: an `EditorState.transactionFilter` that refuses (never truncates) an edit or paste
  that would exceed the limit; a live `docLength`-driven counter; an `externalSync` transaction
  annotation exempting the host's own `modelValue` sync from the guard.
- `src/messages.ts`: a `markdownEditor` namespace on clean-ui's `CuiMessageNamespaces` seam, flat
  rather than grouped (see the Decisions below), covering every user-visible string this package
  renders. `CommandContext.messages` threads the resolved catalog into the two dialogs, which mount
  as detached Vue apps with no `inject()` path to the host's `CuiConfigProvider`.
- `docs/plans/markdown-editor-phase-1` and `apps/docs/src/pages/LocalizationPage.vue` updated.

**Decisions Made:**
- **`CuiMarkdownEditor` does not extend `FormControlProps` directly, and does not render its own
  label/description.** Investigated clean-ui's actual idiom before writing any code: neither
  `CuiInput` nor `CuiTextarea` extends that interface — `CuiFormField` is the real wrapper
  (label/description/required-indicator via provide/inject), and a wrapped control only owns
  `id`/`error`/`errorMessage`/`disabled`/`readonly` + `aria-invalid` itself. Followed the same split
  rather than inventing a new pattern — "renders identically to a sibling `CuiTextarea`" is then true
  by construction, both wrapped in the same `CuiFormField`.
- **Found and filed a real clean-ui core bug, didn't fix it in this plan.** Neither `CuiInput` nor
  `CuiTextarea` declares an `id` prop, so `CuiFormField`'s generated id lands on their outer wrapper
  `<div>` (plain attrs fallthrough) instead of the native `<input>`/`<textarea>` — `<label for>`
  never resolves to anything focusable. Filed as
  [itguy614/clean-ui#78](https://github.com/itguy614/clean-ui/issues/78); `CuiMarkdownEditor` places
  `id` on its own editable surface correctly and does not copy the bug. `form-parity.test.ts`
  documents the asymmetry with a passing assertion rather than papering over it.
- **The message catalog namespace is flat, not grouped, based on a real type-check failure, not a
  style preference.** First wrote `markdownEditor: { toolbar: { bold, italic, ... }, ... }` (mirroring
  how the spec's own FR31 prose reads) — `vue-tsc` rejected a single-field override
  (`{ toolbar: { bold: "Gras" } }`) because clean-ui's shared `DeepPartialMessages` only makes a
  `CuiMessages` namespace's own top-level fields independently optional, one level deep; a nested
  group one level further down isn't itself partial, so it would force supplying *every* field in
  that group to change just one. Flattened to ~40 top-level fields (`toolbarBold`, `linkDialogTitle`,
  ...) instead, verified by re-running the same override through `vue-tsc` successfully.
- **`CommandContext` gained a `messages` getter, not a Vue-provide/inject workaround.** The link/image
  dialogs mount as detached `createApp()` instances (Phase 04's `mountStandaloneDialog`), which have
  no `inject()` path back to the host's `CuiConfigProvider`. Considered copying the host app's
  internal `_context.provides` onto the new app — rejected as reaching for an unsupported internal
  API when a plain, typed prop (`context.messages`, mirroring the existing live `doc`/`selection`
  getters) does the same job with no Vue internals and no extra runtime wiring.
- **`resolveCommandLabel` derives a built-in command's catalog key by convention**
  (`` toolbar${Capitalized(commandId)} ``) instead of a hand-maintained id→key lookup table, so a
  future built-in command needs only a correctly-named field in `messages.ts`, nothing else.

**Verification:**
- 195 tests in `@itguy614/clean-ui-editor` (up from 181 at the start of this phase): 29 form-control
  tests (id/aria-invalid/aria-required placement and reactivity, error border+message, disabled tab
  order, readonly), 1 placeholder test, 8 maxLength tests (counter, refusal, no-truncation, external
  sync exemption, no-split-construct), 4 form-parity tests, 8 pure message-merge/resolve/pick unit
  tests, 6 functional localization tests, plus the carried-forward Phase 01–04 suites. A new
  `messages.test-d.ts` (mirroring clean-ui's own `messages.test-d.ts` pattern) checked via a new
  `tsconfig.typecheck.json`.
- Real-browser verification (temporary, deleted `.dev-harness/` each time, Playwright): id/aria
  attributes land on the correct element and NOT the wrapper; a contenteditable surface's
  `<label for>` does not transfer focus on click in a real browser (documented platform limitation,
  not a bug); genuine keystrokes stop accepting input exactly at `maxLength`; a real OS clipboard
  paste that would exceed the limit is refused with the correct overage message and nothing pasted,
  while a paste that fits is accepted; a localized catalog's strings appear correctly in the real
  interactive slash-menu completion list and in the detached link dialog, with an untouched sibling
  string still showing its English default.
- Full workspace regression: `pnpm -r build`, `pnpm -r --if-present test` (443 clean-ui tests + 195
  clean-ui-editor tests, all green), `pnpm verify:fixture` (packed-tarball install, fixture
  guarantees, and bundle budget — 54.8 kB delta against a 65 kB budget) all pass after this phase's
  changes.

<!-- Template:
### YYYY-MM-DD - Task N.G.T: Title
**Agent:** {agent}  **Status:** {Started|Completed|Blocked}
**Work Done:**
**Decisions Made:**
**Notes:**
-->

<!-- Template:
### YYYY-MM-DD - Task N.G.T: Title
**Agent:** {agent}  **Status:** {Started|Completed|Blocked}
**Work Done:**
**Decisions Made:**
**Notes:**
-->
