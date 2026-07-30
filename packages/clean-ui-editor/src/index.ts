import "./styles/editor.css";
import "./icons";

export { default as CuiMarkdownEditor } from "./components/CuiMarkdownEditor.vue";
export type { CuiMarkdownEditorProps, CuiMarkdownEditorMode } from "./components/CuiMarkdownEditor.vue";
export { version } from "./version";
export { defaultMarkdownEditorMessages, mergeMarkdownEditorMessages, resolveCommandLabel, type CuiMarkdownEditorMessages } from "./messages";
export { useMarkdownEditorMessages } from "./composables/useMarkdownEditorMessages";
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
