<script setup lang="ts">
import { CuiCard, CuiCardHeader, CuiCardBody, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Installation</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        <code class="cui-code">@itguy614/clean-ui-editor</code> is a satellite package to
        <code class="cui-code">@itguy614/clean-ui</code> — it depends on it as a peer, not a bundled
        copy, so your app keeps exactly one instance of both.
      </p>
    </div>

    <CuiCard variant="outline">
      <CuiCardHeader title="1. Install" />
      <CuiCardBody>
        <pre class="cui-pre"><code class="cui-code">pnpm add @itguy614/clean-ui-editor @itguy614/clean-ui vue</code></pre>
      </CuiCardBody>
    </CuiCard>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Peer dependencies</h2>
      <PropTable
        :props="[
          { name: 'vue', type: '^3.5.0', description: 'Vue 3.5+ — the editor uses reactive props destructure and useTemplateRef.' },
          { name: '@itguy614/clean-ui', type: '^1.8.0', description: 'The design system this package composes: CuiButton, CuiModal, CuiInput, CuiToolbar, the message catalog, and useColorScheme. 1.8.0 is the floor — the editor\'s toolbar is a CuiToolbar (added in 1.7.0) whose formatting buttons use CuiButton\'s `pressed` (added in 1.8.0), and its dialogs follow a scoped theme through `useCleanUIContext`. (1.6.0 added useCleanUIContext, which hands your app\'s clean-ui defaults and messages on to the editor\'s link and image dialogs.)' },
        ]"
      />
      <p class="mt-3 text-sm" style="color: var(--cui-text-secondary);">
        A version mismatch between what your app installed and what this package expects is
        detected at runtime (not just left to <code class="cui-code">peerDependencies</code>
        resolution) and reported with both versions named.
      </p>
    </div>

    <CuiCard variant="outline">
      <CuiCardHeader title="2. Register clean-ui" />
      <CuiCardBody>
        <p class="text-sm" style="color: var(--cui-text-secondary); margin-bottom: 0.75rem;">
          <code class="cui-code">@itguy614/clean-ui-editor</code> doesn't need its own Vue plugin —
          its one component works with a plain import. clean-ui itself is still installed the normal
          way if your app doesn't already do this:
        </p>
        <pre class="cui-pre"><code class="cui-code">// main.ts
import { createApp } from "vue";
import { createCleanUI } from "@itguy614/clean-ui";
import { CuiMarkdownEditor } from "@itguy614/clean-ui-editor";
import App from "./App.vue";

const app = createApp(App);
app.use(createCleanUI());
app.component("CuiMarkdownEditor", CuiMarkdownEditor); // optional — or just import it per-file
app.mount("#app");</code></pre>
      </CuiCardBody>
    </CuiCard>

    <CuiCard variant="outline">
      <CuiCardHeader title="3. Import the stylesheet" />
      <CuiCardBody>
        <p class="text-sm" style="color: var(--cui-text-secondary); margin-bottom: 0.75rem;">
          Importing <code class="cui-code">CuiMarkdownEditor</code> from the package's default entry
          already pulls in its CSS as a side effect — nothing else to add. If your bundler tree-shakes
          side-effect-free imports, make sure <code class="cui-code">sideEffects</code> in your own
          build config doesn't strip it (this package's own <code class="cui-code">package.json</code>
          declares its CSS as a side effect for exactly this reason).
        </p>
      </CuiCardBody>
    </CuiCard>

    <CuiCard variant="outline">
      <CuiCardHeader title="Icons" />
      <CuiCardBody>
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          Every icon the editor's built-in toolbar and dialogs render is registered by this package
          itself via clean-ui's <code class="cui-code">registerIcons</code> — nothing to configure. A
          plugin you author that references its own icon name follows the same rule clean-ui
          components do: register it, or pass a component directly to <code class="cui-code">CuiIcon</code>.
        </p>
      </CuiCardBody>
    </CuiCard>

    <CuiCard variant="outline">
      <CuiCardHeader title="Entry points" />
      <CuiCardBody>
        <p class="text-sm" style="color: var(--cui-text-secondary); margin-bottom: 0.75rem;">
          The package's <code class="cui-code">exports</code> map lists four entries, and nothing else
          can be imported. Deep paths into <code class="cui-code">dist</code> (for example
          <code class="cui-code">@itguy614/clean-ui-editor/messages.js</code>) are refused.
        </p>
        <PropTable
          :props="[
            { name: '@itguy614/clean-ui-editor', type: 'entry', description: 'CuiMarkdownEditor, the plugin API, built-in plugins, messages.' },
            { name: '@itguy614/clean-ui-editor/styles', type: 'entry', description: 'The editor stylesheet.' },
            { name: '@itguy614/clean-ui-editor/render', type: 'entry', description: 'CuiMarkdownViewer, serializeMarkdownToHtml, render adapters.' },
            { name: '@itguy614/clean-ui-editor/codemirror', type: 'entry', description: 'CodeMirror building blocks for raw-tier plugins.' },
          ]"
        />
      </CuiCardBody>
    </CuiCard>

    <CuiCard variant="outline">
      <CuiCardHeader title="Upgrading to 2.0" />
      <CuiCardBody>
        <p class="text-sm" style="color: var(--cui-text-secondary); margin-bottom: 0.75rem;">
          Two breaking changes. First, import only from the four entries above; any
          <code class="cui-code">@itguy614/clean-ui-editor/&lt;path&gt;</code> that is not one of them stops
          resolving. Second, the link and image dialogs share four message keys instead of keeping a
          copy each:
        </p>
        <PropTable
          :props="[
            { name: 'linkDialogCancel, imageDialogCancel', type: 'urlDialogCancel', description: 'The Cancel button of both dialogs.' },
            { name: 'linkDialogInsert, imageDialogInsert', type: 'urlDialogInsert', description: 'The Insert button of both dialogs.' },
            { name: 'linkDialogUrlRequired, imageDialogUrlRequired', type: 'urlDialogUrlRequired', description: 'The empty-URL error.' },
            { name: 'linkDialogUrlSchemeNotAllowed, imageDialogUrlSchemeNotAllowed', type: 'urlDialogUrlSchemeNotAllowed', description: 'The disallowed-scheme error.' },
          ]"
        />
      </CuiCardBody>
    </CuiCard>

    <CuiCard variant="outline">
      <CuiCardHeader title="Next" />
      <CuiCardBody>
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          See the <router-link to="/editor" style="color: var(--cui-primary);">Editor reference</router-link>
          for the full prop/event/slot surface, or jump straight to
          <router-link to="/guides/integration" style="color: var(--cui-primary);">Integration &amp; Testing</router-link>
          for CSP, SSR, and the render adapter.
        </p>
      </CuiCardBody>
    </CuiCard>
  </CuiStack>
</template>
