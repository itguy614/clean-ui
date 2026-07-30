<script setup lang="ts">
import { ref } from "vue";
import { CuiCard, CuiCardHeader, CuiCardBody, CuiStack, CuiButton, CuiFlex } from "@itguy614/clean-ui";
import { CuiMarkdownEditor } from "@itguy614/clean-ui-editor";
import Example from "../components/Example.vue";

const doc = ref(
  [
    "# Clean UI Editor",
    "",
    "A **markdown editor** where the document *is* the markdown — no hidden rich-text model, no",
    "round-trip drift. Syntax markers hide until your cursor enters the construct.",
    "",
    "- Try selecting some text and pressing **Ctrl/Cmd+B**",
    "- Type `/` on an empty line to open the slash menu",
    "- Switch to *Source* above to see the raw markdown",
  ].join("\n"),
);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Clean UI Editor</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A markdown editor for Vue, built on CodeMirror 6. The document is markdown text, always —
        editing hides syntax markers away from the cursor rather than modelling a separate rich-text
        tree, so there is nothing to round-trip and nothing to drift.
      </p>
    </div>

    <Example title="Try it" :code="`&lt;CuiMarkdownEditor v-model=&quot;doc&quot; /&gt;`">
      <CuiMarkdownEditor v-model="doc" />
    </Example>

    <CuiFlex gap="4" class="flex-wrap">
      <CuiCard variant="outline" style="flex: 1; min-width: 240px;">
        <CuiCardHeader title="Markdown is the document" />
        <CuiCardBody>
          <p class="text-sm" style="color: var(--cui-text-secondary);">
            No rich-text model to keep in sync. Source mode is the same buffer with decorations
            turned off — what you see in Source is exactly what gets stored.
          </p>
        </CuiCardBody>
      </CuiCard>
      <CuiCard variant="outline" style="flex: 1; min-width: 240px;">
        <CuiCardHeader title="Extensible without touching CodeMirror" />
        <CuiCardBody>
          <p class="text-sm" style="color: var(--cui-text-secondary);">
            A declarative plugin API — commands, toolbar entries, keymaps, construct policy, paste
            rules — expressive enough that every built-in formatting action uses the exact same
            surface a consumer plugin would. See the
            <router-link to="/guides/plugins" style="color: var(--cui-primary);">Plugin Authoring guide</router-link>.
          </p>
        </CuiCardBody>
      </CuiCard>
      <CuiCard variant="outline" style="flex: 1; min-width: 240px;">
        <CuiCardHeader title="No renderer in the core bundle" />
        <CuiCardBody>
          <p class="text-sm" style="color: var(--cui-text-secondary);">
            Rendering markdown to HTML is never required to edit it. A render adapter is injectable
            at a separate subpath, so applications that already have a renderer never pay for a
            second one. See the
            <router-link to="/guides/integration" style="color: var(--cui-primary);">Integration guide</router-link>.
          </p>
        </CuiCardBody>
      </CuiCard>
    </CuiFlex>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Install</h2>
      <CuiCard variant="outline">
        <CuiCardBody>
          <pre class="cui-pre"><code class="cui-code">pnpm add @itguy614/clean-ui-editor @itguy614/clean-ui vue</code></pre>
          <p class="mt-3 text-sm" style="color: var(--cui-text-secondary);">
            See the <router-link to="/installation" style="color: var(--cui-primary);">Installation page</router-link>
            for peer version requirements, registering the plugin, and CSP setup.
          </p>
        </CuiCardBody>
      </CuiCard>
    </div>
  </CuiStack>
</template>
