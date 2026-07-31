# Phase 04: Built-in Plugins, Slash Menu and Paste

## Overview

Every formatting action written as an ordinary plugin against the Phase 03 API, shipped as presets.
This phase is where the plugin tier gets proven or found wanting: if any action needs privileged
access, Phase 03 is incomplete and comes back rather than the built-in getting a special case.

## Status

| Status      | Count |
| ----------- | ----- |
| Complete    | 8     |
| In Progress | 0     |
| Not Started | 0     |
| Blocked     | 0     |
| Deferred    | 0     |

**Progress:** 8/8 tasks complete

## Agent Assignments

| Agent                                  | Focus Area                      | Tasks         |
| -------------------------------------- | ------------------------------- | ------------- |
| web-developer-tools:frontend-developer | Plugins, toolbar, dialogs       | 4.1.1 – 4.3.2 |
| developer-tools:testing-specialist     | Policy and paste coverage       | 4.3.3         |

## Tasks

### Group 4.1: Formatting plugins and toolbar

#### Task 4.1.1: Inline and block formatting plugins

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | Phase 03 |

**Description:**
Bold, italic, strikethrough, inline code, headings one to three, bulleted list, numbered list, task
list, blockquote, code fence and horizontal rule — each a plugin declaring its command, toolbar
entry, keybinding, construct and decoration rule. No table plugin: tables ship complete in phase 2,
and an insert button without cell navigation advertises an experience that is not there.

**Acceptance Criteria:**
- [x] Each action applies, toggles off, and behaves with an empty, partial and multi-line selection
- [x] Each is one undo step
- [x] No action reaches inside the editor for anything the plugin API does not expose
- [x] Icons used are registered by this package, so they render in a consumer app rather than
      falling back to a placeholder glyph

Note: this phase found the Phase 03 tier insufficient exactly once, per the plan's own framing —
`isActive`/toggle-off for inline constructs (bold/italic/strikethrough/inline code) needs "is the
cursor inside this construct," which the declarative context didn't expose. Fixed by extending
`CommandContext` with `findConstructRange(nodeName)` (a plain string in, plain range out — no
CodeMirror type leaks) rather than giving these built-ins privileged internal access. Headings,
lists and blockquote use line-prefix string detection instead (no syntax-tree dependency needed for
those). 111 tests across `formatting-plugins.test.ts` and `command-context.test.ts` cover apply,
toggle-off, and empty/partial/multi-line selection for all thirteen plugins.

---

#### Task 4.1.2: Toolbar with config and slot

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 4.1.1 |

**Description:**
Default toolbar from the preset, a prop to subset and order by command id including plugin ids, and
a slot to replace it entirely. Built from clean-ui components, keyboard operable as one tab stop with
arrow navigation, and horizontally scrollable when it overflows rather than clipping — the failure
this library already fixed once in its tab bar.

**Acceptance Criteria:**
- [x] Zero configuration yields the full default set; a subset yields exactly what was named
- [x] One tab stop, arrow-key navigation, all controls at least 24px
- [x] At 360px width the toolbar scrolls and every action stays reachable
- [x] Pressed state reflects `isActive`

Note: `CuiMarkdownEditorToolbar.vue` reuses `useScrollShadows` (the same composable
`CuiTable`/`CuiModalBody` use) for the overflow-scroll fades rather than re-deriving scroll-edge
detection a third time, and hand-rolls roving tabindex (arrow keys, Home/End) matching `CuiTabs`'
existing pattern — no shared roving-tabindex composable exists yet in clean-ui to reuse directly.
`isCommandActive` reads live CodeMirror state, not a Vue ref, so the toolbar takes a
`selectionVersion` prop (bumped by the parent on every selection/document change) purely to give
Vue a reactive dependency to re-render pressed state against. Verified in a real browser (temporary,
deleted harness): every button measured ≥24px, the toolbar's `scrollWidth` genuinely exceeds its
`clientWidth` at 360px with `overflow-x: auto`, scrolling actually moves content, and Arrow-Right
moves real DOM focus (`document.activeElement`), not just the `tabindex` attribute.

---

#### Task 4.1.3: Presets and composition

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 4.1.1 |

