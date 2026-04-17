<script setup lang="ts">
import { inject, computed, type Ref } from "vue";
import { ShowDebugKey } from "../keys";
import { CuiFlex, CuiFlexItem, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const showDebugRef = inject(ShowDebugKey);
const showDebug = computed(() => showDebugRef?.value ?? false);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Flex Item</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Optional helper for flex item properties
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'flex', type: 'ResponsiveValue<1 | auto | initial | none>', default: '-', description: 'Flex shorthand' },
          { name: 'grow', type: 'ResponsiveValue<0 | 1>', default: '-', description: 'Flex grow' },
          { name: 'shrink', type: 'ResponsiveValue<0 | 1>', default: '-', description: 'Flex shrink' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Example</h2>
      <Example title="Flex Item That Grows">
        <CuiFlex gap="4" :debug="showDebug">
          <div class="rounded-lg bg-primary-500 p-4 text-white">Fixed width</div>
          <CuiFlexItem flex="1">
            <div class="rounded-lg bg-primary-500 p-4 text-white">Grows to fill space</div>
          </CuiFlexItem>
          <div class="rounded-lg bg-primary-500 p-4 text-white">Fixed width</div>
        </CuiFlex>
      </Example>
    </div>
  </CuiStack>
</template>
