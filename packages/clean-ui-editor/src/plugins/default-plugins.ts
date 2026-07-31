import type { CuiEditorPlugin } from "./types";
import {
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
} from "./builtin";

/**
 * The preset applied when `CuiMarkdownEditor`'s `plugins` prop is omitted
 * (FR25) — zero-configuration usage still yields a complete editor. Every
 * entry is an ordinary plugin against this same Phase 03 API (FR17); none of
 * them reach for anything the plugin API doesn't expose.
 */
export const DEFAULT_PLUGINS: readonly CuiEditorPlugin[] = [
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
];
