import "./styles/editor.css";

export { default as CuiMarkdownEditor } from "./components/CuiMarkdownEditor.vue";
export type { CuiMarkdownEditorProps, CuiMarkdownEditorMode } from "./components/CuiMarkdownEditor.vue";
export { version } from "./version";
export {
  definePlugin,
  DEFAULT_PLUGINS,
  PLUGIN_API_VERSION,
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
