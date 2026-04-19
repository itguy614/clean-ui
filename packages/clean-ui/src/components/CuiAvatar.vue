<script setup lang="ts">
import { computed, ref } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "rounded";
export type AvatarStatus = "online" | "offline" | "away" | "busy";

export type AvatarStatusAnimation = "pulse" | "ping" | "none";

export interface CuiAvatarProps {
  /** Image URL */
  src?: string;
  /** Alt text for image */
  alt?: string;
  /** Full name — auto-generates initials */
  name?: string;
  /** Explicit initials (overrides name) */
  initials?: string;
  /** Fallback icon name when no image or initials */
  icon?: string;
  /** Size */
  size?: AvatarSize;
  /** Shape */
  shape?: AvatarShape;
  /** Color role for initials/icon background */
  color?: ButtonColor;
  /** Animate the status indicator */
  statusAnimation?: AvatarStatusAnimation;
  /** Status indicator dot */
  status?: AvatarStatus;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiAvatarProps>(), {
  size: "md",
  shape: "circle",
  color: "primary",
  hidden: false,
});

const imgError = ref(false);

const showImage = computed(() => props.src && !imgError.value);

const computedInitials = computed(() => {
  if (props.initials) return props.initials;
  if (props.name) {
    return props.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  }
  return "";
});

const sizeConfig: Record<AvatarSize, { box: string; font: string; icon: string; statusDot: string; statusOffset: string }> = {
  xs: { box: "1.5rem", font: "0.5rem", icon: "0.75rem", statusDot: "0.5rem", statusOffset: "-2px" },
  sm: { box: "2rem", font: "0.625rem", icon: "0.875rem", statusDot: "0.625rem", statusOffset: "-2px" },
  md: { box: "2.5rem", font: "0.75rem", icon: "1rem", statusDot: "0.625rem", statusOffset: "-1px" },
  lg: { box: "3.5rem", font: "1rem", icon: "1.25rem", statusDot: "0.75rem", statusOffset: "0px" },
  xl: { box: "5rem", font: "1.375rem", icon: "1.75rem", statusDot: "1rem", statusOffset: "2px" },
};

const cfg = computed(() => sizeConfig[props.size]);

const containerStyle = computed(() => ({
  width: cfg.value.box,
  height: cfg.value.box,
  borderRadius: props.shape === "circle" ? "50%" : "20%",
  fontSize: cfg.value.font,
  background: showImage.value ? "transparent" : `var(--cui-${props.color}-bg)`,
  color: showImage.value ? "transparent" : `var(--cui-${props.color})`,
}));

const statusColors: Record<AvatarStatus, string> = {
  online: "var(--cui-success)",
  offline: "var(--cui-text-tertiary, #999)",
  away: "var(--cui-warning)",
  busy: "var(--cui-error)",
};

const statusStyle = computed(() => {
  if (!props.status) return {};
  const s: Record<string, string> = {
    width: cfg.value.statusDot,
    height: cfg.value.statusDot,
    background: statusColors[props.status],
    border: "2px solid var(--cui-surface-base, white)",
    borderRadius: "50%",
    position: "absolute",
    bottom: cfg.value.statusOffset,
    right: cfg.value.statusOffset,
  };
  if (props.statusAnimation === "pulse") {
    s.animation = "cui-pulse 2s ease-in-out infinite";
  }
  return s;
});

const pingStyle = computed(() => {
  if (!props.status || props.statusAnimation !== "ping") return undefined;
  return {
    width: cfg.value.statusDot,
    height: cfg.value.statusDot,
    background: statusColors[props.status],
    borderRadius: "50%",
    position: "absolute" as const,
    bottom: cfg.value.statusOffset,
    right: cfg.value.statusOffset,
    opacity: "0.75",
    animation: "cui-avatar-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
  };
});
</script>

<template>
  <div
    v-show="!hidden"
    class="cui-avatar"
    :style="containerStyle"
  >
    <!-- Image -->
    <img
      v-if="showImage"
      :src="src"
      :alt="alt || name || 'Avatar'"
      class="cui-avatar__img"
      :style="{ borderRadius: shape === 'circle' ? '50%' : '20%' }"
      @error="imgError = true"
    />

    <!-- Initials fallback -->
    <span v-else-if="computedInitials" class="cui-avatar__initials">
      {{ computedInitials }}
    </span>

    <!-- Icon fallback -->
    <CuiIcon v-else :name="icon || 'user'" :size="cfg.icon" />

    <!-- Status ping ring (expanding ring behind the dot) -->
    <span v-if="pingStyle" :style="pingStyle" />
    <!-- Status dot -->
    <span v-if="status" :style="statusStyle" />
  </div>
</template>

<style>
.cui-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  font-weight: 600;
  user-select: none;
  vertical-align: middle;
}

.cui-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cui-avatar__initials {
  line-height: 1;
  letter-spacing: 0.02em;
}

@keyframes cui-avatar-ping {
  0% { transform: scale(1); opacity: 0.75; }
  75%, 100% { transform: scale(2.5); opacity: 0; }
}
</style>
