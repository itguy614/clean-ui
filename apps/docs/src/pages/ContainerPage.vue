<script setup lang="ts">
import { CuiContainer } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/container";
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiContainer max-width=&quot;lg&quot;>
  <p>Page content, capped at 1024px and centred.</p>
</CuiContainer>`"
      >
        <div class="rounded-lg bg-surface-200 py-4 dark:bg-surface-800">
          <CuiContainer max-width="lg">
            <div class="rounded-lg bg-primary-500 p-4 text-white">
              Capped at 1024px, centred, with 1rem of side padding.
            </div>
          </CuiContainer>
        </div>
      </Example>
    </template>

    <template #extra>
      <div>
        <h2 id="container-sizes" class="mb-4 text-2xl font-semibold">Container sizes</h2>
        <div class="overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-800">
          <table class="w-full">
            <thead class="border-b border-surface-200 bg-surface-100 dark:border-surface-800 dark:bg-surface-800">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold">Size</th>
                <th class="px-4 py-3 text-left text-sm font-semibold">Max width</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-200 dark:divide-surface-800">
              <tr><td class="px-4 py-3"><code class="font-mono text-sm">sm</code></td><td class="px-4 py-3">640px</td></tr>
              <tr><td class="px-4 py-3"><code class="font-mono text-sm">md</code></td><td class="px-4 py-3">768px</td></tr>
              <tr><td class="px-4 py-3"><code class="font-mono text-sm">lg</code></td><td class="px-4 py-3">1024px</td></tr>
              <tr><td class="px-4 py-3"><code class="font-mono text-sm">xl</code></td><td class="px-4 py-3">1280px</td></tr>
              <tr><td class="px-4 py-3"><code class="font-mono text-sm">2xl</code></td><td class="px-4 py-3">1536px</td></tr>
              <tr><td class="px-4 py-3"><code class="font-mono text-sm">full</code></td><td class="px-4 py-3">100%</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </DocPage>
</template>
