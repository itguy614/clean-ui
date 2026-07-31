import type { Extension } from "@codemirror/state";
import {
  PLUGIN_API_VERSION,
  type CuiEditorPlugin,
  type PluginCommandSpec,
  type ToolbarEntry,
  type KeymapEntry,
  type PasteRule,
  type DecorationRule,
} from "./types";

export interface RegistryWarning {
  message: string;
}

export interface PluginRegistry {
  /** Command id -> the winning plugin's id and spec (FR21: later plugin wins). */
  commands: Map<string, { pluginId: string; spec: PluginCommandSpec }>;
  toolbar: ToolbarEntry[];
  /** One entry per distinct key, already conflict-resolved (later plugin
   * wins) — see the module doc comment for why this can't just be the
   * concatenated arrays passed to CodeMirror's own `keymap.of()`. */
  keymap: KeymapEntry[];
  constructs: Set<string>;
  paste: PasteRule[];
  decorations: DecorationRule[];
  extensions: Extension[];
  warnings: RegistryWarning[];
}

export type BuildRegistryResult = { ok: true; registry: PluginRegistry } | { ok: false; error: string };

/**
 * Resolves an ordered `plugins` array into one flat registry (FR21/FR22a).
 *
 * Precedence is array order: a later plugin sharing an id with an earlier
 * one replaces it outright; a later plugin's command sharing a command id
 * with an earlier plugin's wins; a later plugin's keybinding sharing a key
 * with an earlier one wins. Every case beyond outright plugin-id replacement
 * emits a warning naming both contributors (FR21) rather than resolving
 * silently.
 *
 * Deliberately NOT "flatten every plugin's `keymap` into one array and hand
 * it to CodeMirror's `keymap.of()`" — CodeMirror's own keymap semantics are
 * first-registered-handler-wins, the opposite of this registry's
 * later-wins precedence. Conflicts are resolved into one entry per key
 * *before* any `keymap.of()` call exists, so the two precedence models never
 * fight each other (the actual CodeMirror keymap extension is built by the
 * caller from this already-resolved `keymap` list — see `CuiMarkdownEditor.vue`).
 *
 * An incompatible plugin API version is the one hard rejection (FR22a) — the
 * caller must keep whatever configuration was previously active rather than
 * apply a partially-built one (FR22).
 */
export function buildRegistry(plugins: readonly CuiEditorPlugin[]): BuildRegistryResult {
  for (const plugin of plugins) {
    if (plugin.apiVersion !== PLUGIN_API_VERSION) {
      return {
        ok: false,
        error: `Plugin "${plugin.id}" was built against plugin API version ${plugin.apiVersion}, but this version of @itguy614/clean-ui-editor expects version ${PLUGIN_API_VERSION}.`,
      };
    }
  }

  const warnings: RegistryWarning[] = [];

  const pluginsById = new Map<string, CuiEditorPlugin>();
  for (const plugin of plugins) {
    if (pluginsById.has(plugin.id)) {
      warnings.push({ message: `Duplicate plugin id "${plugin.id}" — the later registration replaces the earlier one.` });
    }
    pluginsById.set(plugin.id, plugin);
  }
  const resolvedPlugins = [...pluginsById.values()];

  const commands: PluginRegistry["commands"] = new Map();
  const toolbar: ToolbarEntry[] = [];
  const constructs = new Set<string>();
  const paste: PasteRule[] = [];
  const decorations: DecorationRule[] = [];
  const extensions: Extension[] = [];
  const keymapByKey = new Map<string, { pluginId: string; entry: KeymapEntry }>();

  for (const plugin of resolvedPlugins) {
    for (const [commandId, spec] of Object.entries(plugin.commands)) {
      const existing = commands.get(commandId);
      if (existing) {
        warnings.push({
          message: `Command id "${commandId}" is declared by both "${existing.pluginId}" and "${plugin.id}" — "${plugin.id}"'s wins.`,
        });
      }
      commands.set(commandId, { pluginId: plugin.id, spec });
    }

    toolbar.push(...(plugin.toolbar ?? []));
    for (const construct of plugin.constructs ?? []) constructs.add(construct);
    paste.push(...(plugin.paste ?? []));
    decorations.push(...(plugin.decorations ?? []));
    // Grouped per plugin (nested), not flattened — CodeMirror's Extension
    // tree accepts arbitrary nesting, and keeping each plugin's raw
    // extensions as their own subtree is what "installed separately" (FR21a)
    // means at this layer: a broken one stays attributable to its own
    // plugin rather than dissolving into one flat, unattributable array.
    if (plugin.extensions) extensions.push(plugin.extensions);

    for (const entry of plugin.keymap ?? []) {
      const existing = keymapByKey.get(entry.key);
      if (existing) {
        warnings.push({
          message: `Key "${entry.key}" is bound by both "${existing.pluginId}" and "${plugin.id}" — "${plugin.id}"'s binding wins.`,
        });
      }
      keymapByKey.set(entry.key, { pluginId: plugin.id, entry });
    }
  }

  return {
    ok: true,
    registry: {
      commands,
      toolbar,
      keymap: [...keymapByKey.values()].map(({ entry }) => entry),
      constructs,
      paste,
      decorations,
      extensions,
      warnings,
    },
  };
}
