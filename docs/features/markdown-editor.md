# Feature: Markdown Editor (@itguy614/clean-ui-editor)

**Status**: Draft
**Created**: 2026-07-29

## Problem Statement

### Current State

clean-ui ships form controls for single- and multi-line text (`CuiInput`, `CuiTextarea`) and
a read-only `CuiCodeBlock`. There is no way to author formatted content. An app that needs
notes, comments, release notes or descriptions has three options today: a bare textarea in
which users hand-write markdown with no assistance, a third-party editor whose look and
theming diverge from clean-ui, or plain text with no formatting at all.

Markdown-capable editors that would fit visually all carry costs clean-ui deliberately
avoids: their own design systems, large dependency graphs, and no awareness of clean-ui's
tokens, dark mode, density scale or message catalog.

### Desired State

A published, documented editor component that drops into a form like any other clean-ui
control, lets users format content without knowing markdown syntax, still lets
markdown-literate users work in raw source, and can be extended by consumers without forking
it.

### Gap

The library has no content-authoring primitive, and no extension point through which an
application can add its own authoring actions (for example inserting a timestamp, a
template, or an app-specific reference).

## Design Decisions

Settled before drafting; these constrain the requirements below.

| Decision | Choice | Why |
| --- | --- | --- |
| Document model | Markdown text is the single source of truth, edited in CodeMirror 6 | No markdown-to-document conversion exists, so round-trip fidelity cannot drift and source mode is the same buffer with decorations disabled |
| WYSIWYG rendering | Syntax markers hidden until the cursor enters the construct | Reads as formatted prose while every character remains editable text |
| Reveal granularity | Construct-level for pointer input, line-level for touch | Landing a fingertip between two asterisks is not a reasonable requirement; a line is a comfortable touch target |
| Accessible text | Markers are hidden visually only; the full markdown always remains in the accessibility tree | Nothing is ever concealed from assistive technology, and the characters a screen reader announces are exactly the ones the caret moves through |
| Dialect | CommonMark plus GFM (tables, task lists, strikethrough, autolinks) | Lezer ships this as a ready parser extension; matches what GitHub and most CMSes accept |
| Plugin API | Declarative tier (commands, toolbar, keymap, constructs, paste rules, decoration rules) plus a raw CodeMirror extension escape hatch | Covers ordinary actions without leaking CodeMirror, while leaving ambitious plugins possible. The declarative tier must be able to express everything the built-ins need, or the built-ins become privileged and the tier is untested |
| Command execution | Commands are synchronous and return a boolean, as CodeMirror's own commands do; asynchronous work goes through named seams the editor owns | Positions go stale across an `await` and undo grouping becomes undefined; the editor should absorb that once rather than distribute it to every plugin author |
| API stability tiers | Declarative tier is semver-major protected; the raw tier tracks the CodeMirror major it is built against and may break in an editor minor | The escape hatch's price, stated openly, so CodeMirror's release cadence cannot dictate ours |
| Built-in actions | Implemented as plugins against the public plugin API and shipped as presets | Proves the API is sufficient, makes the documentation examples the library's own source, and lets an application omit what it does not use |
| Construct policy | The loaded plugin set defines which constructs are allowed; commands, slash menu, paste conversion and decoration all honour it | Excluding a plugin should mean the construct cannot enter the document, not merely that a button is hidden |
| Plugin precedence | Array order, default preset applied first, later registration wins, conflicts warned | Makes overriding a built-in possible on purpose, and makes an accidental clash visible instead of order-dependent and silent |
| Form integration | Composes `FormControlProps` and participates in `CuiForm` like every other control | A markdown field is a form field; validation errors and helper text need the same home they have on `CuiInput` |
| Rendering to HTML | Injectable `render` adapter; the library's own implementation is an optional `/render` battery with raw HTML escaped by default | The editor needs no HTML at any phase, and an app that already renders markdown elsewhere must not end up with two renderers and two sanitiser policies over the same content |
| Modes | `wysiwyg` and `source`, with a built-in toggle | One boolean over one buffer; split preview additionally needs a renderer and is deferred |
| Toolbar | Default preset, `toolbar` prop to subset and order by command id, `#toolbar` slot to replace | Configuration by id is what lets a plugin's action appear without touching the component |
| Slash menu | `/` opens a filtered palette of insert commands, including plugin commands | Same declaration that produces a toolbar button produces a palette entry |
| Images in v1 | Authored by URL only; pasted or dropped image files are refused with a message | Deferring uploads removes all asynchronous work from v1, and with it pending state, range mapping through concurrent edits, failure and retry, and saving mid-upload |
| Tables in v1 | Parsed, highlighted and rendered, but no insert action and no cell navigation | Shipping an insert button without Tab between cells advertises an experience that is not there; the whole table feature lands together in phase 2 |
| Packaging | `packages/clean-ui-editor` in this monorepo, clean-ui as a peer dependency, own docs app | clean-ui holds module-level singletons (icon registry, theme, density); a second copy would split that state |

