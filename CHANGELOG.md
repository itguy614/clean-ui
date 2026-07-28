# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `CuiTab` accepts a `#label` slot for custom tab-button content — badges, icons, status dots. The `label` prop stays required and renders whenever no slot is given (#45)

### Changed
- `CuiTable` header backgrounds now reference the `--cui-table-head-bg` token instead of raw surface scale steps, so overriding it works on sticky tables and `CuiDataGrid` (#64)
- `CuiTable` now always renders its scroll wrapper (`<div class="cui-table-wrapper">`) around the `<table>`, not only when `minWidth`/`maxHeight` is passed. The wrapper stays inert (`overflow: visible`) while the table fits and only becomes a scroll container when the table actually overflows, so page-scrolled `stickyHeader` tables are unaffected. **DOM change:** a CSS selector matching `.cui-table` as a direct child of a specific element needs updating (#58)
- New `table.scrollRegionLabel` message key (default `"Scrollable table"`) — the accessible name for a table's scroll region (#58)

### Fixed
- The distributed stylesheet no longer ships base Tailwind utilities. `dist/clean-ui.css` emitted an `@layer utilities` block with 48 general-purpose classes (`.hidden`, `.flex`, `.block`, `.container`, `.table`, `.border`, `.transition`, …) that Tailwind's content scan had generated from incidental words in the library source — the components never used them. In a consuming Tailwind app that block merged into the app's own utilities layer *after* its Tailwind, so clean-ui's bare `.hidden` beat the app's `.md:flex` and `hidden md:flex` toggles stayed collapsed at every width. **Note:** a consumer unknowingly relying on clean-ui to supply a utility class will now need it from their own Tailwind (#62)
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
