# Clean UI — @itguy614/clean-ui

## Guiding Principles

1. **Subtle by default, bold by choice** — all components default to subtle/tinted color usage. The hero color is never a default background. Solid fills require explicit `variant="solid"`.
2. **Dogfood everything** — the docs site uses the library's own components for layout, cards, buttons, forms, etc. If we build it, we use it.
3. **Overridable at every level** — CSS custom properties for all tokens (colors, typography, spacing, radius). Consumers override on `:root` or scoped containers.
4. **Accessible first** — WCAG AA contrast, `aria-*` attributes, keyboard navigation, focus rings, screen reader support.
5. **Composition over configuration** — sub-components for assembly, slots for customization, props for simple cases. See "Slots vs Sub-Components" below.
6. **Consistent patterns** — every new component follows the established conventions. Read this file before building anything.

## Project Structure
- pnpm monorepo: `packages/clean-ui` (library) + `apps/docs` (docs site)
- Vue 3.5+ / TypeScript / Tailwind CSS v4 / Vite 6
- Component prefix: `Cui` (CuiButton, CuiGrid, etc.)
- Icons: Phosphor Icons via `@phosphor-icons/vue`, wrapped in `CuiIcon`
- Positioning: `@floating-ui/vue` for tooltips; manual `computeDropdownPosition` for dropdowns/select

## Build & Dev
- This is a **pnpm** workspace (pnpm ≥ 10). Use `pnpm`, not npm/yarn, for all dev tasks.
- Build library: `pnpm build` (root) or `pnpm --filter @itguy614/clean-ui build`
- After rebuild, clear docs cache: `rm -rf apps/docs/node_modules/.vite`
- Color scale (`@theme`) is single-source in `packages/clean-ui/src/styles/theme.css`; both the library `main.css` and the docs `apps/docs/src/styles/main.css` `@import` it (no mirroring). The contrast audit reads the scale from `theme.css` too.
- Build = `vite build` + `vue-tsc --emitDeclarationOnly`

## Critical Gotchas
- **Tailwind v4 cannot detect dynamic classes** — never use template literals for Tailwind classes. Layout components use inline `:style` bindings instead.
- **`<script setup>` cannot have ES module exports** — shared types, injection keys, and context interfaces MUST go in separate `.ts` files (e.g., `radio-context.ts`, `multi-select-group-context.ts`, `dropdown-context.ts`, `tabs-context.ts`, `breadcrumb-context.ts`). This has caused build failures multiple times.
- **Label + hidden input double-toggle** — when a `<label>` contains a hidden `<input>`, clicking fires toggle twice. Always add `@click.stop.prevent` on hidden inputs inside labels.
- **CSS custom properties must be on the element that uses them** — focus ring variables must be set on the root element (via `:style`), not a child, if the `:focus-visible` rule is on the root.
- **Always use semantic color slots for hover/active states** — `--cui-{color}-hover` for hover, `--cui-{color}-active` for pressed. Never use `-muted`, `-border`, or ad-hoc colors for interaction states.
- **Subtle-first color principle** — resting/selected states use `--cui-{color}-bg` (tinted background) + `--cui-{color}-border` + `--cui-{color}` (colored text/icons). The hero color is NEVER a default background. Applies to: toggles, checkboxes, radios, pagination, alerts, toasts, badges, and all future components.
- **Semantic border token** — use `var(--cui-border)` for borders, not surface scale steps directly. The token auto-swaps: light=s-500, dark=s-600. `var(--cui-border-strong)` for input/form control borders: light=s-600, dark=s-500. Both modes use 500+600, just swapped.
- **Semantic surface token** — use `var(--cui-surface-base)` for component backgrounds, not `white`. Auto-swaps in dark mode. For a neutral *tinted* fill/border (parallel to the role `-bg`/`-border` slots), use `var(--cui-surface-bg)` / `var(--cui-surface-border)` — these let a component treat `surface` as a 7th neutral color role (e.g. CuiFieldset `color="surface"`).
- **All semantic slots must reference the scale** — `--cui-primary` must be `var(--color-primary-500)`, NOT a hardcoded oklch value. This is critical for theme compatibility. Both light and dark mode slots must reference `--color-primary-*` variables so theme class overrides propagate correctly.

