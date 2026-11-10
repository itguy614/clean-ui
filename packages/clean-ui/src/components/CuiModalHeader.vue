<script setup lang="ts">
import CuiIcon from "./CuiIcon.vue";
import type { HideableProps, TitleAsProps } from "../types/common";
import { useMessages } from "../composables/useMessages";
import { useHeadingLevel } from "../utils/configure";

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
});

// Its own `titleAs`, else the app's default (#149), else the library's.
const headingTag = useHeadingLevel("modalHeader", () => props.titleAs);

const emit = defineEmits<{
  close: [];
}>();
const messages = useMessages();
</script>

<template>
  <div class="cui-modal-header" v-show="!hidden">
    <div class="cui-modal-header__main">
      <slot>
        <component :is="headingTag" v-if="title" :id="titleId" class="cui-modal-header__title">
          {{ title }}
        </component>
      </slot>
    </div>
    <div v-if="$slots.actions" class="cui-modal-header__actions">
      <slot name="actions" />
    </div>
    <button v-if="!noCloseButton" type="button" class="cui-modal-header__close" :aria-label="messages.close" @click="emit('close')">
      <CuiIcon name="x" size="1rem" />
    </button>
  </div>
</template>

<style scoped>
/*
 * Every themeable rule is a whole :where(), so a consumer's plain `.cui-modal-header { … }` at
 * (0,1,0) wins without !important; structure (display, position, flex) keeps normal
 * specificity. The close button's hover was written from mouseenter and mouseleave handlers
 * (an inline background and colour); it is a :hover rule now.
 */
.cui-modal-header {
  display: flex;
  align-items: flex-start;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}
:where(.cui-modal-header) {
  gap: var(--cui-modal-header-gap, calc(0.75rem * var(--cui-density-scale, 1)));
  padding: calc(1.25rem * var(--cui-density-scale, 1)) var(--cui-modal-header-px, calc(1.5rem * var(--cui-density-scale, 1))) calc(0.25rem * var(--cui-density-scale, 1));
  background: var(--cui-modal-header-bg, var(--cui-surface-base));
}

.cui-modal-header__main {
  flex: 1;
  min-width: 0;
}

:where(.cui-modal-header__title) {
  font-size: var(--cui-modal-header-font-size, 1.125rem);
  font-weight: 600;
  line-height: 1.4;
  color: var(--cui-modal-header-color, var(--cui-text-emphasis));
  margin: 0;
}

.cui-modal-header__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
:where(.cui-modal-header__actions) {
  gap: calc(0.5rem * var(--cui-density-scale, 1));
}

.cui-modal-header__close {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  cursor: pointer;
}
:where(.cui-modal-header__close) {
  padding: 0;
  border: none;
  border-radius: 0.375rem;
  background: none;
  color: var(--cui-text-tertiary);
  margin-top: calc(-0.125rem * var(--cui-density-scale, 1));
  margin-right: calc(-0.25rem * var(--cui-density-scale, 1));
  transition:
    color var(--cui-duration-fast) ease,
    background var(--cui-duration-fast) ease;
}
:where(.cui-modal-header__close:hover) {
  color: var(--cui-modal-header-hover-color, var(--cui-text-body));
  background: var(--cui-modal-header-hover-bg, var(--cui-primary-bg));
}
</style>
