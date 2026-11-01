<script setup lang="ts">
import { CuiFlex, CuiStatusDot } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/status-dot";

const tones = [
  { tone: "success", text: "Online" },
  { tone: "info", text: "Syncing" },
  { tone: "warning", text: "Degraded" },
  { tone: "error", text: "Offline" },
  { tone: "neutral", text: "Unknown" },
] as const;
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<span class=&quot;inline-flex items-center gap-2&quot;>
  <CuiStatusDot tone=&quot;success&quot; /> Online
</span>`"
      >
        <CuiFlex gap="5" class="flex-wrap items-center">
          <span v-for="t in tones" :key="t.tone" class="inline-flex items-center gap-2">
            <CuiStatusDot :tone="t.tone" /> {{ t.text }}
          </span>
        </CuiFlex>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        Colour alone does not carry meaning. By default the dot is
        <code>aria-hidden="true"</code> and the status is written beside it, as above. A dot
        with nothing beside it — in a dense table, say — takes a <code>label</code>, which makes
        it <code>role="img"</code> with that accessible name.
      </p>
      <p class="text-surface-700 dark:text-surface-300">
        In Windows forced-colours mode the dot keeps its colour rather than vanishing into the
        background.
      </p>
    </template>

    <template #examples>
      <Example title="Standalone, with a label" :code="`<CuiStatusDot tone=&quot;error&quot; label=&quot;Offline&quot; />`">
        <CuiStatusDot tone="error" label="Offline" />
      </Example>
    </template>
  </DocPage>
</template>
