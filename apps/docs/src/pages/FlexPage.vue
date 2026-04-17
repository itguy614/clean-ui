<script setup lang="ts">
import { inject, computed, type Ref } from "vue";
import { ShowDebugKey } from "../keys";
import { CuiFlex, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const showDebugRef = inject(ShowDebugKey);
const showDebug = computed(() => showDebugRef?.value ?? false);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Flex</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Flexbox component for one-dimensional layouts
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'direction', type: 'ResponsiveValue<FlexDirection>', default: 'row', description: 'Flex direction: row, row-reverse, col, col-reverse' },
          { name: 'wrap', type: 'ResponsiveValue<FlexWrap>', default: 'wrap', description: 'Wrap behavior: wrap, wrap-reverse, nowrap' },
          { name: 'gap', type: 'ResponsiveValue<TailwindSpacing>', default: '-', description: 'Gap between items' },
          { name: 'debug', type: 'boolean', default: 'false', description: 'Enable debug visualization' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">
        <Example title="Horizontal Flex (default)">
          <CuiFlex gap="4" :debug="showDebug">
            <div class="rounded-lg bg-primary-500 p-4 text-white">Item 1</div>
            <div class="rounded-lg bg-primary-500 p-4 text-white">Item 2</div>
            <div class="rounded-lg bg-primary-500 p-4 text-white">Item 3</div>
          </CuiFlex>
        </Example>

        <Example title="Vertical Flex">
          <CuiFlex direction="col" gap="4" :debug="showDebug">
            <div class="rounded-lg bg-info-500 p-4 text-white">Item 1</div>
            <div class="rounded-lg bg-info-500 p-4 text-white">Item 2</div>
            <div class="rounded-lg bg-info-500 p-4 text-white">Item 3</div>
          </CuiFlex>
        </Example>
      </CuiStack>
    </div>
  </CuiStack>
</template>
