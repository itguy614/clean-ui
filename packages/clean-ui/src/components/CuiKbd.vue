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

const sizeConfig: Record<(typeof SUPPORTED_SIZES)[number], { text: string; py: string; px: string; minWidth: string }> = {
  sm: { text: "0.6875rem", py: scaleDensity("0.0625rem"), px: scaleDensity("0.3125rem"), minWidth: "1.125rem" },
  md: { text: "0.75rem", py: scaleDensity("0.125rem"), px: scaleDensity("0.375rem"), minWidth: "1.375rem" },
  lg: { text: "0.8125rem", py: scaleDensity("0.1875rem"), px: scaleDensity("0.4375rem"), minWidth: "1.5rem" },
};

// `cui-kbd` is the typography layer's helper class too; `cui-kbd--keycap` (in the template) is
// what tells main.css's helper this element is the component, which paints itself.
// The size preset, as private properties; the stylesheet reads each through its public token.
const rootVars = computed(() => {
  const c = sizeConfig[clampSize(props.size, SUPPORTED_SIZES)];
  return {
    "--_kbd-font-size": c.text,
    "--_kbd-py": c.py,
    "--_kbd-px": c.px,
    "--_kbd-min-width": c.minWidth,
  };
});
</script>

<template>
  <kbd class="cui-kbd cui-kbd--keycap" v-show="!hidden" :style="rootVars">
    <slot />
  </kbd>
</template>

<style scoped>
/*
 * Every themeable rule is a whole :where(), so a consumer's plain `.cui-kbd { … }` at (0,1,0)
 * wins without !important. The look is the same inside and outside `.cui-typography`: the prose
 * rule skips an element that carries a `cui-*` class, and the helper `.cui-kbd` rule in
 * main.css skips `.cui-kbd--keycap`.
 */
.cui-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--_kbd-min-width);
  line-height: 1.4;
  white-space: nowrap;
  vertical-align: middle;
}
:where(.cui-kbd) {
  font-family: var(--cui-font-sans, system-ui, sans-serif);
  font-weight: 500;
  font-size: var(--cui-kbd-font-size, var(--_kbd-font-size));
  padding: var(--cui-kbd-py, var(--_kbd-py)) var(--cui-kbd-px, var(--_kbd-px));
  color: var(--cui-kbd-color, var(--cui-text-secondary));
  background: var(--cui-kbd-bg, var(--cui-surface-base, white));
  border: 1px solid var(--cui-kbd-border, var(--cui-border));
  border-bottom-width: 2px;
  border-radius: var(--cui-kbd-radius, 0.25rem);
  box-shadow: 0 1px 0 var(--cui-kbd-border, var(--cui-border));
}
</style>
