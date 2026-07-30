<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, useTemplateRef } from "vue";
import { EditorView, keymap, drawSelection, placeholder as placeholderExtension } from "@codemirror/view";
import { EditorState, Compartment, Prec, Annotation, type Extension, type Transaction } from "@codemirror/state";
import { syntaxHighlighting } from "@codemirror/language";
import { history, historyKeymap, defaultKeymap, indentWithTab } from "@codemirror/commands";
import { insertNewlineContinueMarkup, deleteMarkupBackward, markdownKeymap } from "@codemirror/lang-markdown";
import { completionKeymap } from "@codemirror/autocomplete";
import { CuiButtonGroup, CuiButton, useColorScheme } from "@itguy614/clean-ui";
import CuiMarkdownEditorToolbar from "./CuiMarkdownEditorToolbar.vue";
import { cuiMarkdownLanguage } from "../language/markdown-language";
import { registerEditorInstance, translateCodeMirrorError } from "../duplicate-guard";
import { throttle } from "../utils/throttle";
import { revealExtension, setActiveConstructsEffect } from "../reveal";
import { editorThemeExtension } from "../theme/editor-theme";
import { cuiMarkdownHighlightStyle } from "../theme/syntax-highlight";
import { buildRegistry, type PluginRegistry, type RegistryWarning } from "../plugins/registry";
import { createCommandContext } from "../plugins/command-context";
import { invokeCommand, queryIsActive, type PluginErrorInfo } from "../plugins/invoke-command";
import { slashMenuExtension } from "../plugins/slash-menu";
import { DEFAULT_PLUGINS } from "../plugins/default-plugins";
import type { CuiEditorPlugin } from "../plugins/types";
import { convertHtmlToMarkdown } from "../paste/convert-html";
import { useMarkdownEditorMessages } from "../composables/useMarkdownEditorMessages";

export type CuiMarkdownEditorMode = "wysiwyg" | "source";

export interface CuiMarkdownEditorProps {
  /** The markdown document. */
  modelValue?: string;
  /** `wysiwyg` hides syntax markers away from the cursor; `source` shows raw markdown. */
  mode?: CuiMarkdownEditorMode;
  placeholder?: string;
  /** Minimum ms between `update:modelValue` emissions. 0 (default) emits on every change. */
  throttle?: number;
  /** Applied to the editable surface (`.cm-content`, `role="textbox"`), not
   * the outer wrapper — so a `<label for>` pointing at it actually focuses
   * the editor, matching how `CuiFormField`'s slot bindings are meant to be
   * spread onto a field (FR31). */
  id?: string;
  /** Recolors the border to `--cui-error` and sets `aria-invalid`, matching
   * `CuiInput`/`CuiTextarea`'s own convention. */
  error?: boolean;
  /** Shown below the editor when `error` is true. */
  errorMessage?: string;
  /** Sets `aria-required` on the editable surface. Presentational only —
   * `CuiForm` validates through a resolver, not native required validation,
   * so this never blocks submission by itself (FR31). */
  required?: boolean;
  /**
   * Counts markdown source characters (what a storage column holds), and
   * shows a counter like `CuiTextarea`. Unlike `CuiTextarea`, this never
   * truncates: an edit or paste that would exceed the limit is refused
   * outright, since cutting markdown at a character boundary can split a
   * link or leave an unclosed code fence (FR32). Client-side only — the
   * server must still validate stored length.
   */
  maxLength?: number;
  /**
   * Content-Security-Policy nonce, applied when the editor is constructed.
   * CodeMirror injects its styles at runtime, so under a strict `style-src`
   * policy the editor renders unstyled without one — and it cannot be
   * supplied after construction. Falls back to a `<meta name="csp-nonce">`
   * tag's content if present.
   */
  cspNonce?: string;
  disabled?: boolean;
  readonly?: boolean;
  /** Renders a built-in wysiwyg/source toggle. Set false to drive `mode` yourself. */
  showModeToggle?: boolean;
  /**
   * Declarative extensions (FR17). Defaults to `DEFAULT_PLUGINS` — empty
   * until Phase 04 ships built-in formatting plugins against this same API.
   * Create plugin instances once (module scope or a computed with no
   * reactive deps), not inline in a template — a new array reference every
   * render would reconfigure the editor's extensions on every render (FR22).
   */
  plugins?: CuiEditorPlugin[];
  /** Subsets and orders the toolbar by command id (task 4.1.2). Omit for the
   * full set the active plugins collect. Replace the toolbar entirely with
   * the `#toolbar` slot instead of this prop. */
  toolbar?: string[];
  /** Renders the plugin-command toolbar (bold/italic/... from the active
   * `plugins`). Set false to omit it — e.g. when replacing it via `#toolbar`
   * would be redundant, or a host wants only the mode toggle. */
  showToolbar?: boolean;
}

