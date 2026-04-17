# Component Build Order

## Phase 1: Core Form Controls
*We have the patterns from Radio/Checkbox — apply them quickly*

1. **Toggle/Switch** — checkbox variant, reuses the same group/standalone patterns
2. **Input** — fundamental text field, establishes form field patterns (label, placeholder, error, prefix/suffix slots)
3. **Textarea** — extends Input patterns with multiline
4. **Select** — needs dropdown/popover behavior, builds on Input visually
5. **FormField** — wrapper that standardizes label, help text, error message layout for ALL form controls above

## Phase 1.5: Foundations
*Should be added early — used by alerts, buttons, nav, and many future components*

- **Icon System** — define an approach for icons (inline SVG components, icon font, or sprite). Alerts already use inline SVGs for role-specific icons. Need a consistent, tree-shakeable pattern for the full library. Consider wrapping a popular set (Heroicons, Lucide) or building our own minimal set.

## Phase 2: Feedback & Overlay
*These use the color system heavily and are needed by many other components*

6. **Badge/Tag** — tiny, uses all 6 color roles, useful in tables/lists/nav
7. **Alert** — color roles + icon + dismiss, foundational feedback pattern
8. **Tooltip** — first overlay/positioning component, establishes popover primitives
9. **Toast/Notification** — builds on Alert + positioning from Tooltip
10. **Modal/Dialog** — full overlay, focus trap, accessibility

## Phase 3: Navigation & Structure

11. **Tabs** — common pattern, uses color system
12. **Card** — structured container with header/body/footer slots
13. **Breadcrumb** — simple, uses router integration from Button
14. **Pagination** — builds on Button
15. **Dropdown Menu** — builds on Tooltip positioning + keyboard nav from Radio

## Phase 4: Data Display

16. **Table** — complex, benefits from all prior work (sorting, selection uses Checkbox, pagination)
17. **Avatar** — simple but useful once you have Card/Table
18. **Progress Bar** — color roles, used in forms and dashboards
19. **Accordion/Collapse** — animation patterns

## Phase 5: Advanced

20. **Date Picker** — needs Input + Modal + Calendar grid. NOTE: Come back to this after Modal/Dialog and Tooltip are built. Will use CuiMaskedInput for the text entry with a calendar popover. Consider time picker as a separate companion component.
21. **File Upload** — needs Input + Progress + Button
22. **Autocomplete/Combobox** — needs Input + Dropdown + keyboard nav
