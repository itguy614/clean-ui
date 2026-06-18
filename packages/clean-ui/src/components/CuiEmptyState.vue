<script setup lang="ts">
import { computed } from "vue";
import type { CuiColor, CuiSize, HideableProps, ColorableProps, SizeableProps } from "../types/common";
import { clampSize, scaleDensity } from "../utils/sizing";
import CuiIcon from "./CuiIcon.vue";

const SUPPORTED_SIZES = ["sm", "md", "lg"] as const;

export interface CuiEmptyStateProps extends HideableProps, ColorableProps, SizeableProps {
  /** Phosphor icon name */
  icon?: string;
  /** Heading text */
  title?: string;
  /** Supporting text below the title */
  description?: string;
}

const props = withDefaults(defineProps<CuiEmptyStateProps>(), {
  size: "md",
  color: "primary",
  hidden: false,
});

const sizeConfig: Record<(typeof SUPPORTED_SIZES)[number], {
  circle: string;
  icon: string;
  titleFont: string;
  descFont: string;
  gap: string;
  descMaxWidth: string;
}> = {
  sm: { circle: "2.5rem", icon: "1.25rem", titleFont: "1rem", descFont: "0.8125rem", gap: scaleDensity("0.75rem"), descMaxWidth: "20rem" },
  md: { circle: "3.5rem", icon: "1.75rem", titleFont: "1.125rem", descFont: "0.875rem", gap: scaleDensity("1rem"), descMaxWidth: "24rem" },
  lg: { circle: "4.5rem", icon: "2rem", titleFont: "1.25rem", descFont: "1rem", gap: scaleDensity("1.25rem"), descMaxWidth: "28rem" },
};

const cfg = computed(() => sizeConfig[clampSize(props.size, SUPPORTED_SIZES)]);

const circleStyle = computed(() => ({
  width: cfg.value.circle,
  height: cfg.value.circle,
  background: `var(--cui-${props.color}-bg)`,
  color: `var(--cui-${props.color})`,
}));
</script>

<template>
  <div
    v-show="!hidden"
    class="cui-empty-state"
    :style="{ gap: cfg.gap }"
  >
    <!-- Icon area -->
    <div v-if="icon || $slots.icon" class="cui-empty-state__icon-area">
      <slot name="icon">
        <div class="cui-empty-state__circle" :style="circleStyle">
          <CuiIcon :name="icon!" :size="cfg.icon" />
        </div>
      </slot>
    </div>

    <!-- Content -->
    <slot>
      <div v-if="title" class="cui-empty-state__title" :style="{ fontSize: cfg.titleFont }">
        {{ title }}
      </div>
      <div
        v-if="description"
        class="cui-empty-state__description"
        :style="{ fontSize: cfg.descFont, maxWidth: cfg.descMaxWidth }"
      >
        {{ description }}
      </div>
    </slot>

    <!-- Actions -->
    <div v-if="$slots.actions" class="cui-empty-state__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.cui-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: calc(2rem * var(--cui-density-scale, 1)) calc(1rem * var(--cui-density-scale, 1));
}

.cui-empty-state__icon-area {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cui-empty-state__circle {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.cui-empty-state__title {
  font-weight: 600;
  color: var(--cui-text-body);
  line-height: 1.3;
}

.cui-empty-state__description {
  color: var(--cui-text-secondary);
  line-height: 1.5;
}

.cui-empty-state__actions {
  display: flex;
  align-items: center;
  gap: calc(0.5rem * var(--cui-density-scale, 1));
  flex-wrap: wrap;
  justify-content: center;
}
</style>
