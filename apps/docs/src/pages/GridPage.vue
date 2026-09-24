<script setup lang="ts">
import { inject, computed } from "vue";
import { ShowDebugKey } from "../keys";
import { CuiCard, CuiCardBody, CuiGrid, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/grid";

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
  <DocPage :meta="meta">
    <template #usage>
      <Example code-open :code="codeExamples.grid3Col">
        <CuiGrid :cols="3" gap="4" :debug="showDebug">
          <div class="rounded-lg bg-primary-500 p-4 text-white">Item 1</div>
          <div class="rounded-lg bg-primary-500 p-4 text-white">Item 2</div>
          <div class="rounded-lg bg-primary-500 p-4 text-white">Item 3</div>
          <div class="rounded-lg bg-primary-500 p-4 text-white">Item 4</div>
          <div class="rounded-lg bg-primary-500 p-4 text-white">Item 5</div>
          <div class="rounded-lg bg-primary-500 p-4 text-white">Item 6</div>
        </CuiGrid>
      </Example>
    </template>

    <template #extra>
      <div>
        <h2 id="when-to-use-grid" class="mb-4 text-2xl font-semibold">When to use Grid</h2>
        <CuiCard variant="outline">
          <CuiCardBody>
            <p class="mb-3 text-surface-600 dark:text-surface-400">
              Grid lays out both axes at once, so the tracks are decided by the container
              rather than by the items. Reach for <code>CuiFlex</code> instead when the
              items should size themselves along a single line.
            </p>
            <ul class="list-inside list-disc space-y-2 text-surface-600 dark:text-surface-400">
              <li>Two-dimensional layouts — rows <em>and</em> columns</li>
              <li>Card grids, image galleries, dashboards</li>
              <li>When items must line up across rows, not just within one</li>
              <li>Complex page layouts with several regions</li>
            </ul>
          </CuiCardBody>
        </CuiCard>
      </div>
    </template>

    <template #examples>
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
    </template>
  </DocPage>
</template>
