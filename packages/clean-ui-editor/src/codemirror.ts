/**
 * Re-exports the CodeMirror surface a raw-tier plugin needs, plus its types
 * (FR24a). Documented as the only path for a plugin author to obtain
 * CodeMirror, so a single instance is the default rather than something
 * consumers must arrange themselves — see src/duplicate-guard.ts for what
 * goes wrong when that's not true.
 *
 * Grows as the plugin system (Phase 03) needs more of the surface;
 * intentionally not "export *" from each package, so this file stays the one
 * place documenting exactly what raw-tier authors get.
 */
export {
  EditorView,
  keymap,
  Decoration,
  WidgetType,
  ViewPlugin,
  placeholder,
  type ViewUpdate,
  type DecorationSet,
  type KeyBinding,
} from "@codemirror/view";

export {
  EditorState,
  StateField,
  StateEffect,
  Compartment,
  Prec,
  type Extension,
  type Transaction,
  type TransactionSpec,
  type EditorStateConfig,
} from "@codemirror/state";

export { syntaxTree, Language, LRLanguage, defineLanguageFacet } from "@codemirror/language";

export { history, historyKeymap, defaultKeymap, indentWithTab } from "@codemirror/commands";
