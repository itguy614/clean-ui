<script setup lang="ts">
import { CuiContainer, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Container</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Max-width container with responsive padding
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'maxWidth', type: 'ResponsiveValue<ContainerSize>', default: '2xl', description: 'Max width: sm, md, lg, xl, 2xl, full' },
          { name: 'px', type: 'ResponsiveValue<TailwindSpacing>', default: '4', description: 'Horizontal padding' },
          { name: 'py', type: 'ResponsiveValue<TailwindSpacing>', default: '-', description: 'Vertical padding' },
          { name: 'centered', type: 'boolean', default: 'true', description: 'Center with mx-auto' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Container Sizes</h2>
      <div class="overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-800">
        <table class="w-full">
          <thead class="border-b border-surface-200 bg-surface-100 dark:border-surface-800 dark:bg-surface-800">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-semibold">Size</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Max Width</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-200 dark:divide-surface-800">
            <tr><td class="px-4 py-3"><code class="text-sm font-mono">sm</code></td><td class="px-4 py-3">640px</td></tr>
            <tr><td class="px-4 py-3"><code class="text-sm font-mono">md</code></td><td class="px-4 py-3">768px</td></tr>
            <tr><td class="px-4 py-3"><code class="text-sm font-mono">lg</code></td><td class="px-4 py-3">1024px</td></tr>
            <tr><td class="px-4 py-3"><code class="text-sm font-mono">xl</code></td><td class="px-4 py-3">1280px</td></tr>
            <tr><td class="px-4 py-3"><code class="text-sm font-mono">2xl</code></td><td class="px-4 py-3">1536px</td></tr>
            <tr><td class="px-4 py-3"><code class="text-sm font-mono">full</code></td><td class="px-4 py-3">100%</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </CuiStack>
</template>
