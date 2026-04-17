<script setup lang="ts">
import { provide, toRef, computed } from "vue";
import CuiToast from "./CuiToast.vue";
import {
  ToastContextKey,
  createToastState,
  type ToastPosition,
  type ToastStackMode,
} from "./toast-context";

export interface CuiToastProviderProps {
  /** Position of the toast container */
  position?: ToastPosition;
  /** Stack mode: expanded (all visible) or collapsed (peek) */
  stackMode?: ToastStackMode;
  /** Maximum visible toasts */
  maxToasts?: number;
}

const props = withDefaults(defineProps<CuiToastProviderProps>(), {
  position: "bottom-center",
  stackMode: "expanded",
  maxToasts: 5,
});

const state = createToastState(
  toRef(props, "position"),
  toRef(props, "stackMode"),
  toRef(props, "maxToasts"),
);

provide(ToastContextKey, state);

// Position CSS
const containerStyle = computed(() => {
  const p = props.position;
  const style: Record<string, string> = {
    position: "fixed",
    zIndex: "9998",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "1rem",
    pointerEvents: "none",
    maxHeight: "100vh",
    overflow: "hidden",
  };

  if (p.includes("top")) {
    style.top = "0";
  } else {
    style.bottom = "0";
    style.flexDirection = "column-reverse";
  }

  if (p.includes("left")) {
    style.left = "0";
    style.alignItems = "flex-start";
  } else if (p.includes("right")) {
    style.right = "0";
    style.alignItems = "flex-end";
  } else {
    style.left = "50%";
    style.transform = "translateX(-50%)";
    style.alignItems = "center";
  }

  return style;
});

// Slide direction based on position
const slideFrom = computed(() => {
  const p = props.position;
  if (p.includes("left")) return "left";
  if (p.includes("right")) return "right";
  if (p.includes("top")) return "top";
  return "bottom";
});

// Collapsed mode: only show first toast fully, others peek
const visibleToasts = computed(() => {
  if (props.stackMode === "collapsed" && state.toasts.value.length > 1) {
    return state.toasts.value.map((t, i) => ({
      ...t,
      _collapsed: i < state.toasts.value.length - 1,
      _stackIndex: state.toasts.value.length - 1 - i,
    }));
  }
  return state.toasts.value.map((t) => ({ ...t, _collapsed: false, _stackIndex: 0 }));
});
</script>

<template>
  <!-- App content -->
  <slot />

  <!-- Toast container -->
  <Teleport to="body">
    <div :style="containerStyle" class="cui-toast-container">
      <div
        v-for="(toast, index) in visibleToasts"
        :key="toast.id"
        class="cui-toast-wrapper"
        :class="[
          `cui-toast-wrapper--slide-${slideFrom}`,
          { 'cui-toast-wrapper--collapsed': toast._collapsed },
        ]"
        :style="{
          pointerEvents: 'auto',
          ...(toast._collapsed ? {
            transform: `scale(${1 - toast._stackIndex * 0.05}) translateY(${toast._stackIndex * -8}px)`,
            opacity: String(Math.max(0.4, 1 - toast._stackIndex * 0.2)),
            maxHeight: '3rem',
            overflow: 'hidden',
          } : {}),
        }"
        @click="toast._collapsed ? state.dismiss(toast.id) : undefined"
      >
        <CuiToast
          :toast-id="toast.id"
          :title="toast.title"
          :description="toast.description"
          :color="toast.color"
          :variant="toast.variant"
          :dismissible="toast.dismissible"
          :auto-dismiss="toast.autoDismiss"
          :show-progress="toast.showProgress"
          :animation="toast.animation"
          :icon="toast.icon"
          :no-icon="toast.noIcon"
          :active="index === visibleToasts.length - 1"
          @dismiss="state.dismiss(toast.id)"
        />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.cui-toast-wrapper {
  animation: cui-toast-enter 0.3s ease;
  transition: transform 0.3s ease, opacity 0.3s ease, max-height 0.3s ease;
}

.cui-toast-wrapper--collapsed {
  cursor: pointer;
}

/* Slide animations based on position */
@keyframes cui-toast-enter {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cui-toast-wrapper--slide-top {
  animation-name: cui-toast-slide-top;
}

@keyframes cui-toast-slide-top {
  from {
    opacity: 0;
    transform: translateY(-1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cui-toast-wrapper--slide-left {
  animation-name: cui-toast-slide-left;
}

@keyframes cui-toast-slide-left {
  from {
    opacity: 0;
    transform: translateX(-2rem);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.cui-toast-wrapper--slide-right {
  animation-name: cui-toast-slide-right;
}

@keyframes cui-toast-slide-right {
  from {
    opacity: 0;
    transform: translateX(2rem);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.cui-toast-wrapper--slide-bottom {
  animation-name: cui-toast-slide-bottom;
}

@keyframes cui-toast-slide-bottom {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