## Shared Prop Types & Mixins (`types/common.ts`)
- **All cross-cutting prop types live in `types/common.ts`** — never re-declare them per component. Exports: `CuiColor` (9 roles, below), `CuiSize` (`xs|sm|md|lg|xl`), `CuiRounded` (`none|sm|md|lg|full`), `CuiOrientation` (`horizontal|vertical`), `CuiAutoOrientation` (+`auto`, for form-control groups), `CuiVariant` (`solid|outline|subtle|ghost|dash`), `CuiColorOrCss` (role OR raw CSS string).
- **Base prop "mixins"** — compose via `extends`: `HideableProps` (`hidden`), `ColorableProps` (`color: CuiColor`), `SizeableProps` (`size: CuiSize`), `DisableableProps` (`disabled`), `FormControlProps` (label/description/error/errorMessage/required/readonly). Pattern: `export interface CuiXProps extends HideableProps, ColorableProps, SizeableProps { /* component-specific only */ }`. `defineProps<Props>()` resolves imported `extends` interfaces (Vue 3.5). `withDefaults` still sets defaults per component.
- **Size**: every `size` prop is the flat `CuiSize`. Components that only style a subset narrow via `clampSize(props.size, ["sm","md","lg"] as const)` (from `utils/sizing.ts`) before indexing a scale map (type the map `Record<(typeof SUPPORTED)[number], …>`). Width-preset sizes (Modal/Slideover/Container) and raw dimensions (Spacer/Skeleton) are NOT `CuiSize`.
- **Color**: role-only components use `color: CuiColor`. Paint components (Icon, Divider, Backdrop) use `color: CuiColorOrCss` + `resolveColor(color)` (from `utils/color.ts`) — a role maps to `var(--cui-{role})`, anything else passes through as raw CSS.
- **Naming conventions** (clean break — no legacy aliases): visibility = `v-model:visible` on overlays (Modal/Slideover/Popover/Tooltip/Backdrop/ConfirmDialog); `expanded` only on collapsibles (Fieldset/Accordion). Layout axis = `orientation` (`horizontal|vertical`) everywhere EXCEPT `CuiFlex` which keeps `direction` (CSS `row|col|row-reverse|col-reverse`). Border radius = `rounded: CuiRounded` with the shared radiusMap (`none:0, sm:.25rem, md:var(--cui-button-radius,.375rem), lg:.5rem, full:9999px`).
- **Variant vocab**: reuse `solid|outline|subtle|ghost|dash` when the meaning matches (subtle=tinted bg, ghost=no border/bg). Card uses `elevated|outline|ghost`. Structural variants (Progress `bar|circle`, Spinner `ring|dots|bars`, Skeleton `text|rectangle|circle`) stay component-specific.

## Color System
- 9 `CuiColor` roles: primary, secondary, success, error, warning, info + **surface, surface-light, surface-dark** (neutral, 3 mode-aware intensity steps: light=faintest fill, dark=strongest). All have the full 9-slot set.
- Primary & surface: full 50–950 scale. Others: condensed 100/300/500/700/900.
- 9 semantic slots per role: `--cui-{role}`, `-hover`, `-active`, `-bg`, `-border`, `-text`, `-focus-ring`, `-subtle`, `-muted`
- 3 solid-specific dark-mode slots: `--cui-{role}-solid`, `-solid-hover`, `-solid-active` — darker shades for white-text-on-colored-bg. In light mode these are undefined (components fall back to `--cui-{role}`). Use pattern: `var(--cui-${c}-solid, var(--cui-${c}))` in solid variant backgrounds.
- Dark mode: `:where(.dark, .dark *)` overrides with adjusted lightness (same hue/saturation). Primary text uses 300 (was 400) for better outline contrast; solid buttons use 600+ via `-solid` tokens.
- Light + dark mode: Warning role uses white text on amber: `--cui-warning-text: white` (light) / `var(--color-surface-950)` (dark, dark text on bright amber)
- WCAG AA compliance target (4.5:1 normal text, 3:1 large text). Run `node scripts/check-contrast.mjs` to audit all themes.
- For focus-ring and subtle (transparency needed): use `color-mix(in srgb, var(--color-primary-500) 40%, transparent)` — NOT oklch alpha syntax with var()

