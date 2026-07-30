# Phase 05: Form Integration, Limits and Messages

## Overview

Make the editor a form control that behaves like every other clean-ui control, and localise it
through the library's catalog. The length limit is the one place copying `CuiTextarea` would be
wrong, because truncating markdown corrupts it.

## Status

| Status      | Count |
| ----------- | ----- |
| Complete    | 5     |
| In Progress | 0     |
| Not Started | 0     |
| Blocked     | 0     |
| Deferred    | 0     |

**Progress:** 5/5 tasks complete

## Agent Assignments

| Agent                                  | Focus Area                   | Tasks         |
| -------------------------------------- | ---------------------------- | ------------- |
| web-developer-tools:frontend-developer | Form control, limits, i18n   | 5.1.1 – 5.2.2 |
| developer-tools:testing-specialist     | Form parity coverage         | 5.1.3         |

## Tasks

### Group 5.1: Form control

#### Task 5.1.1: Compose `FormControlProps`

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | Phase 01 |

**Description:**
Label, description, error, error message, required, readonly and disabled, following the library's
error convention — the wrapper's own border recoloured with the message below — plus `aria-invalid`.
Note the boundary discovered during review: `required` is presentational throughout clean-ui, since
`CuiForm` validates only through a resolver and has no field registration. Do not build a private
validation path here to fake it.

**Acceptance Criteria:**
- [X] Label, description and error render identically to a sibling `CuiTextarea`
- [X] `required` renders the indicator and sets `aria-required`
- [X] `readonly` allows selection but not editing; `disabled` removes it from the tab order
- [X] A resolver error for the field renders on the editor

