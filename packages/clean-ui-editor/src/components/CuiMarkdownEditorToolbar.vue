<script setup lang="ts">
import { computed } from "vue";
import { CuiButton, CuiIcon, CuiToolbar } from "@itguy614/clean-ui";
import type { PluginRegistry } from "../plugins/registry";
import { useMarkdownEditorMessages } from "../composables/useMarkdownEditorMessages";
import { resolveCommandLabel } from "../messages";

const props = defineProps<{
  registry: PluginRegistry;
  /** Command ids to show, in order — subsets and reorders the registry's
   * collected toolbar entries (task 4.1.2). Omit for the full default set. */
  toolbar?: string[];
  runCommand: (id: string) => boolean;
  isCommandActive: (id: string) => boolean;
  /**
   * Bumped by the parent on every selection/document change. `isCommandActive`
   * reads live CodeMirror state, not a Vue ref, so nothing here would
   * otherwise tell Vue a re-render is needed when the caret moves into or
   * out of a construct — this prop is the reactive trigger for that.
   */
  selectionVersion: number;
}>();

const messages = useMarkdownEditorMessages();

const entries = computed(() => {
  const ids = props.toolbar ?? props.registry.toolbar.map((entry) => entry.command);
  return ids
    .map((id) => ({ id, spec: props.registry.commands.get(id)?.spec }))
    .filter((entry): entry is { id: string; spec: NonNullable<typeof entry.spec> } => Boolean(entry.spec?.label))
    .map((entry) => ({ ...entry, label: resolveCommandLabel(messages.value, entry.id, entry.spec.label!) }));
});

const activeStates = computed(() => {
  void props.selectionVersion; // establishes the reactive dependency described above
  return new Map(entries.value.map((entry) => [entry.id, props.isCommandActive(entry.id)]));
});
</script>

<template>
  <!-- CuiToolbar (#190) owns the keyboard — one roving tab stop, arrows, Home/End — and the
       overflow: a CuiScrollArea (#143), which owns the scroller and its edge fades, the
       arrangement this toolbar once got wrong, its fades scrolling away with the buttons
       (#125). `loop` keeps the arrows coming round at the ends, as they always have here. -->
  <CuiToolbar class="cui-markdown-editor-toolbar" :label="messages.toolbarAriaLabel" overflow="scroll" loop>
    <!-- A formatting toggle is a ghost button with `pressed` (#396), which renders
         `aria-pressed` and the selected look; a command without `isActive` isn't a toggle
         and gets no `aria-pressed` at all. The look is solid, not CuiButton's subtle
         pressed default: a deliberate, signed-off exception to "subtle by default" — an
         icon-only formatting toggle needs the clearest possible on/off contrast at a glance,
         with no label to fall back on, the convention Word, Docs and Notion use for exactly
         this kind of toolbar. Set through the public pressed tokens below. -->
    <CuiButton
      v-for="entry in entries"
      :key="entry.id"
      size="sm"
      variant="ghost"
      :pressed="entry.spec.isActive ? activeStates.get(entry.id) : undefined"
      :aria-label="entry.label"
      :title="entry.label"
      @click="runCommand(entry.id)"
    >
      <template v-if="entry.spec.icon" #prefix>
        <CuiIcon :name="entry.spec.icon" size="1em" />
      </template>
    </CuiButton>
  </CuiToolbar>
</template>

<style scoped>
.cui-markdown-editor-toolbar {
  position: relative;
  /* The control owns the radius and does not clip (`overflow: visible`), so the toolbar
     carries its top corners down to the overflow fades, which inherit from here. Inset by
     the control's 1px border, the way CuiInput nests its attached buttons (#125). The same
     token the control reads (editor.css; the private value is set on the control), so the
     two can't be rounded differently (#228). */
  border-top-left-radius: calc(var(--cui-markdown-editor-radius, var(--_markdown-editor-radius)) - 1px);
  border-top-right-radius: calc(var(--cui-markdown-editor-radius, var(--_markdown-editor-radius)) - 1px);
  /* The spacing it has always had, as CuiToolbar's private defaults: a public --cui-toolbar-* token on any ancestor still wins. */
  --_toolbar-px: calc(0.375rem * var(--cui-density-scale, 1));
  --_toolbar-py: calc(0.375rem * var(--cui-density-scale, 1));
}

/* A pressed toggle is solid (see the template). The public tokens, declared here so they
   beat any set on an ancestor, as the solid variant did; zero-specificity, so a consumer's
   plain .cui-markdown-editor-toolbar rule still wins. */
:where(.cui-markdown-editor-toolbar) {
  --cui-button-pressed-bg: var(--cui-primary-solid, var(--cui-primary));
  --cui-button-pressed-color: var(--cui-primary-text);
  --cui-button-pressed-border: 1px solid transparent;
}

.cui-markdown-editor-toolbar :deep(.cui-scroll-area__scroller) {
  scrollbar-width: none;
}

.cui-markdown-editor-toolbar :deep(.cui-scroll-area__scroller)::-webkit-scrollbar {
  display: none;
}

.cui-markdown-editor-toolbar :deep(.cui-button) {
  min-width: 24px;
  min-height: 24px;
}

/* `size="sm"` (32px) reads fine as a mouse target but falls short of the
   ~44px touch-target guideline (WCAG 2.5.5, Apple HIG) on a phone-width
   screen, where a near-miss tap is more likely to scroll this already
   horizontally-scrollable strip than activate the button. Setting the
   button's own height token grows the tap area while the icon and padding
   stay exactly as `size="sm"` renders them; before #114 the height was
   inline and unreachable, so this had to be smuggled in as `min-height`.
   Scoped to mobile only: the toolbar's icon-dense, compact layout is
   deliberate at desktop/mouse widths. */
@media (max-width: 639px) {
  .cui-markdown-editor-toolbar :deep(.cui-button) {
    --cui-button-height: 44px;
    min-width: 44px;
  }
}

</style>
