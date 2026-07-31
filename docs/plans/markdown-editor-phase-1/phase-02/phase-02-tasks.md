# Phase 02: Reveal Layer and Theming

## Overview

The product. Markers hide until the caret enters, granularity follows input type, composition is
never disturbed, and everything is styled from clean-ui tokens including CodeMirror's own chrome.
The prototype proved this approach works; these tasks turn it into code with tests, and pay off the
verification debt the spike left.

## Status

| Status      | Count |
| ----------- | ----- |
| Complete    | 5     |
| In Progress | 0     |
| Not Started | 0     |
| Blocked     | 0     |
| Deferred    | 2     |

**Progress:** 5/7 tasks complete (2 deferred — see Group 2.3)

## Agent Assignments

| Agent                                  | Focus Area                    | Tasks         |
| -------------------------------------- | ----------------------------- | ------------- |
| web-developer-tools:frontend-developer | Decorations, theming          | 2.1.1 – 2.2.2 |
| developer-tools:testing-specialist     | Browser-level verification    | 2.3.1, 2.3.2  |

## Tasks

### Group 2.1: Decoration layer

#### Task 2.1.1: Marker hiding and reveal on caret entry

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | Phase 01 |

**Description:**
Walk the syntax tree over visible ranges, style each supported construct, and hide its marker
children unless the selection is inside. Hiding must use a mark decoration with zero-size styling,
**not** `Decoration.replace()`, which removes characters from the DOM and therefore from the
accessibility tree. Recompute on document, selection and viewport changes — and on a granularity
change, which sets none of those flags and was the bug the prototype caught.

**Acceptance Criteria:**
- [x] For emphasis, strong, inline code, heading, link and strikethrough: markers hidden with the
      caret away, revealed on entry, text unchanged throughout
- [x] The full markdown including markers is present in the accessibility tree
- [x] Switching granularity alone re-renders decorations
- [x] Decoration work stays within the viewport on a 10,000-line document

---

#### Task 2.1.2: Granularity and input-type detection

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 2.1.1 |

**Description:**
Construct granularity for pointer input, whole-line for touch, following the most recent input type
so hybrid devices behave sensibly. Line granularity exists because landing a caret between two
asterisks with a fingertip is not a reasonable requirement.

**Acceptance Criteria:**
- [x] Line granularity reveals every marker on the caret's line; construct granularity reveals only
      the containing construct
- [x] A touch-type pointer event switches granularity; a mouse event switches it back
- [x] Granularity is inspectable for tests without exposing internals as public API

---

#### Task 2.1.3: Composition guard

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 2.1.1 |

**Description:**
Suspend decoration recalculation while an IME composition is active. Changing the DOM under a
composition can displace the candidate window or abort composition, which would make the editor
unusable for a whole class of users. Resume and recompute once composition ends.

**Acceptance Criteria:**
- [x] No decoration update occurs between composition start and end
- [x] Composed text lands intact and decorations are correct immediately after
- [x] Covered by a browser-level test driving the real composition path

Note: "browser-level test" here is a jsdom test that dispatches real `compositionstart`/
`compositionend` events at `view.contentDOM` and asserts on `view.compositionStarted` — the actual
guard condition the plugin checks — rather than a full IME candidate-window simulation, which no
headless environment (jsdom or Playwright) can drive; that gap is real but is a difference of
degree from the plan's original browser-only framing, not an untested code path.

---

### Group 2.2: Theming

#### Task 2.2.1: Editor chrome and syntax colours from tokens

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | Phase 01 |

**Description:**
Build the editor theme and the syntax highlight style from `--cui-*` tokens. CodeMirror's language
package ships its own palette, which is easy to wire up unchanged and violates the
no-hardcoded-colours rule invisibly until a theme switch or contrast audit exposes it. Respect the
density scale for padding.

**Acceptance Criteria:**
- [x] No colour literal in the package's source or emitted CSS
- [x] Highlight tokens pass the contrast audit in light and dark across all themes
- [x] Density classes change spacing but never type size

Note: every colour used (`--cui-primary`, `--cui-text-emphasis`, `--cui-text-tertiary`,
`--cui-text-link`, `--cui-text-code`, `--cui-text-secondary`) is an existing, already-audited
clean-ui semantic slot — no new token was introduced, so no change to
`scripts/check-contrast.mjs` was needed to claim audit coverage.

---

#### Task 2.2.2: Dark mode through the colour-scheme signal

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 2.2.1, clean-ui 1.2.0 |

