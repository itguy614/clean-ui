import type { CuiEditorPlugin } from "./types";

/**
 * The preset applied when `CuiMarkdownEditor`'s `plugins` prop is omitted
 * (FR25) — zero-configuration usage still yields a complete editor. Empty
 * until Phase 04 ships the built-in formatting plugins against this same
 * Phase 03 API; the registry and reconfiguration machinery don't change
 * shape when that happens, only this array gains entries.
 */
export const DEFAULT_PLUGINS: readonly CuiEditorPlugin[] = [];
