<script setup lang="ts">
export type KbdSize = "sm" | "md" | "lg";

export interface CuiKbdProps {
  /** Size */
  size?: KbdSize;
  /** Hide the component */
  hidden?: boolean;
}

withDefaults(defineProps<CuiKbdProps>(), {
  size: "md",
  hidden: false,
});

const sizeConfig: Record<KbdSize, { fontSize: string; padding: string; minWidth: string }> = {
  sm: { fontSize: "0.6875rem", padding: "0.0625rem 0.3125rem", minWidth: "1.125rem" },
  md: { fontSize: "0.75rem", padding: "0.125rem 0.375rem", minWidth: "1.375rem" },
  lg: { fontSize: "0.8125rem", padding: "0.1875rem 0.4375rem", minWidth: "1.5rem" },
};
</script>

<template>
  <kbd
    v-show="!hidden"
    :style="{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: sizeConfig[size].fontSize,
      padding: sizeConfig[size].padding,
      minWidth: sizeConfig[size].minWidth,
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
