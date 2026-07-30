import { PLUGIN_API_VERSION, type CuiEditorPlugin, type CuiEditorPluginSpec } from "./types";

/**
 * The single factory every plugin — built-in or third-party — is declared
 * with (FR17). Stamps the API version this package was built against so an
 * incompatible plugin (built against a future major that changed the
 * contract) is rejected by the registry with a named mismatch (FR22a),
 * rather than failing later at a missing or renamed helper.
 */
export function definePlugin(spec: CuiEditorPluginSpec): CuiEditorPlugin {
  return { ...spec, apiVersion: PLUGIN_API_VERSION };
}
