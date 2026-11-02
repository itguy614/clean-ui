<script setup lang="ts">
import { computed } from "vue";
import type { CuiColor, HideableProps } from "../types/common";

export type StatusDotTone = "success" | "info" | "warning" | "error" | "neutral";

export interface CuiStatusDotProps extends HideableProps {
  /** Status the dot shows, mapped to a colour role (`neutral` → `surface-dark`). */
  tone?: StatusDotTone;
  /**
   * Accessible name, for a dot that stands alone. Without one the dot is `aria-hidden`:
   * decorative, with the status spelled out in text beside it — never by colour alone.
   */
  label?: string;
}

const props = withDefaults(defineProps<CuiStatusDotProps>(), {
  tone: "neutral",
  hidden: false,
});

const TONE_ROLE: Record<StatusDotTone, CuiColor> = {
  success: "success",
  info: "info",
  warning: "warning",
  error: "error",
  neutral: "surface-dark",
};

const dotStyle = computed(() => ({ "--_status-dot-bg": `var(--cui-${TONE_ROLE[props.tone]})` }));
</script>

<template>
  <span
    v-show="!hidden"
    class="cui-status-dot"
    :style="dotStyle"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  />
</template>

<style scoped>
:where(.cui-status-dot) {
  background: var(--cui-status-dot-bg, var(--_status-dot-bg));
}

.cui-status-dot {
  display: inline-block;
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
}

/* Forced colours repaint backgrounds as Canvas, which would erase the dot. */
@media (forced-colors: active) {
  .cui-status-dot {
    forced-color-adjust: none;
  }
}
</style>
