<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  title?: string;
  code?: string;
}>();

const showCode = ref(false);
</script>

<template>
  <div class="rounded-lg border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-950">
    <div v-if="title" class="border-b border-surface-200 px-4 py-3 dark:border-surface-800">
      <div class="flex items-center justify-between">
        <h4 class="font-medium">{{ title }}</h4>
        <button
          v-if="code"
          @click="showCode = !showCode"
          class="rounded px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950"
        >
          {{ showCode ? "Hide Code" : "Show Code" }}
        </button>
      </div>
    </div>

    <!-- Preview -->
    <div class="p-6">
      <slot />
    </div>

    <!-- Code -->
    <div v-if="code && showCode" class="border-t border-surface-200 dark:border-surface-800">
      <pre class="overflow-x-auto p-4"><code class="text-sm font-mono text-surface-700 dark:text-surface-300">{{ code }}</code></pre>
    </div>
  </div>
</template>
