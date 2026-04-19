<script setup lang="ts">
import {
  CuiCard,
  CuiCardBody,
  CuiCopyButton,
  CuiFlex,
  CuiInput,
  CuiStack,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const apiKey = "sk_live_4eC39HqLyjWDarjtT1zdp7dc";
const inviteLink = "https://app.example.com/invite/abc123";
const codeSnippet = `npm install @itguy614/clean-ui`;
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Copy Button</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A button that copies text to the clipboard with visual feedback.
        Use standalone, inside inputs, or next to code blocks.
        Also exports a <code class="cui-code">useCopyToClipboard</code> composable for custom UIs.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiCopyButton Props</h2>
      <PropTable
        :props="[
          { name: 'value', type: 'string', default: '—', description: 'Text to copy (required)' },
          { name: 'size', type: 'xs | sm | md', default: 'sm', description: 'Button size' },
          { name: 'color', type: 'primary | secondary | ...', default: 'primary', description: 'Color role' },
          { name: 'variant', type: 'ghost | outline', default: 'ghost', description: 'Button variant' },
          { name: 'tooltip', type: 'string', default: 'Copy', description: 'Tooltip before copy' },
          { name: 'copiedTooltip', type: 'string', default: 'Copied!', description: 'Tooltip after copy' },
          { name: 'resetDelay', type: 'number', default: '2000', description: 'Time in ms before resetting' },
          { name: 'showLabel', type: 'boolean', default: 'false', description: 'Show text label alongside icon' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic" :code="`<CuiCopyButton value=&quot;Hello world&quot; />`">
          <CuiFlex gap="3" class="items-center">
            <CuiCopyButton value="Hello world" />
            <CuiCopyButton value="Hello world" variant="outline" />
            <CuiCopyButton value="Hello world" show-label />
            <CuiCopyButton value="Hello world" show-label variant="outline" />
          </CuiFlex>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes">
          <CuiFlex gap="3" class="items-center">
            <CuiCopyButton value="test" size="xs" show-label />
            <CuiCopyButton value="test" size="sm" show-label />
            <CuiCopyButton value="test" size="md" show-label />
          </CuiFlex>
        </Example>

        <!-- Inside an input -->
        <Example title="Inside an Input (suffix slot)" :code="`<CuiInput :model-value=&quot;apiKey&quot; readonly>
  <template #suffix>
    <CuiCopyButton :value=&quot;apiKey&quot; size=&quot;xs&quot; />
  </template>
</CuiInput>`">
          <div class="max-w-md">
            <CuiStack spacing="3">
              <CuiInput :model-value="apiKey" readonly label="API Key">
                <template #suffix>
                  <CuiCopyButton :value="apiKey" size="xs" />
                </template>
              </CuiInput>
              <CuiInput :model-value="inviteLink" readonly label="Invite Link">
                <template #suffix>
                  <CuiCopyButton :value="inviteLink" size="xs" />
                </template>
              </CuiInput>
            </CuiStack>
          </div>
        </Example>

        <!-- Next to a code block -->
        <Example title="Code Block with Copy">
          <div style="position: relative; max-width: 28rem;">
            <pre class="cui-pre" style="padding-right: 3rem;"><code class="cui-code">{{ codeSnippet }}</code></pre>
            <div style="position: absolute; top: 0.5rem; right: 0.5rem;">
              <CuiCopyButton :value="codeSnippet" size="xs" variant="outline" />
            </div>
          </div>
        </Example>

        <!-- Inline with text -->
        <Example title="Inline with Text">
          <CuiStack spacing="3">
            <CuiFlex gap="2" class="items-center">
              <span class="text-sm font-medium">Order ID:</span>
              <code class="cui-code" style="font-size: 0.8125rem;">ORD-2024-8847</code>
              <CuiCopyButton value="ORD-2024-8847" size="xs" />
            </CuiFlex>
            <CuiFlex gap="2" class="items-center">
              <span class="text-sm font-medium">Tracking:</span>
              <code class="cui-code" style="font-size: 0.8125rem;">1Z999AA10123456784</code>
              <CuiCopyButton value="1Z999AA10123456784" size="xs" />
            </CuiFlex>
          </CuiStack>
        </Example>

        <!-- Card with copyable content -->
        <Example title="Real-World: Credentials Card">
          <CuiCard variant="outline" style="max-width: 24rem;">
            <CuiCardBody>
              <CuiStack spacing="3">
                <div class="text-sm font-semibold">Database Credentials</div>
                <div>
                  <div class="text-xs font-medium" style="color: var(--cui-text-tertiary); margin-bottom: 0.25rem;">Host</div>
                  <CuiFlex gap="2" class="items-center">
                    <code class="cui-code" style="font-size: 0.8125rem; flex: 1;">db.example.com:5432</code>
                    <CuiCopyButton value="db.example.com:5432" size="xs" />
                  </CuiFlex>
                </div>
                <div>
                  <div class="text-xs font-medium" style="color: var(--cui-text-tertiary); margin-bottom: 0.25rem;">Username</div>
                  <CuiFlex gap="2" class="items-center">
                    <code class="cui-code" style="font-size: 0.8125rem; flex: 1;">app_readonly</code>
                    <CuiCopyButton value="app_readonly" size="xs" />
                  </CuiFlex>
                </div>
                <div>
                  <div class="text-xs font-medium" style="color: var(--cui-text-tertiary); margin-bottom: 0.25rem;">Connection String</div>
                  <CuiFlex gap="2" class="items-center">
                    <code class="cui-code" style="font-size: 0.8125rem; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">postgresql://app_readonly@db.example.com:5432/prod</code>
                    <CuiCopyButton value="postgresql://app_readonly@db.example.com:5432/prod" size="xs" />
                  </CuiFlex>
                </div>
              </CuiStack>
            </CuiCardBody>
          </CuiCard>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
