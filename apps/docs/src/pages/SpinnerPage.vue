<script setup lang="ts">
import { CuiCard, CuiCardBody, CuiFlex, CuiGrid, CuiSpinner, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/spinner";
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example code-open :code="`<CuiSpinner />`">
        <CuiSpinner />
      </Example>
    </template>

    <template #accessibility>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        The spinner is a <code>role="status"</code> region labelled by <code>label</code>,
        which defaults to "Loading". The label is always announced — when
        <code>show-label</code> is false it renders as visually hidden text rather than
        being dropped, so the spinner is never a silent animation.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        Make the label say what is loading when there is more than one on a page: "Loading
        invoices" beats three regions all announcing "Loading". A spinner with no
        surrounding context is the one case where the default is not enough.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        All three variants animate continuously, which is motion a user may have asked to
        avoid. The animation is small and in place rather than travelling, so it stays
        within what <abbr title="Web Content Accessibility Guidelines">WCAG</abbr> 2.3.3
        contemplates — but prefer <code>CuiSkeleton</code> with
        <code>animation="none"</code> when a whole region is loading and you are honouring
        reduced motion.
      </p>
    </template>

    <template #examples>
      <!-- Variants -->
      <Example title="Variants" :code="`<CuiSpinner variant=&quot;ring&quot; />
<CuiSpinner variant=&quot;dots&quot; />
<CuiSpinner variant=&quot;bars&quot; />`">
        <CuiFlex gap="6" class="items-center">
          <div class="text-center">
            <CuiSpinner variant="ring" size="lg" />
            <div class="mt-2 text-xs" style="color: var(--cui-text-secondary);">Ring</div>
          </div>
          <div class="text-center">
            <CuiSpinner variant="dots" size="lg" />
            <div class="mt-2 text-xs" style="color: var(--cui-text-secondary);">Dots</div>
          </div>
          <div class="text-center">
            <CuiSpinner variant="bars" size="lg" />
            <div class="mt-2 text-xs" style="color: var(--cui-text-secondary);">Bars</div>
          </div>
        </CuiFlex>
      </Example>

      <!-- Sizes -->
      <Example title="Sizes" :code="`<CuiSpinner size=&quot;xs&quot; />
<CuiSpinner size=&quot;sm&quot; />
<CuiSpinner size=&quot;md&quot; />
<CuiSpinner size=&quot;lg&quot; />
<CuiSpinner size=&quot;xl&quot; />`">
        <CuiStack spacing="4">
          <div v-for="variant in (['ring', 'dots', 'bars'] as const)" :key="variant">
            <div class="mb-2 text-sm font-medium" style="color: var(--cui-text-secondary);">{{ variant }}:</div>
            <CuiFlex gap="4" class="items-center">
              <CuiSpinner :variant="variant" size="xs" />
              <CuiSpinner :variant="variant" size="sm" />
              <CuiSpinner :variant="variant" size="md" />
              <CuiSpinner :variant="variant" size="lg" />
              <CuiSpinner :variant="variant" size="xl" />
            </CuiFlex>
          </div>
        </CuiStack>
      </Example>

      <!-- Colors -->
      <Example title="Colors" :code="`<CuiSpinner color=&quot;primary&quot; />
<CuiSpinner color=&quot;success&quot; />
<CuiSpinner color=&quot;error&quot; />
<CuiSpinner color=&quot;warning&quot; />
<CuiSpinner color=&quot;info&quot; />
<CuiSpinner color=&quot;secondary&quot; />`">
        <CuiFlex gap="4" class="items-center">
          <CuiSpinner color="primary" size="lg" />
          <CuiSpinner color="secondary" size="lg" />
          <CuiSpinner color="success" size="lg" />
          <CuiSpinner color="error" size="lg" />
          <CuiSpinner color="warning" size="lg" />
          <CuiSpinner color="info" size="lg" />
        </CuiFlex>
      </Example>

      <!-- With label -->
      <Example title="With Label" :code="`<CuiSpinner show-label label=&quot;Loading...&quot; />`">
        <CuiFlex gap="6" class="items-start">
          <CuiSpinner show-label label="Loading..." />
          <CuiSpinner show-label label="Saving..." variant="dots" color="success" />
          <CuiSpinner show-label label="Processing..." variant="bars" color="warning" />
        </CuiFlex>
      </Example>

      <!-- Real-world: Card loading -->
      <Example title="Real-World: Card Loading State" :code="`<CuiCard variant=&quot;outline&quot;>
<CuiCardBody style=&quot;display: flex; align-items: center; justify-content: center; min-height: 8rem;&quot;>
  <CuiSpinner show-label label=&quot;Loading data...&quot; />
</CuiCardBody>
</CuiCard>`">
        <CuiGrid :cols="{ sm: 1, md: 3 }" gap="4">
          <CuiCard variant="outline">
            <CuiCardBody style="display: flex; align-items: center; justify-content: center; min-height: 8rem;">
              <CuiSpinner show-label label="Loading data..." />
            </CuiCardBody>
          </CuiCard>
          <CuiCard variant="outline">
            <CuiCardBody style="display: flex; align-items: center; justify-content: center; min-height: 8rem;">
              <CuiSpinner variant="dots" show-label label="Fetching..." color="info" />
            </CuiCardBody>
          </CuiCard>
          <CuiCard variant="outline">
            <CuiCardBody style="display: flex; align-items: center; justify-content: center; min-height: 8rem;">
              <CuiSpinner variant="bars" show-label label="Syncing..." color="success" />
            </CuiCardBody>
          </CuiCard>
        </CuiGrid>
      </Example>

      <!-- Inline with text -->
      <Example title="Inline with Text" :code="`<CuiFlex gap=&quot;2&quot; class=&quot;items-center&quot;>
<CuiSpinner size=&quot;xs&quot; />
<span>Checking availability...</span>
</CuiFlex>`">
        <CuiStack spacing="3">
          <CuiFlex gap="2" class="items-center">
            <CuiSpinner size="xs" />
            <span class="text-sm" style="color: var(--cui-text-secondary);">Checking availability...</span>
          </CuiFlex>
          <CuiFlex gap="2" class="items-center">
            <CuiSpinner size="xs" variant="dots" color="success" />
            <span class="text-sm" style="color: var(--cui-text-secondary);">Uploading file...</span>
          </CuiFlex>
          <CuiFlex gap="2" class="items-center">
            <CuiSpinner size="xs" variant="bars" color="warning" />
            <span class="text-sm" style="color: var(--cui-text-secondary);">Connecting to server...</span>
          </CuiFlex>
        </CuiStack>
      </Example>

    </template>
  </DocPage>
</template>
