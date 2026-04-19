# Component Build Order

## Phase 1: Core Form Controls ✅

1. **Toggle/Switch** ✅
2. **Input** ✅
3. **Textarea** ✅
4. **Select** ✅
5. **FormField** ✅

## Phase 1.5: Foundations ✅

- **Icon System** ✅ — Phosphor Icons via `@phosphor-icons/vue`, wrapped in `CuiIcon`

## Phase 2: Feedback & Overlay ✅

6. **Badge/Tag** ✅
7. **Alert** ✅
8. **Tooltip** ✅
9. **Toast/Notification** ✅
10. **Modal/Dialog** ✅ — modernized: borderless header/footer, spacious padding, subtle close button

## Phase 3: Navigation & Structure ✅

11. **Tabs** ✅
12. **Card** ✅ — modernized: borderless header/footer, rounder corners, softer shadow
13. **Breadcrumb** ✅
14. **Pagination** ✅
15. **Dropdown Menu** ✅ — viewport edge detection for right-align

## Phase 4: Data Display Primitives ✅

16. **Skeleton** ✅
17. **Table Primitives** ✅ — CuiTable, CuiTableHead, CuiTableBody, CuiTableFoot, CuiTableRow, CuiTableCell. Sticky headers via CuiTableHead inject. Scroll shadow indicators. Sticky columns. `minWidth` for horizontal scroll.
18. **Popover** ✅ — modernized: borderless, softer shadow, all inline styles
19. **Context Menu** ✅
20. **Empty State** ✅

## Phase 5: Data Grid ✅

21. **DataGrid** ✅ — sorting, filtering, pagination, row selection, bulk actions, column management, card view, saved views, search, sticky headers, sticky columns, scroll shadow indicators, slot-based cell customization, Inertia adapter, URL state hydration

## Phase 6: Advanced ✅

22. **Avatar** ✅ — image, initials, icon fallback, status indicators (online/away/busy/offline) with pulse/ping animations, AvatarGroup with status
23. **Progress Bar** ✅
24. **Accordion/Collapse** ✅ — modernized: subtle 50% opacity separators, more spacious padding
25. **Slideover** ✅ — modernized: all inline styles, borderless header/footer
26. **Stepper** ✅ — horizontal/vertical, icons, descriptions, error state, clickable navigation
27. **Input Stepper** ✅ — numeric increment/decrement with min/max/step, decimal support
28. **Slider** ✅ — custom rendered thumb (no native styling), icons, #thumb slot, sizes, colors
29. **Masked Input** ✅
30. **Fieldset** ✅
31. **Checkbox Group** ✅
32. **Radio Group** ✅
33. **Toggle Group** ✅
34. **Button Group** ✅
35. **Backdrop** ✅

## Phase 7: Form Controls ✅

36. **Date Picker** ✅ — masked input, calendar popover, custom format patterns (MM/DD/YYYY etc.), month-only mode with fillDay first/last, min/max/blackout dates, disabledDate function, highlightToday, ISO or Date object output
37. **Date Range Picker** ✅ — two-click selection, hover preview, range highlight, blockSpanningBlackout, same constraints as DatePicker
38. **Combobox / Autocomplete** ✅ — single/multiple select, type-ahead filtering, async server search with debounce, rich options (icon/image/description), #option scoped slot, tag chips for multi-select, keyboard navigation, teleported dropdown with smart positioning
39. **Color Picker** ✅ — gradient saturation/brightness area, hue slider, alpha slider, HEX/RGB/HSL format toggle, preset palettes (theme/basic/material/tailwind), swatch-only mode, theme palette reads live CSS vars with MutationObserver
40. **Transfer List** ✅ — dual-panel with transfer/reorder buttons, drag-and-drop between panels and for reordering, search filter, double-click transfer, grip handles, drop indicators, disabled items, #item scoped slot
41. **Time Picker** — time selection companion to date picker
42. **Tag Input** — multi-value text input with removable tags
43. **File Upload / Dropzone** — drag-and-drop file area with preview
44. **Rating** — star/icon rating input
45. **Pin Input / OTP** — verification code entry (4-6 digit boxes)

## Phase 8: Data Display & Content (Partial)

46. **Timeline** ✅ — vertical event timeline, dot or icon markers, #icon slot (avatars), 6 color roles, connector lines, title + timestamp + body
47. **Kbd** ✅ — keyboard shortcut keycap style, 3D bottom border, 3 sizes
48. **Stat Card** — metric display with value, label, trend indicator
49. **Tree View** — expandable hierarchical list
50. **Code Block** — styled code display with copy button

## Phase 9: Feedback & Utility ✅

51. **Spinner** ✅ — ring/dots/bars variants, 5 sizes, 6 colors, optional label, accessible
52. **Banner** ✅ — full-width sticky notification bar, top/bottom position, solid/subtle variants, dismissible with localStorage persistence, #actions slot
53. **Confirmation Dialog** ✅ — built on CuiModal, danger/warning/info variants, typed confirmation (confirmWord), loading state, icon badge header
54. **Divider** ✅ — horizontal/vertical, label (text or slot), start/center/end position, solid/dashed/dotted, custom color
55. **Copy Button** ✅ — useCopyToClipboard composable, icon swap feedback, tooltip, ghost/outline variants, works in input #suffix slots
56. **Resizable Panels** ✅ — horizontal/vertical split, drag handle with grip icon, min sizes, collapse threshold, double-click reset, nestable

## Phase 10: Cross-Cutting Features ✅

57. **`hidden` prop** ✅ — added to all 72 consumer-facing components via v-show
58. **Scroll shadow indicators** ✅ — useScrollShadows composable, applied to CuiTable wrapper and CuiModalBody, dark mode support via --cui-scroll-shadow token
59. **Modern styling pass** ✅ — removed hard border separators from Card/Modal/Popover/Slideover/Accordion, softer shadows, more spacious padding, all inline styles for HMR compatibility
60. **Docs dogfooding** ✅ — PropTable uses CuiTable, Example uses CuiCard

## Remaining

- **Time Picker** — time selection companion to date picker
- **Tag Input** — multi-value text input with removable tags (partially covered by CuiCombobox multiple mode)
- **File Upload / Dropzone** — drag-and-drop file area with preview
- **Rating** — star/icon rating input
- **Pin Input / OTP** — verification code entry (4-6 digit boxes)
- **Stat Card** — metric display with value, label, trend indicator
- **Tree View** — expandable hierarchical list
- **Code Block** — styled code display with copy button
