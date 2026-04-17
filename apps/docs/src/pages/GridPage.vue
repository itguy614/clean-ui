<script setup lang="ts">
import { inject, computed, type Ref } from "vue";
import { ShowDebugKey } from "../keys";
import { CuiCard, CuiCardBody, CuiGrid, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const showDebugRef = inject(ShowDebugKey);
const showDebug = computed(() => showDebugRef?.value ?? false);

const codeExamples = {
  grid3Col: `<CuiGrid :cols="3" gap="4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</CuiGrid>`,
  gridResponsive: `<CuiGrid :cols="{ sm: 1, md: 2, lg: 3 }" gap="4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</CuiGrid>`,
  gridNested: `<CuiGrid :cols="2" gap="4">
  <div>Item 1</div>
  <CuiGrid :cols="2" gap="2">
    <div>Nested 1</div>
    <div>Nested 2</div>
  </CuiGrid>
</CuiGrid>`,
};
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Grid</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        CSS Grid component for two-dimensional layouts
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'cols', type: 'ResponsiveValue<GridColumns>', default: '1', description: 'Number of columns (1-12) or responsive object' },
          { name: 'rows', type: 'ResponsiveValue<GridRows>', default: '-', description: 'Number of rows (1-6), optional' },
          { name: 'gap', type: 'ResponsiveValue<TailwindSpacing>', default: '-', description: 'Gap between all items' },
          { name: 'rowGap', type: 'ResponsiveValue<TailwindSpacing>', default: '-', description: 'Row gap (overrides gap)' },
          { name: 'colGap', type: 'ResponsiveValue<TailwindSpacing>', default: '-', description: 'Column gap (overrides gap)' },
          { name: 'debug', type: 'boolean', default: 'false', description: 'Enable debug visualization' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">
        <Example title="3-Column Grid" :code="codeExamples.grid3Col">
          <CuiGrid :cols="3" gap="4" :debug="showDebug">
            <div class="rounded-lg bg-primary-500 p-4 text-white">Item 1</div>
            <div class="rounded-lg bg-primary-500 p-4 text-white">Item 2</div>
            <div class="rounded-lg bg-primary-500 p-4 text-white">Item 3</div>
            <div class="rounded-lg bg-primary-500 p-4 text-white">Item 4</div>
            <div class="rounded-lg bg-primary-500 p-4 text-white">Item 5</div>
            <div class="rounded-lg bg-primary-500 p-4 text-white">Item 6</div>
          </CuiGrid>
        </Example>

        <Example title="Responsive Grid (1 → 2 → 3 columns)" :code="codeExamples.gridResponsive">
          <CuiGrid :cols="{ sm: 1, md: 2, lg: 3 }" gap="4" :debug="showDebug">
            <div class="rounded-lg bg-info-500 p-4 text-white">Item 1</div>
            <div class="rounded-lg bg-info-500 p-4 text-white">Item 2</div>
            <div class="rounded-lg bg-info-500 p-4 text-white">Item 3</div>
          </CuiGrid>
        </Example>

        <Example title="Nested Grids" :code="codeExamples.gridNested">
          <CuiGrid :cols="2" gap="4" :debug="showDebug">
            <div class="rounded-lg bg-secondary-500 p-4 text-white">Item 1</div>
            <CuiGrid :cols="2" gap="2" :debug="showDebug">
              <div class="rounded-lg bg-secondary-300 p-2 text-white">Nested 1</div>
              <div class="rounded-lg bg-secondary-300 p-2 text-white">Nested 2</div>
              <div class="rounded-lg bg-secondary-300 p-2 text-white">Nested 3</div>
              <div class="rounded-lg bg-secondary-300 p-2 text-white">Nested 4</div>
            </CuiGrid>
          </CuiGrid>
        </Example>
      </CuiStack>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Usage</h2>
      <CuiCard>
        <CuiCardBody>
          <h3 class="mb-3 font-medium">When to use Grid</h3>
          <ul class="list-inside list-disc space-y-2 text-surface-600 dark:text-surface-400">
            <li>Two-dimensional layouts (rows AND columns)</li>
            <li>Card grids, image galleries, dashboards</li>
            <li>When you need precise control over item placement</li>
            <li>Complex page layouts with multiple regions</li>
          </ul>
        </CuiCardBody>
      </CuiCard>
    </div>
  </CuiStack>
</template>
