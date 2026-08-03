import "./styles/editor.css";

export { default as CuiMarkdownEditor } from "./components/CuiMarkdownEditor.vue";
export type { CuiMarkdownEditorProps, CuiMarkdownEditorMode } from "./components/CuiMarkdownEditor.vue";
export { version } from "./version";
export { defaultMarkdownEditorMessages, mergeMarkdownEditorMessages, resolveCommandLabel, type CuiMarkdownEditorMessages } from "./messages";
export { useMarkdownEditorMessages } from "./composables/useMarkdownEditorMessages";
/**
 * FR36/task 6.1.1: only the plain contract (a branded type + the one helper
 * that produces it) — never the renderer or viewer, which live at the
 * `/render` subpath and pull in the actual markdown-to-HTML serializer.
 * Documented here so a consumer building their own adapter (or a future
 * core feature like phase 1.5's split preview) can import the contract
 * without reaching into `/render` at all.
 */
export { markAsTrustedHtml, type TrustedHtml, type MarkdownRenderAdapter } from "./render/contract";
export {
  definePlugin,
  DEFAULT_PLUGINS,
  PLUGIN_API_VERSION,
  boldPlugin,
  italicPlugin,
  strikethroughPlugin,
  inlineCodePlugin,
  heading1Plugin,
  heading2Plugin,
  heading3Plugin,
  bulletedListPlugin,
  numberedListPlugin,
  taskListPlugin,
  blockquotePlugin,
  codeFencePlugin,
  horizontalRulePlugin,
  linkPlugin,
  imagePlugin,
  tablePastePlugin,
  type CuiEditorPlugin,
  type CuiEditorPluginSpec,
  type CommandContext,
  type PluginCommand,
  type PluginCommandSpec,
  type ToolbarEntry,
  type KeymapEntry,
  type PasteRule,
  type DecorationRule,
  type CollectOpener,
  type CollectSettle,
  type EditorSelectionRange,
  type PluginErrorInfo,
} from "./plugins";
