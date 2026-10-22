# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Motion tokens** (#261): `--cui-duration-instant/-press/-fast/-base/-slow` and
  `--cui-ease-out/-in-out/-drawer`. Every component transition and animation reads them,
  so a consumer can make the whole library snappier or calmer from `:root`, or one part of
  it from a container. Teleported overlays (menus, popovers, tooltips, modals and
  slideovers) follow `:root` only. `motionDuration(name, el?)` reads a token in JS, and the exit timers
  in CuiModal, CuiSlideover, CuiDropdown, CuiContextMenu and CuiAlert use it.
  `useOverlay`'s `animationDuration` also takes a token name. A new Foundations → Motion page
  documents them.
- **Press feedback** (#261): a pressed CuiButton shrinks to `--cui-press-scale` (0.97)
  over `--cui-duration-press`. Set the token to `1` to turn it off. It's off under reduced
  motion, and wherever buttons are merged: CuiButtonGroup, CuiInput's attached buttons and
  CuiInputStepper's +/- buttons.

### Changed

- **Reduced motion keeps fades** (#265). Under `prefers-reduced-motion: reduce`:
  - **Fades instead of nothing:** the library used to clamp every animation and transition to 1ms, so nothing faded. Now it removes movement only. Opacity and colour still transition over their usual durations, so overlays fade in and out where they stand, and JS waits still match.
  - **Only the library's own elements:** the old rule matched every element on the page (`*`), the consumer's own included. It now reaches only the library's components and what they contain, not content the consumer wraps in `.cui-typography`, a theme or a density.
  - **Indeterminate progress, spinners' moving parts and the avatar's pulsing status** now stop too.
  - **Hover-only scales and lifts** (CuiRating, the CuiColorPicker swatches, CuiAvatarGroup) now run only with a fine pointer, so a tap on a touch screen no longer leaves them stuck.
- **Every overlay animates out** (#263), through `<Transition>` rather than a close timer:
  - **Animate out, then unmount:** Tooltip, Popover (and the date, time and range pickers), the Select/Combobox/TagInput listbox, and DropdownSub.
  - **Animate in too:** the Select, Combobox and TagInput listboxes.
  - **Reopen mid-exit:** menus and panels turn straight back from where they are, instead of restarting.
  - **Removing a toast** fades it out while the rest slide into place, where before they jumped.
  - **Report after the exit:** Modal, Slideover and Alert report their close or dismiss once the exit has played.
  - **No close timers left:** Dropdown, ContextMenu, Modal, Slideover and Alert.
  - **`useOverlay`** gains `exit: "transition"`, with `mounted` and `onAfterLeave`. The timer stays the default.
  - **`afterAnimations(el, done)`** is exported.
  - **Deprecated:** the dropdown context's `isClosing` is now always false.
- Floating panels grow out of their trigger instead of their centre (#262). Popover,
  Tooltip, DropdownMenu, DropdownSub, ContextMenu and the Select/Combobox/TagInput listbox
  set `transform-origin` from the side they opened on after flipping: their edge facing
  the trigger, at the end they are aligned to. A context menu grows from the corner at the
  pointer. Dropdown menus and sub-menus now scale in from 0.95 rather than slide 4px, which
  pointed the wrong way when a menu flipped up. `usePopover` returns `transformOrigin`.
- A motion guard (`styles/__tests__/motion.test.ts`, #267), across both packages, fails on:
  - `transition: all`
  - `ease-in`
  - an entrance from `scale(0)`
  - a literal duration or close-timer delay

  It also tracks two things until their issues land: layout-property transitions (#266,
  #270), and floating panels that don't yet take a placement-derived `transform-origin`
  (#262).
  Exemptions count their findings, so a new violation in an exempt file still fails.
  CLAUDE.md gains a Motion section that the guard enforces.
- Enter and exit motion uses the `--cui-ease-out` curve instead of plain `ease`, and
  movement on screen (a toggle knob, a chevron turning) uses `--cui-ease-in-out` (#261).
  Colour changes keep `ease`. Menus and popovers open over 200ms and close over 150ms;
  CuiAlert's and toasts' 300ms motion is now 250ms, and Progress's 400ms fill is 250ms.

## [1.4.0] - 2026-10-22

### Added

- **CuiScrollArea** and **useScrollArea** (#143): a scroll container that fades its content
  out at an edge with more past it, with optional arrow or scroll-button indicators beside
  the scroller (`indicator`, `indicatorVisibility`, `#indicator-start`/`#indicator-end`).
  While its content overflows it is a named, focusable region; when it fits it adds no tab
  stop. Edges are logical, so right-to-left pages work. `useScrollArea` is the same
  arrangement for a scroller you render yourself, with a `mask` or `overlay` fade. New
  message key `scrollArea.region` (a custom catalogue must add it).

### Changed

- clean-ui-editor's peer range on `@itguy614/clean-ui` moves to `^1.4.0`: the editor's
  toolbar is built on CuiScrollArea (#143), and its error message carries the shared
  `.cui-field-error` (#217), both first shipped in this release.
- A form control's error message is styled by one shared `.cui-field-error` class (#217):
  0.8125rem at line-height 1.4 everywhere. CuiTagInput and CuiCombobox drew theirs at
  0.75rem, and CuiCombobox's was an inline style no stylesheet could override. Their gap
  above it matches CuiInput's. Each control keeps its own `__error` class beside it.
- CuiCheckbox, CuiRadio, CuiToggle, CuiCopyButton and CuiSpinner hide their screen-reader-only
  parts with the shared `.cui-sr-only` instead of their own copies, three of which used the
  deprecated `clip` (#217).
- CuiDatePicker, CuiDateRangePicker, CuiTimePicker, CuiTransferList and CuiTreeView take the
  full `CuiSize` scale for `size` (#217), so a wrapper forwarding any size type-checks.
  Components styled at three sizes give `xs` and `xl` the nearest one.
- CuiTable, CuiModalBody and the markdown editor toolbar are built on the new scroll area
  (#143). The toolbar's edge fades are now a mask on the buttons rather than painted
  gradients, so they match any toolbar background.

- **Elevation tokens** (#224): `--cui-shadow-sm`, `--cui-shadow-md` and `--cui-shadow-lg`, each
  with a stronger dark-mode value. CuiDropdownMenu, CuiDropdownSub, CuiContextMenu, CuiModal
  and the markdown editor's mode toggle and autocomplete use them in place of a hardcoded
  shadow restated in a `.dark` rule; their look is unchanged.
- CuiTooltip, CuiAlert, CuiToast and CuiBackdrop take their paint from tokens, so a plain
  rule restyles them without `!important` (#211). Their backgrounds, colours and borders
  were bare inline declarations. New tokens: `--cui-tooltip-bg` (the arrow follows it),
  `--cui-tooltip-color`, `-px`, `-py`, `-radius` and `-font-size`; `--cui-alert-bg`,
  `-color`, `-border` and `-radius`; the same four for `--cui-toast-*`; and
  `--cui-backdrop-bg`. A tooltip teleports to `<body>`, so set its tokens on `:root`.
- **App-wide defaults** (#149): `createCleanUI({ headingLevels, roleIcons })`, for one app.
  `headingLevels` sets the default heading level of CuiCardHeader, CuiModalHeader (and so
  CuiModal's and CuiSlideover's `title`), CuiConfirmDialog and CuiEmptyState; an explicit
  `titleAs` still wins. `CuiConfigProvider` takes the same two props for a subtree, and
  `configureCleanUI()` sets them globally, as the fallback beneath every app.
  `registerRoleIcons()` stays as its alias for role icons.
- `useRovingFocus` returns `focusNearest(i)`: after the focused item is removed, focus the
  enabled item that took its place (the next, else the one before) instead of losing focus
  to `<body>` (#170).
- `CuiContextMenu` takes `resolveTarget(el)`, for one menu serving many targets. It is
  called with the element a right-click, long-press or Shift+F10 landed on. Return what
  the menu is for, and the `menu` slot receives it as `target`; return nothing and that
  spot gets the browser's own menu (#208).
- CuiDataGrid takes `searchDebounce` (ms, default 300 — what it always waited): how long the
  search box waits after the last keystroke (#273).


- Twelve components draw their neutral hover, active and track fills from the semantic slots
  (`--cui-surface-bg`, `--cui-surface-dark-bg`, `--cui-table-head-bg`) instead of raw surface
  steps restated for dark mode (#210): Accordion, the four dropdown items, Fieldset,
  Pagination, Tabs, Select, Input, Table and DataGrid, and the markdown editor's
  autocomplete highlight. Same colours in both modes; a consumer's
  slot override now reaches them, and their `.dark` twins are gone. New tokens for the fills
  that had none: `--cui-table-stripe-bg`, `--cui-table-row-hover-bg` and
  `--cui-pagination-hover-border`.
- **More of the UI is translatable** (#215): English a component hardcoded now comes from the
  message catalogue. That covers the prose defaults of CuiCombobox, CuiSelect, CuiTagInput,
  CuiFileUpload, CuiTransferList, CuiCopyButton and CuiSpinner (a prop you set still wins), and
  literals in CuiDataGrid's toolbar, column and view managers, the date pickers ("Today", the
  year-range names, the range prompt), CuiCopyButton's label, CuiAvatar's fallback `alt`,
  CuiToggle's "ON", CuiPagination's landmark and button names, and CuiFileUpload's size, count and
  `reject` reason lines. English output is unchanged. **New required `CuiCoreMessages` keys**:
  a catalogue passed to `CuiConfigProvider` merges onto the defaults and needs nothing, but a
  hand-built full `CuiCoreMessages` object must add `combobox.placeholder` / `noResults`,
  `tagInput.placeholder` / `noSuggestions` / `create` (a function of the value), `select`,
  `fileUpload`, `transferList`, `datePicker`, `dateRangePicker`, `copyButton`, `avatar`, `spinner`,
  `toggle`, `pagination.label` / `previous` / `next` / `page`, and nine under `dataGrid`. Still
  English: month and weekday names, day-cell labels and file sizes, which need locale
  formatting (#337), and CuiTimePicker's AM/PM, which its field, mask and value share.
- CuiRadioGroup, CuiCheckboxGroup and CuiToggleGroup share one implementation of their
  layout and auto-orientation, and the two multi-select groups share their context
  provider (#206). Auto orientation now counts only rendered options: a `v-if`'d-out
  option, whitespace, or a nested `<template v-for>` no longer skews it. Each root and its `__options` / `__error` elements now also carry
  `cui-control-group` classes, whose rules live in the library stylesheet. Those rules
  have lower specificity than the old scoped copies, and the error container's paint is
  zero-specificity, so a consumer's plain (unlayered) override wins. The group-specific
  classes are unchanged. `CheckboxGroupContext` and `ToggleGroupContext` are now aliases of
  `MultiSelectGroupContext`, the identical shape. The deep-import paths
  `components/checkbox-context.js` and `components/toggle-context.js` are gone: the keys they
  held were never the ones the components used, so nothing reading them could have worked.
  Import from the package root.
- **CuiSelect's dropdown now looks like CuiCombobox's and CuiTagInput's** (#216): 0.5rem
  corners, the layered drop shadow, a primary-tinted highlight instead of grey, and a tinted
  selected row instead of coloured bold text. It is the same shared listbox panel, and takes
  the same tokens under the `select` prefix (`--cui-select-panel-*`, `--cui-select-item-*`),
  which are new. Its keyboard navigation now follows the order options are shown in, with
  groups, and adds Home/End and type-ahead.
- **CuiDropdownTrigger forwards menu-button semantics to its child** (#160). The CuiButton
  or `<button>` inside it now gets `aria-haspopup="menu"`, `aria-expanded` and
  `aria-controls`. Arrow Down or Arrow Up on it opens the menu on the first or last item,
  in every trigger mode. The slot should hold exactly one element; anything else logs a
  warning.

### Deprecated

- `useScrollShadows` and its `scrollShadow*Style` objects, in favour of `useScrollArea` (#143).
  Nothing in the library uses them any more; they remain exported until 2.0.

### Fixed

- CuiDateRangePicker sizes its trigger from `size` (#349). It accepted the prop but drew a
  fixed 39px box at every size, a pixel short even of a `md` CuiInput. It now takes its
  height, padding and font size from the same input scale as CuiInput, CuiDatePicker and
  CuiTimePicker, so it lines up with them: its text is 1rem at `md`, up from 0.875rem, and
  the two date fields widen with it. `--cui-date-range-picker-height`, `-px` and
  `-font-size` override them.
- CuiDataGrid takes the full `CuiSize` scale for `size` (#349). `xs` and `xl` take the
  nearest table size, as CuiTable already did. The exported `TableSize` type is unchanged.
- CuiBadge is back to its designed height, about 5px shorter (#351). Since 1.3 its text
  took the scoped reset's `line-height: 1.5` instead of the badge's own 1. Anything holding
  a badge is shorter by the same: tabs with counts, table cells, the timeline. A row of
  chips in an `xs` or `sm` CuiTagInput or CuiCombobox now fits, so the field matches a
  CuiInput beside it.
- CuiResizablePanels follows only the pointer that started a drag, and its handle sets
  `touch-action: none`, so a touch drag resizes the panels instead of panning the page
  (#275). It and CuiColorPicker now share one internal drag helper, and neither starts a
  drag on a right- or middle-click.
- CuiModalBody can be scrolled from the keyboard (#143). An overflowing body is now a
  focusable region, so a body with nothing focusable in it is no longer stuck for keyboard
  users (WCAG 2.1.1). Its padding moved to an inner `.cui-modal-body__content` element.
- CuiTable's wrapper is a scroll region only while the table actually overflows (#143): a
  `maxHeight` table whose rows fit no longer adds a tab stop that scrolls nothing.
- `allowNested` on CuiModal and CuiSlideover (and `useOverlay`'s option) (#285). It never had
  an effect: overlays always stack, and Escape closes only the topmost. It warns when passed
  and goes in 2.0. `useOverlay`'s private one-at-a-time set, which it cleared, is gone; the
  shared layer stack is the one record of open overlays.


- A theme class on part of a page now re-themes it (#329). `<div class="cui-theme-forest">`
  changed only the colour scale; every semantic slot (`--cui-primary`, `--cui-surface-bg`,
  `--cui-text-*`, …) was resolved once on `:root`, so components inside kept the page's theme.
  The slots are now declared on every theme scope too, in light and dark mode. Only the slots that read the scale are re-declared, so a container's own value for the
  others (`--cui-error-focus-ring`, …) still reaches inside. A slot override on `:root` (or any
  ancestor) for one that does read it — `--cui-primary-hover`, say — now stops at a scoped
  theme, which applies its own; to change it inside one, override it on the themed element.
- Components inside a `.cui-typography` scope are no longer restyled by its prose rules
  (#147). Every prose element rule (paragraphs, lists, code, `pre`, `kbd`, blockquotes, `hr`,
  tables, `mark`, `small`) now skips elements carrying a component's `cui-*` class, as headings
  and links already did. The typography layer's own classes (`cui-lead`, `cui-code`, …) still
  take prose styling, with the same specificity as before; `cui-list-unstyled` and
  `cui-list-inline` now actually remove the prose list markers and indent, which used to
  override them. Under a prose scope, CuiTable and CuiDataGrid cells follow their `size` again
  instead of a fixed prose padding, and a breadcrumb's list loses the prose markers and
  indent. Prose itself is unchanged.
- CuiCheckbox, CuiRadio and CuiToggle no longer read their description as part of their
  name (#183): with a `description`, the control is named by its label and described by
  the description. `useFieldDescribedBy` takes an optional `descriptionId`, ordering the
  ids description, then the caller's, then the error.

- Clicking a CuiFormField label now does what a native label would when its control isn't
  natively labelable — CuiCheckbox, CuiRadio, CuiToggle, CuiSelect, CuiTimePicker and the
  groups, where the label's `for` did nothing (#181). It focuses the control (a group's tab
  stop, without picking an option), toggles a checkbox or switch and selects a radio, and
  does nothing for a disabled one.

- CuiPagination's per-page selector is named "Results per page", and its landmark, previous,
  next and page-button names come from the message catalogue (`pagination.label`,
  `perPageLabel`, `previous`, `next`, `page(n)`) instead of hard-coded English. The
  ellipsis is hidden from screen readers (#155). The new keys are required members of `CuiCoreMessages`: a
  full catalogue typed with it needs them added (a partial one passed to
  `CuiConfigProvider` doesn't).
- CuiStepper's steps can be operated from the keyboard (#154). The steps are an ordered
  list inside a `<nav>`, so their count and position are announced; a step you can go to
  is a `<button>`, and the buttons share one tab stop (`useRovingFocus`) on the current
  step. Completed and error steps say so to a screen reader (`stepper.complete` /
  `stepper.error`). With `linear`, only steps up to the furthest one reached are navigable: an
  error step ahead can no longer be jumped to, and going back no longer locks the steps
  already done. `focus()` focuses the current step. This adds a tab stop, so a focus-order snapshot will change.
- CuiFileUpload can be operated from the keyboard (#169). The file input is visually hidden
  but stays in the tab order (it was `display: none`), so Enter or Space opens the file
  dialog, and the drop zone is a `<label>` for it that draws its focus ring. The `label`
  prop now labels the input (so clicking its text opens the dialog too), the accept and size hint describes it, each remove button is
  named after its file (`fileUpload.removeFile`), `focus()` focuses the input, and
  `disabled` disables the input and the list's buttons. This adds a tab stop, so a
  focus-order snapshot will change.
- CuiTransferList can be operated from the keyboard (#170). Each list is a multiselectable
  `role="listbox"` named by its title, with one tab stop (`useRovingFocus`): the arrows and
  Home/End move, Space marks an item, and Enter moves the focused item across. The six
  icon-only buttons and the filter fields are named, and "No items" is translatable
  (`transferList.*` in the message catalogue). This adds tab stops, so a focus-order
  snapshot will change. A double-clicked (or Enter-moved) item no longer stays marked, which
  let "move selected" add it to the other list a second time. "Move selected" now moves only the marked items
  the filter shows; marks on filtered-out items stay. A disabled item in the selected list
  can no longer be marked, double-clicked or dragged.
- `useRovingFocus` leaves no tab stop when every item is disabled, rather than keeping one
  on a disabled item (#170).
- CuiRating can be operated from the keyboard and is announced as a rating (#171). The
  icons are one `role="slider"` tab stop: the arrow keys step the value (by half a star
  with `half`), Home and End reach the ends, and `aria-valuetext` reads "3 of 5 stars"
  (`rating.valueText` in the message catalogue). `label` names it, and `focus()` now
  focuses it. A `readonly` rating is an image with the same text and no tab stop. This
  adds a tab stop to every interactive rating, so a focus-order snapshot will change.
- CuiDataGrid's clickable rows can be used from the keyboard, and plain rows no longer look
  clickable (#232). With a `@row-click` listener (or `rowClickable`), rows are one tab stop:
  the arrows and Home/End move between them — scrolling a virtualised grid — and Enter or
  Space emits `row-click`, with a focus ring and a pointer cursor. Without one, rows get no
  tab stop and no pointer. An overlay opened from a row returns focus to it on close, even
  after it scrolled out of the virtualised window (`useOverlay` asks for an unmounted opener
  back by key, and so does a row's actions menu). `rowClickable` overrides the detection
  either way. Interactive rows carry an `aria-description` ("Press Enter to open",
  `dataGrid.rowHint`).
- CuiDataGrid's column sorting is keyboard-operable and announced (#161): a sortable header's
  text is a `<button>`, and its `<th>` carries `aria-sort`. The select-all and row
  checkboxes, the row-actions buttons and the view toggle are named ("Select Alice",
  "Actions for Alice", "Table view") — a new `rowLabel` prop picks what names a row — from
  new `dataGrid.*` message keys — required members
  of `CuiCoreMessages`, so a full catalogue typed with it needs them. This adds a tab stop
  per sortable column, so a focus-order snapshot will change.
- CuiDataGrid mounts one context menu for the whole grid instead of one per row: a 500-row
  grid mounted 500. The menu shows the actions of the row it was opened on, and a row with
  none still gets the browser's own menu (#208).
- CuiDataGrid's client-side search and filters no longer lower-case every cell on every
  keystroke: each row's cells are lowered once and cached, redone only for a value that
  changed, so a keystroke in a 5,000 × 10 grid went from 50,000 lower-casings to none (#273).

- CuiTabs links each tab to its panel (#271): a tab's `aria-controls` names its panel and the
  panel's `aria-labelledby` its tab, with ids generated per tab set. Before, the panel named
  the tab's value, which no element had as an id, and tabs had no `aria-controls`.

- CuiResizablePanels' handle is keyboard-operable and announced (#156): a focusable
  `role="separator"` (the WAI-ARIA window splitter) named "Resize panels"
  (`resizablePanels.handle` in the message catalogue), with `aria-valuenow` and
  `aria-controls`. The arrows along the split move it in 2% steps (10% with Shift), Home and
  End go to the extremes, and Enter collapses and restores when `collapseThreshold` is set.
  The arrows and the drag now follow the page direction side by side. This adds a tab
  stop, so a focus-order snapshot will change. A collapsed first panel is `inert`, so its content
  leaves the tab order and the accessibility tree. A double-click reset is now clamped to
  `minFirst`/`minSecond`, and emits `collapse` only when it reopens a collapsed panel.
- CuiColorPicker can be operated from the keyboard (#177). The gradient is a Saturation /
  Brightness slider pair sharing one tab stop (Left/Right and Up/Down), hue and alpha are
  sliders, and the swatches are a radiogroup whose arrows move and select, each named by
  its hex value. Shift takes ten steps. Names and value texts are in the message catalogue
  (`colorPicker.*`). `disabled` now disables the text field and the format toggle, which
  stayed editable before, and takes the sliders and swatches out of the tab order.
  `focus()` without a text field focuses the gradient instead of doing nothing. The swatches
  wrap into rows, and Up/Down move a row. This adds tab stops, so a focus-order snapshot will
  change.
- CuiColorPicker's border frames the gradient as well as the controls below it; it had no
  top edge (#177).
- CuiColorPicker no longer re-reads its own emitted value under `v-model`. That value is
  quantized hex, and parsing it back rewound drags and keyboard steps, lost the hue
  whenever the colour reached grey or black, and turned 360° into 0°. A palette entry in
  any format (`#f00`, `rgb(…)`) now shows as selected (#177).
- CuiDropdown and CuiContextMenu put focus back where it came from when Escape or a chosen
  item closes them: the trigger, or the element the context menu was opened from. A
  click outside still leaves focus where it landed. On open, focus now also lands on a
  check or radio item when it comes first. CuiContextMenu's Escape goes through the shared
  layer stack, so inside a modal it closes only the menu (#160).
- Tab in an open dropdown or context menu closes it, and focus moves on from the trigger
  as it would from any button, instead of leaving the page from the end of `<body>`. A
  sub-menu now handles its own keys: Arrow Right moves focus into it, Arrow Up/Down move
  within it, and Escape or Arrow Left closes only the sub-menu and returns to its row
  (#160).
- A dropdown shown by hover or focus (`trigger="hover"` / `"hover-focus"`) no longer takes
  focus from where it was, and a `hover-focus` one no longer closes when focus moves into
  its menu (#160).

## [1.3.2] - 2026-10-19

### Added

- `useFieldDescribedBy` (and its `DescribableProps` type) is now a public export of
  clean-ui. It wires a control's own error message into `aria-describedby` after any
  caller descriptions. clean-ui-editor now requires clean-ui 1.3.2 or later (#221).

### Fixed

- CuiColorPicker ends a drag when it unmounts, or when the browser cancels the pointer.
  An interrupted drag used to leave document listeners attached. Touch drags now work
  on all three surfaces, only the pointer that started a drag moves it, and disabling
  the picker mid-drag ends the drag (#246).
- CuiDataGrid follows changes to its `columns` prop after mount: widths, labels,
  `sticky`, added and removed columns. Your hidden columns and order are kept. Saved
  views and the unsaved-changes indicator stay in step with the change, and
  "Save current" now clears the indicator (#258).
- CuiTooltip dismisses on Escape wherever focus is, not only inside its trigger. Inside
  a dialog, the first Escape closes the tooltip and the next closes the dialog. An open
  select on the same trigger still receives the Escape (#254).
- CuiMarkdownEditor puts CuiFormField's label, help text and required state on its
  editable surface instead of a wrapper div, and references its own error message, so
  all of them reach assistive technology (#221).

### Changed

- `useDataGrid` accepts `columns` as a ref or getter as well as an array. A plain array
  is still read once.
- CuiColorPicker's drag surfaces set `touch-action: none` and gain
  `cui-color-picker__gradient`, `__hue` and `__alpha` classes.

## [1.3.1] - 2026-10-18

### Fixed

- CuiMarkdownEditor no longer emits `update:modelValue` for a value the parent set.
  The echo looked like the user typing to a buffering or autosaving host, and could
  trigger a save that overwrote newer data (#237).
- CuiMarkdownEditor delivers a throttled emit still pending when it loses focus or
  unmounts, so the last keystrokes are no longer lost on a route change. A changed
  `throttle` prop now takes effect without a remount (#239).
- CuiDataGrid freezes the bulk-select checkbox column along with frozen data columns.
  It used to scroll away, leaving a gap, and its header cell was painted over. Frozen
  offsets and the table's min-width now sum column widths as written, so `rem` and
  `calc()` widths line up (#233).
- CuiTabs: arrow-key, Home and End navigation leaves the newly active tab fully in
  view, clear of the edge fade, rather than half clipped. A tab value containing a
  quote or backslash no longer throws (#235).
- CuiCombobox and CuiTagInput remove the window scroll and resize listeners they add
  on mount. Each mount used to leak two (#202).
- CuiPopover gives each popover its own title id, so several titled popovers on a page
  are each named correctly. A `#header` slot now names the dialog too (#159).
- CuiPopover and CuiTooltip open when `v-model:visible` is already `true` at mount, and
  a popover that starts open closes on Escape (#248).
- CuiDivider announces vertical dividers as vertical, and a label becomes the
  separator's accessible name (#157).
- CuiSlider draws a focus ring on the thumb (overridable with
  `--cui-slider-focus-ring`), its `label` prop names the input, and `formatValue` sets
  `aria-valuetext` (#172).
- Every component `<button>` now has an explicit `type`. CuiPagination's buttons and
  one in CuiDataGridViewManager used to submit a surrounding form (#238).

### Changed

- CuiDataGrid's checkbox and row-actions columns are exactly `3rem` wide, with no
  horizontal cell padding. That makes them 4–12px narrower, and the row-actions button
  is now centred.
- CuiTabs: a tab scrolled into view stops 1.5rem in from an edge that has more tabs
  beyond it, instead of flush against it.
- CuiPopover's title id is now `cui-popover-title-<id>`, not the fixed
  `cui-popover-title`.
- CuiMarkdownEditor: code that relied on the `update:modelValue` echo to learn that a
  value was applied no longer receives it. This matches native inputs.

## [1.3.0] - 2026-09-24

### Upgrading to 1.3

Eleven breaking changes, grouped by what they affect. Most consumers will notice the first
group and nothing else.

**Things that move pixels**

- **Form control padding and heights changed across the board.** `INPUT_SIZE_SCALE`'s
  horizontal padding was rebalanced to 8/10/12/14/16px (`xs`–`xl`); `md` was 16px, equal to
  its own font size. `CuiInput` now applies its height to the bordered element, so an input
  and a `CuiSelect` beside it are finally the same height — inputs used to be 2px taller.
  `CuiCombobox`, `CuiTagInput` and `CuiInputStepper` dropped their private size tables and
  take the shared scale, so they line up with everything else and accept the full `xs`–`xl`
  range. If a layout was tuned against the old metrics, this is the change to look at first
  (#123, #124).
- **The `error` role's icon is `warning-octagon`, not `x-circle`,** in `CuiAlert`, `CuiToast`
  and `CuiBanner`. Override per call site with `icon`, or app-wide with
  `registerRoleIcons({ error: "…" })` (#119, #140).

**Things that change which CSS wins**

- **The distributed stylesheet no longer ships Tailwind's preflight.** If you were relying on
  clean-ui for a global reset without realising it, you now need one of your own. The reset
  still applies inside `cui-*` subtrees (#72).
- **`CuiButton`'s themeable rules are zero-specificity now,** so your own
  `.cui-button { … }` rule wins where it used to lose. That is the point — plain CSS themes a
  button again — but a rule written expecting the library to win will start taking effect.
  Structural rules keep their normal specificity (#114).

**Things that change the DOM — check selectors, snapshots and audits**

- **Form controls put `id`, `name` and `autocomplete` on their native element** rather than
  the wrapper `<div>`, so `<label for>` finally associates. Selectors keyed on the wrapper
  carrying an `id` need updating (#78).
- **`CuiCardHeader` and `CuiEmptyState` render their `title` as an `<h3>`** rather than a
  `<div>`. Rendering is unchanged; the document outline is not. An automated audit may now
  flag heading order where a card's level does not suit its surroundings — set `titleAs` to
  the right level, or to `div` to restore the old markup (#129, #148).
- **`CuiInputStepper`'s `+`/`−` buttons left the tab order.** The input is the control and is
  fully keyboard-operable, matching a native number input. This changes tab order wherever
  the component is used, not only inside `CuiTimePicker` (#74).
- **`CuiDropdownRadioGroup` is `role="radiogroup"`,** not `role="group"` (#103).

**Not breaking, but worth knowing**

`CuiBanner`'s `position` gained an `inline` value rather than losing its `"top"` default, so
the change that was planned to break did not (#119, #120).

### Added
- `ariaRequired` on `AriaLabelableProps`, so every control can be marked required for assistive tech through the same plumbing that already carries `ariaDescribedby` (#175)
- Internally, a shared `useFieldDescribedBy()` merges a control's own error message id into `aria-describedby`, keeping caller-supplied ids first — eight components render an error message, and this is the one place that rule lives. Not exported: it takes a control's props object, so it is plumbing rather than public API. It uses Vue's `useId()`, which unlike the library's nine hand-rolled `Math.random()` id sites is stable across re-renders and identical between a server render and its hydration (#175)
- `.cui-sr-only` in `main.css`, alongside the shared keyframes. The visually-hidden technique had been hand-written in six places in three different spellings, with the `clip` → `clip-path` migration half-done across them (#175)
- Docs site: the Form Controls group — 18 pages — converted to the `DocPage` shell, each with an Accessibility section. That completes the conversion for all 61 component pages; the Foundations and Getting Started pages are not component pages and keep their free-form layout (#130)
- Docs site: a `Methods` section in the `DocPage` shell, so a component's imperative API sits in the fixed section order instead of being hand-rolled into `#extra` after Accessibility — which is where Tree View's nine-method `defineExpose` and Context Menu's were. `MethodRow` moved from `MethodTable.vue` to `meta/types.ts`, since `<script setup>` cannot carry module exports (#165)
- `titleId` on `CuiModalHeader` and `ariaLabelledby` on `CuiModal`, which is what fixes every dialog in the library being announced unnamed. `CuiModal` and `CuiSlideover` generated a title id, pointed `aria-labelledby` at it and never rendered it on anything; `CuiConfirmDialog` assembles its own header, so the modal had no `title` to name itself from and emitted no `aria-labelledby` at all. Both paths are wired now, and the test asserts the reference *resolves* rather than merely that the attribute is present (#158)
- Docs site: the Layout, Data Display, Navigation and Overlay groups — 30 pages — converted to the `DocPage` shell, each with an Accessibility section. Modal, Slideover and ConfirmDialog also gained the `titleAs` rows they were missing after #129 (#130)
- `titleAs` on `CuiEmptyState`, which rendered its title as a `<div>` — the same defect #129 fixed in `CuiCardHeader`, and an empty state's title is a genuine region heading. Defaults to `h3`. The line is that static structural containers get headings, while transient or live-region announcements (`CuiAlert`, `CuiToast`) do not (#148)
- `CuiCopyButton` is announced properly. Its default is icon-only, so the button had no accessible name at all — empty text, no `aria-label`, no `aria-describedby`, no `title` — and a screen reader read it as just "button". The `tooltip` prop looked like it covered this but did not: `CuiTooltip` never points the trigger at its panel, and a tooltip is a description rather than a name. It now names the button from `tooltip` when there is no visible label, and announces a successful copy through a polite live region — the copied state was otherwise colour, an icon swap and a tooltip, all visual (#150)
- Docs site: Button Group and Copy Button converted to the `DocPage` shell, both with an Accessibility section. The Copy Button page also documents `useCopyToClipboard`, which the page mentioned but never specified (#130)
- Docs site: Empty State, Skeleton and Spinner converted to the `DocPage` shell, each with an Accessibility section (#130)
- `titleAs` on `CuiCardHeader`, `CuiModalHeader` and `CuiConfirmDialog`, so the heading level is the consumer's to set — it depends on where the component sits, which the component cannot know. Accepts any heading level or `div` for a decorative title. `CuiModal` and `CuiSlideover` forward it, so simple mode (the `title` prop) can choose its level too. A dialog title's level was previously not the consumer's to choose at all: it was a hardcoded `<h2>` (#129)
- `CuiTitleAs` and the `TitleAsProps` mixin in `types/common.ts`, so the five components sharing the prop share one vocabulary (#129)
- `CuiAlert` and `CuiToast` titles stay `<div>`s deliberately: static structural containers get headings, transient or live-region announcements do not. A heading that enters and leaves the document outline as a toast comes and goes is noise, and `role="alert"` / `aria-live` already carries the announcement (#129)
- `registerRoleIcons()` overrides the icon a color role renders in `CuiAlert`, `CuiToast` and `CuiBanner`, app-wide. Role → icon is a theme concern in the same way role → colour is; #119 made it overridable per call site, which still meant passing `icon` at every feedback component in an application (#140)
- A shared radius scale — `--cui-radius-sm`, `-md`, `-lg`. Component radius tokens now fall back to it rather than to each other: `--cui-banner-radius` defaulted to `--cui-card-radius`, and the shared radius map defaulted `md` to `--cui-button-radius`, so a component's corners were defined in terms of another component's. Override the scale to move every component together, or a component token to move one. The component tokens are deliberately not declared on `:root`, so that a container can move the scale for its subtree (#141)
- `CuiBanner`'s `position` gains an `inline` value: rendered in the flow rather than pinned to a page edge, with no edge rule, a closed box and a radius. For a notice inside a card or panel, where the edge rule has nothing to sit against. It is a value of `position` rather than a second prop beside it, so there is no `inline` + `position="bottom"` combination to define. It composes with `variant`, so an inline banner can still be solid (#120)
- `CuiBanner`, `CuiAlert` and `CuiToast` all take an `icon` prop and an `#icon` slot. The prop follows one rule across the three: a registered icon name renders that icon, anything else — an emoji, a character — renders as text, which is what `CuiToast`'s `icon` has always done. `noIcon` still suppresses entirely (#119)
- `CuiBanner` exposes its box and paint as custom properties — `--cui-banner-bg`, `-color`, `-border`, `-radius`, `-padding`, `-gap`, `-font-size`, `-font-weight`, `-text-align` (#119, #120)
- `CuiCombobox`, `CuiTagInput` and `CuiInputStepper` expose their box and paint as custom properties, matching the pattern from #114 — the control's height, padding, radius, border, background and font size, and for the two with dropdowns the panel and its items. `CuiTagInput` and `CuiInputStepper` had no stylesheet at all; everything was inline (#123)
- `nestedSize()` in `utils/sizing.ts` — the size one step down the scale, for a control nested inside another: the tag chips in a combobox or tag input, the +/- buttons in a stepper (#123)
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
- **BREAKING:** `CuiEmptyState` renders its `title` as an `<h3>` rather than a `<div>`, for the same reason and with the same consequence as `CuiCardHeader` below: an empty state's title is a genuine region heading, so it now appears in the document outline and an audit may flag its level against its surroundings. Set `titleAs`, or `div` to restore the old behaviour (#148)
- **BREAKING:** `CuiCardHeader` renders its `title` as an `<h3>` rather than a `<div>`. A card title looks like a heading and now is one, so it is reachable by heading navigation and appears in the document outline; `CuiModalHeader` and `CuiConfirmDialog` already did this. Rendering is unchanged — what changes is the outline, and automated audits may now flag heading order where a card's level does not match its surroundings. Set `titleAs` to the right level, or to `div` to restore the old behaviour (#129)
- The `.cui-typography` heading rules skip elements carrying a `cui-*` class, as the prose link rules already did. A component that renders a heading styles itself, and the prose layer was repainting it — an unexcluded card title took the prose h3 size and margin, including from the mobile responsive block (#129)
- **BREAKING:** the `error` role's default icon is `warning-octagon`, not `x-circle` — in `CuiAlert`, `CuiToast` and `CuiBanner` alike. A cross reads as "close" far more strongly than it reads as "error", and beside a dismissible component's own ✕ it rendered as a second close button. It is deliberately not `warning-circle` either: error and warning are adjacent severities, and sharing a glyph would leave colour as the only thing telling them apart (#119)
- `CuiBanner`'s dismiss button carries an accessible name from the localized `dismiss` message; it was an unlabelled icon-only button (#119)
- **BREAKING:** horizontal padding in `INPUT_SIZE_SCALE` was rebalanced to 8/10/12/14/16px across `xs`–`xl`. `md` was 1rem (16px), equal to its own font size, which read as dead space beside a short value; dropping `md` alone to 12px would have made it identical to `sm`, so the whole curve moved. Affects every form control (#123, #124)
- **BREAKING:** `CuiInput` applies its height to the bordered element rather than to its inner one, so an input is the height the scale says. The 1px borders used to sit outside it, making every input 2px taller than a `CuiSelect` beside it — they have never lined up (#123)
- **BREAKING:** `CuiCombobox`, `CuiTagInput` and `CuiInputStepper` accept the full `xs`–`xl` range and take their metrics from `INPUT_SIZE_SCALE`. They each carried a private size table with different heights, paddings and font sizes, clamped to `sm`–`lg`, and bypassed the `--cui-control-min-target` floor. A form mixing them now lines up by default (#123)
- **BREAKING:** `CuiButton`'s themeable rules are now zero-specificity (`:where(.cui-button)`), so they no longer outrank a consumer's own `.cui-button { … }` rule. That is the point — plain CSS themes a button again — but a rule written expecting the library to win will now take effect. Structural rules (`display`, `cursor`, the disabled states, sub-elements) keep their normal specificity (#114)
- **BREAKING:** the distributed stylesheet no longer ships Tailwind's preflight. `dist/clean-ui.css` carried the full global reset in `@layer base` — `box-sizing` on `*`, `-webkit-text-size-adjust` on `html`, zeroed `h1`–`h6`/`p` margins, `list-style: none` on `ul`/`ol`, `border-width: 0`, `button { background: transparent }`. Tailwind consumers got it twice, once from their own `@import "tailwindcss"` and once from ours, possibly from a different Tailwind version, and ours won ties on import order; consumers not using Tailwind got a page-wide reset they never asked for, easily misread as "clean-ui broke my typography". The library no longer imports the `tailwindcss` entrypoint at all — it pulls in `tailwindcss/theme.css` only, to compile its own `@theme`, and ships `styles/preflight.css`: the same reset scoped to `cui-*` subtrees (an element with a `cui-*` class, and its descendants) with every selector wrapped in `:where()` so it stays at zero specificity and stays overridable, in `@layer base` under an explicit `@layer theme, base, components, utilities;` so it still loses to your utilities. Tailwind's default theme variables (`--font-sans`, `--spacing`, `--color-red-*`, …) are no longer emitted either; the library references none of them. **Note:** a consumer unknowingly relying on clean-ui to supply their global reset will now need one of their own — the same class of change as #62's, and worth checking alongside it (#72)
- **BREAKING:** form controls put `id` on their native element instead of their wrapper. None of them declared `id`, so Vue's attribute fallthrough dropped it on the component's single root — `.cui-input-wrapper`, `.cui-select`, and so on, all plain `<div>`s. A `<label for>` then pointed at something that cannot be focused, so clicking the label did nothing and screen readers never formed the label/control association; `name` and `autocomplete` were equally inert there, which also broke browser autofill. Fixed across `CuiInput`, `CuiTextarea`, `CuiSelect`, `CuiCombobox`, `CuiTagInput`, `CuiInputStepper`, `CuiFileUpload`, `CuiSlider`, `CuiColorPicker`, `CuiCheckbox`, `CuiRadio`, `CuiToggle`, `CuiMaskedInput`, `CuiDatePicker` and `CuiDateRangePicker`. `CuiSelect` takes the `aria-*` attributes only — its focusable surface is a `div[role="combobox"]`, where `name`/`autocomplete` mean nothing, and where `for`/`id` forms no association at all, so `aria-labelledby` is what actually names it. `CuiTimePicker` and the group controls are tracked separately in #103, because neither has a labelable focusable element to attach to (#78)
- **BREAKING:** `CuiInputStepper`'s `+`/`−` buttons are no longer in the tab order. The input is the control and is now fully keyboard-operable, matching how a native number input treats its spinners — but this changes the tab order for every consumer of the component, not only inside `CuiTimePicker` (#74)
- **BREAKING:** `CuiDropdownRadioGroup` is `role="radiogroup"` rather than `role="group"` — it holds radios. Any selector or assertion keyed on the old role needs updating (#103)
- Docs apps resolve `@itguy614/clean-ui` to workspace source for **types** as well as for bundling. `config/workspace-aliases.ts` pointed Vite at source, but nothing pointed TypeScript there, so `vue-tsc` fell back to node resolution and read the package's built `dist/*.d.ts` — the bundler and the type checker disagreed about what the code was, and a docs typecheck failed on anything added since the last build, naming a prop that plainly existed. `config/tsconfig.workspace-source.json` is the TypeScript half, extended by both docs apps; neither needs `dist` to exist any more (#106, #107)
- `CuiButtonGroup` dropped ten `!important` declarations, `CuiInput` two more, and `clean-ui-editor`'s floating mode toggle three. Every one of them existed only to outrank `CuiButton`'s inline styles. `CuiInput`'s `border: none; height: 100%` on attached prefix/suffix buttons had been dead for the same reason and now applies (#114)
- `CuiPopover` and `CuiTooltip` hide their not-yet-positioned panel with `opacity: 0` instead of `visibility: hidden` (#112). `focus()` on a `visibility: hidden` element is a silent no-op, so any consumer moving focus into a panel on open was racing Floating UI's positioning and losing intermittently — which is why the date and time pickers each grew a `requestAnimationFrame` retry loop. Both loops and their shared helper are deleted; one `focus()` now works. The suppression also covers `animation`, which is load-bearing rather than tidiness: a CSS animation overrides inline styles, and both panels animate `opacity` from 0, so `opacity: 0` alone would have been overridden the moment the scale-in started and reintroduced the flash #88 fixed. Withholding it also means the animation plays from the final position rather than starting mid-move

### Fixed
- `CuiCheckbox`, `CuiRadio` and `CuiToggle` put `id`, `aria-describedby` and `aria-labelledby` on the element that carries their role, not on the hidden native input. That input is `aria-hidden`, so every one of those attributes sat on an element removed from the accessibility tree — which made `CuiFormField`'s entire labelling contract silently inert for those three components, while looking correct in both the template and the rendered DOM. `name` and `autocomplete` stay on the input, where the browser reads them and `aria-hidden` does not matter (#173)
- All eight controls that render an error message — `CuiInput`, `CuiTextarea`, `CuiSelect`, `CuiCombobox`, `CuiTagInput` and the checkbox, radio and toggle groups — point `aria-describedby` at it. They set `aria-invalid` and rendered a message that nothing referenced, so a screen-reader user was told a field was wrong and never what was wrong with it. A caller's own `aria-describedby` is kept alongside it (#175)
- `CuiFormField` announces `required`. The visible marker is an asterisk that is deliberately `aria-hidden`, so required-ness reached assistive tech through no path at all. `ariaRequired` joins `AriaLabelableProps`, which every control already inherits — the same route `ariaDescribedby` takes — and `CuiFormField` forwards it, so the state travels independently of whether the field has a label. The label also carries a visually hidden "(required)" for anyone reading it (#175)
- `CuiInput`'s clear and password-reveal buttons, and `CuiSelect`'s chip-remove and clear buttons, are reachable from the keyboard. All four were `tabindex="-1"` with no alternative route, so there was no way to reveal a password without a pointer — the one affordance that exists for people who cannot reliably type one blind (#175)
- `CuiTabs` tab buttons carry `type="button"`. Without it a `<button>` defaults to `type="submit"`, so a tab set inside a `<form>` submitted the form on every tab switch. Part of #153
- The markdown editor's toolbar overflow fades stay at the toolbar's edges instead of scrolling away with the buttons. They were absolutely positioned *inside* the scroll container, and an absolutely-positioned child of a scroller scrolls with its content — so the moment the toolbar was scrolled the left fade slid out of view entirely. They are now siblings of the scroller, which is the arrangement `CuiTable` already used (#125)
- The same fades no longer erase the editor control's rounded top-right corner when the toolbar overflows. The fade is a painted rectangle sitting flush inside its scroller, so on a rounded container it squared off the corner it covered, leaving the border notched. All the shared scroll fades now inherit their scroller's radius, which costs nothing where that is 0 — as it is for `CuiTable` and `CuiModalBody` (#125)
- Removed a dead rule in the editor toolbar's stylesheet that set `position: sticky` on the fades: the inline style set `position: absolute`, which wins, so the rule never applied (#125)
- A required field no longer sits ~1.4px lower than the optional field beside it. `CuiFormField`'s label is a flex row, so its height is its tallest child, and the required marker picked up a taller line-height from the surrounding prose — 21px against the label's 19.6px. Any two-column form row pairing a required field with an optional one was visibly out of line (#134)
- `CuiFieldset` no longer clips its fields' focus rings. It clips its content with `overflow: hidden` for the collapse animation and the content box had no padding, so a full-width field sat flush against the clip edge: the ring was cut off on the left and right of every field, and on the top and bottom of the first and last. A 4px gutter, cancelled by a negative margin so nothing moves (#135)
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
