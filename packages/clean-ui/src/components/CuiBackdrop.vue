<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { CuiColorOrCss, GradientProps, HideableProps } from "../types/common";
import { resolveColor } from "../utils/color";
import { resolveGradient } from "../utils/gradient";

export type BackdropBlur = "none" | "sm" | "md" | "lg" | string;

export interface CuiBackdropProps extends HideableProps, GradientProps {
  /** Backdrop opacity (0-1) */
  opacity?: number;
  /** Backdrop blur — named size or custom CSS value */
  blur?: BackdropBlur;
  /** Backdrop color — a color role (mapped to its token) or any CSS color (default black) */
  color?: CuiColorOrCss;
  /** Background image URL or data URI */
  image?: string;
  /** External visibility control — when provided, overrides internal fade-in state */
  visible?: boolean;
}

const props = withDefaults(defineProps<CuiBackdropProps>(), {
  opacity: 0.5,
  blur: "none",
  color: "black",
  hidden: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const blurMap: Record<string, string> = {
  none: "none",
  sm: "2px",
  md: "4px",
  lg: "8px",
};

// Fade-in state — when `visible` prop is provided, use it; otherwise self-manage
const internalVisible = ref(false);
onMounted(() => {
  requestAnimationFrame(() => {
    internalVisible.value = true;
  });
});
const isVisible = computed(() => props.visible !== undefined ? props.visible : internalVisible.value);

const backdropStyle = computed(() => {
  const blurValue = blurMap[props.blur] ?? props.blur;
  const hasBlur = blurValue !== "none";
  const style: Record<string, string> = {};

  // Build background layers
  // The gradient is two layer lists (sRGB fallback, oklch); the image and color are shared.
  const gradient = resolveGradient(props);
  const layers: string[] = [];

  if (props.image) {
    layers.push(`url("${props.image.replace(/[\\"]/g, "\\$&")}") repeat`);
  }

  // For backdrop-filter to work, the background must be semi-transparent
  // (not achieved via the opacity property, which hides the blur effect).
  const bgColor = resolveColor(props.color, "black");
  if (hasBlur) {
    layers.push(`color-mix(in srgb, ${bgColor} ${Math.round(props.opacity * 100)}%, transparent)`);
    style.backdropFilter = `blur(${blurValue})`;
    style.webkitBackdropFilter = `blur(${blurValue})`;
  } else {
    layers.push(bgColor);
  }

  // A private token, read back through the stylesheet's :where() (#211).
  style["--_backdrop-bg"] = (gradient ? [gradient.fallback, ...layers] : layers).join(", ");
  // Always set, as `initial` without a gradient: custom properties inherit (see CuiPanel.vue).
  style["--_backdrop-bg-modern"] = gradient ? [gradient.modern, ...layers].join(", ") : "initial";

  return style;
});
</script>

<template>
  <div
    v-show="!hidden"
    class="cui-backdrop"
    :class="{ 'cui-backdrop--visible': isVisible }"
    :style="{
      ...backdropStyle,
      // When no blur, use element opacity for the fade-in
      ...(!blur || blur === 'none' ? { '--_backdrop-opacity': String(opacity) } : {}),
    }"
    aria-hidden="true"
    @click="emit('click', $event)"
  />
</template>

<style scoped>
/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
:where(.cui-backdrop) {
  background: var(--cui-backdrop-bg, var(--_backdrop-bg));
}

/* The oklch gradient replaces the sRGB one wherever it parses (see CuiPanel.vue). */
@supports (background: linear-gradient(in oklch shorter hue, red, blue)) {
  :where(.cui-backdrop) {
    background: var(--cui-backdrop-bg, var(--_backdrop-bg-modern, var(--_backdrop-bg)));
  }
}

.cui-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0;
  /* Fades out faster than it came in (#269): the duration of the state it moves to. */
  transition: opacity var(--cui-duration-fast) var(--cui-ease-out);
}

.cui-backdrop--visible {
  opacity: var(--_backdrop-opacity, 1);
  transition-duration: var(--cui-duration-slow);
}
</style>
