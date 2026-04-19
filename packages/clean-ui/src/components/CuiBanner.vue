<script setup lang="ts">
import { ref, computed } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiButton from "./CuiButton.vue";
import { COLOR_ICON_MAP } from "../utils/colorIconMap";

export type BannerPosition = "top" | "bottom";
export type BannerVariant = "solid" | "subtle";

export interface CuiBannerProps {
  /** Color role */
  color?: ButtonColor;
  /** Visual variant */
  variant?: BannerVariant;
  /** Sticky position */
  position?: BannerPosition;
  /** Show dismiss button */
  dismissible?: boolean;
  /** Hide the default role icon */
  noIcon?: boolean;
  /** Persist dismissal to localStorage under this key */
  storageKey?: string;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiBannerProps>(), {
  color: "primary",
  variant: "subtle",
  position: "top",
  dismissible: true,
  noIcon: false,
  hidden: false,
});

const emit = defineEmits<{
  dismiss: [];
}>();

// Check localStorage for previously dismissed banners
const dismissed = ref(
  props.storageKey ? localStorage.getItem(`cui-banner-${props.storageKey}`) === "1" : false,
);

function dismiss() {
  dismissed.value = true;
  if (props.storageKey) {
    localStorage.setItem(`cui-banner-${props.storageKey}`, "1");
  }
  emit("dismiss");
}

const iconName = computed(() => COLOR_ICON_MAP[props.color] ?? "info");

const containerStyle = computed(() => {
  const s: Record<string, string> = {
    position: "sticky",
    left: "0",
    right: "0",
    zIndex: "50",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    padding: "0.625rem 1rem",
  };

  s[props.position] = "0";

  if (props.variant === "solid") {
    s.background = `var(--cui-${props.color}-solid, var(--cui-${props.color}))`;
    s.color = `var(--cui-${props.color}-text, white)`;
  } else {
    s.background = `var(--cui-${props.color}-bg)`;
    s.color = `var(--cui-${props.color})`;
    s.borderBottom = props.position === "top" ? `1px solid var(--cui-${props.color}-border)` : "none";
    s.borderTop = props.position === "bottom" ? `1px solid var(--cui-${props.color}-border)` : "none";
  }

  return s;
});
</script>

<template>
  <div v-if="!dismissed" v-show="!hidden" :style="containerStyle" role="alert">
    <!-- Icon -->
    <CuiIcon v-if="!noIcon" :name="iconName" size="1.125rem" style="flex-shrink: 0;" />

    <!-- Content -->
    <div style="flex: 1; font-size: 0.875rem; font-weight: 500; text-align: center;">
      <slot />
    </div>

    <!-- Actions slot -->
    <div v-if="$slots.actions" style="flex-shrink: 0; display: flex; align-items: center; gap: 0.5rem;">
      <slot name="actions" />
    </div>

    <!-- Dismiss -->
    <CuiButton
      v-if="dismissible"
      variant="ghost"
      size="xs"
      style="flex-shrink: 0; color: currentColor; opacity: 0.7;"
      @click="dismiss"
    >
      <CuiIcon name="x" size="0.875rem" />
    </CuiButton>
  </div>
</template>
