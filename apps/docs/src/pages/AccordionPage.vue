<script setup lang="ts">
import { ref } from "vue";
import {
  CuiAccordion,
  CuiAccordionItem,
  CuiBadge,
  CuiFlex,
  CuiFormField,
  CuiIcon,
  CuiInput,
  CuiStack,
  CuiToggle,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/accordion";

const basic = ref<string[]>([]);
const multi = ref<string[]>(["item1"]);
const controlled = ref<string[]>(["general"]);
const faq = ref<string[]>([]);
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiAccordion v-model=&quot;open&quot;>
  <CuiAccordionItem value=&quot;item1&quot; label=&quot;What is Clean UI?&quot;>
    Content here
  </CuiAccordionItem>
  <CuiAccordionItem value=&quot;item2&quot; label=&quot;How do I install it?&quot;>
    Content here
  </CuiAccordionItem>
</CuiAccordion>`"
      >
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
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        Each item is the pair the ARIA accordion pattern asks for: the header is a real
        <code>&lt;button&gt;</code> carrying <code>aria-expanded</code> and
        <code>aria-controls</code>, and the panel is a <code>role="region"</code> labelled
        by that button — so a screen reader announces the panel with its own header's name
        when you move into it.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <strong>Tab</strong> moves to the accordion and then out of it — the headers are
          not a tab stop each. Within it:
          <strong>↓</strong> / <strong>↑</strong> move between headers and wrap around,
          <strong>Home</strong> and <strong>End</strong> jump to the first and last, and
          <strong>Enter</strong> or <strong>Space</strong> toggles the focused one.
        </li>
        <li>
          A <code>disabled</code> item uses <code>aria-disabled</code> rather than the
          <code>disabled</code> attribute, so it keeps its name in the accessibility tree
          instead of vanishing. Arrow navigation skips it.
        </li>
        <li>
          <code>value</code> becomes the trigger's and panel's DOM ids
          (<code>cui-accordion-trigger-{value}</code> and
          <code>cui-accordion-panel-{value}</code>). Two accordions on one page using the
          same values produce duplicate ids and the <code>aria-controls</code> wiring points
          at the wrong panel — keep values unique per page, not per accordion.
        </li>
        <li>
          The header button's label comes from <code>label</code> or the
          <code>#header</code> slot. Everything you put in that slot is part of the button's
          accessible name, so keep it to text and badges — not another control, which would
          be a button inside a button.
        </li>
        <li>
          Focus is shown inside the header's own edge (<code>outline-offset: -2px</code>),
          so it stays visible against the accordion's border rather than being clipped by it.
        </li>
      </ul>
    </template>

    <template #examples>

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
      <Example title="Default Open" :code="`<CuiAccordion multiple>
  <CuiAccordionItem value=&quot;open1&quot; label=&quot;I start open&quot; default-open>
    This item was expanded by default when the page loaded.
  </CuiAccordionItem>
  <CuiAccordionItem value=&quot;closed1&quot; label=&quot;I start closed&quot;>
    Click to expand me.
  </CuiAccordionItem>
</CuiAccordion>`">
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
      <Example title="Disabled Item" :code="`<CuiAccordion>
  <CuiAccordionItem value=&quot;a&quot; label=&quot;Enabled item&quot;>...</CuiAccordionItem>
  <CuiAccordionItem value=&quot;b&quot; label=&quot;Disabled item&quot; disabled>...</CuiAccordionItem>
</CuiAccordion>`">
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
      <Example title="Custom Header Slot" :code="`<CuiAccordion multiple>
  <CuiAccordionItem value=&quot;notifications&quot;>
    <template #header>
      <CuiFlex gap=&quot;2&quot; class=&quot;items-center&quot;>
        <CuiIcon name=&quot;bell&quot; size=&quot;sm&quot; />
        Notifications
        <CuiBadge variant=&quot;solid&quot; color=&quot;error&quot; size=&quot;sm&quot;>3</CuiBadge>
      </CuiFlex>
    </template>
    Content here.
  </CuiAccordionItem>
</CuiAccordion>`">
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

      <!-- No Animation -->
      <Example title="No Animation" :code="`<CuiAccordion no-animation>
  <CuiAccordionItem value=&quot;a&quot; label=&quot;Instant toggle&quot;>
    No smooth height transition.
  </CuiAccordionItem>
</CuiAccordion>`">
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
      <Example title="Rich Content (form inside accordion)" :code="`<CuiAccordion v-model=&quot;controlled&quot; multiple>
  <CuiAccordionItem value=&quot;general&quot; label=&quot;General Settings&quot;>
    <CuiStack spacing=&quot;3&quot;>
      <CuiFormField label=&quot;Display Name&quot;>
        <CuiInput placeholder=&quot;John Doe&quot; />
      </CuiFormField>
    </CuiStack>
  </CuiAccordionItem>
</CuiAccordion>`">
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
      <Example title="Real-World: FAQ" :code="`<CuiAccordion v-model=&quot;faq&quot;>
  <CuiAccordionItem value=&quot;q1&quot; label=&quot;Is Clean UI free to use?&quot;>
    Yes, Clean UI is open source.
  </CuiAccordionItem>
  <CuiAccordionItem value=&quot;q2&quot; label=&quot;Does it work with Nuxt?&quot;>
    Yes! It works with any Vue 3 framework.
  </CuiAccordionItem>
</CuiAccordion>`">
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

    </template>
  </DocPage>
</template>