**Note:** Neither `CuiInput` nor `CuiTextarea` extends `FormControlProps` directly — clean-ui's
actual idiom is the `CuiFormField` wrapper (renders label/description/required indicator via
provide/inject) around a control that only owns `id`/`error`/`errorMessage`/`disabled`/`readonly` +
`aria-invalid` itself (confirmed by reading `CuiFormField.vue` and `CuiTextarea.vue` in full, and by
the `FormPage.vue` docs example: "CuiFormField renders the label + error message; the field shows
the red border"). `CuiMarkdownEditor` follows that same idiom rather than adding its own `label`/
`description` props — "renders identically to a sibling `CuiTextarea`" is satisfied by construction
when both are wrapped in the same `CuiFormField`. Added `id`, `error`, `errorMessage`, `required`
props; all four (plus `aria-invalid`/`aria-required`) are applied to the editable surface itself
(`.cm-content`, `role="textbox"`) via a new `contentAttrsCompartment`, not the outer wrapper — a
`<label for>` pointing at the wrapper's id would never focus anything, since the wrapper isn't the
focusable element. This surfaced a real, pre-existing clean-ui bug: `CuiInput`/`CuiTextarea` have no
`id` prop, so `CuiFormField`'s generated id falls through to their outer wrapper `<div>` via plain
Vue attrs fallthrough, never reaching the native `<input>`/`<textarea>` — filed as
[itguy614/clean-ui#78](https://github.com/itguy614/clean-ui/issues/78) rather than fixed here (out of
scope for this plan; `CuiMarkdownEditor` does not copy the bug). `required`/`aria-required` is a new
capability neither sibling has today — `CuiFormField`'s own `required` prop only renders the visual
asterisk next to the label and does not forward `required` through its slot bindings, so a consumer
sets `required` on both `CuiFormField` (for the indicator) and `CuiMarkdownEditor` (for
`aria-required`) — redundant but consistent with "required is presentational throughout clean-ui."
Real-browser verification (Playwright): id/aria-invalid/aria-required land on the correct element;
clicking a `<label for>` pointing at a contenteditable surface does **not** transfer focus in any
real browser (contenteditable isn't on HTML's "labelable elements" list — same limitation every
contenteditable-based editor has, not something `for`/`id` wiring can fix); direct focus + real
typing works correctly. 29 new/updated jsdom tests plus a dedicated `form-parity.test.ts` (mounts a
`CuiTextarea` and `CuiMarkdownEditor` side by side inside real `CuiForm`/`CuiFormField` wiring,
asserting parity — the documented jsdom-safe set task 5.1.3 asks for).

---

#### Task 5.1.2: Placeholder and empty state

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | low |
| Dependencies | 5.1.1 |

**Description:**
A `placeholder` prop for the empty state, matching `CuiInput` and `CuiTextarea`. Small, and its
absence would be noticed immediately by anyone dropping the editor into an existing form.

**Acceptance Criteria:**
- [X] Placeholder shows only when the document is empty
- [X] It is not selectable and never becomes part of the value
- [X] Styled with the same token as sibling controls

**Note:** Already substantially implemented in Phase 01 (`placeholder` prop wired to CodeMirror's
own `placeholder()` extension, `.cm-placeholder { color: var(--cui-text-tertiary) }` — the same
token `CuiInput`/`CuiTextarea` use for their native `::placeholder`). This task added the missing
test coverage rather than new code: a jsdom test confirming the placeholder appears only on an empty
doc, disappears immediately on the first keystroke, and reappears (with the document still reading
empty, not the placeholder text) after deleting back to empty. CodeMirror's placeholder is a widget
decoration, not a real text node, so "not selectable/never part of the value" holds by construction.

---

#### Task 5.1.3: Form parity tests

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | testing-specialist |
| Complexity | medium |
| Dependencies | 5.1.1 |

**Description:**
Assert parity with a sibling control rather than asserting the editor's own markup: same label
association, same error presentation, same resolver behaviour. Parity is the actual requirement, and
it survives refactors that a markup snapshot would not.

**Acceptance Criteria:**
- [X] A form containing both an editor and a textarea presents both identically
- [X] These assertions run in the jsdom project, and are the documented jsdom-safe set for consumers

**Note:** `src/components/__tests__/form-parity.test.ts` — mounts `CuiTextarea` and
`CuiMarkdownEditor` as siblings, each inside its own `CuiFormField` bound to a real `CuiForm`
(`v-bind="f"` — the exact idiom `FormPage.vue` documents). Asserts: the required indicator renders
identically for both; `form.setErrors(...)` puts both into the identical error-presented state
(same message text via `CuiFormField`'s own footer, same `aria-invalid`, same error-border class on
each control) and clears identically; and documents (with a passing assertion, not a skip) the one
real asymmetry found — `CuiTextarea`'s label-`for` target is broken (see 5.1.1's note and
[#78](https://github.com/itguy614/clean-ui/issues/78)) while `CuiMarkdownEditor`'s is not.

---

### Group 5.2: Limits and localisation

#### Task 5.2.1: `maxLength` that refuses rather than truncates

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 5.1.1 |

**Description:**
Count markdown source characters, since that is what a storage column holds, and show a counter as
`CuiTextarea` does. Reject the edit that would exceed the limit instead of truncating: cutting at a
character boundary can split a link or open a code fence and corrupt everything after it. An
oversized paste is refused with the overage stated.

**Acceptance Criteria:**
- [X] Typing stops at the limit; the counter shows the error state
- [X] An oversized paste is refused with a message naming the overage, and inserts nothing
- [X] No document is ever left with a split construct or an opened fence
- [X] Documentation states the limit is client-side only and storage must be validated server-side

**Note:** Implemented as a CodeMirror `EditorState.transactionFilter`, not a change filter — it sees
the *resulting* document as a whole, so it can refuse the entire edit outright rather than truncate
at a character boundary (the naive alternative FR32 explicitly rejects, since it can split a link or
leave a fence open). The filter reads `props.maxLength` live through a closure, so no
Compartment/reconfigure is needed when the prop itself changes. A new `externalSync` transaction
annotation exempts the host's own `modelValue` sync from the guard — the limit governs *edits and
pastes*, not whatever a host supplies to display (matching the value contract's "never rewrites
content the user did not edit"), so a document already over length before a limit existed still
displays correctly rather than being silently rejected. `handlePaste` now measures the *resulting*
document length before dispatching (for both the HTML-converted and plain-text paste paths) and
refuses with a message stating the exact overage, matching the emit path a synthetic per-keystroke
event has no equivalent for. A live `docLength` ref (updated from the `updateListener`, not derived
from the possibly-throttled `modelValue` prop) drives an always-correct counter and its
`>= limit` (not `>` — the document can never actually exceed the limit, per the refusal itself)
error-state styling. 8 new jsdom tests plus real-Playwright-browser verification: genuine keystrokes
stop accepting input past the limit, a real OS clipboard paste that would exceed it is refused with
the correct message and nothing pasted, and a paste that fits is accepted — this last check matters
because it proves the guard isn't simply blocking all paste, only oversized ones.

---

#### Task 5.2.2: Message namespace

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | clean-ui 1.2.0 |

**Description:**
Every user-visible string — toolbar labels, dialog fields, refusal messages, the mode toggle, slash
menu entries, counter text — resolves through clean-ui's catalog under this package's namespace,
declared via the augmentation seam so it is typed rather than loose.

**Acceptance Criteria:**
- [X] No user-visible string is hardcoded in a component
- [X] A consumer overrides any string through a custom catalog, with type checking
- [X] The namespace appears in the Localization documentation

**Note:** `src/messages.ts` augments `CuiMessageNamespaces` (clean-ui's own extension point, added in
the 1.2.0 seams work specifically for this) with a `markdownEditor` namespace and ships its English
`defaultMarkdownEditorMessages`. **Deliberately flat** (`toolbarBold`, not `toolbar: { bold }`) —
discovered via a real `vue-tsc` type error that clean-ui's shared `DeepPartialMessages` only makes a
namespace's own top-level fields independently optional; a nested group one level further down would
force overriding *every* field in that group just to change one (confirmed empirically, not assumed
— see the file's own doc comment). Flattening ~40 fields keeps every single string independently
type-checked overridable, matching the AC literally.

Two rendering paths needed different plumbing: (1) `CuiMarkdownEditorToolbar.vue` and
`CuiMarkdownEditor.vue`'s own template read `useMarkdownEditorMessages()` (wraps clean-ui's
`useMessages()` + a shallow merge over the defaults) directly, since both run inside real component
`inject()` context; `slashMenuExtension` takes a `getMessages` accessor called fresh on every query
(it's already a plain function CodeMirror re-invokes per keystroke, so no extra reactive wiring is
needed for a locale switch after mount to take effect). (2) The link/image dialogs mount as
*detached* Vue apps (`mountStandaloneDialog`) with no `inject()` path back to the host's
`CuiConfigProvider` — `CommandContext` gained a `messages` getter (mirroring the existing live
`doc`/`selection` getters) so `link.ts`/`image.ts` can pass the resolved strings down as plain props
instead. `resolveCommandLabel(messages, commandId, fallback)` derives a built-in command's catalog
key as `` `toolbar${Capitalized(commandId)}` `` — a third-party plugin's own command id has no
matching field and falls through to its own declared `label` unchanged (FR20 untouched).

Verification: 8 new unit tests for the pure merge/resolve/pick functions, 6 functional tests mounting
`CuiMarkdownEditor` inside a real `CuiConfigProvider` (confirms an override reaches the toolbar, the
mode toggle, the counter, and — critically — the *detached* link dialog, while an untouched sibling
field still falls back to the English default), plus a `messages.test-d.ts` type fixture (mirroring
clean-ui's own) checked via a new `tsconfig.typecheck.json`. Real-browser Playwright verification:
localized labels appear correctly in the actual interactive slash-menu completion list (alongside an
untranslated sibling), and the localized title reaches the detached link dialog. Updated
`apps/docs/src/pages/LocalizationPage.vue`'s "adding a namespace" example, which pre-dated this
package and showed a hypothetical, now-inaccurate nested shape, to reflect the real, shipped one.