## Requirements

### Functional Requirements

**Value, editing and modes**

- FR1: `v-model` is a markdown string. The component never rewrites content the user did not
  edit, including unknown or non-standard syntax.
- FR2: An incoming `modelValue` equal to the editor's current document is a no-op. Without
  this, a host that echoes the value back mid-throttle resets the cursor and selection.
- FR3: `v-model:mode` switches between `wysiwyg` and `source`. Switching preserves the
  document, cursor position, selection and undo history.
- FR4: In `source` mode the raw markdown is shown with syntax highlighting and nothing hidden.
- FR5: A built-in mode toggle renders in the toolbar and can be suppressed so the host
  application drives `mode` itself.
- FR6: A `placeholder` prop renders in the empty state, consistent with `CuiInput` and
  `CuiTextarea`.

**Reveal model**

- FR7: With pointer input, a construct's markers are hidden until the cursor or selection
  enters that construct, then revealed for editing.
- FR8: With touch input, a caret anywhere on a line reveals every marker on that line. The
  active granularity follows the most recent input type, so hybrid devices behave sensibly.
- FR9: Hiding is visual only. The complete markdown text, markers included, remains in the
  accessibility tree, which rules out removing the characters from the DOM as the hiding
  mechanism.
- FR10: Reveal recalculation is suspended while an IME composition is active, so composition is
  never interrupted or repositioned. CodeMirror exposes this as `view.composing`.
- FR10a: Reveal recalculation is additionally triggered by a granularity change, not only by
  document, selection and viewport changes. Granularity lives in editor state, and changing it
  sets none of those flags — the spike found that switching from pointer to touch silently kept
  the previous decorations until something else happened to invalidate them.

**Formatting actions**

- FR11: Actions with toolbar entries and keyboard shortcuts exist for: bold, italic,
  strikethrough, inline code, headings 1 to 3, bulleted list, numbered list, task list,
  blockquote, code fence, link, image by URL, and horizontal rule. Each is provided by a
  built-in plugin written against the public plugin API (FR17), not privileged internal code.
- FR12: Each action is a toggle where markdown allows it: applying it to an already-formatted
  selection removes the formatting.
- FR13: Applying an action with an empty selection inserts the markers and places the cursor
  between them.
- FR14: Link and image insertion collect values through a dialog built from clean-ui
  components. A selection that looks like a URL pre-fills the URL field; any other selection
  becomes the link label rather than being discarded. Mode switching is blocked while the
  dialog is open.
- FR15: Every command's document changes form exactly one undo step, however many edits it
  makes internally.

**Typing ergonomics**

- FR16: List behaviour: Enter continues the current item; Enter on an empty item exits the
  list; Tab and Shift-Tab indent and outdent; task items continue unchecked; ordered lists
  renumber.

**Plugin system**

- FR17: A plugin is declared with a single factory (`definePlugin`) exposing a unique `id`,
  named `commands`, and optionally: `toolbar` entries, a `keymap`, the `constructs` it
  authorises, `paste` rules (source element to markdown emitter, each with an explicit degrade
  target for FR28), `decorations` rules (parser node to marker-hiding behaviour), and raw
  CodeMirror `extensions`. The declarative fields are sufficient for every built-in, so no
  built-in needs privileged internal access.
- FR18: A command is synchronous and returns a boolean indicating whether it handled the
  invocation. It receives a context object with at minimum the current selection, the document
  text, and helpers to insert at the cursor, wrap the selection and replace a range. These are
  the same helpers the built-in actions use.
