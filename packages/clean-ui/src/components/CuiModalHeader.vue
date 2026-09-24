<script setup lang="ts">
import CuiIcon from "./CuiIcon.vue";
import type { HideableProps, TitleAsProps } from "../types/common";
import { useMessages } from "../composables/useMessages";

export interface CuiModalHeaderProps extends HideableProps, TitleAsProps {
  /** Convenience: title text */
  title?: string;
  /**
   * id for the title element, so the dialog can point `aria-labelledby` at it.
   *
   * `CuiModal` and `CuiSlideover` generate one and pass it down. Without it their
   * `aria-labelledby` referenced an id that was never rendered, so every titled dialog
   * in the library was announced unnamed (#158).
   */
  titleId?: string;
  /** Hide the close button */
  noCloseButton?: boolean;
}

const props = withDefaults(defineProps<CuiModalHeaderProps>(), {
  noCloseButton: false,
  hidden: false,
  titleAs: "h2",
});

const emit = defineEmits<{
  close: [];
}>();
const messages = useMessages();
</script>

<template>
  <div
    class="cui-modal-header"
    v-show="!hidden"
    :style="{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'calc(0.75rem * var(--cui-density-scale, 1))',
      padding: 'calc(1.25rem * var(--cui-density-scale, 1)) calc(1.5rem * var(--cui-density-scale, 1)) calc(0.25rem * var(--cui-density-scale, 1))',
      flexShrink: '0',
      background: 'var(--cui-surface-base)',
      position: 'relative',
      zIndex: '1',
    }"
  >
    <div style="flex: 1; min-width: 0;">
      <slot>
        <component
          :is="titleAs"
          v-if="title"
          :id="titleId"
          class="cui-modal-header__title"
          :style="{
            fontSize: '1.125rem',
            fontWeight: '600',
            lineHeight: '1.4',
            color: 'var(--cui-text-emphasis)',
            margin: '0',
          }"
        >
          {{ title }}
        </component>
      </slot>
    </div>
    <div v-if="$slots.actions" style="display: flex; align-items: center; gap: calc(0.5rem * var(--cui-density-scale, 1)); flex-shrink: 0;">
      <slot name="actions" />
    </div>
    <button
      v-if="!noCloseButton"
      type="button"
      :style="{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1.75rem',
        height: '1.75rem',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        color: 'var(--cui-text-tertiary)',
        padding: '0',
        borderRadius: '0.375rem',
        flexShrink: '0',
        marginTop: 'calc(-0.125rem * var(--cui-density-scale, 1))',
        marginRight: 'calc(-0.25rem * var(--cui-density-scale, 1))',
        transition: 'color 0.15s ease, background 0.15s ease',
      }"
      :aria-label="messages.close"
      @click="emit('close')"
      @mouseenter="($event.target as HTMLElement).style.color = 'var(--cui-text-body)'; ($event.target as HTMLElement).style.background = 'var(--cui-primary-bg)'"
      @mouseleave="($event.target as HTMLElement).style.color = 'var(--cui-text-tertiary)'; ($event.target as HTMLElement).style.background = 'none'"
    >
      <CuiIcon name="x" size="1rem" />
    </button>
  </div>
</template>
