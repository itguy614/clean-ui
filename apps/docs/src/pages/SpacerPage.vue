<script setup lang="ts">
import { inject, computed, type Ref } from "vue";
import { ShowDebugKey } from "../keys";
import { CuiFlex, CuiSpacer, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const showDebugRef = inject(ShowDebugKey);
const showDebug = computed(() => showDebugRef?.value ?? false);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Spacer</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Flexible spacer for pushing items apart or fixed spacing
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'size', type: 'ResponsiveValue<TailwindSpacing>', default: '-', description: 'Fixed size (if not provided, uses flex-grow)' },
          { name: 'direction', type: 'horizontal | vertical', default: 'horizontal', description: 'Spacer direction (width vs height)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">
        <Example title="Flexible Spacer (pushes items apart)">
          <CuiFlex gap="4" :debug="showDebug" class="rounded-lg bg-surface-200 p-4 dark:bg-surface-800">
            <div class="rounded-lg bg-error-500 p-3 text-white">Left</div>
            <CuiSpacer />
            <div class="rounded-lg bg-error-500 p-3 text-white">Right</div>
          </CuiFlex>
        </Example>

        <Example title="Fixed Size Spacer">
          <CuiFlex gap="4" :debug="showDebug" class="rounded-lg bg-surface-200 p-4 dark:bg-surface-800">
            <div class="rounded-lg bg-warning-500 p-3 text-white">Item 1</div>
            <CuiSpacer size="20" />
            <div class="rounded-lg bg-warning-500 p-3 text-white">Item 2</div>
          </CuiFlex>
        </Example>
      </CuiStack>
    </div>
  </CuiStack>
</template>
