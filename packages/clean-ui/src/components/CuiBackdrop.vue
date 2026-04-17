<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

export type BackdropBlur = "none" | "sm" | "md" | "lg" | string;

export interface CuiBackdropProps {
  /** Backdrop opacity (0-1) */
  opacity?: number;
  /** Backdrop blur — named size or custom CSS value */
  blur?: BackdropBlur;
  /** Backdrop color (CSS color string, default black) */
  color?: string;
  /** Background image URL or data URI */
  image?: string;
  /** CSS gradient string */
  gradient?: string;
}

const props = withDefaults(defineProps<CuiBackdropProps>(), {
  opacity: 0.5,
  blur: "none",
  color: "black",
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

// Fade-in state
const visible = ref(false);
onMounted(() => {
  requestAnimationFrame(() => {
    visible.value = true;
  });
});

const backdropStyle = computed(() => {
  const blurValue = blurMap[props.blur] ?? props.blur;
  const hasBlur = blurValue !== "none";
  const style: Record<string, string> = {};

  // Build background layers
  const layers: string[] = [];

  if (props.gradient) {
    layers.push(props.gradient);
  }

  if (props.image) {
    layers.push(`url("${props.image}") repeat`);
  }

  // For backdrop-filter to work, the background must be semi-transparent
  // (not achieved via the opacity property, which hides the blur effect).
  if (hasBlur) {
    layers.push(`color-mix(in srgb, ${props.color} ${Math.round(props.opacity * 100)}%, transparent)`);
    style.backdropFilter = `blur(${blurValue})`;
    style.webkitBackdropFilter = `blur(${blurValue})`;
  } else {
    layers.push(props.color);
  }

  style.background = layers.join(", ");

  return style;
});
</script>

<template>
  <div
    class="cui-backdrop"
    :class="{ 'cui-backdrop--visible': visible }"
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
.cui-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.cui-backdrop--visible {
  opacity: var(--_backdrop-opacity, 1);
}
</style>
