<script setup lang="ts">
export interface CuiCardFooterProps {
  /** Align footer content */
  align?: "left" | "right" | "center" | "between";
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiCardFooterProps>(), {
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
      padding: '0.375rem 1.125rem 1rem',
      justifyContent: justifyMap[align],
    }"
  >
    <slot />
  </div>
</template>
