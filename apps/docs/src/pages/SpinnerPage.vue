<script setup lang="ts">
import { CuiCard, CuiCardBody, CuiFlex, CuiGrid, CuiSpinner, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";
import Playground from "../components/Playground.vue";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Spinner</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Standalone loading indicator with three visual variants.
        Use for async operations, page loads, or content placeholders.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'size', type: 'xs | sm | md | lg | xl', default: 'md', description: 'Size' },
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Color role' },
          { name: 'variant', type: 'ring | dots | bars', default: 'ring', description: 'Visual variant' },
          { name: 'label', type: 'string', default: 'Loading', description: 'Accessible label (always present for screen readers)' },
          { name: 'showLabel', type: 'boolean', default: 'false', description: 'Show label text below the spinner' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <Playground
      :component="CuiSpinner"
      component-name="CuiSpinner"
      :props="{
        size: { type: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'], default: 'md' },
        color: { type: 'select', options: ['primary', 'secondary', 'success', 'error', 'warning', 'info'], default: 'primary' },
        variant: { type: 'select', options: ['ring', 'dots', 'bars'], default: 'ring' },
        label: { type: 'string', default: 'Loading' },
        showLabel: { type: 'boolean', default: false },
      }"
    />

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Variants -->
        <Example title="Variants" :code="`<CuiSpinner variant=&quot;ring&quot; />
<CuiSpinner variant=&quot;dots&quot; />
<CuiSpinner variant=&quot;bars&quot; />`">
          <CuiFlex gap="6" class="items-center">
            <div class="text-center">
              <CuiSpinner variant="ring" size="lg" />
              <div class="mt-2 text-xs" style="color: var(--cui-text-secondary);">Ring</div>
            </div>
            <div class="text-center">
              <CuiSpinner variant="dots" size="lg" />
              <div class="mt-2 text-xs" style="color: var(--cui-text-secondary);">Dots</div>
            </div>
            <div class="text-center">
              <CuiSpinner variant="bars" size="lg" />
              <div class="mt-2 text-xs" style="color: var(--cui-text-secondary);">Bars</div>
            </div>
          </CuiFlex>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes" :code="`<CuiSpinner size=&quot;xs&quot; />
<CuiSpinner size=&quot;sm&quot; />
<CuiSpinner size=&quot;md&quot; />
<CuiSpinner size=&quot;lg&quot; />
<CuiSpinner size=&quot;xl&quot; />`">
          <CuiStack spacing="4">
            <div v-for="variant in (['ring', 'dots', 'bars'] as const)" :key="variant">
              <div class="mb-2 text-sm font-medium" style="color: var(--cui-text-secondary);">{{ variant }}:</div>
              <CuiFlex gap="4" class="items-center">
                <CuiSpinner :variant="variant" size="xs" />
                <CuiSpinner :variant="variant" size="sm" />
                <CuiSpinner :variant="variant" size="md" />
                <CuiSpinner :variant="variant" size="lg" />
                <CuiSpinner :variant="variant" size="xl" />
              </CuiFlex>
            </div>
          </CuiStack>
        </Example>

        <!-- Colors -->
        <Example title="Colors" :code="`<CuiSpinner color=&quot;primary&quot; />
<CuiSpinner color=&quot;success&quot; />
<CuiSpinner color=&quot;error&quot; />
<CuiSpinner color=&quot;warning&quot; />
<CuiSpinner color=&quot;info&quot; />
<CuiSpinner color=&quot;secondary&quot; />`">
          <CuiFlex gap="4" class="items-center">
            <CuiSpinner color="primary" size="lg" />
            <CuiSpinner color="secondary" size="lg" />
            <CuiSpinner color="success" size="lg" />
            <CuiSpinner color="error" size="lg" />
            <CuiSpinner color="warning" size="lg" />
            <CuiSpinner color="info" size="lg" />
          </CuiFlex>
        </Example>

        <!-- With label -->
        <Example title="With Label" :code="`<CuiSpinner show-label label=&quot;Loading...&quot; />`">
          <CuiFlex gap="6" class="items-start">
            <CuiSpinner show-label label="Loading..." />
            <CuiSpinner show-label label="Saving..." variant="dots" color="success" />
            <CuiSpinner show-label label="Processing..." variant="bars" color="warning" />
          </CuiFlex>
        </Example>

        <!-- Real-world: Card loading -->
        <Example title="Real-World: Card Loading State" :code="`<CuiCard variant=&quot;outline&quot;>
  <CuiCardBody style=&quot;display: flex; align-items: center; justify-content: center; min-height: 8rem;&quot;>
    <CuiSpinner show-label label=&quot;Loading data...&quot; />
  </CuiCardBody>
</CuiCard>`">
          <CuiGrid :cols="{ sm: 1, md: 3 }" gap="4">
            <CuiCard variant="outline">
              <CuiCardBody style="display: flex; align-items: center; justify-content: center; min-height: 8rem;">
                <CuiSpinner show-label label="Loading data..." />
              </CuiCardBody>
            </CuiCard>
            <CuiCard variant="outline">
              <CuiCardBody style="display: flex; align-items: center; justify-content: center; min-height: 8rem;">
                <CuiSpinner variant="dots" show-label label="Fetching..." color="info" />
              </CuiCardBody>
            </CuiCard>
            <CuiCard variant="outline">
              <CuiCardBody style="display: flex; align-items: center; justify-content: center; min-height: 8rem;">
                <CuiSpinner variant="bars" show-label label="Syncing..." color="success" />
              </CuiCardBody>
            </CuiCard>
          </CuiGrid>
        </Example>

        <!-- Inline with text -->
        <Example title="Inline with Text" :code="`<CuiFlex gap=&quot;2&quot; class=&quot;items-center&quot;>
  <CuiSpinner size=&quot;xs&quot; />
  <span>Checking availability...</span>
</CuiFlex>`">
          <CuiStack spacing="3">
            <CuiFlex gap="2" class="items-center">
              <CuiSpinner size="xs" />
              <span class="text-sm" style="color: var(--cui-text-secondary);">Checking availability...</span>
            </CuiFlex>
            <CuiFlex gap="2" class="items-center">
              <CuiSpinner size="xs" variant="dots" color="success" />
              <span class="text-sm" style="color: var(--cui-text-secondary);">Uploading file...</span>
            </CuiFlex>
            <CuiFlex gap="2" class="items-center">
              <CuiSpinner size="xs" variant="bars" color="warning" />
              <span class="text-sm" style="color: var(--cui-text-secondary);">Connecting to server...</span>
            </CuiFlex>
          </CuiStack>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
