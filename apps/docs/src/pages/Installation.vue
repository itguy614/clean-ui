<script setup lang="ts">
import { CuiCard, CuiCardBody, CuiStack } from "@itguy614/clean-ui";
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
      <CuiCard variant="outline" class="mt-4">
        <CuiCardBody>
          <p class="text-sm">
            <strong>Tailwind is optional.</strong> That one stylesheet import is everything
            Clean-UI needs: it ships its own compiled CSS and builds no classes in your app.
            Use Tailwind for your own markup if you like, but don't add Clean-UI's
            <code class="cui-code">dist</code> to Tailwind's <code class="cui-code">@source</code>.
            Scanning it gains nothing and can add unused utilities to your CSS.
          </p>
        </CuiCardBody>
      </CuiCard>
    </div>

    <div>
      <h2 id="configure-defaults" class="mb-4 text-2xl font-semibold">Configure App-wide Defaults</h2>
      <p class="mb-3 text-surface-600 dark:text-surface-400">
        Some choices an application makes once rather than at every call site. Pass them to
        <code>createCleanUI()</code>; they belong to that app alone, so two apps on a page, or
        two server-rendered requests, keep their own. A component's own prop still wins.
      </p>
      <pre class="overflow-x-auto rounded-lg bg-surface-900 p-4 text-sm text-surface-100"><code>import { createCleanUI } from '@itguy614/clean-ui'

app.use(createCleanUI({
  // Every card here sits under the page's h1, so its title is an h2
  headingLevels: { cardHeader: 'h2' },
  // A different glyph for errors: any registered icon name
  roleIcons: { error: 'x-circle' },
}))</code></pre>
      <ul class="mt-3 list-disc space-y-1 pl-5 text-surface-600 dark:text-surface-400">
        <li>
          <code>headingLevels</code>: the element each titled component renders its title
          as, unless its <code>titleAs</code> says otherwise. Keys are
          <code>cardHeader</code> (default <code>h3</code>), <code>modalHeader</code>
          (<code>h2</code>, and also CuiModal's and CuiSlideover's <code>title</code>),
          <code>confirmDialog</code> (<code>h2</code>) and <code>emptyState</code>
          (<code>h3</code>).
        </li>
        <li>
          <code>roleIcons</code>: the icon each colour role shows in CuiAlert, CuiToast and
          CuiBanner.
        </li>
      </ul>
      <p class="mt-3 text-surface-600 dark:text-surface-400">
        For part of a page, <code>CuiConfigProvider</code> takes the same
        <code>headingLevels</code> and <code>roleIcons</code> props and applies them to what
        it wraps, over the app's. And <code>configureCleanUI()</code> sets them
        <em>globally</em>, as the fallback beneath every app: for code with no app to hand,
        such as a test setup. On a server it is shared by every request, so prefer the app's
        options. <code>registerRoleIcons()</code> is its alias for role icons.
      </p>
      <p class="mt-2 text-surface-600 dark:text-surface-400">
        Order, first match wins: the component's prop, the nearest
        <code>CuiConfigProvider</code>, the app's options, <code>configureCleanUI()</code>,
        the library's default.
      </p>
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
