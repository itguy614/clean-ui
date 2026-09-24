<script setup lang="ts">
import { CuiFlex, CuiKbd, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/kbd";
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiKbd>⌘</CuiKbd>
<CuiKbd>⇧</CuiKbd>
<CuiKbd>Esc</CuiKbd>
<CuiKbd>Space</CuiKbd>`"
      >
        <CuiFlex gap="2" class="items-center flex-wrap">
          <CuiKbd>⌘</CuiKbd>
          <CuiKbd>⇧</CuiKbd>
          <CuiKbd>⌥</CuiKbd>
          <CuiKbd>⌃</CuiKbd>
          <CuiKbd>⏎</CuiKbd>
          <CuiKbd>⌫</CuiKbd>
          <CuiKbd>⇥</CuiKbd>
          <CuiKbd>Esc</CuiKbd>
          <CuiKbd>Space</CuiKbd>
        </CuiFlex>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        Renders a native <code>&lt;kbd&gt;</code>, so the key is announced as user input
        rather than as ordinary prose, and the element carries no role or focus behaviour
        of its own — it is a label, not a control.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          Glyph-only keys are the risk here. <code>⌘</code>, <code>⇧</code> and
          <code>⌫</code> are read out inconsistently — often as “place of interest sign”,
          or not at all. Where the shortcut matters, spell it in the surrounding sentence
          (“Press Command-K”) or give the container an <code>aria-label</code> and hide the
          keycaps with <code>aria-hidden="true"</code>.
        </li>
        <li>
          One <code>&lt;kbd&gt;</code> per key. Nesting them, or putting a whole combination
          in one, loses the structure that makes “Ctrl then Alt then Del” readable.
        </li>
        <li>
          The separator between keys (<code>+</code>) is decoration — keep it outside the
          <code>&lt;kbd&gt;</code> so it is not announced as part of a key name.
        </li>
      </ul>
    </template>

    <template #examples>

      <!-- Key combinations -->
      <Example title="Key Combinations" :code="`<CuiKbd>⌘</CuiKbd> + <CuiKbd>C</CuiKbd>`">
        <CuiStack spacing="3">
          <CuiFlex gap="1" class="items-center">
            <CuiKbd>⌘</CuiKbd><span style="color: var(--cui-text-tertiary); font-size: 0.75rem;">+</span><CuiKbd>C</CuiKbd>
            <span class="text-sm" style="color: var(--cui-text-secondary); margin-left: 0.5rem;">Copy</span>
          </CuiFlex>
          <CuiFlex gap="1" class="items-center">
            <CuiKbd>⌘</CuiKbd><span style="color: var(--cui-text-tertiary); font-size: 0.75rem;">+</span><CuiKbd>V</CuiKbd>
            <span class="text-sm" style="color: var(--cui-text-secondary); margin-left: 0.5rem;">Paste</span>
          </CuiFlex>
          <CuiFlex gap="1" class="items-center">
            <CuiKbd>⌘</CuiKbd><span style="color: var(--cui-text-tertiary); font-size: 0.75rem;">+</span><CuiKbd>⇧</CuiKbd><span style="color: var(--cui-text-tertiary); font-size: 0.75rem;">+</span><CuiKbd>P</CuiKbd>
            <span class="text-sm" style="color: var(--cui-text-secondary); margin-left: 0.5rem;">Command Palette</span>
          </CuiFlex>
          <CuiFlex gap="1" class="items-center">
            <CuiKbd>Ctrl</CuiKbd><span style="color: var(--cui-text-tertiary); font-size: 0.75rem;">+</span><CuiKbd>Alt</CuiKbd><span style="color: var(--cui-text-tertiary); font-size: 0.75rem;">+</span><CuiKbd>Del</CuiKbd>
            <span class="text-sm" style="color: var(--cui-text-secondary); margin-left: 0.5rem;">Task Manager</span>
          </CuiFlex>
        </CuiStack>
      </Example>

      <!-- Sizes -->
      <Example title="Sizes" :code="`<CuiKbd size=&quot;sm&quot;>⌘</CuiKbd>
<CuiKbd size=&quot;md&quot;>⌘</CuiKbd>
<CuiKbd size=&quot;lg&quot;>⌘</CuiKbd>`">
        <CuiStack spacing="3">
          <CuiFlex gap="1" class="items-center">
            <CuiKbd size="sm">⌘</CuiKbd><span style="color: var(--cui-text-tertiary); font-size: 0.625rem;">+</span><CuiKbd size="sm">K</CuiKbd>
            <span class="text-xs" style="color: var(--cui-text-secondary); margin-left: 0.5rem;">Small</span>
          </CuiFlex>
          <CuiFlex gap="1" class="items-center">
            <CuiKbd size="md">⌘</CuiKbd><span style="color: var(--cui-text-tertiary); font-size: 0.75rem;">+</span><CuiKbd size="md">K</CuiKbd>
            <span class="text-sm" style="color: var(--cui-text-secondary); margin-left: 0.5rem;">Medium (default)</span>
          </CuiFlex>
          <CuiFlex gap="1" class="items-center">
            <CuiKbd size="lg">⌘</CuiKbd><span style="color: var(--cui-text-tertiary); font-size: 0.8125rem;">+</span><CuiKbd size="lg">K</CuiKbd>
            <span style="color: var(--cui-text-secondary); margin-left: 0.5rem;">Large</span>
          </CuiFlex>
        </CuiStack>
      </Example>

      <!-- Inline with text -->
      <Example title="Inline with Text" :code="`<p>Press <CuiKbd size=&quot;sm&quot;>⌘</CuiKbd> <CuiKbd size=&quot;sm&quot;>K</CuiKbd> to open the command palette.</p>
<p>Press <CuiKbd size=&quot;sm&quot;>Esc</CuiKbd> to close.</p>`">
        <CuiStack spacing="3">
          <p class="text-sm" style="color: var(--cui-text-secondary);">
            Press <CuiKbd size="sm">⌘</CuiKbd> <CuiKbd size="sm">K</CuiKbd> to open the command palette.
          </p>
          <p class="text-sm" style="color: var(--cui-text-secondary);">
            Use <CuiKbd size="sm">↑</CuiKbd> <CuiKbd size="sm">↓</CuiKbd> to navigate and <CuiKbd size="sm">⏎</CuiKbd> to select.
          </p>
          <p class="text-sm" style="color: var(--cui-text-secondary);">
            Press <CuiKbd size="sm">Esc</CuiKbd> to close.
          </p>
        </CuiStack>
      </Example>

      <!-- Function keys -->
      <Example title="Function &amp; Special Keys" :code="`<CuiKbd>F1</CuiKbd>
<CuiKbd>F5</CuiKbd>
<CuiKbd>F12</CuiKbd>
<CuiKbd>PgUp</CuiKbd>
<CuiKbd>Home</CuiKbd>
<CuiKbd>End</CuiKbd>`">
        <CuiFlex gap="2" class="items-center flex-wrap">
          <CuiKbd>F1</CuiKbd>
          <CuiKbd>F5</CuiKbd>
          <CuiKbd>F12</CuiKbd>
          <CuiKbd>PgUp</CuiKbd>
          <CuiKbd>PgDn</CuiKbd>
          <CuiKbd>Home</CuiKbd>
          <CuiKbd>End</CuiKbd>
          <CuiKbd>Ins</CuiKbd>
        </CuiFlex>
      </Example>

    </template>
  </DocPage>
</template>
