<script setup lang="ts">
import { computed } from "vue";
import type { MarkdownRenderAdapter } from "./contract";
import { escapeHtml } from "./html-escape";

export interface CuiMarkdownViewerProps {
  /** The markdown source to render. */
  modelValue: string;
  /** Synchronous adapter producing `TrustedHtml` (FR37) — the ready-made one
   * from `createMarkdownRenderAdapter`, or an application's own renderer. */
  adapter: MarkdownRenderAdapter;
}

const props = defineProps<CuiMarkdownViewerProps>();

/**
 * FR37: a throwing adapter falls back to escaped source plus a developer
 * warning — never a blank viewer, never an uncaught error propagating into
 * the host's component tree. `v-html` below is a plain reactive binding, so
 * re-rendering on `modelValue`/`adapter` change is Vue's own diffing with no
 * manually-created DOM or listeners to leak.
 */
const rendered = computed(() => {
  try {
    return { html: props.adapter(props.modelValue), isFallback: false };
  } catch (error) {
    console.warn("[CuiMarkdownViewer] the supplied adapter threw; falling back to escaped source.", error);
    return { html: escapeHtml(props.modelValue), isFallback: true };
  }
});
</script>

<template>
  <div
    class="cui-typography cui-markdown-viewer"
    :class="{ 'cui-markdown-viewer--fallback': rendered.isFallback }"
    v-html="rendered.html"
  />
</template>

<style scoped>
.cui-markdown-viewer--fallback {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
