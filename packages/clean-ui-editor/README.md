# @itguy614/clean-ui-editor

[![npm](https://img.shields.io/npm/v/@itguy614/clean-ui-editor.svg)](https://www.npmjs.com/package/@itguy614/clean-ui-editor)
[![license](https://img.shields.io/npm/l/@itguy614/clean-ui-editor.svg)](./LICENSE)
[![docs](https://img.shields.io/badge/docs-live-blue.svg)](https://itguy614.github.io/clean-ui/)

A markdown editor for [**clean-ui**](https://www.npmjs.com/package/@itguy614/clean-ui) — a
CodeMirror 6 buffer with **hidden syntax markers** (WYSIWYG-style editing where the
`**` / `#` / `-` markup is revealed only around the cursor), a plain **source** mode, and a
declarative **plugin API** for adding your own commands, toolbar entries, keymaps, and paste rules.

Themed entirely with clean-ui's `--cui-*` tokens, so it inherits your theme and dark mode automatically.

## Features

- **Two modes** — `wysiwyg` (hidden syntax markers, revealed near the cursor) and `source` (raw markdown), switchable at runtime via `v-model:mode`.
- **Declarative plugin API** — `definePlugin()` composes commands, toolbar buttons, keymaps, paste rules, and decorations. Ships a full default set (bold, italic, headings, lists, task lists, quotes, code fences, links, images, table paste, …).
- **Safe HTML rendering** — an opt-in `/render` subpath (`CuiMarkdownViewer`, `serializeMarkdownToHtml`) with a `TrustedHtml` contract, kept out of the core entry so the editor never bundles the serializer unless you ask for it.
- **Tree-shakeable subpath exports** — `/render` and `/codemirror` are separate entries; importing the editor barrel doesn't pull in the renderer or re-export CodeMirror.
- **Localizable** — every command label / built-in string overridable via the message catalog.
- **Themeable** — no colors of its own; styled with clean-ui's tokens.

## Installation

```sh
npm install @itguy614/clean-ui-editor
# peer dependencies
npm install @itguy614/clean-ui vue@^3.5
```

> `@itguy614/clean-ui` and `vue` are peer dependencies. CodeMirror and the markdown
> parser are bundled dependencies — you don't install them separately.

## Usage

This package has a heavy dependency graph (CodeMirror 6), so — unlike clean-ui — it is
**not** registered globally by a plugin. Import `CuiMarkdownEditor` as a **named export**,
and load it lazily on the route/view that needs it so it stays out of your main bundle:

```vue
<script setup lang="ts">
import { ref, defineAsyncComponent } from "vue";
import "@itguy614/clean-ui-editor/styles";

const CuiMarkdownEditor = defineAsyncComponent(() =>
  import("@itguy614/clean-ui-editor").then((m) => m.CuiMarkdownEditor),
);

const content = ref("# Hello\n\nStart typing **markdown**…");
</script>

<template>
  <CuiMarkdownEditor v-model="content" placeholder="Write something…" />
</template>
```

Import the stylesheet once (`@itguy614/clean-ui-editor/styles`), alongside clean-ui's own
`@itguy614/clean-ui/styles`.

### Modes

```vue
<script setup lang="ts">
import { ref } from "vue";
import type { CuiMarkdownEditorMode } from "@itguy614/clean-ui-editor";

const content = ref("");
const mode = ref<CuiMarkdownEditorMode>("wysiwyg"); // or "source"
</script>

<template>
  <CuiMarkdownEditor v-model="content" v-model:mode="mode" />
</template>
```

Key props: `modelValue` (`v-model`), `mode` (`v-model:mode`, `"wysiwyg" | "source"`),
`placeholder`, `readonly`, and `plugins` (override the default plugin set).

## Plugins

Extend the editor with `definePlugin()`, or start from `DEFAULT_PLUGINS`:

```ts
import { definePlugin, DEFAULT_PLUGINS } from "@itguy614/clean-ui-editor";

const highlight = definePlugin({
  id: "highlight",
  command: { id: "highlight", run: (ctx) => ctx.toggleInlineWrap("==") },
  toolbar: { icon: "highlighter", label: "Highlight" },
  keymap: { key: "Mod-Shift-h", command: "highlight" },
});

// pass to the editor
// <CuiMarkdownEditor :plugins="[...DEFAULT_PLUGINS, highlight]" />
```

## Rendering markdown to HTML

The serializer and viewer live at the **`/render`** subpath (kept out of the core entry so
the editor doesn't bundle them). It returns a branded `TrustedHtml` value so rendering is
explicit and safe:

```ts
import { serializeMarkdownToHtml } from "@itguy614/clean-ui-editor/render";

const html = serializeMarkdownToHtml("# Title\n\nSome **markdown**.");
```

```vue
<script setup lang="ts">
import { CuiMarkdownViewer } from "@itguy614/clean-ui-editor/render";
</script>

<template>
  <CuiMarkdownViewer :source="content" />
</template>
```

## Subpath exports

| Import | Contents |
|---|---|
| `@itguy614/clean-ui-editor` | `CuiMarkdownEditor`, the plugin API (`definePlugin`, `DEFAULT_PLUGINS`, built-in plugins), messages, and the `TrustedHtml` contract type |
| `@itguy614/clean-ui-editor/styles` | Editor stylesheet (import once) |
| `@itguy614/clean-ui-editor/render` | `CuiMarkdownViewer`, `serializeMarkdownToHtml`, render adapters — the markdown→HTML serializer |
| `@itguy614/clean-ui-editor/codemirror` | CodeMirror building blocks, for advanced/custom setups |

## Documentation

Part of the clean-ui project: **https://itguy614.github.io/clean-ui/**

## License

[MIT](./LICENSE) © Kurt Wolf