- FR18a: Asynchronous work goes through named seams on the context rather than async commands.
  `collect()` opens a dialog and resolves with values, and is used by FR14 in v1 so the seam is
  proven before anything else depends on it. Phase 2 adds a reservation seam whose handle is
  position-mapped through subsequent edits. FR15's single-undo-step guarantee applies per
  transaction, not across an interaction that awaits a user.
- FR19: A command may expose an `isActive` query so the toolbar can render pressed state and
  the command can decide toggle-on versus toggle-off. Built-in toggles (FR12) rely on it.
- FR20: Plugin toolbar entries and commands are addressable by id from the `toolbar` prop, and
  appear in the slash menu when they carry a label and icon.
- FR21: Precedence is the order of the `plugins` array with the default preset applied first,
  so a later registration overrides an earlier one. Duplicate plugin ids, duplicate command
  ids and conflicting keybindings emit a developer warning naming both contributors. Note this
  is the opposite of CodeMirror's keymap semantics, where the first handler returning true wins,
  so the mapping is implemented deliberately rather than by passing the array through. A raw
  extension using an explicit precedence override escapes this model, which is documented.
- FR21a: A plugin whose command throws does not break the editor. Every invocation path
  (toolbar, keymap, slash menu, imperative API) is guarded, the failure surfaces through an
  error hook naming the plugin, and editing continues. The raw tier is explicitly not
  sandboxed — CodeMirror offers no such isolation — so each plugin's raw extensions are
  installed separately, allowing a failing one to be dropped without remounting.
- FR22: The `plugins` prop is reactive: changing it reconfigures the derived toolbar, commands,
  keymap, construct policy and CodeMirror extensions in place, preserving the document, undo
  history and cursor. The replacement configuration is built and validated **before** it is
  applied; if it is invalid the previous configuration is kept and the failure is reported,
  because a failed reconfiguration would otherwise leave a dead editor holding the user's
  document. Documentation warns that plugin instances should be created once rather than inline
  in a template.
- FR22a: `definePlugin` stamps the plugin API version it was built against, and registration
  rejects an incompatible plugin with a message naming the mismatch rather than failing later
  at a missing helper.
- FR23: The reference `timestamp` plugin ships in the docs as the worked example of the
  declarative tier, and a second example uses the raw CodeMirror tier.
- FR24: The component exposes an imperative API for host applications that do not want to
  author a plugin: at minimum `el`, `focus`, `blur`, `runCommand(id, args?)`, `getSelection()`
  and `getView()`. The raw view is reached through that single named accessor rather than a
  reactive property, and every CodeMirror type the public API mentions is re-exported from this
  package so a consumer's type-checker never resolves CodeMirror itself.
- FR24a: Raw-tier plugin authors obtain CodeMirror through
  `@itguy614/clean-ui-editor/codemirror`, which re-exports the surface they need. This is the
  documented path because it makes a single CodeMirror instance the default rather than
  something consumers must arrange. See `docs/platform/multi-package-build-and-release.md` for
  the detection and CI enforcement that backs it.

**Composition and construct policy**

- FR25: Built-in plugins are exported individually and as presets, including a default preset
  used when `plugins` is not supplied, so zero-configuration usage yields a complete editor.
- FR26: An application can compose its own set by listing plugins explicitly, extending the
  default preset, or configuring a preset to omit individual actions.
- FR27: A construct whose plugin is not loaded is absent from every authoring surface: no
  toolbar button, no keyboard shortcut, no slash-menu entry, no command.
- FR28: Paste conversion honours the loaded construct set. HTML implying an unavailable
  construct degrades to the nearest available representation, falling back to plain text.
- FR29: Decoration honours the loaded construct set. An unavailable construct is not styled,
  so its markers appear as ordinary text.
- FR30: The policy's boundary is documented explicitly: it governs what the editor produces,
  converts and styles, and cannot prevent a user typing marker characters by hand.
  Applications needing a hard content guarantee validate server-side.

**Form integration**

- FR31: The component composes `FormControlProps` (label, description, error, errorMessage,
  required, readonly, disabled), follows the library's error convention of recolouring its own
  border with the message below, and sets `aria-invalid`. It participates in `CuiForm` on the
  same terms as every other control: a resolver error for its field renders on it, and
  `required` renders the indicator and sets `aria-required`. Note that `required` is
  presentational throughout clean-ui — `CuiForm` validates only through a resolver and has no
  field registration — so "an empty required editor blocks submit" is not achievable in this
  package. Native required validation would be a separate clean-ui feature.