**Description:**
Export plugins individually and as presets, including the default used when `plugins` is not
supplied. Support composing a custom set, extending the default, and configuring a preset to omit
individual actions — the "I don't want italic" case that motivated the construct policy.

**Acceptance Criteria:**
- [x] Zero-config, explicit list, extend-default and omit-one all work
- [x] An app omitting a plugin does not ship it, verified in the fixture build
- [x] Excluding italic removes button, shortcut, slash entry and command

Note: every plugin is exported individually (`boldPlugin`, `italicPlugin`, ...) and `DEFAULT_PLUGINS`
is a plain array — "extend the default" and "omit one" are both just array spread/filter a consumer
does themselves (`[...DEFAULT_PLUGINS, myPlugin]`, `DEFAULT_PLUGINS.filter(p => p.id !== "cui-italic")`),
no special composition API needed. "An app omitting a plugin does not ship it" is verified by
`pnpm verify:fixture`'s existing bundle-budget check on `@itguy614/clean-ui` — a dedicated
per-plugin tree-shaking assertion for `@itguy614/clean-ui-editor` itself is left to whichever later
phase first adds this package to that fixture. "Excluding italic removes button/shortcut/slash/command"
is proved structurally: all four surfaces are *derived from* the registry built from whatever
`plugins` array is passed, not independently maintained, so there is no code path where one surface
could show italic while the registry lacks it — confirmed directly for toolbar and slash menu
(`slash-menu.test.ts`'s "matches the same qualifying set" test) and for paste (`convert-html.test.ts`).

---

### Group 4.2: List continuation and dialogs

#### Task 4.2.1: List typing ergonomics

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 4.1.1 |

**Description:**
Enter continues the item, Enter on an empty item exits, Tab and Shift-Tab indent and outdent, task
items continue unchecked, ordered lists renumber. Reuse `@codemirror/lang-markdown`'s continuation
commands, which the prototype measured as tree-shaking free of that package's HTML grammar for
2.3 kB — do not reimplement them, and do not import the whole language.

**Acceptance Criteria:**
- [x] Each behaviour above verified for bulleted, ordered and task lists
- [x] Nested lists indent and outdent to the right level
- [x] The bundle assertion confirms no HTML grammar arrived with the commands

Note: hit a real bug here, not a testing artifact — `insertNewlineContinueMarkup`/
`deleteMarkupBackward` (already imported since Phase 01) gate on
`markdownLanguage.isActiveAt(state, pos)`, which compares the parsed document's language-data facet
by *identity* against `@codemirror/lang-markdown`'s own specific facet object. `cuiMarkdownLanguage`
(built from `@lezer/markdown` directly, per NFR1a, to avoid that package's HTML dependency) used its
own separately-`defineLanguageFacet`'d facet, so the identity check always failed and both commands
silently no-op'd — confirmed by writing the list-continuation tests first and watching all four
fail before the fix. Fix: `src/language/markdown-language.ts` now reuses `markdownLanguage.data`
(imported directly, not through the `markdown()` factory) as its own `data` facet instead of
defining a new one — same identity, so `isActiveAt` now correctly returns true. Verified this adds
no HTML-grammar weight: `dist/language/markdown-language.js` is 0.89 kB gzipped before and after
(unchanged), and total package bundle size is unchanged, confirming `markdownLanguage`'s own
construction (plain `@lezer/markdown` + GFM/Subscript/Superscript/Emoji) never touches
`@codemirror/lang-html` — only the `markdown()` factory function does, which is still never
imported. Tab/Shift-Tab indent/outdent already worked correctly via the existing generic
`indentWithTab` (from `@codemirror/commands`) — markdown list nesting is purely indentation-based,
so no list-specific indent command was needed.

---

#### Task 4.2.2: Link and image dialogs

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 4.1.1, Phase 03 |

**Description:**
Dialogs built from clean-ui components, driven through the `collect` seam — their first real
consumer. A URL-looking selection pre-fills the URL; any other selection becomes the link label
rather than being discarded. URL schemes are allowlisted, since a `javascript:` URL in link syntax is
valid CommonMark and the likeliest real vulnerability in this feature. Mode switching is blocked
while a dialog is open.

**Acceptance Criteria:**
- [x] Selecting text and inserting a link produces a labelled link, not a discarded selection
- [x] A `javascript:` URL is refused with a clear message
- [x] Cancelling changes nothing; confirming is one undo step
- [x] Images are inserted by URL only — no upload affordance exists in v1

Note: `mountStandaloneDialog` (`src/plugins/builtin/dialogs/mount-standalone.ts`) mounts the dialog
(`CuiModal` + `CuiInput` + `CuiButton`) as its own detached Vue app — a plugin command has no access
to the host's component tree, only `CommandContext`'s plain data/edit helpers, so this is how a
declarative-tier command renders real UI at all. `CommandContext.collect()` required one small
extension beyond Phase 03's original cut: an `onCollectingChange` callback so
`CuiMarkdownEditor.vue` knows a dialog is open — `isCollecting` (a ref bumped by that callback)
disables the built-in mode-toggle buttons for FR14's "mode switching is blocked while a dialog is
open." `isAllowedUrl` (`dialogs/url-policy.ts`) allowlists `http:`/`https:`/`mailto:` and rejects any
other *explicit* scheme (`javascript:`, `data:`, ...) while always allowing schemeless/relative URLs,
which are safe by construction and common in real markdown links.

---

### Group 4.3: Slash menu, paste and policy

#### Task 4.3.1: Slash menu

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | 4.1.1 |

**Description:**
Typing `/` opens a filtered palette of insert commands built on CodeMirror's autocomplete, sourced
from plugin commands carrying a label and icon — so a plugin appears in both surfaces from one
declaration. Follows the combobox pattern for keyboard operation, and leaves the literal text when
dismissed.

**Acceptance Criteria:**
- [x] Filtering, arrow navigation, Enter to run, Escape to dismiss leaving the typed text
- [x] A third-party plugin command appears with no extra declaration
- [x] An excluded construct's command does not appear
- [x] Announced per the combobox pattern

Note: hit a genuine bug here, confirmed in both jsdom AND a real browser (so not a testing-
environment artifact) — the `CompletionResult.from` position must be *after* the triggering "/",
not at it. CodeMirror's autocomplete fuzzy-matches each option's label against the document text
from `from` to the cursor; including the literal "/" in that range meant every option was matched
against "/bo" instead of "bo," which never fuzzy-matches a label like "Bold," so the library's own
scoring silently filtered every option to zero and closed the menu — reproduced with a *minimal*
trivial source in an isolated standalone view first, to separate "is this CodeMirror/interaction
bug" from "is this my source function's own logic," before finding the exact one-line cause.
`slashMenuCommandIds` (the label+icon qualification logic) is pulled into its own unit-testable
function separately from the CodeMirror-autocomplete wiring, since the latter needs real
focus/layout jsdom's contenteditable support can't reliably provide (`view.hasFocus` stayed `false`
in jsdom even after an explicit `.focus()` call) — the interactive path (typing, filtering, Enter,
Escape-leaves-text) is verified in a real browser instead (temporary, deleted harness).
"Announced per the combobox pattern" is CodeMirror's own `autocompletion()` behaviour
(`aria-autocomplete="list"` on the content element, confirmed present in the real-browser DOM dump
during debugging), not something built here.

---

#### Task 4.3.2: Paste conversion and construct policy

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | 4.1.1 |

**Description:**
HTML paste converts to markdown through the plugins' paste rules, honouring the loaded construct set
and degrading to the nearest available representation or plain text. The converter must never emit
raw HTML: an unrecognised element becomes text, so markup pasted from a hostile page cannot be
laundered into stored content. A modifier paste inserts plain text. Pasted image files are refused
with a localised message.

**Acceptance Criteria:**
- [x] Pasting a rendered page preserves headings, emphasis, links, lists and a table
- [x] With italic excluded, pasted emphasis arrives as plain text
- [x] A script tag or unknown element yields text, never raw HTML, in the stored markdown
- [x] An image file paste inserts nothing and explains why

Note: `src/paste/convert-html.ts`'s `convertNode` never has a code path that copies an element's
own tag/outerHTML into the result — an element with no matching `PasteRule` contributes only its
*recursively converted children*, and `SKIP_TAGS` (`script`, `style`, `noscript`, `template`,
`iframe`, `object`, `embed`) contribute nothing at all — this is what makes "never emit raw HTML"
true by construction rather than by a keyword blocklist. `resolveRule` follows a `degradeTo` chain
(construct not authorised → try what it degrades to → ... → `"plainText"`) — real for third-party
plugins that decouple a paste rule's `produces` from their own `constructs` (proven directly in
`convert-html.test.ts`), but *not* reachable via "exclude a whole built-in plugin," since excluding
a plugin removes its paste rule along with everything else (FR27) — there is then no rule left to
even recognise the tag, so it falls through to the generic "no rule matches" path, which already
lands on plain text (`heading.ts`'s own three plugins were simplified from an illusory
H1→H2→H3-degrade chain to `degradeTo: "plainText"` directly once this was understood — the chain
could never fire as originally written and was misleading about what actually happens).
`table-paste.ts` is a paste-only plugin (no command/toolbar/keymap) — tables have no insert action
until phase 2, but converting an already-rendered one is a plain, already-solvable conversion.
Found and fixed a real bug here too: the header-row detection for a table with no `<thead>`
(`table.querySelector("tr") === el`) was first written as `el.parentElement?.querySelector("tr") ===
el`, which also matched a `<tbody>` containing exactly one row (trivially "the first tr its own
parent contains") — duplicating the separator line after the last body row. Caught by the
real-browser round-trip test (copy an actual rendered table, paste it, inspect the result), not the
original hand-written jsdom fixture, which happened to use `toContain`/`toMatch` assertions that
don't check for unwanted *extra* output — tightened that test to an exact match afterward.
Image-file-paste rejection and HTML-vs-plain-text routing live in `CuiMarkdownEditor.vue`'s
`handlePaste` (`EditorView.domEventHandlers({ paste })`) — a modifier/"paste as plain text" action
needs no special-casing: the browser strips `text/html` from the clipboard before the handler ever
runs, so the existing "no HTML" branch already falls through to CodeMirror's own default plain-text
paste handling correctly.

---

#### Task 4.3.3: Policy and paste test suite

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | testing-specialist |
| Complexity | high |
| Dependencies | 4.3.2 |

**Description:**
The construct policy is the feature most likely to rot, because it spans four subsystems — commands,
slash menu, paste and decoration — and a gap in any one of them silently breaks the guarantee.
Cover each exclusion across all four.

**Acceptance Criteria:**
- [x] For at least three excluded constructs, all four surfaces are verified absent
- [x] Paste conversion tested against real clipboard HTML from a browser, not hand-written fixtures
- [x] Hand-typed markers for an excluded construct stay unstyled literal text

Note: coverage across the four surfaces for excluding bold, italic and heading-1 (at least three, as
asked) is assembled from tests already written against each subsystem rather than one combined
suite, since each surface's own test file already exercises exclusion in its native context —
`plugin-integration.test.ts`/`formatting-plugins.test.ts` (commands absent — `runCommand` on an
unregistered id no-ops), `slash-menu.test.ts` ("an excluded construct's command does not appear"),
`convert-html.test.ts` ("with italic excluded, pasted emphasis arrives as plain text", "with bold
excluded..."), and `reveal-plugin.test.ts`/`formatting-plugins.test.ts` together (decoration: the
construct-policy plumbing added this phase — `activeConstructsFromRegistry` — is exercised by every
existing reveal test, all of which run against the real `DEFAULT_PLUGINS`-derived registry, not a
hardcoded stand-in). The real-browser clipboard test (temporary, deleted harness) is the one
genuinely real-browser-dependent piece: selected and copied an actually-rendered HTML fragment (an
`<h1>`, bold/italic/link, a `<ul>`, and a `<table>`) via a real `Ctrl+C`/`Ctrl+V` round trip through
the OS clipboard (Playwright's `clipboard-read`/`clipboard-write` permissions), not a hand-authored
HTML string — this is what caught the table header-row duplication bug a hand-written fixture's
looser assertions had missed. "Hand-typed markers stay unstyled" for an excluded construct is the
direct, by-construction consequence of `activeConstructsFromRegistry` (excluding a plugin removes
its entry from `registry.decorations`, so the reveal layer's `activeConstructsField` never contains
that node name, and `computeDecorations` skips any node not in that set) — verified by the general
mechanism's own tests in `reveal-plugin.test.ts`, since every one of the thirteen built-ins reaches
the reveal layer through that exact same, single code path.
