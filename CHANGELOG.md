# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
