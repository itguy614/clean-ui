<script setup lang="ts">
import { computed } from "vue";
import type { HideableProps, SizeableProps } from "../types/common";
import { clampSize, scaleDensity } from "../utils/sizing";
import { useScrollArea } from "../composables/useScrollArea";
import { useMessages } from "../composables/useMessages";
import CuiCopyButton from "./CuiCopyButton.vue";

const SUPPORTED_SIZES = ["sm", "md", "lg"] as const;

export interface CuiCodeBlockProps extends HideableProps, SizeableProps {
  /** Code content */
  code: string;
  /** Language label (displayed in header) */
  language?: string;
  /** File name (displayed in header, overrides language) */
  filename?: string;
  /** Show line numbers */
  lineNumbers?: boolean;
  /** Starting line number */
  startLine?: number;
  /** Highlight specific line numbers */
  highlightLines?: number[];
  /** Show copy button */
  copyable?: boolean;
  /** Max height before scrolling */
  maxHeight?: string;
  /**
   * The code region's accessible name while the block scrolls. Defaults to "Scrollable code"
   * (`codeBlock.region`).
   */
  ariaLabel?: string;
}

const props = withDefaults(defineProps<CuiCodeBlockProps>(), {
  lineNumbers: false,
  startLine: 1,
  copyable: true,
  size: "md",
  hidden: false,
});

const lines = computed(() => props.code.split("\n"));

const sizeConfig: Record<(typeof SUPPORTED_SIZES)[number], { fontSize: string; lineHeight: string; padding: string; headerFont: string }> = {
  sm: { fontSize: "0.75rem", lineHeight: "1.6", padding: scaleDensity("0.75rem"), headerFont: "0.6875rem" },
  md: { fontSize: "0.8125rem", lineHeight: "1.65", padding: scaleDensity("1rem"), headerFont: "0.75rem" },
  lg: { fontSize: "0.875rem", lineHeight: "1.7", padding: scaleDensity("1.25rem"), headerFont: "0.8125rem" },
};
const cfg = computed(() => sizeConfig[clampSize(props.size, SUPPORTED_SIZES)]);

const headerLabel = computed(() => props.filename || props.language || "");

const highlightSet = computed(() => new Set(props.highlightLines ?? []));

// The <pre> is the scroller (#163): while the code overflows it is a named, focusable region
// (so a keyboard can scroll it, WCAG 2.1.1), and while it fits it is neither, adding no tab stop.
const messages = useMessages();
const area = useScrollArea({
  orientation: "both",
  fade: "none",
  ariaLabel: () => props.ariaLabel ?? messages.value.codeBlock.region,
});
</script>

<template>
  <div
    class="cui-code-block"
    v-show="!hidden"
    :style="{
      borderRadius: '0.5rem',
      overflow: 'hidden',
      border: '1px solid var(--cui-border)',
      background: 'var(--color-surface-950, #1a1a2e)',
    }"
  >
    <!-- Header -->
    <div
      v-if="headerLabel || copyable"
      :style="{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `calc(0.375rem * var(--cui-density-scale, 1)) ${cfg.padding}`,
        background: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }"
    >
      <span
        v-if="headerLabel"
        :style="{
          fontSize: cfg.headerFont,
          fontWeight: '500',
          color: 'var(--color-surface-400, #999)',
          fontFamily: 'var(--cui-font-mono, monospace)',
          textTransform: language && !filename ? 'uppercase' : 'none',
          letterSpacing: language && !filename ? '0.04em' : 'normal',
        }"
      >
        {{ headerLabel }}
      </span>
      <span v-else />
      <CuiCopyButton
        v-if="copyable"
        :value="code"
        size="xs"
        variant="ghost"
        :style="{ color: 'var(--color-surface-400, #999)' }"
      />
    </div>

    <!-- Code area: the <pre> scrolls. The gutter is decoration, hidden from assistive tech, so a
         screen reader reads the code and not "one const two x". -->
    <pre
      :ref="area.setScroller"
      class="cui-code-block__pre"
      v-bind="area.scrollerAttrs.value"
      :style="{
        display: 'flex',
        margin: '0',
        overflow: 'auto',
        maxHeight: maxHeight || undefined,
        padding: `${cfg.padding} 0`,
        background: 'transparent',
        font: 'inherit',
      }"
    >
      <!-- Line numbers -->
      <span
        v-if="lineNumbers"
        class="cui-code-block__gutter"
        aria-hidden="true"
        :style="{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          paddingRight: 'calc(0.75rem * var(--cui-density-scale, 1))',
          paddingLeft: cfg.padding,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          marginRight: 'calc(0.75rem * var(--cui-density-scale, 1))',
          userSelect: 'none',
          flexShrink: '0',
        }"
      >
        <span
          v-for="(_, i) in lines"
          :key="i"
          :style="{
            fontSize: cfg.fontSize,
            lineHeight: cfg.lineHeight,
            fontFamily: 'var(--cui-font-mono, monospace)',
            color: highlightSet.has(startLine + i)
              ? 'var(--color-surface-200, #ccc)'
              : 'var(--color-surface-600, #555)',
            minWidth: `${String(startLine + lines.length - 1).length}ch`,
          }"
        >{{ startLine + i }}</span>
      </span>

      <!-- Code content -->
      <code
        class="cui-code-block__code"
        :style="{
          display: 'block',
          flex: '1 0 auto',
          background: 'transparent',
          font: 'inherit',
          color: 'inherit',
          padding: `0 ${cfg.padding} 0 ${lineNumbers ? '0' : cfg.padding}`,
        }"
      >
        <span
          v-for="(line, i) in lines"
          :key="i"
          :style="{
            display: 'block',
            fontSize: cfg.fontSize,
            lineHeight: cfg.lineHeight,
            fontFamily: 'var(--cui-font-mono, monospace)',
            color: 'var(--color-surface-200, #e0e0e0)',
            whiteSpace: 'pre',
            background: highlightSet.has(startLine + i)
              ? 'rgba(255,255,255,0.06)'
              : 'transparent',
            marginLeft: highlightSet.has(startLine + i) ? 'calc(-0.5rem * var(--cui-density-scale, 1))' : '0',
            marginRight: highlightSet.has(startLine + i) ? 'calc(-0.5rem * var(--cui-density-scale, 1))' : '0',
            paddingLeft: highlightSet.has(startLine + i) ? 'calc(0.5rem * var(--cui-density-scale, 1))' : '0',
            paddingRight: highlightSet.has(startLine + i) ? 'calc(0.5rem * var(--cui-density-scale, 1))' : '0',
            borderLeft: highlightSet.has(startLine + i)
              ? '2px solid var(--cui-primary)'
              : '2px solid transparent',
            borderRadius: '2px',
          }"
        >{{ line || " " }}</span>
      </code>
    </pre>
  </div>
</template>

<style scoped>
/* The ring sits inside the block: the root clips (overflow: hidden), so an outer one is cut. */
:where(.cui-code-block__pre:focus-visible) {
  outline: 2px solid var(--cui-code-block-focus-ring, var(--cui-primary-focus-ring));
  outline-offset: -2px;
}
</style>
