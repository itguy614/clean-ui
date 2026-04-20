<script setup lang="ts">
export interface CuiModalFooterProps {
  /** Align footer content */
  align?: "left" | "right" | "center" | "between";
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiModalFooterProps>(), {
  align: "right",
  hidden: false,
});

const justifyMap: Record<string, string> = {
  left: "flex-start",
  right: "flex-end",
  center: "center",
  between: "space-between",
};
</script>

<template>
  <div
    v-show="!hidden"
    :style="{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem 1.25rem',
      flexShrink: '0',
      justifyContent: justifyMap[align],
      background: 'var(--cui-surface-base)',
    }"
  >
    <slot />
  </div>
</template>
