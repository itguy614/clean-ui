<script setup lang="ts">
import { computed, type Component } from "vue";
import CuiIcon from "./CuiIcon.vue";
import type { HideableProps } from "../types/common";
import { useSidebarContext } from "./sidebar-context";

export interface CuiSidebarHeaderProps extends HideableProps {
  /** The title. The default slot replaces the whole title block. */
  title?: string;
  /** A line under the title. */
  subtitle?: string;
  /** Leading icon: a registered icon name or an icon component. The `#icon` slot replaces it. */
  icon?: string | Component;
}

const props = withDefaults(defineProps<CuiSidebarHeaderProps>(), {
  hidden: false,
});

// Fails clearly outside a CuiSidebar.
useSidebarContext();

/** CuiIcon takes a name and a component as separate props. */
const iconProps = computed(() => (typeof props.icon === "string" ? { name: props.icon } : { icon: props.icon }));
</script>

<template>
  <div v-show="!hidden" class="cui-sidebar-header">
    <span v-if="$slots.icon || icon" class="cui-sidebar-header__icon">
      <slot name="icon"><CuiIcon v-bind="iconProps" size="1.25rem" /></slot>
    </span>
    <span class="cui-sidebar-header__text">
      <slot>
        <span v-if="title" class="cui-sidebar-header__title">{{ title }}</span>
        <span v-if="subtitle" class="cui-sidebar-header__subtitle">{{ subtitle }}</span>
      </slot>
    </span>
    <span v-if="$slots.suffix" class="cui-sidebar-header__suffix"><slot name="suffix" /></span>
  </div>
</template>

<style scoped>
:where(.cui-sidebar-header) {
  padding: calc(1rem * var(--cui-density-scale, 1)) calc(1rem * var(--cui-density-scale, 1)) calc(0.75rem * var(--cui-density-scale, 1));
}

:where(.cui-sidebar-header__title) {
  color: var(--cui-text-emphasis);
  font-size: 1.25rem;
}

:where(.cui-sidebar-header__subtitle) {
  color: var(--cui-text-secondary);
  font-size: 0.875rem;
}

.cui-sidebar-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.625rem;
}

.cui-sidebar-header__icon,
.cui-sidebar-header__suffix {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
}

.cui-sidebar-header__icon {
  color: var(--cui-primary);
}

.cui-sidebar-header__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.cui-sidebar-header__title {
  font-weight: 700;
  line-height: inherit;
}
</style>
