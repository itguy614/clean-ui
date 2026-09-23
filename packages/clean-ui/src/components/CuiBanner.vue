<script setup lang="ts">
import { ref, computed } from "vue";
import type { HideableProps, ColorableProps, LiveRegionProps } from "../types/common";
import CuiIcon from "./CuiIcon.vue";
import CuiButton from "./CuiButton.vue";
import { COLOR_ICON_MAP, isIconName } from "../utils/colorIconMap";
import { resolveLiveRegion } from "../utils/liveRegion";
import { safeGetItem, safeSetItem } from "../utils/storage";
import { useMessages } from "../composables/useMessages";

export type BannerPosition = "top" | "bottom";
export type BannerVariant = "solid" | "subtle";

export interface CuiBannerProps extends HideableProps, ColorableProps, LiveRegionProps {
  /** Visual variant */
  variant?: BannerVariant;
  /** Sticky position */
  position?: BannerPosition;
  /** Show dismiss button */
  dismissible?: boolean;
  /** Hide the role icon entirely */
  noIcon?: boolean;
  /**
   * Replace the role icon. A registered icon name renders that icon; anything else — an
   * emoji, a character — renders as text. For arbitrary content use the `#icon` slot.
   */
  icon?: string;
  /**
   * Render in the flow rather than pinned to a page edge: no edge border, a radius, and
   * `position` no longer applies. For a notice inside a card or panel, where the edge
   * border has nothing to sit against (#120).
   */
  inline?: boolean;
  /** Persist dismissal to localStorage under this key */
  storageKey?: string;
}

const props = withDefaults(defineProps<CuiBannerProps>(), {
  color: "primary",
  variant: "subtle",
  position: "top",
  dismissible: true,
  noIcon: false,
  inline: false,
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

const iconName = computed(() => (isIconName(props.icon) ? props.icon : (COLOR_ICON_MAP[props.color] ?? "info")));
/** A non-registered `icon` is literal content — an emoji or a character. */
const iconText = computed(() => (props.icon && !isIconName(props.icon) ? props.icon : null));

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

  // Pinned to whichever edge it names. Ignored when inline, which takes the banner out of
  // the sticky flow entirely.
  if (!props.inline) s[props.position] = "0";
  return s;
});
</script>

<template>
  <div
    class="cui-banner"
    :class="[`cui-banner--${variant}`, { 'cui-banner--inline': inline, [`cui-banner--${position}`]: !inline }]"
    v-if="!dismissed"
    v-show="!hidden"
    :style="containerStyle"
    v-bind="liveAttrs"
  >
    <!-- Icon: the slot renders in the component's own icon position, so a replacement
         sits beside the text rather than stacking above it (#119). -->
    <span v-if="!noIcon" class="cui-banner__icon">
      <slot name="icon">
        <template v-if="iconText">{{ iconText }}</template>
        <CuiIcon v-else :name="iconName" size="1.125rem" />
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

/* Inline: nothing to sit against, so the rule becomes a box and the corners round to
   match whatever card or panel holds it (#120). */
:where(.cui-banner--inline) {
  border: var(--cui-banner-border, 1px solid var(--_banner-border-color));
  border-radius: var(--cui-banner-radius, var(--cui-card-radius, 0.5rem));
}

/* --- Structural --- */
.cui-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  position: sticky;
  left: 0;
  right: 0;
  z-index: 50;
}

.cui-banner--inline {
  position: static;
  z-index: auto;
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
