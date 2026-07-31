import { computed, type ComputedRef } from "vue";
import { useMessages } from "@itguy614/clean-ui";
import { mergeMarkdownEditorMessages, type CuiMarkdownEditorMessages } from "../messages";

/**
 * Resolves this package's own message namespace: the nearest
 * `CuiConfigProvider`'s `messages.markdownEditor` override (if any), merged
 * over the built-in English defaults — or just the defaults when there's no
 * provider, or the provider hasn't touched this namespace at all.
 */
export function useMarkdownEditorMessages(): ComputedRef<CuiMarkdownEditorMessages> {
  const catalog = useMessages();
  return computed(() => mergeMarkdownEditorMessages(catalog.value.markdownEditor));
}
