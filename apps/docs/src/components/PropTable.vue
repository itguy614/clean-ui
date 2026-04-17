<script setup lang="ts">
export interface PropRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}

defineProps<{
  props: PropRow[];
}>();
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-800">
    <table class="w-full">
      <thead class="border-b border-surface-200 bg-surface-100 dark:border-surface-800 dark:bg-surface-800">
        <tr>
          <th class="px-4 py-3 text-left text-sm font-semibold">Prop</th>
          <th class="px-4 py-3 text-left text-sm font-semibold">Type</th>
          <th class="px-4 py-3 text-left text-sm font-semibold">Default</th>
          <th class="px-4 py-3 text-left text-sm font-semibold">Description</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-surface-200 dark:divide-surface-800">
        <tr v-for="prop in props" :key="prop.name" class="hover:bg-surface-50 dark:hover:bg-surface-900">
          <td class="px-4 py-3">
            <code class="rounded bg-surface-200 px-2 py-1 text-sm font-mono text-primary-600 dark:bg-surface-800 dark:text-primary-400">
              {{ prop.name }}
            </code>
          </td>
          <td class="px-4 py-3">
            <code class="text-sm font-mono text-surface-600 dark:text-surface-400">
              {{ prop.type }}
            </code>
          </td>
          <td class="px-4 py-3">
            <code v-if="prop.default" class="text-sm font-mono text-surface-600 dark:text-surface-400">
              {{ prop.default }}
            </code>
            <span v-else class="text-sm text-surface-400">-</span>
          </td>
          <td class="px-4 py-3 text-sm text-surface-700 dark:text-surface-300">
            {{ prop.description }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
