<script setup lang="ts">
import { CuiBadge, CuiButton, CuiDivider, CuiFlex, CuiIcon, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Divider</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A horizontal or vertical separator with optional label.
        Use to visually group content within a page or layout.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'orientation', type: 'horizontal | vertical', default: 'horizontal', description: 'Line direction' },
          { name: 'labelPosition', type: 'start | center | end', default: 'center', description: 'Label placement along the line' },
          { name: 'label', type: 'string', default: '—', description: 'Simple text label' },
          { name: 'variant', type: 'solid | dashed | dotted', default: 'solid', description: 'Line style' },
          { name: 'spacing', type: 'string', default: '0', description: 'Margin above/below (horizontal) or left/right (vertical)' },
          { name: 'color', type: 'string', default: '—', description: 'Custom line/label color (CSS value)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic Horizontal">
          <CuiStack spacing="3">
            <p class="text-sm" style="color: var(--cui-text-secondary);">Content above the divider</p>
            <CuiDivider />
            <p class="text-sm" style="color: var(--cui-text-secondary);">Content below the divider</p>
          </CuiStack>
        </Example>

        <!-- With label -->
        <Example title="With Label" :code="`<CuiDivider label=&quot;OR&quot; />`">
          <CuiStack spacing="4">
            <CuiDivider label="OR" />
            <CuiDivider label="Section Title" />
            <CuiDivider label="Continue" />
          </CuiStack>
        </Example>

        <!-- Label positions -->
        <Example title="Label Positions">
          <CuiStack spacing="4">
            <CuiDivider label="Start" label-position="start" />
            <CuiDivider label="Center" label-position="center" />
            <CuiDivider label="End" label-position="end" />
          </CuiStack>
        </Example>

        <!-- Variants -->
        <Example title="Line Styles">
          <CuiStack spacing="4">
            <div>
              <div class="mb-1 text-xs" style="color: var(--cui-text-tertiary);">Solid:</div>
              <CuiDivider variant="solid" />
            </div>
            <div>
              <div class="mb-1 text-xs" style="color: var(--cui-text-tertiary);">Dashed:</div>
              <CuiDivider variant="dashed" />
            </div>
            <div>
              <div class="mb-1 text-xs" style="color: var(--cui-text-tertiary);">Dotted:</div>
              <CuiDivider variant="dotted" />
            </div>
          </CuiStack>
        </Example>

        <!-- Custom color -->
        <Example title="Custom Colors">
          <CuiStack spacing="4">
            <CuiDivider label="Primary" color="var(--cui-primary)" />
            <CuiDivider label="Success" color="var(--cui-success)" />
            <CuiDivider label="Error" color="var(--cui-error)" variant="dashed" />
          </CuiStack>
        </Example>

        <!-- With custom content slot -->
        <Example title="Custom Content in Slot" :code="`<CuiDivider>
  <CuiBadge>NEW</CuiBadge>
</CuiDivider>`">
          <CuiStack spacing="4">
            <CuiDivider>
              <CuiBadge color="primary" size="sm">NEW</CuiBadge>
            </CuiDivider>
            <CuiDivider>
              <CuiIcon name="star" size="1rem" style="color: var(--cui-warning);" />
            </CuiDivider>
            <CuiDivider>
              <span style="font-size: 0.75rem; color: var(--cui-text-tertiary);">Step 3 of 5</span>
            </CuiDivider>
          </CuiStack>
        </Example>

        <!-- Vertical -->
        <Example title="Vertical">
          <CuiFlex gap="0" class="items-center" style="height: 3rem;">
            <span class="text-sm" style="color: var(--cui-text-secondary);">Home</span>
            <CuiDivider orientation="vertical" spacing="0.75rem" />
            <span class="text-sm" style="color: var(--cui-text-secondary);">Products</span>
            <CuiDivider orientation="vertical" spacing="0.75rem" />
            <span class="text-sm" style="color: var(--cui-text-secondary);">About</span>
            <CuiDivider orientation="vertical" spacing="0.75rem" />
            <span class="text-sm" style="color: var(--cui-text-secondary);">Contact</span>
          </CuiFlex>
        </Example>

        <!-- Real-world: Login form -->
        <Example title="Real-World: Login Form Separator">
          <div style="max-width: 20rem;">
            <CuiStack spacing="3">
              <CuiButton variant="outline" class="w-full">
                <template #prefix><CuiIcon name="google-logo" /></template>
                Continue with Google
              </CuiButton>
              <CuiDivider label="OR" />
              <CuiButton variant="solid" class="w-full">Sign in with Email</CuiButton>
            </CuiStack>
          </div>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