- FR32: `maxLength` counts markdown source characters, since that is what a storage column
  holds, and displays a counter as `CuiTextarea` does. It never truncates: an edit that would
  exceed the limit is rejected, and an oversized paste is refused with a message stating the
  overage. Truncation is excluded deliberately, because cutting at a character boundary can
  split a link or open a code fence and corrupt the rest of the document.

**Paste and images**

- FR33: Pasting `text/html` converts it to markdown, preserving headings, emphasis, links,
  lists, code and tables, subject to FR28. Pasting plain text inserts verbatim.
- FR34: A modifier-key paste inserts the clipboard as plain text without conversion.
- FR35: In v1, a pasted or dropped image file is refused with a visible, localised message and
  nothing is inserted. Images are authored by URL through the dialog in FR14.

**Rendering**

- FR36: Rendering markdown to HTML is never required to edit. The core entry contains no
  markdown-to-HTML renderer and no sanitiser, at any phase.
- FR37: Components that display rendered markdown accept a `render` adapter so an application
  can supply the renderer it already uses. The adapter is synchronous in v1 and returns a value
  produced only by an explicit trust-marking helper, so the type itself states that the caller
  is asserting the HTML is safe to inject. Widening to allow a promise later is additive;
  narrowing would not be. A viewer whose adapter throws falls back to escaped source with a
  developer warning rather than blanking or propagating.
- FR38: `@itguy614/clean-ui-editor/render` exports a ready-made adapter and a viewer component
  for applications with no renderer of their own. Nothing in the core entry imports it, and the
  subpath requires its own build entry to be emitted at all.
- FR39: The supplied adapter escapes raw HTML by configuring the parser not to emit it, which
  needs no sanitiser and keeps the subpath free of any DOM dependency so it also runs during
  server rendering. Allowing raw HTML requires the consumer to supply their own sanitiser
  function; the library does not bundle one and does not become the security boundary by
  default.
- FR40: The viewer applies clean-ui's typography layer itself rather than documenting that
  consumers should.
- FR41: The trust boundary is stated in the documentation: the document is untrusted text at
  all times, enforcement happens at render time, and the server is the only authority. Both
  `maxLength` (FR32) and the construct policy (FR30) are client-side only.
- FR42: URL schemes are allowlisted (http, https, mailto, tel, relative) in both the supplied
  adapter and the FR14 link and image dialog. A `javascript:` URL in link syntax is valid
  CommonMark and is the most likely real vulnerability in this feature.
- FR43: The paste converter never emits raw HTML. An element it does not recognise degrades to
  text, so hostile markup pasted from a web page cannot be laundered into stored content that
  fires later on a render path with raw HTML enabled.
- FR44: Rendered widgets, when they arrive in phase 2, are built by constructing DOM from the
  parse tree, never by producing HTML strings — otherwise FR36's guarantee erodes the first time
  a widget ships.

### Non-Functional Requirements

- NFR1: The core entry's budget is **130 kB gzip**, measured as the delta a consumer bundle
  grows by. The prototype spike measured 112.8 kB for CodeMirror, the markdown language, the
  reveal layer and the autocomplete package the slash menu needs, leaving roughly 17 kB for the
  toolbar, dialogs and command layer. No module may resolve dependencies through a computed
  namespace index, the pattern that defeated tree-shaking in clean-ui issue #42.
- NFR1a: The markdown language is built from `@lezer/markdown` with the GFM extensions
  directly, not from `@codemirror/lang-markdown`, whose static dependency on the HTML language
  (and through it JavaScript and CSS) costs **70 kB gzip** for embedded-HTML support this editor
  does not need. Its list-continuation commands are still imported, which the spike confirmed
  tree-shakes free of the HTML grammar for 2.3 kB. Any change here is measured, not assumed.
- NFR2: `vue` and `@itguy614/clean-ui` (`^1.2.0`) are peer dependencies and are never bundled.
  A caret range, not `>=`, since compatibility with a future major cannot be asserted. clean-ui
  1.2.0 is the floor because three seams the editor needs do not exist in 1.1.0: an augmentable
  message-namespace interface (`CuiMessages` is closed today, so NFR5 is not implementable at
  the type level against 1.1.0), an exported `version` for mismatch detection, and a
  colour-scheme signal for NFR6. That release is a prerequisite, not a parallel effort.
