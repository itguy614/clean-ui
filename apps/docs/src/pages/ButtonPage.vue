<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiCard, CuiCardBody, CuiFlex, CuiIcon, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";
import Playground from "../components/Playground.vue";

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

    <CuiCard variant="outline">
      <CuiCardBody>
        <p class="text-sm text-surface-700 dark:text-surface-300">
          <strong><code>color</code> vs <code>variant</code>:</strong>
          <code>color</code> sets the semantic role (<code>primary</code>,
          <code>success</code>, <code>error</code>, <code>warning</code>,
          <code>info</code>, …); <code>variant</code> sets the visual style
          (<code>solid</code>, <code>outline</code>, <code>dash</code>,
          <code>ghost</code>). Passing a role name to <code>variant</code> (e.g.
          <code>variant="primary"</code>) won't work — use
          <code>color="primary"</code>. Note the role for “danger” is
          <code>error</code>.
        </p>
      </CuiCardBody>
    </CuiCard>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'color', type: 'primary | secondary | success | error | warning | info | surface | surface-light | surface-dark', default: 'primary', description: 'Color role from the color system' },
          { name: 'variant', type: 'solid | outline | dash | ghost', default: 'outline', description: 'Visual variant' },
          { name: 'size', type: 'xs | sm | md | lg | xl', default: 'md', description: 'Button size (md matches 1rem body text)' },
          { name: 'rounded', type: 'sm | md | lg | full', default: 'md', description: 'Border radius (md uses --cui-button-radius)' },
          { name: 'type', type: 'button | submit | reset', default: 'button', description: 'HTML button type attribute' },
          { name: 'href', type: 'string', default: '-', description: 'Renders as <a> link with this URL' },
          { name: 'to', type: 'string | object', default: '-', description: 'Renders as <router-link> with this route' },
          { name: 'icon', type: 'boolean', default: 'false', description: 'Icon-only: square, no horizontal padding. Also opts out of the 24px minimum target size' },
          { name: 'loading', type: 'boolean', default: 'false', description: 'Shows spinner and disables interaction' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state (uses aria-disabled for links)' },
        ]"
      />
    </div>

    <!-- Playground -->
    <div>
      <h2 style="margin-bottom: 1rem; font-size: 1.5rem; font-weight: 600;">Playground</h2>
      <Playground
        :component="CuiButton"
        component-name="CuiButton"
        :props="{
          variant: { type: 'select', options: ['solid', 'outline', 'dash', 'ghost'], default: 'outline' },
          color: { type: 'select', options: ['primary', 'secondary', 'success', 'error', 'warning', 'info'], default: 'primary' },
          size: { type: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'], default: 'md' },
          rounded: { type: 'select', options: ['sm', 'md', 'lg', 'full'], default: 'md' },
          type: { type: 'select', options: ['button', 'submit', 'reset'], default: 'button' },
          loading: { type: 'boolean', default: false },
          disabled: { type: 'boolean', default: false },
        }"
        slot-content="Click Me"
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

        <!-- Icon-only -->
        <Example title="Icon Buttons" :code="`<CuiButton icon variant=&quot;solid&quot; color=&quot;error&quot;>
  <CuiIcon name=&quot;trash&quot; />
</CuiButton>`">
          <CuiFlex gap="3" class="items-center flex-wrap">
            <CuiButton icon size="sm"><CuiIcon name="copy" /></CuiButton>
            <CuiButton icon variant="solid"><CuiIcon name="check" /></CuiButton>
            <CuiButton icon variant="solid" color="error"><CuiIcon name="trash" /></CuiButton>
            <CuiButton icon variant="ghost" color="secondary"><CuiIcon name="dots-three" /></CuiButton>
            <CuiButton icon size="lg" variant="outline" color="info"><CuiIcon name="eye" /></CuiButton>
            <CuiButton icon rounded="full" variant="solid" color="success"><CuiIcon name="plus" /></CuiButton>
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

    <!-- Target size -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Minimum target size</h2>
      <CuiCard variant="outline">
        <CuiCardBody>
          <p class="mb-3 text-surface-600 dark:text-surface-400">
            Control heights are floored at 24px &mdash; the WCAG 2.5.8 minimum target size.
            The floor only binds at <code>size="xs"</code> under compact density; at every
            other size the computed height already clears it.
          </p>
          <pre class="cui-pre"><code>/* relax it for a dense strip — buttons AND inputs inside */
.dense-toolbar {
  --cui-control-min-target: 0px;
}</code></pre>
          <p class="mt-3 text-sm text-surface-600 dark:text-surface-400">
            <code>icon</code> opts out on its own, since an icon-only button is usually
            deliberately small. Both routes take you below the accessibility minimum, so
            they are worth using knowingly rather than by habit &mdash; the property exists
            so that going below the floor is a deliberate, greppable act.
          </p>
        </CuiCardBody>
      </CuiCard>
    </div>

    <!-- Customization -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Customization</h2>
      <CuiCard variant="outline">
        <CuiCardBody>
          <p class="mb-3 text-surface-600 dark:text-surface-400">
            Every property a button computes is exposed as a custom property. Set one on
            <code>:root</code>, on any container, or on the button itself — no
            <code>!important</code>, and no dependence on stylesheet order.
          </p>
          <pre class="cui-pre"><code>/* every button in a subtree */
.admin-toolbar {
  --cui-button-bg: var(--cui-surface-bg);
  --cui-button-hover-bg: var(--cui-surface-hover);
  --cui-button-height: 2.25rem;
}</code></pre>
          <p class="mt-4 mb-2 font-semibold">Box</p>
          <pre class="cui-pre"><code>--cui-button-height      --cui-button-gap
--cui-button-px          --cui-button-font-size
--cui-button-radius</code></pre>
          <p class="mt-4 mb-2 font-semibold">Paint</p>
          <pre class="cui-pre"><code>--cui-button-bg          --cui-button-border
--cui-button-color</code></pre>
          <p class="mt-4 mb-2 font-semibold">Interaction</p>
          <pre class="cui-pre"><code>--cui-button-hover-bg    --cui-button-active-bg
--cui-button-hover-color --cui-button-focus-ring
--cui-button-hover-border</code></pre>
          <p class="mt-4 text-sm text-surface-600 dark:text-surface-400">
            <strong>How it works:</strong> the button computes its per-variant values into
            private <code>--_button-*</code> properties and reads each one back as
            <code>var(--cui-button-bg, var(--_button-bg))</code>, so your token wins
            wherever you set it and the variant supplies the default. The rules themselves
            are wrapped in <code>:where()</code>, which makes them zero-specificity — so a
            plain <code>.cui-button { background: … }</code> rule of your own works too.
          </p>
        </CuiCardBody>
      </CuiCard>
    </div>
  </CuiStack>
</template>
