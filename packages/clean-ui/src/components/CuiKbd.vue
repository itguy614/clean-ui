<script setup lang="ts">
import { computed } from "vue";
import type { HideableProps, SizeableProps } from "../types/common";
import { clampSize, scaleDensity } from "../utils/sizing";

export interface CuiKbdProps extends HideableProps, SizeableProps {
}

const props = withDefaults(defineProps<CuiKbdProps>(), {
  size: "md",
  hidden: false,
});

const SUPPORTED_SIZES = ["sm", "md", "lg"] as const;

const sizeConfig: Record<(typeof SUPPORTED_SIZES)[number], { fontSize: string; padding: string; minWidth: string }> = {
  sm: { fontSize: "0.6875rem", padding: `${scaleDensity("0.0625rem")} ${scaleDensity("0.3125rem")}`, minWidth: "1.125rem" },
  md: { fontSize: "0.75rem", padding: `${scaleDensity("0.125rem")} ${scaleDensity("0.375rem")}`, minWidth: "1.375rem" },
  lg: { fontSize: "0.8125rem", padding: `${scaleDensity("0.1875rem")} ${scaleDensity("0.4375rem")}`, minWidth: "1.5rem" },
};

const clampedSize = computed(() => clampSize(props.size, SUPPORTED_SIZES));
</script>

<template>
  <kbd
    v-show="!hidden"
    :style="{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: sizeConfig[clampedSize].fontSize,
      padding: sizeConfig[clampedSize].padding,
      minWidth: sizeConfig[clampedSize].minWidth,
      fontFamily: 'var(--cui-font-sans, system-ui, sans-serif)',
      fontWeight: '500',
      lineHeight: '1.4',
      color: 'var(--cui-text-secondary)',
      background: 'var(--cui-surface-base, white)',
      border: '1px solid var(--cui-border)',
      borderBottom: '2px solid var(--cui-border)',
      borderRadius: '0.25rem',
      boxShadow: '0 1px 0 var(--cui-border)',
      whiteSpace: 'nowrap',
      verticalAlign: 'middle',
    }"
  >
    <slot />
  </kbd>
</template>