const props = withDefaults(defineProps<CuiMarkdownEditorProps>(), {
  modelValue: "",
  mode: "wysiwyg",
  throttle: 0,
  showModeToggle: true,
  showToolbar: true,
  error: false,
  required: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:mode": [mode: CuiMarkdownEditorMode];
  /** A registered plugin's command or `isActive` query threw (FR21a). */
  pluginError: [info: PluginErrorInfo];
  /** The `plugins` prop changed to a configuration that failed to build
   * (FR22a's version check, or any other registry-build failure) — the
   * previous configuration is kept and this reports why the new one wasn't
   * applied (FR22). */
  pluginConfigError: [message: string];
  /** FR28: a pasted image file was refused (no upload affordance exists in
   * v1) — nothing was inserted; `message` is a host-displayable explanation. */
  pasteRejected: [message: string];
  /** FR32: an edit or paste was refused because it would exceed `maxLength`;
   * nothing was inserted. `message` names the overage for paste specifically
   * (typing simply stops accepting new characters, with no discrete event
   * per keystroke to report). */
  maxLengthExceeded: [message: string];
}>();

const cmHostRef = useTemplateRef<HTMLDivElement>("cmHost");
const rootRef = useTemplateRef<HTMLDivElement>("root");
const isMounted = ref(false);

let view: EditorView | null = null;
const modeCompartment = new Compartment();
const readOnlyCompartment = new Compartment();
const themeCompartment = new Compartment();
const contentAttrsCompartment = new Compartment();

// Marks a transaction as host-driven (the `modelValue` sync watcher below),
// exempting it from the maxLength guard: FR32 refuses *edits and pastes*
// that would exceed the limit, but a host is free to supply — and this
// component must still faithfully display, per the value contract's "never
// rewrites content the user did not edit" — a document already over length
// (e.g. legacy content saved before a limit existed).
const externalSync = Annotation.define<boolean>();

// Live doc length for the counter (task 5.2.1) — tracked from the
// updateListener directly rather than derived from `modelValue`, since that
// prop can lag behind the real buffer under a throttle (see `emitModelValue`).
const docLength = ref(0);

/** `id`/`error`/`required` all belong on the editable surface itself (FR31)
 * — the same element that already carries `role="textbox"` — not the outer
 * wrapper, so a `<label for>` and a screen reader's error/required state
 * both target the thing that's actually focusable and editable. */
function buildContentAttributes(): Record<string, string> {
  return {
    role: "textbox",
    "aria-multiline": "true",
    "data-testid": "cui-markdown-editor-content",
    ...(props.id ? { id: props.id } : {}),
    ...(props.error ? { "aria-invalid": "true" } : {}),
    ...(props.required ? { "aria-required": "true" } : {}),
  };
}

const isAtLimit = computed(() => props.maxLength !== undefined && docLength.value >= props.maxLength);

/**
 * FR32: refuses rather than truncates. A transaction filter (not a change
 * filter) so it sees the resulting document as a whole — truncating at
 * `tr.newDoc.length - maxLength` characters, the naive alternative, can cut
 * a link mid-URL or leave a code fence unclosed. Reading `props.maxLength`
 * live in the closure means no Compartment/reconfigure is needed when the
 * prop changes. Exempts `externalSync`-tagged transactions — see that
 * annotation's own comment.
 */
function maxLengthFilter(tr: Transaction) {
  if (!tr.docChanged || tr.annotation(externalSync)) return tr;
  if (props.maxLength !== undefined && tr.newDoc.length > props.maxLength) return [];
  return tr;
}

// clean-ui's dark mode is a `.dark` class that can land on any ancestor at
// any time — CodeMirror's own base theme picks its (hardcoded, non-token)
// caret/selection colours from a `dark` flag fixed when its theme extension
// was built, so that flag must be re-driven through a compartment whenever
// this signal changes, not just read once at mount (see src/theme/editor-theme.ts).
const { isDark } = useColorScheme(rootRef);

function themeExtensions(): Extension[] {
  return [editorThemeExtension(isDark.value), syntaxHighlighting(cuiMarkdownHighlightStyle)];
}

const pluginsCompartment = new Compartment();

// FR14: true for the duration of any `collect()` call (e.g. the link/image
// dialogs) — disables the mode-toggle buttons below so a dialog stays valid
// against whichever mode was active when it opened.
const isCollecting = ref(false);

const messages = useMarkdownEditorMessages();

// Reads `view` through this closure rather than a captured reference, so a
// context built once and reused (in the keymap below, and via `runCommand`)
// always operates on the live view — including inside a `collect()`
// continuation that runs after an awaited gap.
const commandContext = createCommandContext(
  () => view,
  (collecting) => (isCollecting.value = collecting),
  () => messages.value,
);

// Bumped on every selection/document change so the toolbar's pressed state
// (which reads live CodeMirror state through `isCommandActive`, not a Vue
// ref) has a reactive dependency to re-render against — see updateListener
// in createView() and CuiMarkdownEditorToolbar's `selectionVersion` prop.
const selectionVersion = ref(0);

function reportPluginWarnings(warnings: RegistryWarning[]) {
  for (const warning of warnings) {
    console.warn(`[CuiMarkdownEditor] ${warning.message}`);
  }
}

function handlePluginError(info: PluginErrorInfo) {
  emit("pluginError", info);
}

/** Builds the CodeMirror extensions a registry contributes: its raw
 * `extensions` (grouped per plugin, not flattened, so a broken one is at
 * least identifiable as its own subtree — FR21a) plus a keymap built from
 * the registry's already conflict-resolved bindings, each call routed
 * through the same guarded `invokeCommand` every other invocation path uses.
 * `Prec.highest` so a plugin's own bindings are checked before the base
 * editing keymap installed in `createView()`. */
function registryExtensions(registry: PluginRegistry): Extension[] {
  const pluginKeymap = keymap.of(
    registry.keymap.map((entry) => ({
      key: entry.key,
      run: () => invokeCommand(registry, entry.command, commandContext, handlePluginError),
    })),
  );
  return [
    Prec.highest(pluginKeymap),
    slashMenuExtension(registry, commandContext, handlePluginError, () => messages.value),
    ...registry.extensions,
  ];
}

// The initial registry: built once here (not deferred to onMounted) since
// `createView()` needs its extensions synchronously. `plugins` defaults to
// `DEFAULT_PLUGINS`, which is always valid (empty), so there's no "keep the
// previous configuration" fallback to reach for yet — that only applies to
// the reactive watcher below, once a *previous* configuration exists.
let currentRegistry: PluginRegistry = (() => {
  const result = buildRegistry(props.plugins ?? DEFAULT_PLUGINS);
  if (!result.ok) throw new Error(result.error);
  reportPluginWarnings(result.registry.warnings);
  return result.registry;
})();

// The value contract's echo-suppression state (FR2): the last document value
// this component has actually told the host about (or was told to apply).
// An incoming `modelValue` equal to this is treated as an echo and ignored.
//
// Deliberately updated only when the value is *actually emitted* — inside
// the throttled callback below, not eagerly on every keystroke — because
// under a throttle those two moments diverge: if this were updated eagerly,
// a stale echo of an earlier (already-superseded) emission would no longer
// match "the current document" and would be misread as a genuine external
// change, replaying old content over newer keystrokes typed while the
// throttle was in flight.
let lastKnownValue = props.modelValue;

const emitModelValue = throttle((value: string) => {
  lastKnownValue = value;
  emit("update:modelValue", value);
}, props.throttle);

function resolveCspNonce(): string | undefined {
  if (props.cspNonce) return props.cspNonce;
  if (typeof document === "undefined") return undefined;
  return document.querySelector('meta[name="csp-nonce"]')?.getAttribute("content") ?? undefined;
}

/** FR27/FR29: the reveal layer only decorates constructs the active plugins
 * actually declare via `decorations` — excluding a plugin means its markers
 * stay literal, unstyled text. */
function activeConstructsFromRegistry(registry: PluginRegistry): ReadonlySet<string> {
  return new Set(registry.decorations.map((rule) => rule.node));
}

/** `wysiwyg` gets the reveal layer (hidden markers, revealed on caret entry);
 * `source` stays the base editor with nothing added, per FR4. */
function buildModeExtensions(mode: CuiMarkdownEditorMode): Extension[] {
  return mode === "wysiwyg" ? [revealExtension(activeConstructsFromRegistry(currentRegistry))] : [];
}

function onDocChanged(value: string) {
  emitModelValue(value);
}

/**
 * FR28: HTML paste converts to markdown through the active plugins' own
 * `paste` rules; a modifier/"paste as plain text" action naturally has no
 * `text/html` clipboard entry at all (the browser strips it before this
 * handler ever runs), so falling through to CodeMirror's own default paste
 * handling for that case needs no special-casing here. An image file paste
 * is refused outright — no upload affordance exists in v1.
 */
function handlePaste(event: ClipboardEvent, targetView: EditorView): boolean {
  const clipboardData = event.clipboardData;
  if (!clipboardData) return false;

  const imageFile = [...clipboardData.files].find((file) => file.type.startsWith("image/"));
  if (imageFile) {
    event.preventDefault();
    emit("pasteRejected", messages.value.pasteRejectedImage);
    return true;
  }

  const html = clipboardData.getData("text/html");
  const markdown = html ? convertHtmlToMarkdown(html, currentRegistry.paste, currentRegistry.constructs) : clipboardData.getData("text/plain");

  const { from, to } = targetView.state.selection.main;
  if (props.maxLength !== undefined) {
    const resultLength = targetView.state.doc.length - (to - from) + markdown.length;
    const overage = resultLength - props.maxLength;
    if (overage > 0) {
      event.preventDefault();
      emit("maxLengthExceeded", messages.value.maxLengthExceeded(overage, props.maxLength));
      return true;
    }
  }

  if (!html) return false; // within limit — fall through to CodeMirror's own plain-text paste
  if (!markdown.trim()) return false;

  event.preventDefault();
  targetView.dispatch({ changes: { from, to, insert: markdown }, selection: { anchor: from + markdown.length } });
  return true;
}

function createView(): EditorView {
  registerEditorInstance();

  const nonce = resolveCspNonce();

  return new EditorView({
    parent: cmHostRef.value!,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        cuiMarkdownLanguage.extension,
        // Renders the caret/selection as themeable `.cm-cursorLayer`/
        // `.cm-selectionLayer` DOM layers instead of relying on the native
        // browser caret and ::selection, which the chrome theme (see
        // src/theme/editor-theme.ts) styles from --cui-* tokens.
        drawSelection(),
        history(),
        keymap.of([...markdownKeymap, indentWithTab, ...defaultKeymap, ...historyKeymap, ...completionKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onDocChanged(update.state.doc.toString());
            docLength.value = update.state.doc.length;
          }
          if (update.docChanged || update.selectionSet) selectionVersion.value++;
        }),
        EditorState.transactionFilter.of(maxLengthFilter),
        EditorView.domEventHandlers({ paste: handlePaste }),
        placeholderExtension(props.placeholder ?? ""),
        modeCompartment.of(buildModeExtensions(props.mode)),
        themeCompartment.of(themeExtensions()),
        pluginsCompartment.of(registryExtensions(currentRegistry)),
        readOnlyCompartment.of(EditorState.readOnly.of(Boolean(props.disabled || props.readonly))),
        contentAttrsCompartment.of(EditorView.contentAttributes.of(buildContentAttributes())),
        EditorView.editable.of(!props.disabled),
        ...(nonce ? [EditorView.cspNonce.of(nonce)] : []),
      ],
    }),
  });
}

