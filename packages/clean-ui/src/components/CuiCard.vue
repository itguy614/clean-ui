<script setup lang="ts">
import { computed } from "vue";
import type { HideableProps, CuiRounded } from "../types/common";

export type CardVariant = "elevated" | "outline" | "ghost";

const radiusMap: Record<CuiRounded, string> = {
  none: "0",
  sm: "0.25rem",
  md: "var(--cui-button-radius, 0.375rem)",
  lg: "0.5rem",
  full: "9999px",
};

export interface CuiCardProps extends HideableProps {
  /** Visual style */
  variant?: CardVariant;
  /** Border radius */
  rounded?: CuiRounded;
}

const props = withDefaults(defineProps<CuiCardProps>(), {
  variant: "elevated",
  hidden: false,
  rounded: "lg",
});

/**
 * Only the values that depend on a prop are emitted here, as private `--_card-*`
 * properties; the stylesheet reads each as `var(--cui-card-bg, var(--_card-bg))` so a
 * public token set anywhere in the ancestor chain wins. Everything that does not vary —
 * the paddings — is a plain default in the CSS instead, with no inline style at all.
 * See "Themeable Properties" in CLAUDE.md (#114, #115).
 */
const cardStyle = computed(() => {
  const base: Record<string, string> = {
    "--_card-radius": radiusMap[props.rounded],
  };

  if (props.variant === "elevated") {
    base["--_card-bg"] = "var(--cui-surface-base)";
    base["--_card-border"] = "1px solid var(--cui-border)";
    base["--_card-shadow"] = "0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.03)";
  } else if (props.variant === "outline") {
    base["--_card-bg"] = "var(--cui-surface-base)";
    base["--_card-border"] = "1px solid var(--cui-border)";
    base["--_card-shadow"] = "none";
  } else {
    base["--_card-bg"] = "transparent";
    base["--_card-border"] = "none";
    base["--_card-shadow"] = "none";
  }

  return base;
});
</script>

<template>
  <div class="cui-card" v-show="!hidden" :style="cardStyle">
    <slot />
  </div>
</template>

<style scoped>
/* Themeable — zero specificity, so a consumer's own `.cui-card { … }` rule wins without
   `!important`. See the note in CuiButton.vue. */
:where(.cui-card) {
  border-radius: var(--cui-card-radius, var(--_card-radius));
  background: var(--cui-card-bg, var(--_card-bg));
  border: var(--cui-card-border, var(--_card-border));
  box-shadow: var(--cui-card-shadow, var(--_card-shadow));
}

/* Structural: clips the sub-components' corners to the card's radius. */
.cui-card {
  overflow: clip;
}
</style>
