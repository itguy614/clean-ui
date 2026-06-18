<script setup lang="ts">
import { ref, computed } from "vue";
import {
  CuiConfigProvider,
  CuiStack,
  CuiCard,
  CuiCardBody,
  CuiCardHeader,
  CuiButton,
  CuiButtonGroup,
  CuiPagination,
  CuiSelect,
  type DeepPartialMessages,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

// A small Spanish sample to demonstrate "set defaults once".
const es: DeepPartialMessages = {
  clear: "Limpiar",
  pagination: {
    summary: ({ from, to, total }) => `Mostrando ${from}–${to} de ${total} resultados`,
    perPage: (n) => `${n} / página`,
  },
};

const locale = ref<"en" | "es">("en");
const messages = computed<DeepPartialMessages>(() => (locale.value === "es" ? es : {}));

const page = ref(1);
const perPage = ref(10);
const selectValue = ref<string | number | null>("a");
const selectOptions = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
];
</script>

<template>
  <CuiStack spacing="8" class="cui-typography">
    <div>
      <h1>Localization</h1>
      <p class="cui-lead">
        Translate clean-ui's built-in strings — aria-labels, button text, empty states,
        pagination — for a whole app at once with <code class="cui-code">CuiConfigProvider</code>,
        instead of overriding props on every instance.
      </p>
    </div>

    <CuiCard variant="outline">
      <CuiCardHeader title="How it works" />
      <CuiCardBody>
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          Wrap your app (or any subtree) in <code class="cui-code">CuiConfigProvider</code> and pass a
          partial <code class="cui-code">messages</code> object. Only the keys you supply are
          replaced; the rest fall back to the built-in English defaults. Providers nest — an inner
          one merges onto the outer. Per-instance props still win over the provider, so the
          resolution order is:
        </p>
        <p class="text-sm" style="margin-top: 0.5rem;">
          <strong>explicit prop &gt; nearest provider &gt; built-in English default</strong>
        </p>
        <p class="text-sm" style="color: var(--cui-text-secondary); margin-top: 0.5rem;">
          Interpolated strings (pagination summary, "N items selected", "Type N more…") are
          <em>functions</em>, so locales control wording, pluralization, and word order.
        </p>
      </CuiCardBody>
    </CuiCard>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiConfigProvider Props</h2>
      <PropTable
        :props="[
          { name: 'messages', type: 'DeepPartialMessages', default: '{}', description: 'Partial overrides for the default message catalog. Unspecified keys fall back to defaults (or a parent provider).' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Live example</h2>
      <Example title="Set the locale once for everything inside" :code="`<CuiConfigProvider :messages=&quot;localeMessages&quot;>
  <!-- every clean-ui component inside now speaks this locale -->
  <CuiPagination v-model:current-page=&quot;page&quot; :per-page=&quot;perPage&quot; :total-items=&quot;42&quot; />
</CuiConfigProvider>

// localeMessages (partial — only what you translate):
const es = {
  clear: 'Limpiar',
  pagination: {
    summary: ({ from, to, total }) => \`Mostrando \${from}–\${to} de \${total} resultados\`,
    perPage: (n) => \`\${n} / página\`,
  },
}`">
        <CuiStack spacing="4">
          <CuiButtonGroup>
            <CuiButton :variant="locale === 'en' ? 'solid' : 'outline'" size="sm" @click="locale = 'en'">English</CuiButton>
            <CuiButton :variant="locale === 'es' ? 'solid' : 'outline'" size="sm" @click="locale = 'es'">Español</CuiButton>
          </CuiButtonGroup>

          <CuiConfigProvider :messages="messages">
            <CuiStack spacing="4">
              <CuiPagination
                v-model:current-page="page"
                :per-page="perPage"
                :total-items="42"
                :per-page-options="[10, 25, 50]"
                @update:per-page="perPage = $event"
              />
              <div style="max-width: 16rem;">
                <CuiSelect v-model="selectValue" :options="selectOptions" clearable />
                <p class="text-xs" style="color: var(--cui-text-secondary); margin-top: 0.25rem;">
                  The clear (✕) button's aria-label is localized too.
                </p>
              </div>
            </CuiStack>
          </CuiConfigProvider>
        </CuiStack>
      </Example>
    </div>

    <CuiCard variant="outline">
      <CuiCardHeader title="Message catalog reference" />
      <CuiCardBody>
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          Shared atoms (reused across components): <code class="cui-code">close</code>,
          <code class="cui-code">dismiss</code>, <code class="cui-code">remove</code>,
          <code class="cui-code">clear</code>, <code class="cui-code">clearAll</code>,
          <code class="cui-code">apply</code>, <code class="cui-code">loading</code>.
        </p>
        <p class="text-sm" style="color: var(--cui-text-secondary); margin-top: 0.5rem;">
          Namespaces: <code class="cui-code">input</code>, <code class="cui-code">combobox</code>,
          <code class="cui-code">confirmDialog</code>, <code class="cui-code">pagination</code>,
          <code class="cui-code">breadcrumb</code>, <code class="cui-code">stepper</code>,
          <code class="cui-code">skeleton</code>, <code class="cui-code">tabs</code>,
          <code class="cui-code">dataGrid</code>. See the
          <code class="cui-code">CuiMessages</code> type for the full shape — your editor will
          autocomplete every key.
        </p>
        <pre class="cui-pre" style="margin-top: 0.75rem;"><code class="cui-code">import type { CuiMessages, DeepPartialMessages } from "@itguy614/clean-ui";
import { defaultMessages } from "@itguy614/clean-ui";  // the English baseline</code></pre>
      </CuiCardBody>
    </CuiCard>
  </CuiStack>
</template>