onMounted(() => {
  try {
    view = createView();
  } catch (error) {
    throw translateCodeMirrorError(error);
  }
  docLength.value = view.state.doc.length;
  isMounted.value = true;
});

onBeforeUnmount(() => {
  view?.destroy();
  view = null;
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue === lastKnownValue) return;
    lastKnownValue = newValue;
    if (!view) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newValue },
      annotations: externalSync.of(true),
    });
  },
);

watch(
  () => props.mode,
  (newMode) => {
    if (!view) return;
    view.dispatch({
      effects: [
        modeCompartment.reconfigure(buildModeExtensions(newMode)),
        EditorView.announce.of(
          newMode === "source" ? messages.value.modeToggleSourceAnnounce : messages.value.modeToggleFormattedAnnounce,
        ),
      ],
    });
  },
);

watch(
  () => Boolean(props.disabled || props.readonly),
  (isReadOnly) => {
    if (!view) return;
    view.dispatch({ effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(isReadOnly)) });
  },
);

watch(isDark, () => {
  if (!view) return;
  view.dispatch({ effects: themeCompartment.reconfigure(themeExtensions()) });
});

watch(
  () => [props.id, props.error, props.required],
  () => {
    if (!view) return;
    view.dispatch({
      effects: contentAttrsCompartment.reconfigure(EditorView.contentAttributes.of(buildContentAttributes())),
    });
  },
);

