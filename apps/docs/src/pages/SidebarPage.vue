<script setup lang="ts">
import { CuiSidebar, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Sidebar</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        TODO: describe Sidebar.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable :props="[
        { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component (v-show)' },
      ]" />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">
        <Example title="Basic" :code="`<CuiSidebar>Hello</CuiSidebar>`">
          <CuiSidebar>Hello</CuiSidebar>
        </Example>
      </CuiStack>
    </div>
  </CuiStack>
</template>
