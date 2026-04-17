<script setup lang="ts">
import { CuiCard, CuiCardBody, CuiGrid, CuiStack } from "@itguy614/clean-ui";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Clean UI</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A clean, dark-mode-ready Vue 3 component library built with Tailwind CSS v4
      </p>
    </div>

    <CuiCard>
      <CuiCardBody>
        <h2 class="mb-4 text-2xl font-semibold">Key Features</h2>
        <CuiGrid :cols="{ sm: 1, md: 2 }" gap="4">
          <div>
            <h3 class="mb-1 font-medium text-primary-600 dark:text-primary-400">🎨 Tailwind-First</h3>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Uses Tailwind's spacing scale and breakpoints for consistency
            </p>
          </div>
          <div>
            <h3 class="mb-1 font-medium text-primary-600 dark:text-primary-400">📱 Responsive</h3>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Object syntax for mobile-first responsive design
            </p>
          </div>
          <div>
            <h3 class="mb-1 font-medium text-primary-600 dark:text-primary-400">🔒 TypeScript</h3>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Strict typing with full autocomplete support
            </p>
          </div>
          <div>
            <h3 class="mb-1 font-medium text-primary-600 dark:text-primary-400">🐛 Debug Mode</h3>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Visual overlays to see layout structure during development
            </p>
          </div>
          <div>
            <h3 class="mb-1 font-medium text-primary-600 dark:text-primary-400">🎯 Smart Defaults</h3>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Mobile-first defaults that degrade gracefully
            </p>
          </div>
          <div>
            <h3 class="mb-1 font-medium text-primary-600 dark:text-primary-400">🌙 Dark Mode</h3>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Built-in dark mode support for all components
            </p>
          </div>
        </CuiGrid>
      </CuiCardBody>
    </CuiCard>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Components</h2>
      <div class="space-y-3">
        <CuiCard variant="outline">
          <CuiCardBody>
            <h3 class="font-medium">Layout Components</h3>
            <p class="mt-1 text-sm text-surface-600 dark:text-surface-400">
              Grid, Flex, Stack, Container, Spacer - Build responsive layouts with ease
            </p>
          </CuiCardBody>
        </CuiCard>
        <CuiCard variant="outline">
          <CuiCardBody>
            <h3 class="font-medium">UI Components</h3>
            <p class="mt-1 text-sm text-surface-600 dark:text-surface-400">
              Button - Interactive components (more coming soon!)
            </p>
          </CuiCardBody>
        </CuiCard>
      </div>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Quick Start</h2>
      <div class="space-y-4">
        <div>
          <h3 class="mb-2 text-lg font-medium">1. Install</h3>
          <pre class="overflow-x-auto rounded-lg bg-surface-900 p-4 text-surface-100"><code>npm install @itguy614/clean-ui</code></pre>
        </div>
        <div>
          <h3 class="mb-2 text-lg font-medium">2. Import</h3>
          <pre class="overflow-x-auto rounded-lg bg-surface-900 p-4 text-sm text-surface-100"><code>import { createCleanUI } from '@itguy614/clean-ui'
import '@itguy614/clean-ui/styles'

app.use(createCleanUI())</code></pre>
        </div>
        <div>
          <h3 class="mb-2 text-lg font-medium">3. Use</h3>
          <pre class="overflow-x-auto rounded-lg bg-surface-900 p-4 text-sm text-surface-100"><code>&lt;CuiGrid :cols="3" gap="4"&gt;
  &lt;Card&gt;Item 1&lt;/Card&gt;
  &lt;Card&gt;Item 2&lt;/Card&gt;
  &lt;Card&gt;Item 3&lt;/Card&gt;
&lt;/CuiGrid&gt;</code></pre>
        </div>
      </div>
    </div>
  </CuiStack>
</template>