- NFR3: Every Phosphor icon the editor renders is registered by the package itself via
  clean-ui's `registerIcons`, or passed as a component. Since clean-ui 1.1.0 an unregistered
  name renders a placeholder glyph, so an unregistered toolbar icon would appear broken in
  consumer applications.
- NFR4: Server-side rendering must not touch the DOM. On the server the component renders a
  stable, correctly-sized shell that hydrates without layout shift or hydration mismatch. The
  shell takes its dimensions from this package's own stylesheet, because CodeMirror's styles are
  injected at runtime and are therefore absent during server rendering.
- NFR4a: A `cspNonce` prop is applied when the editor view is constructed, with a fallback to
  the conventional `csp-nonce` meta tag. CodeMirror injects its styles at runtime, so under a
  strict `style-src` policy the editor renders unstyled without one — and the nonce cannot be
  supplied after construction. Both intended consumers are content-security-policy environments
  (a Laravel CSP middleware, and Tauri's configured policy), so this is a v1 requirement rather
  than a later accommodation. Documentation states the required policy for consumers who instead
  permit inline styles.
- NFR5: All user-visible strings resolve through clean-ui's message catalog under a new
  namespace, so they are overridable exactly like the rest of the library.
- NFR6: Appearance derives from clean-ui tokens, honours dark mode and respects the density
  scale. The package ships no hardcoded colours. This explicitly includes source-mode syntax
  highlighting: the CodeMirror `HighlightStyle` is built from `--cui-*` tokens rather than using
  CodeMirror's default palette. Tokens alone are not sufficient for dark mode, because
  CodeMirror selects its own base-theme rules from a flag fixed when the configuration is built,
  while clean-ui's dark mode is a class on an arbitrary ancestor that can toggle at runtime and
  can be scoped to a subtree. That flag is therefore driven from clean-ui's colour-scheme signal
  (NFR2) through a reconfigurable compartment, or the caret and selection layers stay in light
  mode with no obvious cause. Extending the repository's contrast audit to cover a second
  package's tokens is a prerequisite for claiming the audit covers these.
- NFR7: Accessibility: the editor exposes an accessible name and role; the toolbar is keyboard
  operable with a single tab stop and arrow-key navigation; controls meet the 24px minimum
  target size (WCAG 2.5.8); mode changes are announced; the slash menu follows the combobox
  pattern with full keyboard operation.
- NFR8: Touch and narrow viewports are first-class: the toolbar scrolls horizontally rather
  than clipping when it overflows, no control depends on hover, and the reveal model uses the
  touch granularity in FR8.
- NFR9: Editing stays responsive on documents of at least 10,000 lines, relying on
  CodeMirror's viewport rendering rather than rendering the whole document.
- NFR10: `update:modelValue` emission is throttleable by prop, in combination with FR2.
- NFR11: Public API is fully typed, including the types a plugin author needs.
- NFR12: A documented testing contract for consumer applications: stable `data-testid` and
  `aria-label` hooks on the editor region, toolbar and each command button, plus documentation
  of which assertions hold under jsdom (value flow, disabled and error states, form
  validation, button presence) and which require a real browser (marker reveal, paste
  conversion, slash-menu keyboard operation, toolbar overflow).

## Acceptance Criteria

### Feature Specific

- [ ] `v-model` round-trips a document containing every supported construct plus unknown syntax,
      an HTML block and a YAML frontmatter block, byte for byte, with no edits made
- [ ] Typing continuously while `update:modelValue` is throttled and echoed back never moves the
      cursor or drops characters
- [ ] Switching mode both ways preserves document, cursor, selection and undo history, verified
      by undoing across a mode switch
- [ ] With pointer input, markers hide with the cursor away and reveal with the cursor inside,
      for each of: emphasis, strong, inline code, heading, link, strikethrough
- [ ] With touch input, tapping anywhere on a line reveals that line's markers
- [ ] A screen reader announces the full markdown including markers in `wysiwyg` mode, and the
      caret traverses exactly the characters announced
- [ ] IME composition (verified with a CJK input method) completes without interruption or
      candidate-window displacement in `wysiwyg` mode
- [ ] Every action in FR11 applies, toggles off, and behaves correctly with an empty selection
      and a multi-line selection; each is a single undo step
- [ ] Selecting the words `the docs` and inserting a link yields `[the docs](url)`, not a
      discarded selection
- [ ] Enter continues a list item, Enter on an empty item exits, Tab and Shift-Tab indent and
      outdent, and an ordered list renumbers
- [ ] The editor inside `CuiForm` shows label, description and a resolver error identically to a
      sibling `CuiTextarea`, and `required` renders the indicator and sets `aria-required`
- [ ] With `maxLength` set, typing stops at the limit without truncating, an oversized paste is
      refused with the overage stated, and no document is left with a split link or open fence
- [ ] The reference timestamp plugin, registered by a consumer, appears in the toolbar and
      slash menu and inserts at the cursor with no change to the component's own code
- [ ] A plugin contributing a raw CodeMirror extension, imported from this package's CodeMirror
      subpath, takes effect
- [ ] A plugin declaring `constructs`, a `paste` rule and a `decorations` rule has all three
      honoured, with no built-in relying on internal access the tier lacks
- [ ] Failure is contained: a command that throws surfaces through the error hook and leaves the
      editor usable; an invalid `plugins` value keeps the previous configuration with the
      document intact; a plugin stamped with an incompatible API version is rejected at
      registration naming the mismatch
- [ ] `[click](javascript:alert(1))` is neither produced by the link dialog nor rendered as a
      live link, and pasted HTML containing a script tag or unrecognised element yields text
      rather than raw HTML in the stored markdown
- [ ] With a strict `style-src` and a supplied `cspNonce`, the editor renders styled; without
      the nonce the failure is documented rather than mysterious
- [ ] Toggling clean-ui's dark class at runtime updates the editor's caret, selection layer and
      syntax colours without a remount
- [ ] A toolbar button renders pressed state from a command's `isActive` while the cursor sits
      inside that construct
- [ ] A consumer plugin overriding a built-in command id wins, with a warning naming both
- [ ] Adding a plugin to the `plugins` array on a mounted editor updates the toolbar without
      losing document, undo history or cursor
- [ ] `runCommand` from the exposed API performs the same edit as the toolbar button
- [ ] Every built-in formatting action is implemented through the public plugin API, provable
      by the absence of privileged internal command paths
- [ ] With italic excluded: no button, no `Mod-I`, no slash entry, pasted `<em>` arrives as
      plain text, and hand-typed asterisks stay unstyled literal characters
- [ ] Pasting HTML copied from a rendered page produces markdown preserving headings,
      emphasis, links, lists and a table; plain-text paste is verbatim
- [ ] A pasted image file is refused with a localised message and nothing is inserted
- [ ] The core entry's built bundle contains no markdown-to-HTML renderer and no sanitiser,
      measured on a consumer build; importing `/render` adds them
- [ ] A viewer driven by a consumer-supplied `render` adapter works with no import from
      `/render`
- [ ] The supplied adapter escapes a script tag by default and renders it only when raw HTML is
      explicitly allowed
- [ ] Source-mode highlighting uses only `--cui-*` tokens and passes the contrast audit in
      light and dark mode across themes
- [ ] Rendering during SSR performs no DOM access and hydrates without warnings
- [ ] Every string is overridden by supplying a custom message catalog, typed through the
      augmentation seam
- [ ] Toolbar is fully keyboard operable with one tab stop, controls measure at least 24px, and
      at 360px width it scrolls rather than clipping with every action reachable by touch
- [ ] A 10,000-line document loads and stays responsive while typing
- [ ] The documented jsdom-safe assertions pass in a jsdom test run

### Verification

Packaging, dependency and CI requirements this feature depends on are specified separately in
`docs/platform/multi-package-build-and-release.md`, since they apply to any satellite package.
That document owns the consumer-fixture build, the single-instance enforcement, the bundle
budget gate, and the test-environment matrix the criteria below assume.

- [ ] All tests pass, including a round-trip suite over a corpus of markdown documents and a
      unit test asserting the shipped default preset has no internal id or keybinding conflict
- [ ] Type declarations build with no errors, and a CI check confirms CodeMirror types appear
      only in the raw-tier declarations, keeping the declarative tier portable
- [ ] The core bundle stays within its committed budget, verified on a consumer build rather
      than on this package's own `dist`
- [ ] Behaviour verified in a real browser, not only jsdom, for: marker reveal on cursor entry,
      touch-granularity reveal, paste conversion, slash-menu keyboard operation, IME
      composition, and toolbar overflow
- [ ] Docs site builds and documents every prop, event, slot, command id and plugin hook
- [ ] Feature works end-to-end in the docs site against a non-trivial document

## Prototype Evidence

A throwaway spike (since deleted) validated the four assumptions that could have invalidated
this approach, measured in headless Chrome against a built bundle rather than in jsdom:

- **Reveal.** Markers render zero-width with the caret away and reveal on entry; the construct
  grows 31 to 63 pixels; the text is unchanged throughout.
- **Accessibility.** The full markdown, markers included, appears in the browser's accessibility
  tree — the mechanism FR9 depends on. This is also what proves the hiding technique matters:
  no DOM-level assertion distinguishes it from an approach that would break screen readers.
- **Touch.** Line granularity reveals more than construct granularity, and a touch-type pointer
  event switches modes on its own.
- **Composition.** An IME composition completes with the text landing intact and the editor
  reporting composition state throughout, so the decoration layer does not disturb it.

Bundle figures behind NFR1 come from the same spike, as the gzip delta between two otherwise
identical consumer builds.

Deliberately still unproven, and therefore work the implementation must carry: touch was
synthesised rather than run on a device, so selection handles and the on-screen keyboard are
unverified; the composition test drove the browser's IME path directly rather than a real input
method; and no screen reader has been run, so how the exposed markdown *sounds* is unknown.

## Phasing

**Phase 1.5** — split source-and-preview mode, once the `render` adapter contract exists.

**Phase 2**, in this order:

1. Image upload. Paste or drop a file, an `upload` prop returning a URL, and the interaction
   already designed for it: insert a localised placeholder immediately, replace exactly that
   range on success (CodeMirror maps the range as the user keeps typing), remove it and
   surface an error on failure, and expose an `uploading` state so a form can block submit
   while a placeholder exists. Likely the first thing the first integration asks for.
2. Tables as a complete feature: insert action, Tab and Shift-Tab between cells, new row at the
   last cell, row and column insertion, and the rendered table widget, shipped together.
3. Remaining rendered widgets: inline images, clickable task checkboxes, syntax-highlighted
   fences. Each needs its own edit and exit-to-source interaction, which is where this class
   of editor accumulates defects.

**Phase 3** — a plugin tier for custom markdown syntax (new inline or block constructs with
their own Lezer grammar), including how unknown syntax degrades for other consumers of the
document.

**Out of scope** — collaborative or multi-cursor editing, comments, suggestions, revision
history; footnotes, math and frontmatter as core constructs (candidates for plugins); image
editing or media library management.

## First Integration

Pulse (`~/code/gohcltech/pulse`) is the first intended consumer once this is built and tested
here. Two applications would embed it: `app-web` (Laravel with Vue 3.5, Vite) and
`app-desktop` (Tauri 2 with Vue 3.5). Both already depend on `@itguy614/clean-ui` from the
registry rather than the workspace, and `app-web` is deliberately not a workspace member, so
the editor must be consumed as a published package. Neither application authors markdown
today, so the integration is net-new rather than a migration. Pulse's mobile audit produced
several of the accessibility and touch requirements above, which is why NFR7, NFR8 and FR8 are
requirements rather than polish. Pasting a screenshot into a note is the most likely first
request beyond v1, which is why image upload heads phase 2.

## References

- CodeMirror 6 system guide and reference: https://codemirror.net/docs/
- Decorations: https://codemirror.net/docs/ref/#view.Decoration
- Dynamic reconfiguration (`Compartment`): https://codemirror.net/docs/ref/#state.Compartment
- Lezer markdown parser and GFM extensions: https://github.com/lezer-parser/markdown
- CommonMark specification: https://spec.commonmark.org/
- GitHub Flavored Markdown specification: https://github.github.com/gfm/
- WAI-ARIA Authoring Practices, toolbar and combobox patterns:
  https://www.w3.org/WAI/ARIA/apg/patterns/
- WCAG 2.5.8 Target Size (Minimum):
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- clean-ui conventions this package must follow: `CLAUDE.md` in this repository
- Icon registry behaviour and its rationale: clean-ui issue #42 and `CHANGELOG.md` 1.1.0
