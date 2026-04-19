<script setup lang="ts">
import {
  CuiCard, CuiCardBody, CuiGrid, CuiStack, CuiIcon, CuiBadge, CuiFlex,
} from "@itguy614/clean-ui";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Clean UI</h1>
      <p style="margin-top: 0.5rem; font-size: 1.125rem; color: var(--cui-text-secondary);">
        A token-based Vue 3 component library with 8 color themes, dark mode, and WCAG AA accessibility.
      </p>
    </div>

    <CuiCard>
      <CuiCardBody>
        <h2 style="margin-bottom: 1rem; font-size: 1.5rem; font-weight: 600;">Key Features</h2>
        <CuiGrid :cols="{ sm: 1, md: 2, lg: 3 }" gap="6">
          <CuiStack spacing="1">
            <CuiFlex align="center" gap="2">
              <CuiIcon name="palette" size="1.25rem" color="var(--cui-primary)" />
              <h3 style="font-weight: 500;">Token-Based Design</h3>
            </CuiFlex>
            <p style="font-size: 0.875rem; color: var(--cui-text-secondary);">
              CSS custom properties for all colors, spacing, and typography. Override any
              <code class="cui-code" style="font-size: 0.8125rem;">--cui-*</code> token at any scope.
            </p>
          </CuiStack>

          <CuiStack spacing="1">
            <CuiFlex align="center" gap="2">
              <CuiIcon name="swatches" size="1.25rem" color="var(--cui-primary)" />
              <h3 style="font-weight: 500;">8 Color Themes</h3>
            </CuiFlex>
            <p style="font-size: 0.875rem; color: var(--cui-text-secondary);">
              Mono, Navy, Forest, Amber, Azure, Teal, Violet, and Ruby. Apply to any ancestor via CSS class.
            </p>
          </CuiStack>

          <CuiStack spacing="1">
            <CuiFlex align="center" gap="2">
              <CuiIcon name="moon" size="1.25rem" color="var(--cui-primary)" />
              <h3 style="font-weight: 500;">Dark Mode</h3>
            </CuiFlex>
            <p style="font-size: 0.875rem; color: var(--cui-text-secondary);">
              Every component supports dark mode. Semantic tokens auto-swap so themes work in both modes.
            </p>
          </CuiStack>

          <CuiStack spacing="1">
            <CuiFlex align="center" gap="2">
              <CuiIcon name="eye" size="1.25rem" color="var(--cui-primary)" />
              <h3 style="font-weight: 500;">WCAG AA Accessible</h3>
            </CuiFlex>
            <p style="font-size: 0.875rem; color: var(--cui-text-secondary);">
              4.5:1 text contrast, 3:1 non-text contrast, keyboard navigation, ARIA attributes, and focus rings.
            </p>
          </CuiStack>

          <CuiStack spacing="1">
            <CuiFlex align="center" gap="2">
              <CuiIcon name="code" size="1.25rem" color="var(--cui-primary)" />
              <h3 style="font-weight: 500;">TypeScript</h3>
            </CuiFlex>
            <p style="font-size: 0.875rem; color: var(--cui-text-secondary);">
              Full type definitions with autocomplete for all props, events, and slots.
            </p>
          </CuiStack>

          <CuiStack spacing="1">
            <CuiFlex align="center" gap="2">
              <CuiIcon name="puzzle-piece" size="1.25rem" color="var(--cui-primary)" />
              <h3 style="font-weight: 500;">Tailwind CSS v4 Compatible</h3>
            </CuiFlex>
            <p style="font-size: 0.875rem; color: var(--cui-text-secondary);">
              Color scales registered via <code class="cui-code" style="font-size: 0.8125rem;">@theme</code>
              so Tailwind utilities work alongside CUI components.
            </p>
          </CuiStack>
        </CuiGrid>
      </CuiCardBody>
    </CuiCard>

    <div>
      <h2 style="margin-bottom: 1rem; font-size: 1.5rem; font-weight: 600;">Components</h2>
      <CuiGrid :cols="{ sm: 1, md: 2, lg: 3 }" gap="4">
        <CuiCard variant="outline">
          <CuiCardBody>
            <CuiFlex align="center" gap="2" style="margin-bottom: 0.5rem;">
              <h3 style="font-weight: 500;">Layout</h3>
              <CuiBadge size="sm">7</CuiBadge>
            </CuiFlex>
            <p style="font-size: 0.875rem; color: var(--cui-text-secondary);">
              Grid, Flex, Stack, Container, Spacer, Divider, Resizable Panels
            </p>
          </CuiCardBody>
        </CuiCard>

        <CuiCard variant="outline">
          <CuiCardBody>
            <CuiFlex align="center" gap="2" style="margin-bottom: 0.5rem;">
              <h3 style="font-weight: 500;">Form Controls</h3>
              <CuiBadge size="sm">16</CuiBadge>
            </CuiFlex>
            <p style="font-size: 0.875rem; color: var(--cui-text-secondary);">
              Input, Textarea, Select, Checkbox, Radio, Toggle, Slider, Rating, Combobox, Date/Time Pickers, and more
            </p>
          </CuiCardBody>
        </CuiCard>

        <CuiCard variant="outline">
          <CuiCardBody>
            <CuiFlex align="center" gap="2" style="margin-bottom: 0.5rem;">
              <h3 style="font-weight: 500;">Data Display</h3>
              <CuiBadge size="sm">9</CuiBadge>
            </CuiFlex>
            <p style="font-size: 0.875rem; color: var(--cui-text-secondary);">
              Table, DataGrid, Card, Accordion, Badge, Progress, Timeline, Tree View, Code Block
            </p>
          </CuiCardBody>
        </CuiCard>

        <CuiCard variant="outline">
          <CuiCardBody>
            <CuiFlex align="center" gap="2" style="margin-bottom: 0.5rem;">
              <h3 style="font-weight: 500;">Feedback</h3>
              <CuiBadge size="sm">7</CuiBadge>
            </CuiFlex>
            <p style="font-size: 0.875rem; color: var(--cui-text-secondary);">
              Alert, Toast, Banner, Tooltip, Spinner, Skeleton, Empty State
            </p>
          </CuiCardBody>
        </CuiCard>

        <CuiCard variant="outline">
          <CuiCardBody>
            <CuiFlex align="center" gap="2" style="margin-bottom: 0.5rem;">
              <h3 style="font-weight: 500;">Navigation</h3>
              <CuiBadge size="sm">5</CuiBadge>
            </CuiFlex>
            <p style="font-size: 0.875rem; color: var(--cui-text-secondary);">
              Tabs, Breadcrumb, Pagination, Stepper, Dropdown Menu
            </p>
          </CuiCardBody>
        </CuiCard>

        <CuiCard variant="outline">
          <CuiCardBody>
            <CuiFlex align="center" gap="2" style="margin-bottom: 0.5rem;">
              <h3 style="font-weight: 500;">Overlay</h3>
              <CuiBadge size="sm">5</CuiBadge>
            </CuiFlex>
            <p style="font-size: 0.875rem; color: var(--cui-text-secondary);">
              Modal, Slideover, Popover, Context Menu, Confirm Dialog
            </p>
          </CuiCardBody>
        </CuiCard>
      </CuiGrid>
    </div>

    <div>
      <h2 style="margin-bottom: 1rem; font-size: 1.5rem; font-weight: 600;">Quick Start</h2>
      <CuiStack spacing="4">
        <div>
          <h3 style="margin-bottom: 0.5rem; font-size: 1.125rem; font-weight: 500;">1. Install</h3>
          <pre class="cui-pre"><code class="cui-code" style="background: none; padding: 0;">npm install @itguy614/clean-ui</code></pre>
        </div>
        <div>
          <h3 style="margin-bottom: 0.5rem; font-size: 1.125rem; font-weight: 500;">2. Register the plugin</h3>
          <pre class="cui-pre"><code class="cui-code" style="background: none; padding: 0;">import { createCleanUI } from '@itguy614/clean-ui'
