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

const sizeConfig: Record<(typeof SUPPORTED_SIZES)[number], { text: string; leading: string; inset: string; header: string }> = {
  sm: { text: "0.75rem", leading: "1.6", inset: scaleDensity("0.75rem"), header: "0.6875rem" },
  md: { text: "0.8125rem", leading: "1.65", inset: scaleDensity("1rem"), header: "0.75rem" },
  lg: { text: "0.875rem", leading: "1.7", inset: scaleDensity("1.25rem"), header: "0.8125rem" },
};
const cfg = computed(() => sizeConfig[clampSize(props.size, SUPPORTED_SIZES)]);

// The size preset reaches the stylesheet as private properties, which it reads back through
// the public `--cui-code-block-*` tokens (CLAUDE.md, "Themeable Properties").
const rootVars = computed(() => ({
  "--_code-block-px": cfg.value.inset,
  "--_code-block-py": cfg.value.inset,
  "--_code-block-font-size": cfg.value.text,
  "--_code-block-line-height": cfg.value.leading,
  "--_code-block-header-font-size": cfg.value.header,
}));

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
  <div class="cui-code-block" v-show="!hidden" :style="rootVars">
    <!-- Header -->
    <div v-if="headerLabel || copyable" class="cui-code-block__header">
      <span
        v-if="headerLabel"
        class="cui-code-block__title"
        :class="{ 'cui-code-block__title--language': language && !filename }"
      >
        {{ headerLabel }}
      </span>
      <span v-else />
      <CuiCopyButton v-if="copyable" class="cui-code-block__copy" :value="code" size="xs" variant="ghost" />
    </div>

    <!-- Code area: the <pre> scrolls. The gutter is decoration, hidden from assistive tech, so a
         screen reader reads the code and not "one const two x". -->
    <pre
      :ref="area.setScroller"
      class="cui-code-block__pre"
      v-bind="area.scrollerAttrs.value"
      :style="{ maxHeight: maxHeight || undefined }"
    >
      <!-- Line numbers -->
      <span v-if="lineNumbers" class="cui-code-block__gutter" aria-hidden="true">
        <span
          v-for="(_, i) in lines"
          :key="i"
          class="cui-code-block__number"
          :class="{ 'cui-code-block__number--highlight': highlightSet.has(startLine + i) }"
          :style="{ minWidth: `${String(startLine + lines.length - 1).length}ch` }"
        >{{ startLine + i }}</span>
      </span>

      <!-- Code content. No whitespace between <code> and its lines: inside a <pre> it would
           render as blank lines. Each line ends in a real newline, so the text copies and
           reads as source whatever the browser does between blocks. -->
      <code class="cui-code-block__code" :class="{ 'cui-code-block__code--numbered': lineNumbers }"><span
          v-for="(line, i) in lines"
          :key="i"
          class="cui-code-block__line"
          :class="{ 'cui-code-block__line--highlight': highlightSet.has(startLine + i) }"
        >{{ line || " " }}{{ i < lines.length - 1 ? "\n" : "" }}</span></code>
    </pre>
  </div>
</template>

<style scoped>
/*
 * Every themeable rule is a whole :where(), so a consumer's plain `.cui-code-block { … }` at
 * (0,1,0) wins without !important; structure (display, overflow, white-space) keeps normal
 * specificity. The block is a dark panel in light and dark mode alike, so its colours read
 * the surface scale and fixed white tints rather than the mode-swapping semantic slots.
 */
.cui-code-block {
  overflow: hidden;
}
/* The mono face is structural, at normal specificity: `.cui-typography * { font-family }` is
   (0,1,0), and a consumer who wants another face sets --cui-font-mono. */
.cui-code-block__title,
.cui-code-block__number,
.cui-code-block__line {
  font-family: var(--cui-font-mono, monospace);
}
:where(.cui-code-block) {
  border-radius: var(--cui-code-block-radius, 0.5rem);
  border: 1px solid var(--cui-code-block-border, var(--cui-border));
  background: var(--cui-code-block-bg, var(--color-surface-950, #1a1a2e));
}

.cui-code-block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
:where(.cui-code-block__header) {
  padding: calc(0.375rem * var(--cui-density-scale, 1)) var(--cui-code-block-px, var(--_code-block-px));
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

:where(.cui-code-block__title) {
  font-size: var(--_code-block-header-font-size);
  font-weight: 500;
  color: var(--color-surface-400, #999);
  text-transform: none;
  letter-spacing: normal;
}
:where(.cui-code-block__title--language) {
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
:where(.cui-code-block__copy) {
  color: var(--color-surface-400, #999);
}

.cui-code-block__pre {
  display: flex;
  margin: 0;
  overflow: auto;
  font: inherit;
}
:where(.cui-code-block__pre) {
  padding: var(--cui-code-block-py, var(--_code-block-py)) 0;
  background: transparent;
}
/* The ring sits inside the block: the root clips (overflow: hidden), so an outer one is cut. */
:where(.cui-code-block__pre:focus-visible) {
  outline: 2px solid var(--cui-code-block-focus-ring, var(--cui-primary-focus-ring));
  outline-offset: -2px;
}

.cui-code-block__gutter {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  user-select: none;
  flex-shrink: 0;
}
:where(.cui-code-block__gutter) {
  padding-right: calc(0.75rem * var(--cui-density-scale, 1));
  padding-left: var(--cui-code-block-px, var(--_code-block-px));
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  margin-right: calc(0.75rem * var(--cui-density-scale, 1));
}
:where(.cui-code-block__number) {
  font-size: var(--cui-code-block-font-size, var(--_code-block-font-size));
  line-height: var(--_code-block-line-height);
  color: var(--color-surface-600, #555);
}
:where(.cui-code-block__number--highlight) {
  color: var(--color-surface-200, #ccc);
}

.cui-code-block__code {
  display: block;
  flex: 1 0 auto;
  font: inherit;
}
:where(.cui-code-block__code) {
  background: transparent;
  color: inherit;
  padding: 0 var(--cui-code-block-px, var(--_code-block-px));
}
:where(.cui-code-block__code--numbered) {
  padding-left: 0;
}

.cui-code-block__line {
  display: block;
  white-space: pre;
}
:where(.cui-code-block__line) {
  font-size: var(--cui-code-block-font-size, var(--_code-block-font-size));
  line-height: var(--_code-block-line-height);
  color: var(--cui-code-block-color, var(--color-surface-200, #e0e0e0));
  background: transparent;
  border-left: 2px solid transparent;
  border-radius: 2px;
}
/* A highlighted line bleeds past the code's padding, so its tint reaches the gutter. */
:where(.cui-code-block__line--highlight) {
  background: rgba(255, 255, 255, 0.06);
  margin-inline: calc(-0.5rem * var(--cui-density-scale, 1));
  padding-inline: calc(0.5rem * var(--cui-density-scale, 1));
  border-left: 2px solid var(--cui-primary);
}
</style>
