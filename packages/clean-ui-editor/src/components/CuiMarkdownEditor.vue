<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, useTemplateRef } from "vue";
import { EditorView, keymap, drawSelection, placeholder as placeholderExtension } from "@codemirror/view";
import { EditorState, Compartment, type Extension } from "@codemirror/state";
import { syntaxHighlighting } from "@codemirror/language";
import { history, historyKeymap, defaultKeymap, indentWithTab } from "@codemirror/commands";
import { insertNewlineContinueMarkup, deleteMarkupBackward, markdownKeymap } from "@codemirror/lang-markdown";
import { CuiButtonGroup, CuiButton, useColorScheme } from "@itguy614/clean-ui";
import { cuiMarkdownLanguage } from "../language/markdown-language";
import { registerEditorInstance, translateCodeMirrorError } from "../duplicate-guard";
import { throttle } from "../utils/throttle";
import { revealExtension } from "../reveal";
import { editorThemeExtension } from "../theme/editor-theme";
import { cuiMarkdownHighlightStyle } from "../theme/syntax-highlight";

export type CuiMarkdownEditorMode = "wysiwyg" | "source";

export interface CuiMarkdownEditorProps {
  /** The markdown document. */
  modelValue?: string;
  /** `wysiwyg` hides syntax markers away from the cursor; `source` shows raw markdown. */
  mode?: CuiMarkdownEditorMode;
  placeholder?: string;
  /** Minimum ms between `update:modelValue` emissions. 0 (default) emits on every change. */
  throttle?: number;
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
}

const props = withDefaults(defineProps<CuiMarkdownEditorProps>(), {
  modelValue: "",
  mode: "wysiwyg",
  throttle: 0,
  showModeToggle: true,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:mode": [mode: CuiMarkdownEditorMode];
}>();

const cmHostRef = useTemplateRef<HTMLDivElement>("cmHost");
const rootRef = useTemplateRef<HTMLDivElement>("root");
const isMounted = ref(false);

let view: EditorView | null = null;
const modeCompartment = new Compartment();
const readOnlyCompartment = new Compartment();
const themeCompartment = new Compartment();

// clean-ui's dark mode is a `.dark` class that can land on any ancestor at
// any time — CodeMirror's own base theme picks its (hardcoded, non-token)
// caret/selection colours from a `dark` flag fixed when its theme extension
// was built, so that flag must be re-driven through a compartment whenever
// this signal changes, not just read once at mount (see src/theme/editor-theme.ts).
const { isDark } = useColorScheme(rootRef);

function themeExtensions(): Extension[] {
  return [editorThemeExtension(isDark.value), syntaxHighlighting(cuiMarkdownHighlightStyle)];
}

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

/** `wysiwyg` gets the reveal layer (hidden markers, revealed on caret entry);
 * `source` stays the base editor with nothing added, per FR4. */
function buildModeExtensions(mode: CuiMarkdownEditorMode): Extension[] {
  return mode === "wysiwyg" ? [revealExtension()] : [];
}

function onDocChanged(value: string) {
  emitModelValue(value);
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
        keymap.of([...markdownKeymap, indentWithTab, ...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onDocChanged(update.state.doc.toString());
        }),
        placeholderExtension(props.placeholder ?? ""),
        modeCompartment.of(buildModeExtensions(props.mode)),
        themeCompartment.of(themeExtensions()),
        readOnlyCompartment.of(EditorState.readOnly.of(Boolean(props.disabled || props.readonly))),
        EditorView.contentAttributes.of({
          role: "textbox",
          "aria-multiline": "true",
          "data-testid": "cui-markdown-editor-content",
        }),
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
        EditorView.announce.of(newMode === "source" ? "Source mode" : "Formatted mode"),
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

function setMode(mode: CuiMarkdownEditorMode) {
  if (mode === props.mode) return;
  emit("update:mode", mode);
}

defineExpose({
  el: rootRef,
  focus: () => view?.focus(),
  blur: () => view?.contentDOM.blur(),
  getView: () => view,
});
</script>

<template>
  <div
    ref="root"
    class="cui-markdown-editor"
    :class="{ 'cui-markdown-editor--disabled': disabled }"
  >
    <CuiButtonGroup v-if="showModeToggle" style="margin: 0.375rem 0.375rem 0">
      <CuiButton
        size="sm"
        :variant="mode === 'wysiwyg' ? 'solid' : 'outline'"
        :disabled="disabled"
        data-testid="cui-markdown-editor-mode-wysiwyg"
        @click="setMode('wysiwyg')"
      >
        Formatted
      </CuiButton>
      <CuiButton
        size="sm"
        :variant="mode === 'source' ? 'solid' : 'outline'"
        :disabled="disabled"
        data-testid="cui-markdown-editor-mode-source"
        @click="setMode('source')"
      >
        Source
      </CuiButton>
    </CuiButtonGroup>
    <div
      ref="cmHost"
      class="cui-markdown-editor__cm-host"
      :data-testid="isMounted ? 'cui-markdown-editor' : 'cui-markdown-editor-shell'"
    />
  </div>
</template>