// FR22: build and validate the replacement configuration before applying
// it. On failure, `currentRegistry` and the live compartment content are
// left completely untouched — a bad `plugins` value never leaves a
// half-reconfigured, dead editor holding the user's document.
watch(
  () => props.plugins,
  (newPlugins) => {
    const result = buildRegistry(newPlugins ?? DEFAULT_PLUGINS);
    if (!result.ok) {
      emit("pluginConfigError", result.error);
      return;
    }
    reportPluginWarnings(result.registry.warnings);
    currentRegistry = result.registry;
    if (!view) return;
    view.dispatch({
      effects: [
        pluginsCompartment.reconfigure(registryExtensions(currentRegistry)),
        // The reveal layer's own construct policy (FR27/FR29) — only
        // present in wysiwyg mode, so only worth updating there; dispatching
        // an effect an inactive StateField doesn't have is a harmless no-op,
        // but the guard keeps this from doing pointless work in source mode.
        ...(props.mode === "wysiwyg" ? [setActiveConstructsEffect.of(activeConstructsFromRegistry(currentRegistry))] : []),
      ],
    });
  },
);

function setMode(mode: CuiMarkdownEditorMode) {
  if (mode === props.mode) return;
  emit("update:mode", mode);
}

/** FR24: runs a registered command by id through the same guarded path
 * every other invocation route (keymap, toolbar, imperative call) uses — a
 * throwing command reports via `pluginError` and returns `false` rather
 * than propagating. Also the toolbar's click handler (below). */
