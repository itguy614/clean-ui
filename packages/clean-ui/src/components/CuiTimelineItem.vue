<script setup lang="ts">
import { computed } from "vue";
import type { HideableProps, ColorableProps } from "../types/common";
import CuiIcon from "./CuiIcon.vue";

export interface CuiTimelineItemProps extends HideableProps, ColorableProps {
  /** Icon name (replaces the dot) */
  icon?: string;
  /** Title text */
  title?: string;
  /** Timestamp or meta text */
  timestamp?: string;
  /** Hide the connector line (use on last item) */
  last?: boolean;
}

const props = withDefaults(defineProps<CuiTimelineItemProps>(), {
  color: "primary",
  last: false,
  hidden: false,
});

// The dot's colours follow `color` (and whether it carries an icon): per-instance data,
// emitted as private properties on the dot. The stylesheet reads them back through the
// public tokens, so a consumer's rule or container token still wins (#489).
const dotVars = computed(() => ({
  "--_timeline-item-bg": props.icon ? `var(--cui-${props.color}-bg)` : `var(--cui-${props.color})`,
  "--_timeline-item-color": `var(--cui-${props.color})`,  "--_timeline-item-border": props.icon ? `var(--cui-${props.color}-border)` : "var(--cui-surface-base, white)",
}));
</script>

<template>
  <div class="cui-timeline-item" :class="{ 'cui-timeline-item--last': last }" v-show="!hidden" role="listitem">
    <!-- Left column: dot/icon + connector line -->
    <div class="cui-timeline-item__rail" :class="{ 'cui-timeline-item__rail--icon': icon }">
      <!-- Dot or icon -->
      <div class="cui-timeline-item__dot" :class="{ 'cui-timeline-item__dot--icon': icon }" :style="dotVars">
        <slot name="icon">
          <CuiIcon v-if="icon" :name="icon" size="0.875rem" />
        </slot>
      </div>

      <!-- Connector line -->
      <div v-if="!last" class="cui-timeline-item__line" />
    </div>

    <!-- Right column: content -->
    <div class="cui-timeline-item__content" :class="{ 'cui-timeline-item__content--icon': icon }">
      <!-- Title + timestamp row -->
      <div v-if="title || timestamp" class="cui-timeline-item__head">
        <span v-if="title" class="cui-timeline-item__title">
          {{ title }}
        </span>
        <span v-if="timestamp" class="cui-timeline-item__timestamp">
          {{ timestamp }}
        </span>
      </div>

      <!-- Body content -->
      <div v-if="$slots.default" class="cui-timeline-item__body" :class="{ 'cui-timeline-item__body--titled': title }">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
 * Every themeable rule is a whole :where(), so a consumer's plain `.cui-timeline-item__dot
 * { … }` at (0,1,0) wins without !important; structure (display, flex, positioning) keeps
 * normal specificity. The dot's colours arrive as private --_timeline-item-* properties (#489).
 */
.cui-timeline-item {
  display: flex;
  position: relative;
}
:where(.cui-timeline-item) {
  gap: var(--cui-timeline-item-gap, calc(0.875rem * var(--cui-density-scale, 1)));
  padding-bottom: calc(1.5rem * var(--cui-density-scale, 1));
}
:where(.cui-timeline-item--last) {
  padding-bottom: 0;
}

.cui-timeline-item__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 0.75rem;
}
.cui-timeline-item__rail--icon {
  width: 1.75rem;
}

.cui-timeline-item__dot {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}
:where(.cui-timeline-item__dot) {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background: var(--cui-timeline-item-bg, var(--_timeline-item-bg));
  color: var(--cui-timeline-item-color, var(--_timeline-item-color));
  border: 3px solid var(--cui-timeline-item-border, var(--_timeline-item-border));
  box-shadow: 0 0 0 3px var(--cui-surface-base, white);
}
:where(.cui-timeline-item__dot--icon) {
  width: 1.75rem;
  height: 1.75rem;
  border-width: 1px;
  box-shadow: none;
}

.cui-timeline-item__line {
  width: 2px;
  flex: 1;
}
:where(.cui-timeline-item__line) {
  background: var(--cui-border);
  margin-top: calc(0.375rem * var(--cui-density-scale, 1));
  border-radius: 1px;
}

.cui-timeline-item__content {
  flex: 1;
  min-width: 0;
}
:where(.cui-timeline-item__content--icon) {
  padding-top: calc(0.125rem * var(--cui-density-scale, 1));
}

.cui-timeline-item__head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
}
:where(.cui-timeline-item__head) {
  gap: calc(0.5rem * var(--cui-density-scale, 1));
}
:where(.cui-timeline-item__title) {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--cui-text-body);
  line-height: 1.4;
}
.cui-timeline-item__timestamp {
  white-space: nowrap;
}
:where(.cui-timeline-item__timestamp) {
  font-size: 0.75rem;
  color: var(--cui-text-tertiary);
}
:where(.cui-timeline-item__body) {
  font-size: 0.8125rem;
  color: var(--cui-text-secondary);
  line-height: 1.55;
}
:where(.cui-timeline-item__body--titled) {
  margin-top: calc(0.25rem * var(--cui-density-scale, 1));
}
</style>
