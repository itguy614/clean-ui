<script setup lang="ts">
import { ref } from "vue";
import {
  CuiAccordion,
  CuiAccordionItem,
  CuiBadge,
  CuiCard,
  CuiCardBody,
  CuiFlex,
  CuiFormField,
  CuiIcon,
  CuiInput,
  CuiStack,
  CuiToggle,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const basic = ref<string[]>([]);
const multi = ref<string[]>(["item1"]);
const controlled = ref<string[]>(["general"]);
const faq = ref<string[]>([]);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Accordion</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Expandable content sections. Single or multiple items open at once,
        smooth height animation, keyboard navigation.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiAccordion Props</h2>
      <PropTable
        :props="[
          { name: 'v-model', type: 'string[]', default: '[]', description: 'Array of open item values' },
          { name: 'multiple', type: 'boolean', default: 'false', description: 'Allow multiple items open at once' },
          { name: 'color', type: 'ButtonColor', default: 'primary', description: 'Active header color' },
          { name: 'noAnimation', type: 'boolean', default: 'false', description: 'Disable expand/collapse animation' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiAccordionItem Props</h2>
      <PropTable
        :props="[
          { name: 'value', type: 'string', default: '-', description: 'Unique identifier (required)' },
          { name: 'label', type: 'string', default: '-', description: 'Header text (or use #header slot)' },
          { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Start expanded' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Cannot toggle' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic (single open)" :code="`<CuiAccordion v-model=&quot;open&quot;>
  <CuiAccordionItem value=&quot;item1&quot; label=&quot;Section 1&quot;>
    Content here
  </CuiAccordionItem>
</CuiAccordion>`">
          <div class="max-w-lg">
            <CuiAccordion v-model="basic">
              <CuiAccordionItem value="item1" label="What is Clean UI?">
                Clean UI is a Vue 3 component library built with TypeScript and Tailwind CSS v4.
                It provides a comprehensive set of accessible, themeable components for building
                modern web applications.
              </CuiAccordionItem>
              <CuiAccordionItem value="item2" label="How do I install it?">
                Install via npm or pnpm: <code class="cui-code">pnpm add @itguy614/clean-ui</code>.
                Then import the plugin and styles in your main.ts.
              </CuiAccordionItem>
              <CuiAccordionItem value="item3" label="Does it support dark mode?">
                Yes! All components support dark mode automatically via the <code class="cui-code">.dark</code>
                class on any ancestor element. Theme colors also adapt in dark mode.
              </CuiAccordionItem>
            </CuiAccordion>
          </div>
        </Example>

        <!-- Multiple -->
        <Example title="Multiple Open" :code="`<CuiAccordion v-model=&quot;open&quot; multiple>`">
          <div class="max-w-lg">
            <CuiAccordion v-model="multi" multiple>
              <CuiAccordionItem value="item1" label="First Section">
                This section can be open at the same time as others.
              </CuiAccordionItem>
              <CuiAccordionItem value="item2" label="Second Section">
                Open me without closing the first!
              </CuiAccordionItem>
              <CuiAccordionItem value="item3" label="Third Section">
                All three can be open simultaneously.
              </CuiAccordionItem>
            </CuiAccordion>
          </div>
        </Example>

        <!-- Default Open -->
        <Example title="Default Open">
          <div class="max-w-lg">
            <CuiAccordion multiple>
              <CuiAccordionItem value="open1" label="I start open" default-open>
                This item was expanded by default when the page loaded.
              </CuiAccordionItem>
              <CuiAccordionItem value="closed1" label="I start closed">
                Click to expand me.
              </CuiAccordionItem>
            </CuiAccordion>
          </div>
        </Example>

        <!-- Disabled -->
        <Example title="Disabled Item">
          <div class="max-w-lg">
            <CuiAccordion>
              <CuiAccordionItem value="a" label="Enabled item">
                This item works normally.
              </CuiAccordionItem>
              <CuiAccordionItem value="b" label="Disabled item" disabled>
                You should not see this content.
              </CuiAccordionItem>
              <CuiAccordionItem value="c" label="Another enabled item">
                This item also works normally.
              </CuiAccordionItem>
            </CuiAccordion>
          </div>
        </Example>

        <!-- Custom Header -->
        <Example title="Custom Header Slot">
          <div class="max-w-lg">
            <CuiAccordion multiple>
              <CuiAccordionItem value="notifications">
                <template #header>
                  <CuiFlex gap="2" class="items-center">
                    <CuiIcon name="bell" size="sm" />
                    Notifications
                    <CuiBadge variant="solid" color="error" size="sm">3</CuiBadge>
                  </CuiFlex>
                </template>
                You have 3 unread notifications. Configure your preferences below.
              </CuiAccordionItem>
              <CuiAccordionItem value="security">
                <template #header>
                  <CuiFlex gap="2" class="items-center">
                    <CuiIcon name="shield-check" size="sm" />
                    Security
                    <CuiBadge color="success" size="sm">Enabled</CuiBadge>
                  </CuiFlex>
                </template>
                Two-factor authentication is active. Last login from 192.168.1.1.
              </CuiAccordionItem>
            </CuiAccordion>
          </div>
        </Example>

        <!-- Colors -->
        <Example title="Colors">
          <CuiStack spacing="3" class="max-w-lg">
            <CuiAccordion color="primary">
              <CuiAccordionItem value="a" label="Primary" default-open>Primary colored header when open.</CuiAccordionItem>
            </CuiAccordion>
            <CuiAccordion color="success">
              <CuiAccordionItem value="a" label="Success" default-open>Success colored header when open.</CuiAccordionItem>
            </CuiAccordion>
            <CuiAccordion color="error">
              <CuiAccordionItem value="a" label="Error" default-open>Error colored header when open.</CuiAccordionItem>
            </CuiAccordion>
          </CuiStack>
        </Example>

        <!-- No Animation -->
        <Example title="No Animation">
          <div class="max-w-lg">
            <CuiAccordion no-animation>
              <CuiAccordionItem value="a" label="Instant toggle">
                No smooth height transition — expands and collapses instantly.
              </CuiAccordionItem>
              <CuiAccordionItem value="b" label="Another instant item">
                Useful when animation feels slow or distracting.
              </CuiAccordionItem>
            </CuiAccordion>
          </div>
        </Example>

        <!-- Rich Content -->
        <Example title="Rich Content (form inside accordion)">
          <div class="max-w-lg">
            <CuiAccordion v-model="controlled" multiple>
              <CuiAccordionItem value="general" label="General Settings">
                <CuiStack spacing="3">
                  <CuiFormField label="Display Name">
                    <CuiInput placeholder="John Doe" />
                  </CuiFormField>
                  <CuiFormField label="Email">
                    <CuiInput placeholder="you@example.com" type="email" />
                  </CuiFormField>
                </CuiStack>
              </CuiAccordionItem>
              <CuiAccordionItem value="preferences" label="Preferences">
                <CuiStack spacing="3">
                  <CuiToggle label="Email notifications" :model-value="true" />
                  <CuiToggle label="Dark mode" :model-value="false" />
                  <CuiToggle label="Compact layout" :model-value="false" />
                </CuiStack>
              </CuiAccordionItem>
            </CuiAccordion>
          </div>
        </Example>

        <!-- FAQ Pattern -->
        <Example title="Real-World: FAQ">
          <div class="max-w-lg">
            <CuiAccordion v-model="faq">
              <CuiAccordionItem value="q1" label="Is Clean UI free to use?">
                Yes, Clean UI is open source and free for both personal and commercial projects.
              </CuiAccordionItem>
              <CuiAccordionItem value="q2" label="Does it work with Nuxt?">
                Clean UI is built for Vue 3 and works with any Vue 3 framework including Nuxt 3,
                Inertia.js, and plain Vite setups.
              </CuiAccordionItem>
              <CuiAccordionItem value="q3" label="Can I customize the colors?">
                Absolutely. The theme system lets you override any color via CSS custom properties.
                You can also create entirely custom themes with your own brand palette.
              </CuiAccordionItem>
              <CuiAccordionItem value="q4" label="How do I report a bug?">
                Open an issue on GitHub or submit a pull request. We welcome contributions!
              </CuiAccordionItem>
            </CuiAccordion>
          </div>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
