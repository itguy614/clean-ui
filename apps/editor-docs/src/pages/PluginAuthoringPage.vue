<script setup lang="ts">
import { ref } from "vue";
import { CuiCard, CuiCardBody, CuiStack, CuiAlert } from "@itguy614/clean-ui";
import { CuiMarkdownEditor, definePlugin, DEFAULT_PLUGINS, type CuiEditorPlugin } from "@itguy614/clean-ui-editor";
import { EditorView, Decoration, ViewPlugin, Prec, keymap, type DecorationSet, type ViewUpdate } from "@itguy614/clean-ui-editor/codemirror";
import Example from "../components/Example.vue";

// --- The declarative-tier worked example (FR23): insert a timestamp -------
const timestampPlugin: CuiEditorPlugin = definePlugin({
  id: "docs-timestamp",
  commands: {
    insertTimestamp: {
      run(context) {
        context.insertAtCursor(new Date().toISOString());
        return true;
      },
      label: "Timestamp",
      icon: "clock",
    },
  },
  toolbar: [{ command: "insertTimestamp" }],
  keymap: [{ key: "Mod-Shift-t", command: "insertTimestamp" }],
});

// --- The raw-tier worked example: highlighting a plain word, something ----
// --- the declarative `decorations` field (one syntax-tree node name) -----
// --- has no way to express at all. -----------------------------------------
const todoMark = Decoration.mark({ class: "docs-todo-highlight" });

function findTodoDecorations(view: EditorView): DecorationSet {
  const ranges: ReturnType<typeof todoMark.range>[] = [];
  const text = view.state.doc.toString();
  const pattern = /\bTODO\b/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    ranges.push(todoMark.range(match.index, match.index + match[0].length));
  }
  return Decoration.set(ranges);
}

const todoHighlightViewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = findTodoDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged) this.decorations = findTodoDecorations(update.view);
    }
  },
  { decorations: (instance) => instance.decorations },
);

// A raw extension can override one of CodeMirror's own BASE keybindings
// (history/undo, indentation, default editing — installed with no Prec
// wrapper at all in createView()) via an explicit Prec.highest. Verified
// empirically before writing this: the same technique aimed at a
// DECLARATIVE plugin's own keymap entry (e.g. bold's Mod-b) does NOT win —
// that entry is itself wrapped in Prec.highest by the registry and placed
// earlier in the extension array, so two same-tier Prec.highest extensions
// resolve by array position, and the registry's own always comes first. See
// "Precedence and conflicts" below for the full boundary.
const overrideUndoKeymap = Prec.highest(
  keymap.of([{ key: "Mod-z", run: () => { alert("Undo intercepted by a raw extension"); return true; } }]),
);

const todoHighlightPlugin: CuiEditorPlugin = definePlugin({
  id: "docs-todo-highlight",
  commands: {},
  extensions: [
    todoHighlightViewPlugin,
    EditorView.baseTheme({ ".docs-todo-highlight": { background: "var(--cui-warning-bg)", borderRadius: "2px" } }),
  ],
});

const overrideKeymapPlugin: CuiEditorPlugin = definePlugin({
  id: "docs-override-undo-keymap",
  commands: {},
  extensions: [overrideUndoKeymap],
});

const timestampDoc = ref("Press the clock button, type /timestamp, or Mod-Shift-T.");
const todoDoc = ref("- TODO: write the changelog\n- done: everything else");
const overrideDoc = ref("Type something, then press Mod-Z (Cmd/Ctrl+Z) — a raw extension intercepts undo.");
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Plugin Authoring</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Two tiers. The declarative tier is expressive enough that every built-in formatting action —
        bold, headings, lists, links, all of it — is implemented as an ordinary plugin against this
        same public API; nothing built-in reaches for privileged internal access the tier itself
        lacks. The raw tier is CodeMirror itself, for the rest.
      </p>
    </div>

    <CuiAlert color="info" title="Stability differs by tier">
      The declarative tier (<code class="cui-code">commands</code>, <code class="cui-code">toolbar</code>,
      <code class="cui-code">keymap</code>, <code class="cui-code">constructs</code>,
      <code class="cui-code">paste</code>, <code class="cui-code">decorations</code>) is protected
      across this package's semver majors. The raw tier (<code class="cui-code">extensions</code>) is
      CodeMirror's own API, tracked at whatever CodeMirror major this package currently depends on —
      it can break in a <em>minor</em> release of this package if CodeMirror itself changes underneath
      it. Reach for the declarative tier first; drop to raw only for what it genuinely cannot express.
    </CuiAlert>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">The declarative tier: a timestamp plugin</h2>
      <p class="mb-4 text-sm" style="color: var(--cui-text-secondary);">
        <code class="cui-code">definePlugin</code> stamps the plugin API version it was built against
        (see "Precedence and conflicts" below) and returns a plain object — <code class="cui-code">commands</code>
        maps a command id to a handler plus optional <code class="cui-code">label</code>/<code class="cui-code">icon</code>
        (both required for a command to appear in the toolbar or slash menu — omit either to keep a
        command keymap/imperative-only). <code class="cui-code">context.insertAtCursor</code> is the
        same seam every built-in formatting command uses.
      </p>
      <Example title="docs-timestamp.ts">
        <CuiMarkdownEditor v-model="timestampDoc" :plugins="[timestampPlugin, ...DEFAULT_PLUGINS]" />
      </Example>
      <pre class="cui-pre" style="margin-top: 0.75rem;"><code class="cui-code">import { definePlugin } from "@itguy614/clean-ui-editor";

