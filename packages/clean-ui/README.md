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
- **Tailwind CSS v4 compatible** — color scales registered via `@theme` so Tailwind utilities work alongside the components.
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
  --cui-button-radius: 0.5rem;
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
