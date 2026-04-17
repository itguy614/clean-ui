<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiCard, CuiCardBody, CuiFlex, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const isLoading = ref(false);

function simulateLoad() {
  isLoading.value = true;
  setTimeout(() => {
    isLoading.value = false;
  }, 2000);
}
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Button</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Interactive button component with semantic colors, multiple variants,
        sizes, and loading state.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Color role from the color system' },
          { name: 'variant', type: 'solid | outline | dash | ghost', default: 'outline', description: 'Visual variant' },
          { name: 'size', type: 'xs | sm | md | lg | xl', default: 'md', description: 'Button size (md matches 1rem body text)' },
          { name: 'rounded', type: 'sm | md | lg | full', default: 'md', description: 'Border radius (md uses --cui-button-radius)' },
          { name: 'type', type: 'button | submit | reset', default: 'button', description: 'HTML button type attribute' },
          { name: 'href', type: 'string', default: '-', description: 'Renders as <a> link with this URL' },
          { name: 'to', type: 'string | object', default: '-', description: 'Renders as <router-link> with this route' },
          { name: 'loading', type: 'boolean', default: 'false', description: 'Shows spinner and disables interaction' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state (uses aria-disabled for links)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Colors -->
        <Example title="Colors" :code="`<CuiButton color=&quot;primary&quot;>Primary</CuiButton>
<CuiButton color=&quot;success&quot;>Success</CuiButton>
<CuiButton color=&quot;error&quot;>Error</CuiButton>`">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButton color="primary">Primary</CuiButton>
            <CuiButton color="secondary">Secondary</CuiButton>
            <CuiButton color="success">Success</CuiButton>
            <CuiButton color="error">Error</CuiButton>
            <CuiButton color="warning">Warning</CuiButton>
            <CuiButton color="info">Info</CuiButton>
          </CuiFlex>
        </Example>

        <!-- Variants -->
        <Example title="Variants" :code="`<CuiButton variant=&quot;solid&quot;>Solid</CuiButton>
<CuiButton variant=&quot;outline&quot;>Outline</CuiButton>
<CuiButton variant=&quot;dash&quot;>Dash</CuiButton>
<CuiButton variant=&quot;ghost&quot;>Ghost</CuiButton>`">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButton variant="solid">Solid</CuiButton>
            <CuiButton variant="outline">Outline</CuiButton>
            <CuiButton variant="dash">Dash</CuiButton>
            <CuiButton variant="ghost">Ghost</CuiButton>
          </CuiFlex>
        </Example>

        <!-- Solid Variants in All Colors -->
        <Example title="Solid — All Colors">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButton variant="solid" color="primary">Primary</CuiButton>
            <CuiButton variant="solid" color="secondary">Secondary</CuiButton>
            <CuiButton variant="solid" color="success">Success</CuiButton>
            <CuiButton variant="solid" color="error">Error</CuiButton>
            <CuiButton variant="solid" color="warning">Warning</CuiButton>
            <CuiButton variant="solid" color="info">Info</CuiButton>
          </CuiFlex>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes" :code="`<CuiButton size=&quot;xs&quot;>XS</CuiButton>
<CuiButton size=&quot;sm&quot;>Small</CuiButton>
<CuiButton size=&quot;md&quot;>Medium</CuiButton>
<CuiButton size=&quot;lg&quot;>Large</CuiButton>
<CuiButton size=&quot;xl&quot;>XL</CuiButton>`">
          <CuiFlex gap="3" class="items-center flex-wrap">
            <CuiButton size="xs">Extra Small</CuiButton>
            <CuiButton size="sm">Small</CuiButton>
            <CuiButton size="md">Medium</CuiButton>
            <CuiButton size="lg">Large</CuiButton>
            <CuiButton size="xl">Extra Large</CuiButton>
          </CuiFlex>
        </Example>

        <!-- Rounded -->
        <Example title="Rounded" :code="`<CuiButton rounded=&quot;sm&quot;>Sm</CuiButton>
<CuiButton rounded=&quot;full&quot;>Pill</CuiButton>`">
          <CuiFlex gap="3" class="items-center flex-wrap">
            <CuiButton rounded="sm">Small Radius</CuiButton>
            <CuiButton rounded="md">Medium (default)</CuiButton>
            <CuiButton rounded="lg">Large Radius</CuiButton>
            <CuiButton rounded="full">Pill Shape</CuiButton>
          </CuiFlex>
        </Example>

        <!-- Loading -->
        <Example title="Loading State" :code="`<CuiButton :loading=&quot;true&quot;>Saving...</CuiButton>`">
          <CuiFlex gap="3" class="items-center flex-wrap">
            <CuiButton :loading="isLoading" variant="solid" @click="simulateLoad">
              {{ isLoading ? "Saving..." : "Click to Load" }}
            </CuiButton>
            <CuiButton :loading="true" color="success" variant="solid">Processing</CuiButton>
            <CuiButton :loading="true" color="info">Loading</CuiButton>
          </CuiFlex>
        </Example>

        <!-- Disabled -->
        <Example title="Disabled State">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButton disabled variant="solid">Solid Disabled</CuiButton>
            <CuiButton disabled variant="outline">Outline Disabled</CuiButton>
            <CuiButton disabled variant="ghost">Ghost Disabled</CuiButton>
          </CuiFlex>
        </Example>

        <!-- Mixed: Color + Variant Combos -->
        <Example title="Color + Variant Combinations">
          <CuiStack spacing="3">
            <CuiFlex gap="3" class="flex-wrap">
              <CuiButton variant="solid" color="error">Delete Account</CuiButton>
              <CuiButton variant="outline" color="error">Cancel</CuiButton>
              <CuiButton variant="ghost" color="secondary">Dismiss</CuiButton>
            </CuiFlex>
            <CuiFlex gap="3" class="flex-wrap">
              <CuiButton variant="solid" color="success" size="lg">Confirm Purchase</CuiButton>
              <CuiButton variant="dash" color="info">Add Optional</CuiButton>
            </CuiFlex>
          </CuiStack>
        </Example>

        <!-- Link Mode -->
        <Example title="Link Buttons" :code="`<CuiButton href=&quot;https://example.com&quot;>External Link</CuiButton>
<CuiButton to=&quot;/&quot;>Router Link</CuiButton>`">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButton href="https://github.com" variant="solid" color="primary">
              External Link
            </CuiButton>
            <CuiButton to="/" color="info">
              Router Link Home
            </CuiButton>
            <CuiButton href="#" disabled>
              Disabled Link
            </CuiButton>
          </CuiFlex>
        </Example>

        <!-- Prefix / Suffix Slots -->
        <Example title="Prefix &amp; Suffix Slots" :code="`<CuiButton variant=&quot;solid&quot;>
  <template #prefix>←</template>
  Back
</CuiButton>`">
          <CuiFlex gap="3" class="items-center flex-wrap">
            <CuiButton variant="solid">
              <template #prefix>←</template>
              Back
            </CuiButton>
            <CuiButton variant="solid" color="success">
              Next
              <template #suffix>→</template>
            </CuiButton>
            <CuiButton variant="outline" color="error">
              <template #prefix>✕</template>
              Delete
            </CuiButton>
            <CuiButton variant="solid" color="info" size="lg">
              <template #prefix>⬇</template>
              Download
              <template #suffix>.zip</template>
            </CuiButton>
          </CuiFlex>
        </Example>

        <!-- Button Type -->
        <Example title="Button Types">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButton type="button">type=button (default)</CuiButton>
            <CuiButton type="submit" variant="solid" color="success">type=submit</CuiButton>
            <CuiButton type="reset" color="secondary">type=reset</CuiButton>
          </CuiFlex>
        </Example>

      </CuiStack>
    </div>

    <!-- Customization -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Customization</h2>
      <CuiCard>
        <CuiCardBody>
          <p class="mb-3 text-surface-600 dark:text-surface-400">
            Override the global border radius for all buttons:
          </p>
          <pre class="cui-pre"><code>:root {
  --cui-button-radius: 0.5rem;   /* rounder */
}</code></pre>
        </CuiCardBody>
      </CuiCard>
    </div>
  </CuiStack>
</template>
