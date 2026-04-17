<script setup lang="ts">
import { CuiStack } from "@itguy614/clean-ui";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Installation</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Get started with Clean UI in your Vue 3 project
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Install Package</h2>
      <pre class="overflow-x-auto rounded-lg bg-surface-900 p-4 text-surface-100"><code>npm install @itguy614/clean-ui</code></pre>
      <p class="mt-2 text-sm text-surface-600 dark:text-surface-400">or with pnpm:</p>
      <pre class="mt-2 overflow-x-auto rounded-lg bg-surface-900 p-4 text-surface-100"><code>pnpm add @itguy614/clean-ui</code></pre>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Import in Your App</h2>
      <pre class="overflow-x-auto rounded-lg bg-surface-900 p-4 text-sm text-surface-100"><code>import { createApp } from 'vue'
import { createCleanUI } from '@itguy614/clean-ui'
import '@itguy614/clean-ui/styles'

const app = createApp(App)
app.use(createCleanUI())
app.mount('#app')</code></pre>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Import Individual Components</h2>
      <p class="mb-3 text-surface-600 dark:text-surface-400">
        You can also import individual components without the plugin:
      </p>
      <pre class="overflow-x-auto rounded-lg bg-surface-900 p-4 text-sm text-surface-100"><code>import { CuiButton, CuiGrid } from '@itguy614/clean-ui'
import '@itguy614/clean-ui/styles'</code></pre>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">TypeScript Support</h2>
      <p class="mb-3 text-surface-600 dark:text-surface-400">
        Clean UI is written in TypeScript and includes full type definitions. No additional configuration needed!
      </p>
      <pre class="overflow-x-auto rounded-lg bg-surface-900 p-4 text-sm text-surface-100"><code>import type { CuiButtonProps, CuiGridProps } from '@itguy614/clean-ui'</code></pre>
    </div>
  </CuiStack>
</template>
