<script setup lang="ts">
import { computed } from "vue";
import type { CuiColorOrCss, CuiRounded, GradientProps, HideableProps } from "../types/common";
import { resolveColor } from "../utils/color";
import { resolveGradient } from "../utils/gradient";
import { RADIUS_SCALE } from "../utils/sizing";

export interface CuiPanelProps extends HideableProps, GradientProps {
  /** The element to render (default `div`) */
  as?: string;
  /** Base color, the bottom layer: a color role (mapped to its token) or any CSS color */
  color?: CuiColorOrCss;
  /** Background image URL or data URI, painted above the color and below the gradient */
  image?: string;
  /** Corner radius, from the shared radius scale */
  rounded?: CuiRounded;
}

const props = withDefaults(defineProps<CuiPanelProps>(), {
  as: "div",
  color: "var(--cui-surface-base)",
  rounded: "none",
  hidden: false,
});

/**
 * Layers, top to bottom: grain, gradient, image, color. The gradient's `fallback` (sRGB) is the
 * private `--_panel-bg`; its oklch form is `--_panel-bg-modern`, which the stylesheet prefers
 * inside `@supports`. Both are private: the stylesheet reads them back through the public
 * `--cui-panel-*` layer, so a consumer's token wins without `!important`.
 */
const panelStyle = computed(() => {
  const gradient = resolveGradient(props);
  const rest: string[] = [];
  if (props.image) rest.push(`url("${props.image.replace(/[\\"]/g, "\\$&")}") center / cover no-repeat`);
  rest.push(resolveColor(props.color, "var(--cui-surface-base)"));

  const style: Record<string, string> = {
    "--_panel-radius": RADIUS_SCALE[props.rounded],
    "--_panel-bg": (gradient ? [gradient.fallback, ...rest] : rest).join(", "),
  };
  if (gradient) style["--_panel-bg-modern"] = [gradient.modern, ...rest].join(", ");
  return style;
});
</script>

<template>
  <component :is="as" v-show="!hidden" class="cui-panel" :style="panelStyle">
    <slot />
  </component>
</template>

<style scoped>
/* Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue). */
:where(.cui-panel) {
  background: var(--cui-panel-bg, var(--_panel-bg));
  border-radius: var(--cui-panel-radius, var(--_panel-radius));
}

/* The oklch gradient replaces the sRGB one wherever it parses; a plain custom property cannot
   fall back by itself, since `var()` is only validated when the declaration is used. */
@supports (background: linear-gradient(in oklch shorter hue, red, blue)) {
  :where(.cui-panel) {
    background: var(--cui-panel-bg, var(--_panel-bg-modern, var(--_panel-bg)));
  }
}
</style>
