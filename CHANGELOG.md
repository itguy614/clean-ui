# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `CuiButton` exposes every property it computes as a custom property — `--cui-button-height`, `-px`, `-gap`, `-font-size`, `-bg`, `-color`, `-border`, `-hover-bg`, `-hover-color`, `-hover-border`, `-active-bg`, `-focus-ring` (joining the existing `-radius`). Set one on `:root`, on a container or on the button itself: no `!important`, no selector doubling, no dependence on stylesheet order. The component computes into private `--_button-*` properties and reads them back as `var(--cui-button-bg, var(--_button-bg))`, so a token set on an ancestor wins and the variant supplies the default (#114, #116)
- `CuiCard` and its sub-components expose their box and paint as custom properties — `--cui-card-bg`, `-border`, `-shadow`, `-radius`, the three `-padding` tokens, and the header's title/subtitle sizes and colors. Theming a card previously meant `!important` on every declaration plus a class threaded through every call site. The header's inner elements also gained `cui-card-header__title` / `__subtitle` / `__actions` / `__content` classes; they had none, so there was nothing to select even after the roots got theirs in #94 (#115)
- Docs site: a `Usage` section now opens every component page with one canonical example and its code already showing, before the reference tables. Compound components (Card, Modal, Tabs) render an API sub-heading per sub-component instead of a top-level section each, which kept Customization and Examples reachable (#115)
- Docs site: component pages are built from a `DocPage` shell and a per-component metadata module, so the section order — Props, Slots, Events, Customization, Accessibility, Examples — is fixed by construction rather than by convention. Sections omit themselves when the metadata has nothing for them. A sticky on-page nav reads the page's own h2/h3 headings, so it works on every page including the ones not yet converted, and `Example` titles are real `<h3>`s instead of a `<div>` — previously no example on any page was reachable by heading navigation (#114)
- `CuiButton` gains an `icon` prop: square, no horizontal padding, and opts out of the minimum target size. It composes with `variant`, so an icon button can still be solid, outline, dash or ghost (#117, #118)
- `--cui-control-min-target` (default `24px`, the WCAG 2.5.8 minimum) makes the control-height floor overridable for buttons, inputs, selects, the time picker and tree-view hit areas at once. It only binds at `size="xs"` under compact density. Going below the minimum is now a deliberate, greppable act rather than an impossibility (#118)
- `CuiTreeView` is operable from the keyboard (#74). It had no keyboard handling of any kind — no `tabindex`, no `keydown` listener — so expand/collapse and selection were reachable only with a pointer, a WCAG 2.1.1 failure on the component's core interaction
  - A single tab stop with roving focus, per the ARIA tree pattern: one `Tab` reaches the tree however many nodes it holds. A `tabindex` per node would have added a tab stop per node, which is what that pattern exists to avoid
  - `↓`/`↑` move through visible nodes across depth boundaries; `→` expands a collapsed parent then steps into its first child; `←` collapses an expanded parent then steps out to the parent; `Home`/`End` jump to the ends; `Enter`/`Space` do exactly what a row click does; `*` expands every sibling at the current level; typing jumps by label prefix, accumulating for ~600ms so a multi-letter search continues rather than restarting. Disabled nodes are skipped throughout
  - Pointer and keyboard share one notion of the current node, so tabbing away and back resumes where a click left off. Collapsing a branch that contains the focused node moves focus to a still-visible node instead of dropping it onto `<body>`
  - Tree ARIA completed: `aria-multiselectable` on the tree; `aria-selected`, `aria-disabled`, `aria-level`, `aria-setsize` and `aria-posinset` on each `treeitem`; `role="group"` on each children wrapper. The focus ring draws on the row rather than the `treeitem` element, which has to wrap the whole subtree to contain the child group
- `CuiTreeView` exposes its expansion state. It owned it privately before — no `v-model:expanded`, no `defineExpose`, and `defaultExpanded` read once during setup — so a consumer could observe expansion through `@node-expand` but could not cause it, and "expand all", "reveal a search hit" and restore-after-reload all required synthesising a click on the chevron element through the DOM (#94)
  - `v-model:expanded` — pass it and expansion is controlled, exactly like `modelValue` already is for selection: the tree renders the ids you give it and emits every change instead of moving itself, so expansion can be driven from app state, persisted and restored. Omit it and the tree manages its own, seeded from `defaultExpanded` / `expandAll` as before. Both existing props keep working untouched
  - `defineExpose({ el, expand, collapse, toggleExpand, expandAll, collapseAll, reveal, isExpanded, expandedIds })` for the actions a bound array is clumsy for. `reveal(id)` expands every ancestor of a node so a deep match becomes visible without the caller working out the path. Each method works in both modes — under `v-model:expanded` they emit rather than moving the tree
  - `update:expanded` fires for every change. `node-expand` still fires per node for single-node changes however they were caused, including imperative ones; bulk changes (`expandAll` / `collapseAll`) report once through `update:expanded` instead of emitting one event per node
- `CuiTreeView` / `CuiTreeNode` now carry `cui-tree-view`, `cui-tree-node`, `cui-tree-node__row` and `cui-tree-node__chevron` classes. The chevron in particular had no class or `data-*` attribute, so it could only be found by walking the DOM from a known markup shape — which any change to the template silently broke (#94)
- The date and time pickers are operable from the keyboard (#74). `CuiDatePicker` and `CuiDateRangePicker` built their day/month/year grids from unfocusable `<div>`s with a click handler — no `tabindex`, no `role`, no `keydown` listener — so a date could only be picked with a pointer. `CuiTimePicker` had no focusable trigger at all
  - `↓` on the field opens the calendar. CuiPopover only opens on a click, so without this the grid navigation below was unreachable — a keyboard user could type a date but never see the calendar. `Enter` is deliberately not bound: in a form it submits, and the field accepts typed input
  - Calendar grids: `←`/`→` a day, `↑`/`↓` a week, `Home`/`End` the ends of the week, `PageUp`/`PageDown` a month, `Shift` + those a year, `Enter`/`Space` to select, `Escape` to close. The month and year grids use the same keys in their own units. Moving past the edge of a month pages the calendar, so the focused cell is always one you can see
  - Opening puts focus on the selected date (or today); closing returns it to the field. In `CuiDateRangePicker` the range preview follows the focused cell while picking the end, where it previously only followed the pointer
  - Movement deliberately does not skip disabled dates: a calendar is a grid whose shape carries meaning, and holes in it make it impossible to navigate. Disabled cells are reachable and carry `aria-disabled`; selection is what refuses
  - `role="grid"` / `role="gridcell"` with `aria-selected`, `aria-disabled` and per-cell labels, and a single roving tab stop
  - `CuiTimePicker`'s trigger is now `role="combobox"` in the tab order, opening on `Enter`/`Space`/`↓` and closing on `Escape`. It therefore also takes `id` / `aria-labelledby` / `aria-describedby`, which #78 had to skip because there was nothing focusable to attach them to — closing that half of #103
  - `CuiInputStepper` gains keyboard stepping and `role="spinbutton"`: `↑`/`↓` by one step, `PageUp`/`PageDown` by ten, `Home`/`End` to the bounds, all honouring `wrap`/`min`/`max`. It had no keydown handling at all, which is a WCAG 2.1.1 gap in its own right and is also why `CuiTimePicker`'s panel did nothing once opened
  - In `CuiTimePicker`, `Enter` commits the time and closes the panel, matching the calendar; `←`/`→` move between hour, minute and AM/PM, as the segments of a native time input do. `CuiInputStepper`'s `+`/`−` buttons are no longer tab stops — the input is the control and is fully keyboard-operable, which is how native number inputs behave — so `Tab` now goes straight from hour to minute instead of through three intermediate stops
  - `CuiTimePicker` moves focus into its panel on open. The panel is teleported to `<body>`, so it sits nowhere near the trigger in tab order — leaving focus on the trigger meant `Tab` went to whatever follows the component in the document, never into the hours field
  - New `useCalendarKeyboard` composable holds the grid navigation, shared by both date pickers rather than written twice
- `CuiContextMenu` can be reached without a right-click (#60). It could only be summoned by the native `contextmenu` event, and `positionAtCursor` was private, so a consumer wiring their own gesture had to dispatch a synthetic MouseEvent at a private code path. On touch that left context actions effectively unreachable; by keyboard they were unreachable outright
  - **`openAt(x, y)`** on the instance — open at viewport coordinates, for driving the menu from a kebab button or a list-row gesture. This is what the downstream workaround was faking
  - **Keyboard**: `Shift+F10` and the dedicated Menu key open the menu at the focused element, as the platform does. No opt-in, as long as the wrapped content contains something focusable
  - **Long press**: `trigger="longpress"` or `trigger="auto"` (the native event for mouse and pen, a hold for touch), with `longPressDelay` (500ms) and `longPressTolerance` (10px, so a drag or scroll is not a press). It is **opt-in** because suppressing the iOS callout and native text selection has to be in place *before* the gesture starts — it cannot be switched on mid-hold — so enabling it makes the wrapped content unselectable by touch. The default stays `contextmenu`, unchanged for every existing consumer
  - The hold swallows the `click` and the `contextmenu` the platform synthesises from the same press, so a long press neither activates what is underneath nor opens the menu twice on Android
  - New `open` (with coordinates) and `close` events
- Group controls can be named (#103). `CuiRadioGroup`, `CuiCheckboxGroup`, `CuiToggleGroup`, `CuiButtonGroup` and `CuiDropdownRadioGroup` now accept `aria-labelledby`, `aria-describedby` and `id`. A `<label for>` cannot name a group — there is no single control to point at, and a container is not a *labelable* element, so the association was silently never formed. That is why #78 left them out. `CuiFormField` already renders its label and help/error text with ids, so `v-bind="f"` now names a group end to end
  - `aria-label` is omitted when `aria-labelledby` is present: `aria-labelledby` wins anyway, and it points at text the user can actually see, so emitting both is noise
  - `CuiButtonGroup` and `CuiDropdownRadioGroup` also gain a `label` prop, for use where there is no element to point `aria-labelledby` at
  - `AriaLabelableProps` is split out of `NativeControlProps` (which now extends it) and both are exported — `NativeControlProps` had not been exported at all since #78
- New `NativeControlProps` mixin in `types/common.ts` — `id`, `name`, `autocomplete`, `ariaDescribedby`, `ariaLabelledby`. Every single-value form control now extends it and binds the attributes to its own focusable element (#78)
- `CuiFormField` renders its label and its help/error text with ids, and passes `ariaLabelledby` / `ariaDescribedby` through its slot bindings. `aria-describedby` is omitted when the field renders neither help text nor an error, since a reference to an element that isn't there is worse than none (#78)
- `CuiCoreMessages` is exported — the message keys this package itself ships, as distinct from `CuiMessages`, which is those plus whatever satellite packages have merged into `CuiMessageNamespaces` (#107)

### Changed
- **BREAKING:** `CuiButton`'s themeable rules are now zero-specificity (`:where(.cui-button)`), so they no longer outrank a consumer's own `.cui-button { … }` rule. That is the point — plain CSS themes a button again — but a rule written expecting the library to win will now take effect. Structural rules (`display`, `cursor`, the disabled states, sub-elements) keep their normal specificity (#114)
- **BREAKING:** the distributed stylesheet no longer ships Tailwind's preflight. `dist/clean-ui.css` carried the full global reset in `@layer base` — `box-sizing` on `*`, `-webkit-text-size-adjust` on `html`, zeroed `h1`–`h6`/`p` margins, `list-style: none` on `ul`/`ol`, `border-width: 0`, `button { background: transparent }`. Tailwind consumers got it twice, once from their own `@import "tailwindcss"` and once from ours, possibly from a different Tailwind version, and ours won ties on import order; consumers not using Tailwind got a page-wide reset they never asked for, easily misread as "clean-ui broke my typography". The library no longer imports the `tailwindcss` entrypoint at all — it pulls in `tailwindcss/theme.css` only, to compile its own `@theme`, and ships `styles/preflight.css`: the same reset scoped to `cui-*` subtrees (an element with a `cui-*` class, and its descendants) with every selector wrapped in `:where()` so it stays at zero specificity and stays overridable, in `@layer base` under an explicit `@layer theme, base, components, utilities;` so it still loses to your utilities. Tailwind's default theme variables (`--font-sans`, `--spacing`, `--color-red-*`, …) are no longer emitted either; the library references none of them. **Note:** a consumer unknowingly relying on clean-ui to supply their global reset will now need one of their own — the same class of change as #62's, and worth checking alongside it (#72)
- **BREAKING:** form controls put `id` on their native element instead of their wrapper. None of them declared `id`, so Vue's attribute fallthrough dropped it on the component's single root — `.cui-input-wrapper`, `.cui-select`, and so on, all plain `<div>`s. A `<label for>` then pointed at something that cannot be focused, so clicking the label did nothing and screen readers never formed the label/control association; `name` and `autocomplete` were equally inert there, which also broke browser autofill. Fixed across `CuiInput`, `CuiTextarea`, `CuiSelect`, `CuiCombobox`, `CuiTagInput`, `CuiInputStepper`, `CuiFileUpload`, `CuiSlider`, `CuiColorPicker`, `CuiCheckbox`, `CuiRadio`, `CuiToggle`, `CuiMaskedInput`, `CuiDatePicker` and `CuiDateRangePicker`. `CuiSelect` takes the `aria-*` attributes only — its focusable surface is a `div[role="combobox"]`, where `name`/`autocomplete` mean nothing, and where `for`/`id` forms no association at all, so `aria-labelledby` is what actually names it. `CuiTimePicker` and the group controls are tracked separately in #103, because neither has a labelable focusable element to attach to (#78)
- **BREAKING:** `CuiInputStepper`'s `+`/`−` buttons are no longer in the tab order. The input is the control and is now fully keyboard-operable, matching how a native number input treats its spinners — but this changes the tab order for every consumer of the component, not only inside `CuiTimePicker` (#74)
- **BREAKING:** `CuiDropdownRadioGroup` is `role="radiogroup"` rather than `role="group"` — it holds radios. Any selector or assertion keyed on the old role needs updating (#103)
- Docs apps resolve `@itguy614/clean-ui` to workspace source for **types** as well as for bundling. `config/workspace-aliases.ts` pointed Vite at source, but nothing pointed TypeScript there, so `vue-tsc` fell back to node resolution and read the package's built `dist/*.d.ts` — the bundler and the type checker disagreed about what the code was, and a docs typecheck failed on anything added since the last build, naming a prop that plainly existed. `config/tsconfig.workspace-source.json` is the TypeScript half, extended by both docs apps; neither needs `dist` to exist any more (#106, #107)
- `CuiButtonGroup` dropped ten `!important` declarations, `CuiInput` two more, and `clean-ui-editor`'s floating mode toggle three. Every one of them existed only to outrank `CuiButton`'s inline styles. `CuiInput`'s `border: none; height: 100%` on attached prefix/suffix buttons had been dead for the same reason and now applies (#114)
- `CuiPopover` and `CuiTooltip` hide their not-yet-positioned panel with `opacity: 0` instead of `visibility: hidden` (#112). `focus()` on a `visibility: hidden` element is a silent no-op, so any consumer moving focus into a panel on open was racing Floating UI's positioning and losing intermittently — which is why the date and time pickers each grew a `requestAnimationFrame` retry loop. Both loops and their shared helper are deleted; one `focus()` now works. The suppression also covers `animation`, which is load-bearing rather than tidiness: a CSS animation overrides inline styles, and both panels animate `opacity` from 0, so `opacity: 0` alone would have been overridden the moment the scale-in started and reintroduced the flash #88 fixed. Withholding it also means the animation plays from the final position rather than starting mid-move

### Fixed
- Solid buttons no longer take the surrounding text colour on hover, which made the label unreadable against the fill. The hover rule fell back to `inherit` when a variant set no hover colour — which only `solid` does — and it now falls back to the button's own resting colour instead. The bug predates #114 but was masked: the resting colour used to be an inline declaration, which outranked the hover rule; once both became stylesheet rules the later one won (#114)
- Dark-mode tokens are declared on the scoping root rather than on every element, so a subtree can re-theme them. They sat under `:where(.dark, .dark *)`, which set each token on every descendant individually — custom properties inherit, but the library kept overriding the inherited value, so a deliberately-light surface inside a dark panel could only be themed by mirroring the library's own blanket selector. They now use `:root.dark, .dark`: a bare `:where(.dark)` would lose the specificity tie with the `:root` light block on `<html>` and render the whole page light. The same change fixes a second case — with `cui-theme-*` and `dark` on the same element, which is what `useTheme` produces, neither old theme selector matched, so the themed element kept its light surfaces while its descendants went dark (#121)
- Every component root now carries a `cui-*` class. The scoped base added in #72 only reaches an element with such a class and its descendants, so a component whose own root had none rendered its whole subtree outside it — no `box-sizing: border-box`, no `font: inherit` on form controls. 46 roots across 43 components were in that state (`CuiDivider` alone has four, one per branch of its `v-if`), including `CuiCard`, `CuiTable`, `CuiDivider`, `CuiSpinner`, `CuiTimeline`, `CuiRating`, `CuiDatePicker` and the Card/Modal sub-components. This only misbehaved for consumers not supplying their own global reset, which is exactly the case #72 left without a safety net. Renderless components (`CuiConfigProvider`, `CuiToastProvider`) and those whose root is a `<Teleport>` or `<Transition>` are exempt — the element they wrap already carries the class (#72, #94)
- Four teleported panels (`CuiCombobox`, `CuiPopover`, `CuiSlideover`, `CuiTagInput`) rendered into `<body>` without a `cui-*` class of their own. They now carry `cui-combobox__dropdown`, `cui-popover__panel`, `cui-slideover-overlay` and `cui-tag-input__dropdown`, which puts them inside the scoped base — and makes them targetable from consumer CSS (#72)
- Floating panels no longer flash at the top-left corner of the screen before jumping into place. Floating UI positions with `transform: translate()`, and the panels animate in with `transform: scale(...)` — a CSS animation on `transform` *replaces* the element's transform for its whole duration, so the positioning translate was dropped and the panel rendered at the origin of the teleport container for the full 0.15s, then snapped. Most obvious opening upward, where the jump is the height of the viewport. `usePopover` now passes `transform: false`, so Floating UI writes `left`/`top` and the animation owns `transform` uncontested. Affected `CuiPopover` and everything rendering through it — `CuiDatePicker`, `CuiDateRangePicker`, `CuiTimePicker`, `CuiDataGridColumnManager` — and `CuiTooltip`, whose 200ms show delay made it easier to miss. `CuiPopover`'s existing `isPositioned` guard could not catch this, because the displacement happens *after* positioning succeeds; `CuiTooltip`, which had no such guard, now has one too (#101)
- `CuiContextMenu` flips up again when it does not fit below the cursor. `positionAtCursor` clamped `maxHeight` to the space *below* the cursor before measuring, so by the time it checked `rect.bottom > vh - padding` the panel had been constrained to fit by construction and the check could never be true — the flip-up branch was dead code. Right-clicking near the bottom squashed an eight-item menu into a two-item scroll box. It now measures the panel unconstrained (hidden for that frame, the same way `CuiPopover` avoids showing an unpositioned panel), then picks a side: below if it fits, else flipped up with its **bottom** on the cursor so the first item stays by the pointer, else the roomier side with a scroll. Measuring switched from `getBoundingClientRect()` to `offsetWidth`/`offsetHeight` — the panel animates in from `transform: scale(0.95)` and a rect reports the transformed box, so the old code was also measuring ~5% small, which left a leftward flip overhanging the right edge (#95)
- `CuiCombobox` and `CuiTagInput` dropdowns anchor to their control instead of their wrapper. The wrapper also holds the label above the control and the error message below it, so an upward-opening panel was placed 4px above the *label* — a gap the height of the label (~29px instead of 4px), which read as the dropdown detaching from the field. `CuiSelect` has always measured its trigger and looked right; both now match it. Same fix downward, where the old anchor cleared the error message. Both also sized the panel from `Math.max(spaceBelow, spaceAbove)` whatever side they opened to, so an upward panel could be taller than the room above it and run off the top of the viewport; they now bound by the side actually chosen, floored at zero (#99)
- `CuiTagInput`'s control element now carries `cui-tag-input__control`, matching `cui-combobox__control` — it had no class, so it could not be targeted for styling or testing (#99)
- A picker no longer steals the focus ring back when another one opens. Closing hands focus to the field, and closing is usually caused by clicking elsewhere — so with two pickers on a page, opening the second left the ring on the first one'''s field while the second one'''s panel was open. Focus is only reclaimed when it is the picker'''s to reclaim: still inside its own panel (what Escape and a commit look like, since the watcher runs before the DOM updates), or already on `<body>` because the close orphaned it (#112)
- The date and time pickers no longer scroll the page when opened. Making the panel focusable (below) meant `focus()` started actually doing something, and focusing an element scrolls it into view — with the panel still at the origin, opening a picker part-way down a page yanked the page to the top. Every focus in the picker path now passes `{ preventScroll: true }`; the panel opens beside a trigger the user is already looking at, so there is nothing to scroll to. `CuiMaskedInput.focus()` forwards `FocusOptions` as `CuiInput.focus()` and the native method already did (#112)
- `defaultMessages` is typed `CuiCoreMessages` rather than `CuiMessages`. Declaration merging is whole-program, so once a satellite augmented `CuiMessageNamespaces`, the library's own defaults literal no longer satisfied its own annotation — the augmented interface required a namespace this package cannot provide for itself. That forced `messages.test-d.ts` to assert against the built `.d.ts` (and so against a stale build, needing `pnpm build` to have run first) and blocked `apps/editor-docs` from resolving clean-ui to source the way `apps/docs` does. Both are now fixed: the type test targets source, the whole clean-ui suite passes with no `dist` present at all, and `apps/editor-docs` type-checks against source like every other workspace app. The single widening lives in `mergeMessages`, which returns `CuiMessages` from a `CuiCoreMessages` base — sound because a satellite ships and merges its own namespace defaults (#107)

## [1.2.2] - 2026-08-03

### Fixed
- `useTheme` no longer strips a consuming app's own `cui-theme-<brand>` class or forces a theme when the library loads; a stored theme is restored lazily on first use, and with nothing stored the default is a no-op (base Navy) rather than mono (#85)
- `@itguy614/clean-ui-editor`: built-in toolbar icons now register reliably in consumer builds — they were tree-shaken away and rendered as `?` (#86)
- `CuiTimePicker`'s trigger honors the `size` prop, so it matches `CuiInput`/`CuiDatePicker` heights when placed side by side (#87)
- `CuiPopover` no longer flashes at the viewport's top-left for one frame before Floating UI positions it — fixes the open flash across date/time pickers and popover menus (#88)

## [1.2.1] - 2026-08-03

### Documentation
- Add a README for `@itguy614/clean-ui-editor` — features, install, async usage, wysiwyg/source modes, the plugin API, and markdown→HTML rendering (#82)
- Link the editor from the `clean-ui` README (new "Markdown editor" section) and add a Packages section to the monorepo README (#82)
- Correct the `clean-ui` README: the library is ESM-only as of 1.0 (#82)

## [1.2.0] - 2026-07-31

### Added
- **New package: `@itguy614/clean-ui-editor`** — a markdown editor built on CodeMirror 6 where the
  markdown text *is* the document, so there is no conversion and nothing to lose on round-trip.
  Syntax markers hide until the caret enters the construct (construct granularity for pointer
  input, whole-line for touch); `wysiwyg` and `source` are one buffer with decorations on or off.
  Ships a plugin API whose declarative tier every built-in formatting action is written against, a
  slash menu, HTML-to-markdown paste, form-control integration with a `maxLength` that refuses
  rather than truncates, and a localised message namespace. Joins at the shared version per the
  lockstep policy; it is a first release, and its documentation says so (clean-ui-editor)
- Rendering markdown to HTML is opt-in at `@itguy614/clean-ui-editor/render`, and injectable — a
  consumer can supply the renderer they already use. Nothing in the core entry imports a renderer
  or a sanitiser, at any phase (clean-ui-editor)
- `@itguy614/clean-ui-editor/codemirror` re-exports the CodeMirror surface a plugin author needs,
  so a single instance is the default rather than something consumers must arrange
  (clean-ui-editor)
- Seams for satellite packages: an augmentable `CuiMessageNamespaces` interface so another package
  can add a typed message namespace, an exported `version` so a version mismatch or duplicate copy
  can be detected at runtime, and `useColorScheme` for code that needs the dark-mode state in
  JavaScript — resolved from the calling component's own ancestor chain, so a `.dark` scoped to a
  subtree is respected
- A second documentation site for the editor, served at `/editor/` alongside the existing one

### Changed
- Publishing is a matrix over every publishable package, with a guard that skips a package whose
  files have not changed since the previous release tag — lockstep moves every version number, and
  without the guard each release would republish byte-identical packages
- CI builds and tests the whole workspace on both supported Node versions rather than a single
  filtered package, and GitHub Pages now hosts both documentation sites from one composed artifact
- Package dependencies are externalized by rule rather than a maintained list, and CI asserts that
  every bare import in a built `dist` is declared — a list silently inlines the dependency someone
  forgets to add
- Package guarantees are verified in a **packed consumer build** installed with npm, not against
  this repository's own source aliases: no icon barrel, no CSS utilities layer, a single copy of
  each shared runtime dependency, and a committed gzip budget that fails CI on regression. Both
  regressions this checks for shipped to consumers before it existed (#42, #62)
- The contrast audit reads token sources from configuration, so it can cover more than one package
- `CuiButton` renders its content span only when the default slot is filled, so an icon-only button
  no longer emits an empty span

## [1.1.0] - 2026-07-28

### Added
- `CuiTab` accepts a `#label` slot for custom tab-button content — badges, icons, status dots. The `label` prop stays required and renders whenever no slot is given (#45)

### Changed
- **BREAKING (icons):** `CuiIcon` no longer resolves arbitrary names by importing all of `@phosphor-icons/vue`. It now renders from a static set — the 52 icons the library's own components draw — plus anything you register. An unregistered name renders a `?` glyph and logs how to fix it. Measured on an app rendering one icon: **1306 kB → 124 kB gzip, 1513 icons → 52** (#42)
  - `registerIcons({ rocket: PhRocket })` adds your own statically-imported icons; each adds only itself to the bundle
  - `<CuiIcon :icon="PhRocket" />` passes a component directly
  - `import "@itguy614/clean-ui/icons/lazy"` restores the old any-name behavior in one line, at the old bundle cost — for apps whose icon names come from data
- Icons in the static set now render synchronously, so they appear in SSR output and on first paint instead of after mount — the placeholder and the hydration workaround are gone for them (#42)
- `CuiTable` header backgrounds now reference the `--cui-table-head-bg` token instead of raw surface scale steps, so overriding it works on sticky tables and `CuiDataGrid` (#64)
- `CuiTable` now always renders its scroll wrapper (`<div class="cui-table-wrapper">`) around the `<table>`, not only when `minWidth`/`maxHeight` is passed. The wrapper stays inert (`overflow: visible`) while the table fits and only becomes a scroll container when the table actually overflows, so page-scrolled `stickyHeader` tables are unaffected. **DOM change:** a CSS selector matching `.cui-table` as a direct child of a specific element needs updating (#58)
- New `table.scrollRegionLabel` message key (default `"Scrollable table"`) — the accessible name for a table's scroll region (#58)

### Fixed
- The distributed stylesheet no longer ships base Tailwind utilities. `dist/clean-ui.css` emitted an `@layer utilities` block with 48 general-purpose classes (`.hidden`, `.flex`, `.block`, `.container`, `.table`, `.border`, `.transition`, …) that Tailwind's content scan had generated from incidental words in the library source — the components never used them. In a consuming Tailwind app that block merged into the app's own utilities layer *after* its Tailwind, so clean-ui's bare `.hidden` beat the app's `.md:flex` and `hidden md:flex` toggles stayed collapsed at every width. **Note:** a consumer unknowingly relying on clean-ui to supply a utility class will now need it from their own Tailwind (#62)
- `CuiTreeView`'s expand/collapse chevron now has a 24×24px minimum hit target (WCAG 2.5.8) instead of being sized to the glyph — 12px at `size="sm"`, 14px at `md`. The caret still draws at its old size; only the tappable box grew, using the same `scaleControlHeight` floor as `CuiButton`/`CuiInput`. **Visual:** rows are ~4.5px taller at `sm` and ~3px at `md`, and labels shift ~7px right (#59)
- Overlay scroll lock now holds on iOS Safari — `overflow: hidden` on `<body>` doesn't stop touch scrolling there, so the page kept panning behind an open `CuiModal` / `CuiSlideover`. On iOS the body is pinned with `position: fixed` at its current offset and the scroll position is restored on close; other platforms keep the lighter `overflow` lock (#61)
- Overlay scroll lock is reference-counted, so closing one of two stacked overlays no longer unlocks the page, and it restores the previous inline `<body>` styles instead of blanking them (#61)
- Opening an overlay no longer shifts the page sideways where scrollbars take up space — the removed scrollbar's width is held as padding (#61)
- A `CuiTab` no longer jumps to the end of the tab bar when one of its props changes — re-registration now updates in place instead of removing and re-appending (#45)
- Storage access no longer throws where `localStorage` exists but is unusable — sandboxed iframes without `allow-same-origin`, Safari private mode, blocked cookies, exceeded quota. `useDensity`, `useDataGridViews`' `localStorageViewAdapter`, and `CuiBanner` were unguarded; `useDensity` read at module scope, so a single throw took down every import of the library barrel. All storage now routes through one guarded helper (#67)
- Test suite runs on modern Node again: Node ≥22 ships an inert global `localStorage` that shadows jsdom's, which broke the `useDensity` and smoke suites at collect time. CI now runs a Node 20 + 24 matrix so runtime-dependent breakage surfaces (#67)
- `CuiTableCell` inside a `CuiTableHead` now renders `<th scope="col">` instead of `<td>`. Vue casts an absent `Boolean` prop to `false`, so the explicit-override branch always won and the section context was never consulted — which also meant `sticky-header` was a silent no-op, since its CSS matches `thead th`. **DOM change:** consumer CSS targeting `thead td` needs updating (#64)
- `CuiTabs` tab bar now scrolls when the tabs overflow their container, with an edge fade marking the clipped side — trailing tabs were previously clipped and unreachable inside `CuiModal` / `CuiSlideover` (#57)
- `CuiTabs` keyboard navigation no longer focuses a tab in a different `CuiTabs` instance when two tab sets on a page share tab values (#57)
- Wide `CuiTable`s no longer overflow their ancestor into page-level horizontal scroll with no affordance — horizontal scroll containment and the scroll-shadow fade are now the default instead of requiring `minWidth`/`maxHeight` (#58)
- A scrolling `CuiTable` (including `CuiDataGrid`'s) is now keyboard-reachable — `role="region"`, `tabindex="0"`, and a focus ring, per WCAG 2.1.1 (#58)

## [1.0.1] - 2026-06-29

### Added
- `CuiDataGrid` is now generic over its row type (`CuiDataGrid<T>`) — custom cell slots and row/bulk-action emits are typed, no more `(row as any)` (#46)
- `CuiInput` supports `type="number"` / `"range"` and a numeric `modelValue` (`string | number`), so `v-model.number` binds without a cast (#47)
- Dev-mode warning when an unrecognized `variant`/`color` is passed to `CuiBadge`/`CuiButton`/`CuiAlert`, plus docs clarifying color vs variant (#48)

### Fixed
- DataGrid bulk-action bar buttons no longer render blue-on-blue; the bar is now a subtle tinted surface (#49)
- DataGrid header→body divider now renders (its header cells are td-based) (#43)
- `CuiSlideover` / `CuiModal` open (slide/scale-in) animation now plays (#44)

## [1.0.0] - 2026-06-22

### Added
- Per-module, tree-shakeable build (`preserveModules`) and subpath exports (`@itguy614/clean-ui/*`) so bundlers drop unused components and deep imports resolve (#27)
- `cui-scrollbar` opt-in utility for always-visible custom scrollbars (#33)

### Changed
- Color scale consolidated into a single source of truth shared by the library and docs — no more drift between them (#37)

### Removed
- **BREAKING:** the UMD / CommonJS (`require()`) build — the package is now ESM-only; `main`/`module` resolve to `dist/index.js` (#27)

### Fixed
- WCAG AA contrast across all 8 themes in light & dark mode: secondary/tertiary text, dark-mode code blocks, badges, sidebar nav, and unchecked form controls (#34)

## [0.9.0] - 2026-06-22

### Added
- Row virtualization for `CuiDataGrid` — opt-in `virtualize` prop that windows rows for large datasets (#15)
- `CuiForm` form-level abstraction with submit handling and library-agnostic validation; ships `zodResolver` and `valibotResolver` adapters (#19)
- Localization: `CuiConfigProvider` + `useMessages` message catalog to override every built-in string, with documented zod/valibot recipes (#23)
- Global UI density — `compact` / `default` / `comfortable` via a `useDensity` composable and `cui-density-*` classes; scales spacing (never type), with WCAG touch-target floors (#25)
- Live-region semantics (`role` / `aria-live`) on Toast, Alert, and Banner so screen readers announce them (#21)
- SSR/Nuxt support — SSR-safe DOM guards, `ssrThemeInitScript` to prevent FOUC, and hydration-safe `CuiIcon` (#28)
- Test suite (smoke coverage + interactive behavior tests) and a CI gate running type-check + tests on every PR (#24)

### Fixed
- `CuiDataGrid` sticky-column headers and the select-all / row-action header cells no longer scroll away on vertical scroll (#22)

## [0.3.1] - 2026-04-23

### Fixed
- Use working-directory instead of -w flag for npm publish workflow

## [0.3.0] - 2026-04-23

### Added
- 80+ Vue 3 components with TypeScript, Tailwind CSS v4, dark mode
- 8 color themes (Mono, Navy, Forest, Amber, Azure, Teal, Violet, Ruby)
- Data grid with sorting, filtering, pagination, card view, saved views
- Interactive playground on 10 component docs pages
- Event tables documenting emits on 36 docs pages
- Docs site with GitHub Pages deployment
- npm publish workflow triggered by version tags
- WCAG AA contrast system with dark mode solid tokens
- Scroll shadow composable for tables and modals
- Color picker, date/time pickers, combobox, transfer list, tag input, file upload, tree view, and more

### Fixed
- WCAG AA contrast across all themes in light and dark mode
- Monotonic surface scale (no longer mutates 200/300 steps for borders)
- Modal scrolling body with proper scroll shadows
- Modal header/footer backgrounds prevent content bleed-through
- Radio button selected hover contrast
- Warning text changed to white for proper contrast on dark amber

### Changed
- Theme IDs renamed from product names to color palette names
- Border tokens reference surface-500/600 instead of mutated 200/300
- Dark mode primary text bumped from 400 to 300 for better outline contrast
- Solid button backgrounds use dedicated -solid tokens in dark mode
- Overview page rewritten: "token-based" not "Tailwind-first"
- Navigation alphabetized, Badge moved to Data Display, Tooltip to Overlay
- PropTable uses cui-code class for readable formatting

### Documentation
- Docs app @theme synced to match library values
- EventTable component for documenting component emits
- Playground component integrated into 10 key component pages