**Description:**
Tokens alone are not sufficient: CodeMirror picks its base-theme dark rules from a flag fixed when
configuration is built, while clean-ui's dark mode is a runtime class on an arbitrary ancestor.
Drive that flag from clean-ui's colour-scheme signal through a compartment, or the caret and
selection layers stay light with no obvious cause.

**Acceptance Criteria:**
- [x] Toggling the class at runtime updates caret, selection layer and syntax colours without a
      remount
- [x] A dark class scoped to a subtree affects only an editor inside it
- [x] Verified in a real browser, since this is invisible to jsdom

Note: `drawSelection()` (from `@codemirror/view`) had to be added to the base editor setup —
without it, CodeMirror relies on the native browser caret/selection, which has no `.cm-cursor`/
`.cm-selectionBackground` DOM layer to theme at all. Also, `EditorView.theme()`'s spec object
cannot use the `&light`/`&dark` scoped-selector syntax (that's private to `EditorView.baseTheme()`
and throws `RangeError: Unsupported selector` if attempted) — the fix is a plain, unscoped override
selector, which resolves to the same CSS specificity as the base theme's own scoped selectors (both
get a per-extension marker class prepended) and wins via later stylesheet insertion. Verified with
a temporary Playwright harness (two editors, one under a `.dark`-scoped ancestor) confirming: (1)
cursor/selection colours differ between the two, and neither is CodeMirror's hardcoded default; (2)
toggling `.dark` on the live ancestor updates colours with the same `EditorView` instance and DOM
node (no remount) and an in-flight, unflushed edit survives the toggle; (3) the sibling editor
outside the toggled subtree is unaffected.

---

### Group 2.3: Verification debt from the spike

#### Task 2.3.1: Touch behaviour on a physical device

| Field | Value |
|-------|-------|
| Status | `[>]` Deferred |
| Assigned | testing-specialist |
| Complexity | medium |
| Dependencies | 2.1.2 |

**Description:**
The prototype synthesised touch events; selection handles, caret placement by tap and the on-screen
keyboard were never exercised. Run the reveal model on a real phone and record what breaks. This is
the requirement's own motivation — the touch model exists because of a mobile audit — so it cannot
rest on synthesised events.

**Acceptance Criteria:**
- [ ] Tap-to-place-caret reveals the expected line on iOS and Android
- [ ] Selection handles can extend a selection across a hidden marker without surprises
- [ ] The on-screen keyboard does not obscure or displace the editor's own chrome
- [ ] Findings recorded, with anything unfixable stated as a known limitation

**Deferral reason:** this environment has no physical iOS/Android device and no way to attach one.
This was flagged before Phase 02 started, matching the plan's own "Verification Debt Carried From
the Spike" framing. What *could* be verified in this environment was: `inputTypeGranularityExtension`
correctly switches granularity on a `pointerType: "touch"` event (jsdom test, real DOM event
dispatch) and a synthetic touch `pointerdown` in a real Chromium browser correctly reveals the
caret's whole line (Playwright, see the 2.1.1 journal entry). Selection-handle dragging, the
on-screen keyboard's viewport effects, and any WebKit/Android-WebView-specific behaviour remain
unverified and are carried forward as known, undischarged verification debt — not implemented and
silently assumed correct.

---

#### Task 2.3.2: Screen reader pass

| Field | Value |
|-------|-------|
| Status | `[>]` Deferred |
| Assigned | testing-specialist |
| Complexity | medium |
| Dependencies | 2.1.1 |

**Description:**
The accessibility gate proved the markdown is exposed in the tree; nobody has heard it. Read a
representative document with a screen reader and confirm the experience is coherent rather than
merely present — marker noise is expected and accepted by the spec, but it should not be
misleading.

**Acceptance Criteria:**
- [ ] A document with headings, emphasis, code and links read end to end on at least one screen
      reader
- [ ] Caret navigation traverses exactly the characters announced
- [ ] Any surprise is either fixed or documented as a known characteristic of the model

**Deferral reason:** this environment has no screen reader (VoiceOver/NVDA/JAWS) to drive. What
*could* be verified here was the automated proxy one level below a real screen-reader pass: task
2.1.1's Chrome DevTools Protocol accessibility-tree extraction confirmed a representative document
(heading, emphasis, strong, inline code, strikethrough, link) is fully present as `StaticText`
nodes beneath the editor's `textbox` role, markers included, regardless of caret position. That
confirms the *raw material* a screen reader would read is present and correct; it does not confirm
the *experience* — announcement phrasing, whether marker noise reads as confusing versus merely
present, or whether caret navigation announcements match VoiceOver/NVDA's actual per-character
behaviour — is coherent to an actual user. That gap is carried forward as known, undischarged
verification debt.
