<script setup lang="ts">
import { computed } from "vue";
import type { CuiColor, CuiSize, HideableProps, ColorableProps, SizeableProps } from "../types/common";
import { clampSize } from "../utils/sizing";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiTooltip from "./CuiTooltip.vue";
import { useCopyToClipboard } from "../composables/useCopyToClipboard";

const SUPPORTED_SIZES = ["xs", "sm", "md"] as const;

export interface CuiCopyButtonProps extends HideableProps, ColorableProps, SizeableProps {
  /** Text to copy to clipboard */
  value: string;
  /** Button variant */
  variant?: "ghost" | "outline";
  /** Tooltip text before copy */
  tooltip?: string;
  /** Tooltip text after copy */
  copiedTooltip?: string;
  /** Time in ms before the "copied" state resets */
  resetDelay?: number;
  /** Show text label alongside the icon */
  showLabel?: boolean;
}

const props = withDefaults(defineProps<CuiCopyButtonProps>(), {
  size: "sm",
  color: "primary",
  variant: "ghost",
  tooltip: "Copy",
  copiedTooltip: "Copied!",
  resetDelay: 2000,
  showLabel: false,
  hidden: false,
});

const { copied, copy } = useCopyToClipboard(props.resetDelay);

function onClick() {
  copy(props.value);
}

const iconSize: Record<(typeof SUPPORTED_SIZES)[number], string> = {
  xs: "0.75rem",
  sm: "0.875rem",
  md: "1rem",
};

const clampedSize = computed(() => clampSize(props.size, SUPPORTED_SIZES));
</script>

<template>
  <CuiTooltip v-show="!hidden" :text="copied ? copiedTooltip : tooltip" placement="top" :show-delay="300">
    <CuiButton
      :size="size"
      :variant="variant"
      :color="copied ? 'success' : color"
      @click="onClick"
    >
      <template #prefix>
        <CuiIcon
          :name="copied ? 'check' : 'copy'"
          :size="iconSize[clampedSize]"
          :style="{ transition: 'transform 0.15s ease', transform: copied ? 'scale(1.1)' : 'scale(1)' }"
        />
      </template>
      <span v-if="showLabel">{{ copied ? "Copied" : "Copy" }}</span>
    </CuiButton>
  </CuiTooltip>
</template>
