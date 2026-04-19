<script setup lang="ts">
import { CuiFlex, CuiKbd, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Kbd</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Displays keyboard shortcut keys with a realistic keycap style.
        Use inline with text or grouped for key combinations.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Size' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic keys -->
        <Example title="Single Keys" :code="`<CuiKbd>⌘</CuiKbd>`">
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
        <Example title="Function & Special Keys" :code="`<CuiKbd>F1</CuiKbd>
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

      </CuiStack>
    </div>
  </CuiStack>
</template>
