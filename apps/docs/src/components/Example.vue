<script setup lang="ts">
import { ref } from "vue";
import { CuiCard, CuiCardHeader, CuiCardBody, CuiButton } from "@itguy614/clean-ui";

defineProps<{
  title?: string;
  code?: string;
}>();

const showCode = ref(false);
</script>

<template>
  <CuiCard variant="outline">
    <CuiCardHeader v-if="title" :title="title">
      <template #actions>
        <CuiButton
          v-if="code"
          variant="ghost"
          size="xs"
          @click="showCode = !showCode"
        >
          {{ showCode ? "Hide Code" : "Show Code" }}
        </CuiButton>
      </template>
    </CuiCardHeader>

    <!-- Preview -->
    <CuiCardBody>
      <slot />
    </CuiCardBody>

    <!-- Code -->
    <div
      v-if="code && showCode"
      :style="{
        borderTop: '1px solid var(--cui-border)',
        padding: '1rem 1.125rem',
        overflow: 'auto',
      }"
    >
      <pre class="cui-pre" style="margin: 0;"><code class="cui-code" style="font-size: 0.8125rem;">{{ code }}</code></pre>
    </div>
  </CuiCard>
</template>
