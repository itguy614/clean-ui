<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from "vue";
import { CuiButton, CuiIcon, useScrollShadows, scrollShadowRightStyle } from "@itguy614/clean-ui";
import type { PluginRegistry } from "../plugins/registry";

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

const entries = computed(() => {
  const ids = props.toolbar ?? props.registry.toolbar.map((entry) => entry.command);
  return ids
    .map((id) => ({ id, spec: props.registry.commands.get(id)?.spec }))
    .filter((entry): entry is { id: string; spec: NonNullable<typeof entry.spec> } => Boolean(entry.spec?.label));
});

const activeStates = computed(() => {
  void props.selectionVersion; // establishes the reactive dependency described above
  return new Map(entries.value.map((entry) => [entry.id, props.isCommandActive(entry.id)]));
});

function activate(id: string, index: number) {
  focusedIndex.value = index;
  props.runCommand(id);
}

// --- Overflow scrolling — reuses the same composable CuiTable/CuiModalBody
// use, rather than re-deriving scroll-edge detection a third time. ---
const barRef = useTemplateRef<HTMLDivElement>("bar");
const { canScrollLeft, canScrollRight, onScroll, onMount } = useScrollShadows();
const scrollShadowLeftStyle = {
  ...scrollShadowRightStyle,
  right: undefined,
  left: "0",
  background: "linear-gradient(to right, var(--cui-surface-base, white), transparent)",
};

onMounted(() => onMount(barRef.value));

// --- Roving tabindex (one tab stop, arrow-key navigation between buttons —
// same pattern as CuiTabs' hand-rolled keyboard nav; no shared composable
// for this exists yet in clean-ui). ---
const focusedIndex = ref(0);
const buttonRefs = ref<Array<InstanceType<typeof CuiButton> | null>>([]);

function onKeydown(event: KeyboardEvent) {
  const count = entries.value.length;
  if (count === 0) return;
  let next = -1;
  if (event.key === "ArrowRight") next = (focusedIndex.value + 1) % count;
  else if (event.key === "ArrowLeft") next = (focusedIndex.value - 1 + count) % count;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = count - 1;

  if (next >= 0) {
    event.preventDefault();
    focusedIndex.value = next;
    nextTick(() => buttonRefs.value[next]?.focus());
  }
}
</script>

<template>
  <div
    ref="bar"
    class="cui-markdown-editor-toolbar"
    role="toolbar"
    aria-label="Formatting"
    @keydown="onKeydown"
    @scroll="onScroll"
  >
    <div v-if="canScrollLeft" class="cui-markdown-editor-toolbar__shadow" :style="scrollShadowLeftStyle" />
    <CuiButton
      v-for="(entry, index) in entries"
      :key="entry.id"
      :ref="(el) => (buttonRefs[index] = el as InstanceType<typeof CuiButton> | null)"
      size="sm"
      :variant="activeStates.get(entry.id) ? 'solid' : 'ghost'"
      :tabindex="index === focusedIndex ? 0 : -1"
      :aria-pressed="entry.spec.isActive ? activeStates.get(entry.id) : undefined"
      :aria-label="entry.spec.label"
      :title="entry.spec.label"
      @click="activate(entry.id, index)"
    >
      <template v-if="entry.spec.icon" #prefix>
        <CuiIcon :name="entry.spec.icon" size="1em" />
      </template>
    </CuiButton>
    <div v-if="canScrollRight" class="cui-markdown-editor-toolbar__shadow" :style="scrollShadowRightStyle" />
  </div>
</template>

<style scoped>
.cui-markdown-editor-toolbar {
  position: relative;
  display: flex;
  align-items: center;
  gap: calc(0.25rem * var(--cui-density-scale, 1));
  padding: calc(0.375rem * var(--cui-density-scale, 1));
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.cui-markdown-editor-toolbar::-webkit-scrollbar {
  display: none;
}

.cui-markdown-editor-toolbar :deep(.cui-button) {
  flex-shrink: 0;
  min-width: 24px;
  min-height: 24px;
}

.cui-markdown-editor-toolbar__shadow {
  position: sticky;
  z-index: 1;
}
</style>