function runCommand(id: string, ...args: unknown[]): boolean {
  return invokeCommand(currentRegistry, id, commandContext, handlePluginError, ...args);
}

function isCommandActive(id: string): boolean {
  return queryIsActive(currentRegistry, id, commandContext, handlePluginError);
}

defineExpose({
  el: rootRef,
  focus: () => view?.focus(),
  blur: () => view?.contentDOM.blur(),
  getView: () => view,
  runCommand,
  isCommandActive,
  getSelection: () => (view ? commandContext.selection : null),
});
</script>

<template>
  <div
    ref="root"
    class="cui-markdown-editor"
    :class="{ 'cui-markdown-editor--disabled': disabled, 'cui-markdown-editor--error': error }"
  >
    <CuiButtonGroup v-if="showModeToggle" style="margin: 0.375rem 0.375rem 0">
      <CuiButton
        size="sm"
        :variant="mode === 'wysiwyg' ? 'solid' : 'outline'"
        :disabled="disabled || isCollecting"
        data-testid="cui-markdown-editor-mode-wysiwyg"
        @click="setMode('wysiwyg')"
      >
        {{ messages.modeToggleFormatted }}
      </CuiButton>
      <CuiButton
        size="sm"
        :variant="mode === 'source' ? 'solid' : 'outline'"
        :disabled="disabled || isCollecting"
        data-testid="cui-markdown-editor-mode-source"
        @click="setMode('source')"
      >
        {{ messages.modeToggleSource }}
      </CuiButton>
    </CuiButtonGroup>
    <slot name="toolbar" :registry="currentRegistry" :run-command="runCommand" :is-command-active="isCommandActive">
      <CuiMarkdownEditorToolbar
        v-if="showToolbar"
        :registry="currentRegistry"
        :toolbar="toolbar"
        :run-command="runCommand"
        :is-command-active="isCommandActive"
        :selection-version="selectionVersion"
      />
    </slot>
    <div
      ref="cmHost"
      class="cui-markdown-editor__cm-host"
      :data-testid="isMounted ? 'cui-markdown-editor' : 'cui-markdown-editor-shell'"
    />
    <div v-if="(error && errorMessage) || maxLength !== undefined" class="cui-markdown-editor__footer">
      <div v-if="error && errorMessage" class="cui-markdown-editor__error" data-testid="cui-markdown-editor-error">
        {{ errorMessage }}
      </div>
      <div v-else class="cui-markdown-editor__spacer" />
      <div
        v-if="maxLength !== undefined"
        class="cui-markdown-editor__counter"
        :class="{ 'cui-markdown-editor__counter--over': isAtLimit }"
        data-testid="cui-markdown-editor-counter"
      >
        {{ messages.counter(docLength, maxLength!) }}
      </div>
    </div>
  </div>
</template>
