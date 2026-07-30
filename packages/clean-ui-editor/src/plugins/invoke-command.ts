import type { CommandContext } from "./types";
import type { PluginRegistry } from "./registry";

export interface PluginErrorInfo {
  pluginId: string;
  commandId: string;
  error: unknown;
}

export type PluginErrorHandler = (info: PluginErrorInfo) => void;

/**
 * The single guarded entry point every invocation path — keymap, toolbar,
 * slash menu, the imperative `runCommand` — must call through (FR21a). A
 * throwing command reports through `onError` naming the plugin and command,
 * and editing stays usable: the raw CodeMirror `extensions` tier is
 * genuinely not sandboxed (CodeMirror offers no such isolation), but a
 * plugin's *declarative* command always fails contained rather than taking
 * the whole editor down with it.
 */
export function invokeCommand(
  registry: PluginRegistry,
  commandId: string,
  context: CommandContext,
  onError: PluginErrorHandler,
  ...args: unknown[]
): boolean {
  const entry = registry.commands.get(commandId);
  if (!entry) return false;

  try {
    return entry.spec.run(context, ...args);
  } catch (error) {
    onError({ pluginId: entry.pluginId, commandId, error });
    return false;
  }
}

/** Same containment guarantee for `isActive` (FR19) — a throwing query
 * degrades to "not active" rather than breaking every other toolbar button's
 * pressed-state computation on the same selection change. */
export function queryIsActive(
  registry: PluginRegistry,
  commandId: string,
  context: CommandContext,
  onError: PluginErrorHandler,
): boolean {
  const entry = registry.commands.get(commandId);
  if (!entry?.spec.isActive) return false;

  try {
    return entry.spec.isActive(context);
  } catch (error) {
    onError({ pluginId: entry.pluginId, commandId, error });
    return false;
  }
}
