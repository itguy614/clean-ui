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
      <h2 id="other-themes" class="mb-4 text-2xl font-semibold">Import the Themes You Use</h2>
      <p class="mb-3 text-surface-600 dark:text-surface-400">
        <code>@itguy614/clean-ui/styles</code> carries the default Navy theme, light and dark. The
        other seven palettes are opt-in files of about 2 kB each, so an app pays only for the ones
        it uses. A theme class whose file is not imported styles nothing, and in development
        <code>setTheme()</code> warns.
      </p>
      <pre class="overflow-x-auto rounded-lg bg-surface-900 p-4 text-sm text-surface-100"><code>import '@itguy614/clean-ui/styles'
import '@itguy614/clean-ui/themes/forest.css'   // mono, forest, amber, azure, teal, violet, ruby</code></pre>
      <p class="mb-3 mt-4 text-surface-600 dark:text-surface-400">
        With no bundler, or to offer every theme without listing them, use the all-in-one
        stylesheet (it replaces <code>styles</code>, it does not go with it):
      </p>
      <pre class="overflow-x-auto rounded-lg bg-surface-900 p-4 text-sm text-surface-100"><code>import '@itguy614/clean-ui/styles/all.css'</code></pre>
    </div>

    <div>
      <h2 id="configure-defaults" class="mb-4 text-2xl font-semibold">Configure App-wide Defaults</h2>
      <p class="mb-3 text-surface-600 dark:text-surface-400">
        Some choices an application makes once rather than at every call site. Pass them to
        <code>createCleanUI()</code>; they belong to that app alone, so two apps on a page, or
        two server-rendered requests, keep their own. A component's own prop still wins.
      </p>
      <pre class="overflow-x-auto rounded-lg bg-surface-900 p-4 text-sm text-surface-100"><code>import { createCleanUI } from '@itguy614/clean-ui'
import { PhSiren } from '@phosphor-icons/vue'

app.use(createCleanUI({
  // Every card here sits under the page's h1, so its title is an h2
  headingLevels: { cardHeader: 'h2' },
  // A different glyph for errors: an icon component, or a registered icon name
  roleIcons: { error: PhSiren },
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
        <li>
          <code>locale</code>: the language tag dates, file sizes and AM/PM labels are
          formatted in, such as <code>"de"</code>. It follows the document's <code>lang</code>
          when unset. See <router-link to="/composables/locale">Locale</router-link>.
        </li>
      </ul>
      <p class="mt-3 text-surface-600 dark:text-surface-400">
        For part of a page, <code>CuiConfigProvider</code> takes the same
        <code>headingLevels</code>, <code>roleIcons</code> and <code>locale</code> props and applies them to what
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
      <h2 id="detached-apps" class="mb-4 text-2xl font-semibold">Carry the Config into a Detached App</h2>
      <p class="mb-3 text-surface-600 dark:text-surface-400">
        A dialog mounted with its own <code>createApp()</code>, outside your component tree,
        can't see what your app provides: its components fall back to the library's defaults
        and the English messages. <code>useCleanUIContext()</code>, called in the setup of a
        component inside your tree, captures the app's options, any
        <code>CuiConfigProvider</code> above it and the message catalog;
        <code>provideTo(app)</code> hands them to the other app before it mounts. They stay
        live, so a later change to the provider reaches the dialog too. It also hands on the
        scoped theme around that component: the dialog's modal, and any select or menu in it,
        take the nearest <code>cui-theme-*</code> class and a scoped <code>dark</code> class
        (see <router-link to="/foundations/themes">Themes</router-link>).
      </p>
      <pre class="overflow-x-auto rounded-lg bg-surface-900 p-4 text-sm text-surface-100"><code>import { createApp } from 'vue'
import { useCleanUIContext } from '@itguy614/clean-ui'

// In setup()
const cleanUI = useCleanUIContext()

let dialogs = 0

function openDialog() {
  const app = createApp(MyDialog)
  // Generated ids are unique per app: keep this one's apart from your app's
  app.config.idPrefix = `my-dialog-${++dialogs}`
  cleanUI.provideTo(app)
  app.mount(document.body.appendChild(document.createElement('div')))
}</code></pre>
      <p class="mt-3 text-surface-600 dark:text-surface-400">
        The markdown editor's link and image dialogs use it, so they follow your app's heading
        levels and messages.
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
