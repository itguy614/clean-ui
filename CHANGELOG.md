# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