export const timestampPlugin = definePlugin({
  id: "docs-timestamp",
  commands: {
    insertTimestamp: {
      run(context) {
        context.insertAtCursor(new Date().toISOString());
        return true; // handled — FR18
      },
      label: "Timestamp",
      icon: "clock", // must be registered — see registerIcons, or pass a component to CuiIcon
    },
  },
  toolbar: [{ command: "insertTimestamp" }],
  keymap: [{ key: "Mod-Shift-t", command: "insertTimestamp" }],
});

// &lt;CuiMarkdownEditor v-model="doc" :plugins="[timestampPlugin, ...DEFAULT_PLUGINS]" /&gt;</code></pre>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">A built-in, read as an ordinary plugin</h2>
      <p class="mb-4 text-sm" style="color: var(--cui-text-secondary);">
        This is <code class="cui-code">bold.ts</code>, unmodified — the actual source for the toolbar
        button and <code class="cui-code">Mod-B</code> shortcut you've been using on every other page
        in this site:
      </p>
      <pre class="cui-pre"><code class="cui-code">import { definePlugin } from "../define-plugin";
import { toggleInlineCommand } from "./toggle-inline";

export const boldPlugin = definePlugin({
  id: "cui-bold",
  commands: {
    bold: { ...toggleInlineCommand({ nodeName: "StrongEmphasis", marker: "**" }), label: "Bold", icon: "text-b" },
  },
  toolbar: [{ command: "bold" }],
  keymap: [{ key: "Mod-b", command: "bold" }],
  constructs: ["StrongEmphasis"],
  decorations: [{ node: "StrongEmphasis" }],
  paste: [{ selector: "strong, b", produces: "StrongEmphasis", degradeTo: "plainText", toMarkdown: (_el, c) => `**${c}**` }],
});</code></pre>
      <p class="mt-3 text-sm" style="color: var(--cui-text-secondary);">
        <code class="cui-code">constructs</code> is what makes excluding this plugin actually remove
        the construct (not just its toolbar button) — see the Editor reference's
        "construct excluded" example. <code class="cui-code">decorations</code> tells the reveal layer
        which syntax node to hide markers for. <code class="cui-code">paste</code> converts a real
        <code class="cui-code">&lt;strong&gt;</code>/<code class="cui-code">&lt;b&gt;</code> element
        back to markdown, degrading to plain text if the construct isn't loaded.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">The raw tier: a CodeMirror extension</h2>
      <p class="mb-4 text-sm" style="color: var(--cui-text-secondary);">
        Highlighting every occurrence of a specific <em>word</em> (not a syntax construct) is
        something the declarative <code class="cui-code">decorations</code> field genuinely cannot
        express — it decorates one named syntax-tree node, not an arbitrary text pattern. This is
        exactly the kind of thing the raw tier exists for. CodeMirror itself comes from this package's
        own subpath, <code class="cui-code">@itguy614/clean-ui-editor/codemirror</code> — importing it
        from anywhere else risks a second CodeMirror instance loading alongside the editor's own,
        which throws at runtime (see the Integration guide's note on this).
      </p>
      <Example title="docs-todo-highlight.ts">
        <CuiMarkdownEditor v-model="todoDoc" :plugins="[todoHighlightPlugin, ...DEFAULT_PLUGINS]" />
      </Example>
      <pre class="cui-pre" style="margin-top: 0.75rem;"><code class="cui-code">import { definePlugin } from "@itguy614/clean-ui-editor";
import { EditorView, Decoration, ViewPlugin, type DecorationSet, type ViewUpdate } from "@itguy614/clean-ui-editor/codemirror";

const todoMark = Decoration.mark({ class: "todo-highlight" });

function findTodoDecorations(view: EditorView): DecorationSet {
  const ranges = [];
  const pattern = /\bTODO\b/g;
  let match;
  while ((match = pattern.exec(view.state.doc.toString()))) {
    ranges.push(todoMark.range(match.index, match.index + match[0].length));
  }
  return Decoration.set(ranges);
}

const todoHighlightViewPlugin = ViewPlugin.fromClass(
  class {
    decorations = findTodoDecorations;
    constructor(view) { this.decorations = findTodoDecorations(view); }
    update(update) { if (update.docChanged) this.decorations = findTodoDecorations(update.view); }
  },
  { decorations: (instance) => instance.decorations },
);

export const todoHighlightPlugin = definePlugin({
  id: "docs-todo-highlight",
  commands: {},
  extensions: [
    todoHighlightViewPlugin,
    EditorView.baseTheme({ ".todo-highlight": { background: "var(--cui-warning-bg)" } }),
  ],
});</code></pre>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Precedence and conflicts</h2>
      <CuiCard variant="outline">
        <CuiCardBody>
          <CuiStack spacing="3">
            <p class="text-sm" style="color: var(--cui-text-secondary);">
              <strong>Declarative-tier conflicts resolve by array order — the later plugin wins</strong>,
              with a console warning naming both contributors: a duplicate plugin <code class="cui-code">id</code>
              (the later registration replaces the earlier one outright), a duplicate command id (the
              later plugin's command wins), or a duplicate keymap <code class="cui-code">key</code>
              string (the later plugin's binding wins). This is why the built-in list plugins and your
              own <code class="cui-code">plugins</code> array should list your overrides
              <em>after</em> <code class="cui-code">DEFAULT_PLUGINS</code>, not before.
            </p>
            <p class="text-sm" style="color: var(--cui-text-secondary);">
              This is deliberately the <em>opposite</em> of CodeMirror's own keymap semantics, where
              the <em>first</em> handler that returns <code class="cui-code">true</code> wins — the
              registry resolves every declarative-tier key conflict into one entry per key before any
              CodeMirror <code class="cui-code">keymap.of()</code> call exists, so the two precedence
              models never fight each other.
            </p>
            <p class="text-sm" style="color: var(--cui-text-secondary);">
              <strong>A raw extension's own keymap doesn't go through the registry's conflict
              resolution at all</strong> — it's CodeMirror's native <code class="cui-code">keymap.of()</code>,
              subject only to CodeMirror's own precedence. This lets it override one of CodeMirror's
              <em>base</em> keybindings (undo/redo, indentation, default editing — installed with no
              <code class="cui-code">Prec</code> wrapper at all) via an explicit
              <code class="cui-code">Prec.highest</code>, tried below with undo. <strong>It cannot,
              however, override a declarative-tier plugin's own keymap entry</strong> the same way —
              that entry is <em>itself</em> wrapped in <code class="cui-code">Prec.highest</code> by
              the registry (see <code class="cui-code">registryExtensions()</code>) and placed earlier
              in the extension array, so two same-tier <code class="cui-code">Prec.highest</code>
              extensions resolve by array position and the registry's own always wins. Verified by
              trying exactly this against bold's <code class="cui-code">Mod-b</code> first — it
              silently did nothing, which is precisely the kind of surprise this section exists to
              prevent. To actually change a built-in command's shortcut, replace its declarative
              <code class="cui-code">keymap</code> entry (list your own plugin with the same command id
              <em>after</em> <code class="cui-code">DEFAULT_PLUGINS</code>), not a raw extension.
            </p>
          </CuiStack>
        </CuiCardBody>
      </CuiCard>
      <Example title="A raw extension intercepting Mod-Z (undo) — a base CodeMirror binding, not a declarative one">
        <CuiMarkdownEditor v-model="overrideDoc" :plugins="[overrideKeymapPlugin, ...DEFAULT_PLUGINS]" />
      </Example>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">The API version check</h2>
      <CuiCard variant="outline">
        <CuiCardBody>
          <p class="text-sm" style="color: var(--cui-text-secondary);">
            <code class="cui-code">definePlugin</code> stamps every plugin it builds with the
            declarative-tier API version this package's build was compiled against. Registering a
            plugin built against a different version is the one hard rejection: the whole
            <code class="cui-code">plugins</code> configuration is refused — the <em>previous</em>
            configuration stays active and the document is never touched — with a message naming both
            versions, rather than failing later at a missing or renamed helper. This is what makes
            "the declarative tier is protected across majors" an enforced guarantee rather than a
            promise: a plugin built for a future incompatible tier can't silently half-work.
          </p>
        </CuiCardBody>
      </CuiCard>
    </div>
  </CuiStack>
</template>
