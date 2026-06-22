import { computed, inject, type ComputedRef } from "vue";
import { CuiConfigKey } from "../components/config-context";
import { defaultMessages, type CuiMessages } from "../messages";

// Shared fallback for components used outside any CuiConfigProvider — built-in
// English defaults. One instance, since the catalog is static.
const FALLBACK: ComputedRef<CuiMessages> = computed(() => defaultMessages);

/**
 * Resolve the active message catalog. Returns the nearest CuiConfigProvider's
 * merged messages, or the built-in English defaults when there is no provider.
 *
 * In templates the returned ref auto-unwraps (`messages.close`); in script use
 * `messages.value.close`.
 */
export function useMessages(): ComputedRef<CuiMessages> {
  return inject(CuiConfigKey, FALLBACK);
}
