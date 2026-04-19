<script setup lang="ts">
import { computed } from "vue";
import CuiCopyButton from "./CuiCopyButton.vue";

export type CodeBlockSize = "sm" | "md" | "lg";

export interface CuiCodeBlockProps {
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
  /** Size */
  size?: CodeBlockSize;
  /** Hidden */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiCodeBlockProps>(), {
  lineNumbers: false,
  startLine: 1,
  copyable: true,
  size: "md",
  hidden: false,
});

const lines = computed(() => props.code.split("\n"));

const sizeConfig: Record<CodeBlockSize, { fontSize: string; lineHeight: string; padding: string; headerFont: string }> = {
  sm: { fontSize: "0.75rem", lineHeight: "1.6", padding: "0.75rem", headerFont: "0.6875rem" },
  md: { fontSize: "0.8125rem", lineHeight: "1.65", padding: "1rem", headerFont: "0.75rem" },
  lg: { fontSize: "0.875rem", lineHeight: "1.7", padding: "1.25rem", headerFont: "0.8125rem" },
};
const cfg = computed(() => sizeConfig[props.size]);

const headerLabel = computed(() => props.filename || props.language || "");

const highlightSet = computed(() => new Set(props.highlightLines ?? []));
</script>

<template>
  <div
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
        padding: `0.375rem ${cfg.padding}`,
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

    <!-- Code area -->
    <div
      :style="{
        overflow: 'auto',
        maxHeight: maxHeight || undefined,
      }"
    >
      <div
        :style="{
          display: 'flex',
          padding: `${cfg.padding} 0`,
          minWidth: 'fit-content',
        }"
      >
        <!-- Line numbers -->
        <div
          v-if="lineNumbers"
          :style="{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            paddingRight: '0.75rem',
            paddingLeft: cfg.padding,
            borderRight: '1px solid rgba(255,255,255,0.06)',
            marginRight: '0.75rem',
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
          >
            {{ startLine + i }}
          </span>
        </div>

        <!-- Code content -->
        <div :style="{ flex: '1', paddingRight: cfg.padding, paddingLeft: lineNumbers ? '0' : cfg.padding }">
          <div
            v-for="(line, i) in lines"
            :key="i"
            :style="{
              fontSize: cfg.fontSize,
              lineHeight: cfg.lineHeight,
              fontFamily: 'var(--cui-font-mono, monospace)',
              color: 'var(--color-surface-200, #e0e0e0)',
              whiteSpace: 'pre',
              background: highlightSet.has(startLine + i)
                ? 'rgba(255,255,255,0.06)'
                : 'transparent',
              marginLeft: highlightSet.has(startLine + i) ? '-0.5rem' : '0',
              marginRight: highlightSet.has(startLine + i) ? '-0.5rem' : '0',
              paddingLeft: highlightSet.has(startLine + i) ? '0.5rem' : '0',
              paddingRight: highlightSet.has(startLine + i) ? '0.5rem' : '0',
              borderLeft: highlightSet.has(startLine + i)
                ? '2px solid var(--cui-primary)'
                : '2px solid transparent',
              borderRadius: '2px',
            }"
          >{{ line || " " }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
