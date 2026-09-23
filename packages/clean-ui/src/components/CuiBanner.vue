<script setup lang="ts">
import { ref, computed } from "vue";
import type { HideableProps, ColorableProps, LiveRegionProps, RoleIconProps } from "../types/common";
import CuiIcon from "./CuiIcon.vue";
import CuiButton from "./CuiButton.vue";
import { resolveRoleIcon } from "../utils/colorIconMap";
import { resolveLiveRegion } from "../utils/liveRegion";
import { safeGetItem, safeSetItem } from "../utils/storage";
import { useMessages } from "../composables/useMessages";

export type BannerPosition = "top" | "bottom" | "inline";
export type BannerVariant = "solid" | "subtle";

export interface CuiBannerProps extends HideableProps, ColorableProps, LiveRegionProps, RoleIconProps {
  /** Visual variant */
  variant?: BannerVariant;
  /**
   * Where the banner sits. `top` and `bottom` pin it to that page edge, sticky, with a
   * rule against the edge. `inline` puts it in the flow instead — no edge rule, a closed
   * box with a radius — for a notice inside a card or panel, where the rule has nothing
   * to sit against (#120).
   */
  position?: BannerPosition;
  /** Show dismiss button */
  dismissible?: boolean;
  /** Persist dismissal to localStorage under this key */
  storageKey?: string;
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

// Check storage for previously dismissed banners
const dismissed = ref(
  props.storageKey ? safeGetItem(`cui-banner-${props.storageKey}`) === "1" : false,
);

function dismiss() {
  dismissed.value = true;
  if (props.storageKey) {
    safeSetItem(`cui-banner-${props.storageKey}`, "1");
  }
  emit("dismiss");
}

const roleIcon = computed(() => resolveRoleIcon(props.icon, props.color));

// The dismiss button is icon-only, so it needs a name — CuiAlert already uses this key.
const messages = useMessages();

const liveAttrs = computed(() => resolveLiveRegion(props.color, props.live));

/**
 * Only the values that vary with a prop are emitted, as private `--_banner-*` properties;
 * the stylesheet reads each as `var(--cui-banner-bg, var(--_banner-bg))`, so a public
 * token set anywhere in the ancestor chain wins. Everything that does not vary is a plain
 * default in the CSS. See "Themeable Properties" in CLAUDE.md (#114, #119).
 */
const containerStyle = computed(() => {
  const c = props.color;
  const s: Record<string, string> =
    props.variant === "solid"
      ? {
          "--_banner-bg": `var(--cui-${c}-solid, var(--cui-${c}))`,
          "--_banner-color": `var(--cui-${c}-text, white)`,
          "--_banner-border-color": "transparent",
        }
      : {
          "--_banner-bg": `var(--cui-${c}-bg)`,
          "--_banner-color": `var(--cui-${c})`,
          "--_banner-border-color": `var(--cui-${c}-border)`,
        };

  return s;
});
</script>

<template>
  <div
    class="cui-banner"
    :class="[`cui-banner--${variant}`, `cui-banner--${position}`]"
    v-if="!dismissed"
    v-show="!hidden"
    :style="containerStyle"
    v-bind="liveAttrs"
  >
    <!-- Icon: the slot renders in the component's own icon position, so a replacement
         sits beside the text rather than stacking above it (#119). -->
    <span v-if="!noIcon" class="cui-banner__icon">
      <slot name="icon">
        <template v-if="roleIcon.text">{{ roleIcon.text }}</template>
        <CuiIcon v-else :name="roleIcon.name!" size="1.125rem" />
      </slot>
    </span>

    <!-- Content -->
    <div class="cui-banner__content">
      <slot />
    </div>

    <!-- Actions slot -->
    <div v-if="$slots.actions" class="cui-banner__actions">
      <slot name="actions" />
    </div>

    <!-- Dismiss -->
    <CuiButton
      v-if="dismissible"
      variant="ghost"
      size="xs"
      class="cui-banner__dismiss"
      :aria-label="messages.dismiss"
      @click="dismiss"
    >
      <CuiIcon name="x" size="0.875rem" />
    </CuiButton>
  </div>
</template>

<style scoped>
/* --- Themeable ---
   Zero specificity, so a consumer's own rule wins without `!important`. That was the
   whole of #120's complaint: the banner wrote its box inline, so restyling it in a card
   needed `!important` on every declaration. */
:where(.cui-banner) {
  background: var(--cui-banner-bg, var(--_banner-bg));
  color: var(--cui-banner-color, var(--_banner-color));
  gap: var(--cui-banner-gap, calc(0.75rem * var(--cui-density-scale, 1)));
  padding: var(
    --cui-banner-padding,
    calc(0.625rem * var(--cui-density-scale, 1)) calc(1rem * var(--cui-density-scale, 1))
  );
}

:where(.cui-banner__content) {
  font-size: var(--cui-banner-font-size, 0.875rem);
  font-weight: var(--cui-banner-font-weight, 500);
  text-align: var(--cui-banner-text-align, center);
}

/* A pinned banner draws a rule against the edge it sits on; the subtle variant is the
   only one that needs it, since solid already separates itself by fill. */
:where(.cui-banner--subtle.cui-banner--top) {
  border-bottom: var(--cui-banner-border, 1px solid var(--_banner-border-color));
}

:where(.cui-banner--subtle.cui-banner--bottom) {
  border-top: var(--cui-banner-border, 1px solid var(--_banner-border-color));
}

/* Inline: nothing to sit against, so the rule becomes a box and the corners take the
   shared radius scale — not `--cui-card-radius`, which tied a banner's corners to a
   component it may sit nowhere near (#120, #141). */
:where(.cui-banner--inline) {
  border: var(--cui-banner-border, 1px solid var(--_banner-border-color));
  border-radius: var(--cui-banner-radius, var(--cui-radius-lg, 0.5rem));
}

/* --- Structural --- */
.cui-banner {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Pinned: sticky against the named edge. The offset lives here rather than in the style
   binding so the binding has a fixed shape — a variable key means Vue has to clear the
   stale `top`/`bottom` when `position` flips. */
.cui-banner--top,
.cui-banner--bottom {
  position: sticky;
  left: 0;
  right: 0;
  z-index: 50;
}

.cui-banner--top {
  top: 0;
}

.cui-banner--bottom {
  bottom: 0;
}

.cui-banner__icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.cui-banner__content {
  flex: 1;
}

.cui-banner__actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: calc(0.5rem * var(--cui-density-scale, 1));
}

.cui-banner__dismiss {
  flex-shrink: 0;
  color: currentColor;
  opacity: 0.7;
}
</style>
