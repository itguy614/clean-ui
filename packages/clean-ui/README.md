# @itguy614/clean-ui

[![npm](https://img.shields.io/npm/v/@itguy614/clean-ui.svg)](https://www.npmjs.com/package/@itguy614/clean-ui)
[![license](https://img.shields.io/npm/l/@itguy614/clean-ui.svg)](./LICENSE)
[![docs](https://img.shields.io/badge/docs-live-blue.svg)](https://itguy614.github.io/clean-ui/)

A clean, dark-mode-ready Vue 3 component library. 100+ components built on a fully
token-driven theme system — **subtle by default, bold by choice**, accessible first,
and overridable at every level via CSS custom properties.

**[📖 Documentation & live examples →](https://itguy614.github.io/clean-ui/)**

## Features

- **100+ components** — layout, form controls, actions, feedback, data display, navigation, and overlays.
- **8 built-in themes** + light/dark mode, all driven by `--cui-*` custom properties you can override on any scope.
- **Accessible first** — WCAG AA contrast targets, ARIA attributes, keyboard navigation, focus management.
- **TypeScript** — full type definitions; shared `CuiColor` / `CuiSize` / `CuiRounded` prop types across components.
- **Works with or without Tailwind** — no Tailwind needed in your app; if you use Tailwind CSS v4, the color scales are registered via `@theme` so its utilities match the components.
- **Tree-shakeable, per-module ESM** — Vue is the only peer dependency. (ESM-only as of 1.0.)

## Installation

```sh
npm install @itguy614/clean-ui
# peer dependency
npm install vue@^3.5
```

## Quick start

Register the plugin (registers every `Cui*` component globally) and import the stylesheet once:

```ts
// main.ts
import { createApp } from "vue";
import { createCleanUI } from "@itguy614/clean-ui";
import "@itguy614/clean-ui/styles";
import App from "./App.vue";

createApp(App).use(createCleanUI()).mount("#app");
```

```vue
<template>
  <CuiButton color="primary" variant="solid">Click me</CuiButton>
</template>
```

**Tailwind is optional.** `import "@itguy614/clean-ui/styles"` is everything Clean-UI
needs: it ships its own compiled CSS and builds no classes in your app. Use Tailwind for
your own markup if you like, but don't add Clean-UI's `dist` to Tailwind's `@source`.
Scanning it gains nothing and can add unused utilities to your CSS.

### The stylesheet does not reset your page

`@itguy614/clean-ui/styles` styles the library's own components and nothing else.
Its base rules — `box-sizing`, `font: inherit` on form controls, list and margin
resets — are scoped to elements carrying a `cui-*` class and their descendants,
and every selector sits at zero specificity (`:where(…)`), so your own CSS always
wins. Nothing is applied to `html`, `body`, or your markup.

That means the library does **not** supply a global reset. If you use Tailwind,
your own `@import "tailwindcss"` already provides preflight. If you don't, and you
want one, bring your own (`normalize.css`, `modern-normalize`, or your framework's).

### Or import components individually

No plugin required — import only what you use:

```vue
<script setup lang="ts">
import { CuiButton, CuiCard, CuiCardBody } from "@itguy614/clean-ui";
import "@itguy614/clean-ui/styles";
</script>

<template>
  <CuiCard>
    <CuiCardBody>
      <CuiButton>Hello</CuiButton>
    </CuiCardBody>
  </CuiCard>
</template>
```

### Supported entry points

Import from these paths only:

| Path | What it is |
|---|---|
| `@itguy614/clean-ui` | Every component, composable and type |
| `@itguy614/clean-ui/styles` | The stylesheet: tokens, the default Navy theme, preflight, typography |
| `@itguy614/clean-ui/styles/all.css` | The same plus every theme (no bundler, or SSR) |
| `@itguy614/clean-ui/themes/<name>.css` | One opt-in theme (`mono`, `forest`, `amber`, `azure`, `teal`, `violet`, `ruby`) |
| `@itguy614/clean-ui/icons/builtin` | Registers the built-in icon names for `name="..."` lookups |
| `@itguy614/clean-ui/icons/lazy` | Registers any Phosphor icon by name (pulls in the full set) |
| `@itguy614/clean-ui/icons/generated/<name>` | One built-in icon component |

Deep imports of anything else in the package (for example `@itguy614/clean-ui/components/CuiButton.vue.js`
or `@itguy614/clean-ui/utils/...`) happen to resolve today, but they are **not supported**: those
files are internal, and a path can be renamed, moved or stop resolving in any release, minor
included. A later major release will close them off. If you need something only a deep path gives
you, [open an issue](https://github.com/itguy614/clean-ui/issues) and we'll export it properly.

## Theming

Eight presets ship out of the box: **Navy** (default), Mono, Forest, Amber, Azure, Teal, Violet, and Ruby.
Themes are plain CSS classes — apply one to any ancestor (or `<html>`) and everything inside re-themes:

```html
<html class="cui-theme-forest">      <!-- whole app -->
<div class="cui-theme-violet"> … </div>  <!-- scoped subtree -->
```

Dark mode is the `dark` class on any ancestor:

```html
<html class="dark cui-theme-azure"> … </html>
```

Navy is in `@itguy614/clean-ui/styles`. Each other theme is an opt-in stylesheet, so an app
pays only for the ones it uses: import them after `styles`, in any order. Without the file a
theme class styles nothing (in development `setTheme()` warns and names it).

```ts
import "@itguy614/clean-ui/styles";
import "@itguy614/clean-ui/themes/forest.css"; // mono, forest, amber, azure, teal, violet, ruby
```

With no bundler, or to offer every theme, load `@itguy614/clean-ui/styles/all.css` instead of
`styles`: it is `styles` plus all seven. (Upgrading from 1.x: this is the one-line way back.)

Switch themes reactively with the `useTheme` composable (persists to `localStorage`):

```ts
import { useTheme } from "@itguy614/clean-ui";

const { theme, setTheme } = useTheme();
setTheme("forest");
```

### Customizing tokens

Every color, radius, and typography value is a `--cui-*` custom property. Override on `:root` or any scoped container:

```css
:root {
  --cui-radius-md: 0.5rem; /* every md corner; --cui-button-radius moves buttons only */
}

/* Or re-map a whole color scale for a custom brand theme */
.cui-theme-brand {
  --color-primary-500: oklch(0.5 0.2 320);
  /* …50–950 */
}
```

## Markdown editor

Need a markdown editor? The companion package
[**`@itguy614/clean-ui-editor`**](https://www.npmjs.com/package/@itguy614/clean-ui-editor)
is a CodeMirror 6 editor themed with clean-ui's tokens — WYSIWYG (hidden syntax markers) and
source modes, a declarative plugin API, and an optional safe HTML renderer. It has a heavier
dependency graph, so it ships as a separate, lazily-loadable package rather than in the core:

```sh
npm install @itguy614/clean-ui-editor
```

```vue
<script setup lang="ts">
import { ref, defineAsyncComponent } from "vue";
import "@itguy614/clean-ui-editor/styles";

const CuiMarkdownEditor = defineAsyncComponent(() =>
  import("@itguy614/clean-ui-editor").then((m) => m.CuiMarkdownEditor),
);
const content = ref("# Hello");
</script>

<template>
  <CuiMarkdownEditor v-model="content" />
</template>
```

See the [editor README](../clean-ui-editor/README.md) for modes, plugins, and rendering.

## Documentation

Full component reference, props, and live examples: **https://itguy614.github.io/clean-ui/**

## License

[MIT](./LICENSE) © Kurt Wolf