## Theme System
- 8 presets: Mono (monochrome), Navy (default/indigo), Forest (green), Amber (orange/warm), Azure (blue), Teal (cool teal), Violet (purple), Ruby (red)
- Themes are CSS classes (`cui-theme-forest`, etc.) that override `--color-primary-*` and `--color-surface-*`
- Apply to any ancestor: `<html class="cui-theme-forest">` or scoped `<div class="cui-theme-violet">`
- `useTheme()` composable: `setTheme(id)`, reactive `theme` ref, persists to localStorage
- Surface lightness curve based on Amber warm gray distribution (0.983 → 0.196) — ALL themes use this curve
- Light mode surfaces have a very subtle primary tint (chroma 0.005-0.010)
- Dark mode surfaces have a slightly stronger tint (chroma 0.006-0.015)
- Semantic colors (success/error/warning/info) stay consistent across themes
- When creating new themes: define `--color-primary-50` through `--color-primary-950`, optionally override surface scale

## Typography
- CSS foundation layer, NOT components — opt in with `.cui-typography` class on ancestor
- All tokens overridable: `--cui-font-sans`, `--cui-font-mono`, `--cui-font-size-h1` through `h6`, `--cui-text-body/secondary/tertiary/emphasis`
- Breakpoint-based responsive sizing (scales down below 768px)
- Display headings: `.cui-display-1/2/3`, Lead text: `.cui-lead`
- Code text color references primary scale: `--cui-text-code: var(--color-primary-700)` (light) / `var(--color-primary-300)` (dark)

## Shared Utilities
- `utils/sizing.ts` — `INPUT_SIZE_SCALE`, `BUTTON_SIZE_SCALE`, `TEXTAREA_SIZE_SCALE`, `SIZE_ORDER`, `clampSize()`. All components import from here. Never define local size maps or size types.
- `utils/color.ts` — color conversions + `resolveColor()` / `isColorRole()` for the role-or-CSS hybrid (Icon/Divider/Backdrop).
- `types/common.ts` — shared cross-component prop types + base mixin interfaces (see "Shared Prop Types & Mixins"). Compose component props from these.
- `utils/responsive.ts` — `resolveResponsive()`, `spacingToCss()`, `CONTAINER_WIDTHS`
- `utils/colorIconMap.ts` — `COLOR_ICON_MAP` mapping color roles to Phosphor icon names (used by Alert, Toast)
- `composables/useBreakpoint.ts` — singleton reactive breakpoint via matchMedia
- `composables/useClickOutside.ts` — shared click-outside detection
- `composables/usePopover.ts` — wraps @floating-ui/vue (used by Tooltip)
- `composables/useTheme.ts` — theme switching, localStorage persistence
- `composables/useToast.ts` — programmatic toast API
- Shared keyframes in `main.css`: `cui-spin`, `cui-pulse`, `cui-glow`, `cui-shake`, `cui-bounce`, `cui-fade-in`, `cui-scale-in`. Components reference these — never define local `@keyframes` for shared animations.

## Component Patterns

### Layout Components (CuiGrid, CuiFlex, CuiStack, etc.)
- Use inline styles for all computed layout (grid-template-columns, flex-direction, gap)
- `useBreakpoint()` + `resolveResponsive()` for responsive values
- `spacingToCss(spacing)` converts Tailwind spacing scale to CSS lengths
- Debug mode: `watch(() => props.debug, ...)` with `{ immediate: true }` for reactivity

