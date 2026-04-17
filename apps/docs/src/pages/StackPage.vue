<script setup lang="ts">
import { inject, computed, type Ref } from "vue";
import { ShowDebugKey } from "../keys";
import { CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const showDebugRef = inject(ShowDebugKey);
const showDebug = computed(() => showDebugRef?.value ?? false);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Stack</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Convenience wrapper for simple vertical/horizontal spacing
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'direction', type: 'vertical | horizontal', default: 'vertical', description: 'Stack direction' },
          { name: 'spacing', type: 'ResponsiveValue<TailwindSpacing>', default: '4', description: 'Space between items' },
          { name: 'debug', type: 'boolean', default: 'false', description: 'Enable debug visualization' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">
        <Example title="Vertical Stack (default)">
          <CuiStack spacing="4" :debug="showDebug">
            <div class="rounded-lg bg-primary-500 p-3 text-white">Item 1</div>
            <div class="rounded-lg bg-primary-500 p-3 text-white">Item 2</div>
            <div class="rounded-lg bg-primary-500 p-3 text-white">Item 3</div>
          </CuiStack>
        </Example>

        <Example title="Horizontal Stack">
          <CuiStack direction="horizontal" spacing="3" :debug="showDebug">
            <div class="rounded-lg bg-info-500 p-3 text-white">Item 1</div>
            <div class="rounded-lg bg-info-500 p-3 text-white">Item 2</div>
            <div class="rounded-lg bg-info-500 p-3 text-white">Item 3</div>
          </CuiStack>
        </Example>
      </CuiStack>
    </div>
  </CuiStack>
</template>