import '@itguy614/clean-ui/styles'

app.use(createCleanUI())</code></pre>
        </div>
        <div>
          <h3 style="margin-bottom: 0.5rem; font-size: 1.125rem; font-weight: 500;">3. Use components</h3>
          <pre class="cui-pre"><code class="cui-code" style="background: none; padding: 0;">&lt;CuiStack spacing="4"&gt;
  &lt;CuiButton variant="solid"&gt;Save&lt;/CuiButton&gt;
  &lt;CuiInput label="Name" placeholder="Enter your name" /&gt;
  &lt;CuiAlert color="success"&gt;Changes saved.&lt;/CuiAlert&gt;
&lt;/CuiStack&gt;</code></pre>
        </div>
      </CuiStack>
    </div>

    <CuiCard>
      <CuiCardBody>
        <h2 style="margin-bottom: 0.75rem; font-size: 1.5rem; font-weight: 600;">Architecture</h2>
        <CuiStack spacing="3">
          <p style="font-size: 0.9375rem; color: var(--cui-text-secondary);">
            Clean UI uses <strong>CSS custom properties</strong> as its core styling mechanism.
            Every color, spacing token, and visual state is defined as a
            <code class="cui-code" style="font-size: 0.8125rem;">--cui-*</code> variable that can be
            overridden at any scope.
          </p>
          <p style="font-size: 0.9375rem; color: var(--cui-text-secondary);">
            Components use <strong>inline style bindings</strong> for computed layout and color,
            with scoped CSS for interaction states (hover, focus, animation). This approach ensures
            theme compatibility and avoids Tailwind v4's dynamic class detection limitations.
          </p>
          <p style="font-size: 0.9375rem; color: var(--cui-text-secondary);">
            <strong>Tailwind CSS v4</strong> serves as the build pipeline and provides utility class
            compatibility. The library's color scales are registered via
            <code class="cui-code" style="font-size: 0.8125rem;">@theme</code>, so consumers can freely
            use Tailwind utilities like
            <code class="cui-code" style="font-size: 0.8125rem;">bg-primary-500</code> or
            <code class="cui-code" style="font-size: 0.8125rem;">text-surface-600</code>
            alongside CUI components.
          </p>
        </CuiStack>
      </CuiCardBody>
    </CuiCard>
  </CuiStack>
</template>