### Interactive Components (CuiButton, CuiRadio, CuiCheckbox)
- `color` prop: accepts any of the 6 semantic roles (primary default)
- Buttons: `variant` (solid/outline/dash/ghost, default outline), `size` (xs-xl, default md=1rem), `rounded` (sm/md/lg/full backed by `--cui-button-radius`)
- Buttons render as `<button>`, `<a>` (href prop), or `<router-link>` (to prop) via dynamic `component :is`
- Named slots: `#prefix` and `#suffix` for icons/badges
- `defineExpose({ el, focus, blur })` on all interactive components
- No drop shadows on buttons — hover feedback via color transitions only
- CuiButtonGroup merges buttons via `:deep(.cui-button)` selectors for radius stripping

### Form Controls (Radio, Checkbox, Toggle, Input, Select, etc.)
- Group + individual pattern: `CuiRadioGroup`/`CuiCheckboxGroup`/`CuiToggleGroup` + individual components
- Group provides context via provide/inject (context type in separate `.ts` file)
- `MultiSelectGroupContext` shared between CheckboxGroup and ToggleGroup (identical shape)
- `v-model` on group (managed state) OR on individual (standalone mode)
- Radio: `v-model` is `string | number | boolean`. Checkbox/Toggle group: `v-model` is `Array<string | number>`. Standalone checkbox/toggle: `v-model` is `boolean`.
- Auto orientation: horizontal for ≤2 options, vertical for 3+, overridable with `orientation` prop (`horizontal | vertical | auto` — `CuiAutoOrientation`)
- RadioGroup supports `variant="buttons"` for segmented button-style radios (uses CuiButtonGroup internally)
- Error validation: no left accent bar. Single controls (Input, Select, Textarea, etc.) recolor their own border to `--cui-error` + show a red message. Groups (Radio/Checkbox/Toggle) wrap their options in a `__options` div that gets a subtle bordered container on error (`border: 1px solid var(--cui-error-border)` + `background: var(--cui-error-bg)` + `--cui-button-radius`) with the red message below it. No permanent reserved padding — fields/groups sit flush so they align with buttons and other non-field elements.
- Focus ring: `outline: 2px solid var(--cui-{color}-focus-ring); outline-offset: 2px` on the ROOT label element
- `label` and `description` as props (not slot-only) for JSON-driven dynamic forms
- `aria-invalid` on native inputs when error is true
- CuiFormField: `fieldId` is a constant (not computed) to avoid re-generating on re-render
- CuiInput: hides native browser password toggles via `::-ms-reveal` and `::-webkit-*` pseudo-elements
- CuiInput: attached buttons via `#prefix-button`/`#suffix-button` slots — radius stripped with `!important` to override inline styles
- CuiSelect: `#option` and `#selected` slots for rich content; `icon` field on SelectOption for simple icon case
- CuiMaskedInput: `\` escapes mask characters as literals

### Floating Elements (Tooltip, Dropdown, Select)
- CuiTooltip uses `usePopover` (Floating UI) — reactive positioning works here because tooltip has a show delay
- CuiDropdown uses synchronous `computeDropdownPosition()` — avoids the async Floating UI timing issue with `v-if`
- CuiSelect uses its own inline `positionDropdown()` (same approach as Dropdown)
- Dropdown closes on scroll by default; `pinned` prop keeps it open and repositions
- Dropdown has animated close: `isClosing` state plays exit animation before removing from DOM
- Sub-menus inherit parent trigger mode by default, `trigger` prop to override
- Only one sub-menu open at a time within a dropdown (siblings auto-close)

### Feedback Components (Alert, Toast, Badge)
- Alert/Toast share: `COLOR_ICON_MAP` for auto-icons, shared keyframes (cui-pulse, cui-glow, cui-shake)
- Toast defaults to `variant="subtle"` (not solid). Solid is opt-in.
- Toast `active` prop controls timer — only the topmost toast counts down
- Toast progress bar pauses on hover
- Toasts require `CuiToastProvider` wrapping the app

### Overlay Components (Modal, Dropdown, Backdrop)
- CuiModal: simple mode (title prop auto-renders header+body) OR sub-component mode (CuiModalHeader/Body/Footer)
- CuiBackdrop: configurable opacity, blur, color, image, gradient. Uses `position: absolute` (not fixed) inside the modal overlay.
- Modal z-index: overlay=9990, container=2 (above backdrop at z-index=0)

## Slots vs Sub-Components

**Rule: If the consumer is filling a hole, use a slot. If they are assembling a system, use sub-components.**

Once you have more than a couple named slots, or when slot names describe component roles rather than content regions, that is a sign the API wants sub-components instead.

### Use sub-components for:
- **Composition patterns**: Card (CardHeader, CardBody, CardFooter, CardMedia), Modal (ModalHeader, ModalBody, ModalFooter), Tabs (Tabs + Tab), Dropdown (Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, etc.), Breadcrumb (Breadcrumb + BreadcrumbItem)
- **Group + individual patterns**: RadioGroup + Radio, CheckboxGroup + Checkbox, ToggleGroup + Toggle
- Sub-components use provide/inject for shared context (context type in separate `.ts` file)

### Use slots for:
- **Content adornments**: Button (#prefix, #suffix), Badge (default), Alert (#icon, #actions), Input (#prefix, #suffix, #prefix-button, #suffix-button)
- **Small customizable regions** inside sub-components: CardHeader (#actions), ModalHeader (#actions), Select (#option, #selected)

### The pattern:
Compound sub-components for top-level composition, targeted slots inside them for customization. Each sub-component is a separate `.vue` file, registered in `index.ts`, with its own exported props interface.

## Docs Site
- Dogfoods the library: CuiGrid for layout, CuiCard for content panels, `cui-typography` on main content, CuiButton/CuiIcon everywhere
- Theme switcher + dark mode toggle + debug toggle in header
- `ShowDebugKey` InjectionKey in `apps/docs/src/keys.ts`, provided in App.vue, injected via computed in pages
- `CuiToastProvider` wraps the app in App.vue
- Navigation groups: Getting Started → Foundations → Layout → Form Controls → Actions → Feedback → Data Display → Navigation → Overlay
- Helper components: `Example.vue` (show/hide code), `PropTable.vue` (props documentation)
- Each page: import from library, use `CuiStack spacing="8"` as root wrapper
- No hardcoded Tailwind colors (blue-500, green-500, etc.) — always use the library's color roles (primary, success, error, etc.)
- Code examples use `cui-pre` and `cui-code` classes from typography system
- Info/customization panels use `CuiCard` + `CuiCardBody`, not hand-rolled bordered divs

## GitHub Workflow

- **Issues**: All bugs, features, and tasks are tracked as GitHub issues at `itguy614/clean-ui`. Use `gh issue create` — do not use Jira or any other tracker.
- **Pull requests**: When creating a PR, always link it to the relevant issue using a closing keyword in the PR body so the issue closes automatically when the PR is merged:
  ```
  Closes #<issue-number>
  ```
  Other accepted keywords: `Fixes #N`, `Resolves #N`. Put it in the PR body (not the title).
- **Branch → issue traceability**: Every PR should reference at least one issue. If no issue exists yet, create one before opening the PR.

## Adding a New Component — Checklist
1. Read this file first. Follow established patterns.
2. Create the `.vue` file in `src/components/`. If it needs shared context, create a `{name}-context.ts` file (NOT exports in the .vue file).
3. Use `CuiIcon` for all icons (never inline SVGs).
4. Import sizes from `utils/sizing.ts`, not local maps.
5. Use `var(--cui-surface-base)` for backgrounds, `var(--cui-border)` for borders.
6. Use semantic color slots (`--cui-{color}-bg`, `--cui-{color}-border`, etc.) — never hardcoded oklch values that would break themes.
7. Default to subtle color usage. Solid fill only via explicit `variant="solid"`.
8. Add `aria-*` attributes, keyboard navigation, focus rings.
9. `defineExpose({ el, focus, blur })` on interactive components.
10. Register in `index.ts`: import, component export, type export, `app.component()` in plugin.
11. Create a docs page, add route, add nav entry in the correct group.
12. Use `CuiCard` for example containers in docs, not hand-rolled divs.
13. Build and verify: `pnpm build` must pass with zero TypeScript errors.
