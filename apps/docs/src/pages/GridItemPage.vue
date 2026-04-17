<script setup lang="ts">
import { inject, computed, type Ref } from "vue";
import { ShowDebugKey } from "../keys";
import { CuiGrid, CuiGridItem, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const showDebugRef = inject(ShowDebugKey);
const showDebug = computed(() => showDebugRef?.value ?? false);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Grid Item</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Optional helper for grid item spanning and positioning
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'colSpan', type: 'ResponsiveValue<GridSpan>', default: '-', description: 'Columns to span (1-12, full)' },
          { name: 'rowSpan', type: 'ResponsiveValue<GridSpan>', default: '-', description: 'Rows to span (1-12, full)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Example</h2>
      <Example title="Column Spanning">
        <CuiGrid :cols="3" gap="4" :debug="showDebug">
          <CuiGridItem :col-span="2">
            <div class="rounded-lg bg-success-500 p-4 text-white">Spans 2 columns</div>
          </CuiGridItem>
          <div class="rounded-lg bg-success-500 p-4 text-white">Normal</div>
        </CuiGrid>
      </Example>
    </div>
  </CuiStack>
</template>
