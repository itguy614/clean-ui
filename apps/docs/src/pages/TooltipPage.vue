<script setup lang="ts">
import { ref } from "vue";
import { CuiBadge, CuiButton, CuiFlex, CuiInput, CuiStack, CuiTooltip } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import EventTable from "../components/EventTable.vue";
import Example from "../components/Example.vue";

const manualVisible = ref(false);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Tooltip</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Contextual overlay that appears on hover, focus, or click. Powered by
        <code class="cui-code">@floating-ui/vue</code> for smart positioning
        with auto-flip.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'text', type: 'string', default: '-', description: 'Simple text content' },
          { name: 'placement', type: 'top | bottom | left | right | auto', default: 'top', description: 'Preferred position (auto-flips near edges)' },
          { name: 'trigger', type: 'hover | focus | click | hover-focus', default: 'hover-focus', description: 'How the tooltip is activated' },
          { name: 'showDelay', type: 'number', default: '200', description: 'Delay before showing (ms)' },
          { name: 'hideDelay', type: 'number', default: '100', description: 'Delay before hiding (ms)' },
          { name: 'noArrow', type: 'boolean', default: 'false', description: 'Hide the pointing arrow' },
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: '-', description: 'Semantic color (default is dark neutral)' },
          { name: 'v-model:visible', type: 'boolean', default: '-', description: 'Manual visibility control' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Prevent tooltip from showing' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Slots</h2>
      <PropTable
        :props="[
          { name: 'default', type: 'slot', default: '-', description: 'The trigger element' },
          { name: '#content', type: 'slot', default: '-', description: 'Rich tooltip content (overrides text prop)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Events</h2>
      <EventTable
        :events="[
          { name: 'update:visible', payload: 'boolean', description: 'Controls tooltip visibility (v-model:visible)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic Tooltip" :code="`<CuiTooltip text=&quot;Hello, world!&quot;>
  <CuiButton>Hover me</CuiButton>
</CuiTooltip>`">
          <CuiFlex gap="4" class="flex-wrap">
            <CuiTooltip text="Hello, world!">
              <CuiButton>Hover me</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="I appear on focus too — try tabbing">
              <CuiButton variant="outline">Hover or focus</CuiButton>
            </CuiTooltip>
          </CuiFlex>
        </Example>

        <!-- Placements -->
        <Example title="Placements" :code="`<CuiTooltip text=&quot;Top&quot; placement=&quot;top&quot;>...</CuiTooltip>`">
          <CuiFlex gap="4" class="flex-wrap items-center justify-center">
            <CuiTooltip text="I appear on top" placement="top">
              <CuiButton variant="outline" size="sm">Top</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="I appear on the bottom" placement="bottom">
              <CuiButton variant="outline" size="sm">Bottom</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="I appear on the left" placement="left">
              <CuiButton variant="outline" size="sm">Left</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="I appear on the right" placement="right">
              <CuiButton variant="outline" size="sm">Right</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="I pick the best spot automatically" placement="auto">
              <CuiButton variant="outline" size="sm">Auto</CuiButton>
            </CuiTooltip>
          </CuiFlex>
        </Example>

        <!-- Triggers -->
        <Example title="Trigger Modes" :code="`<CuiTooltip text=&quot;Hover only&quot; trigger=&quot;hover&quot;>...</CuiTooltip>
<CuiTooltip text=&quot;Focus only&quot; trigger=&quot;focus&quot;>...</CuiTooltip>
<CuiTooltip text=&quot;Click to toggle&quot; trigger=&quot;click&quot;>...</CuiTooltip>
<CuiTooltip text=&quot;Hover + focus&quot; trigger=&quot;hover-focus&quot;>...</CuiTooltip>`">
          <CuiFlex gap="4" class="flex-wrap">
            <CuiTooltip text="Hover only" trigger="hover">
              <CuiButton variant="outline" size="sm">Hover</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="Focus only (tab to me)" trigger="focus">
              <CuiButton variant="outline" size="sm">Focus</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="Click to toggle" trigger="click">
              <CuiButton variant="outline" size="sm">Click</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="Hover + focus (default)" trigger="hover-focus">
              <CuiButton variant="outline" size="sm">Hover + Focus</CuiButton>
            </CuiTooltip>
          </CuiFlex>
        </Example>

        <!-- No Arrow -->
        <Example title="Without Arrow" :code="`<CuiTooltip text=&quot;No arrow&quot; no-arrow>
  <CuiButton>No arrow</CuiButton>
</CuiTooltip>`">
          <CuiFlex gap="4" class="flex-wrap">
            <CuiTooltip text="No arrow here" no-arrow>
              <CuiButton variant="outline" size="sm">No arrow</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="With arrow (default)">
              <CuiButton variant="outline" size="sm">With arrow</CuiButton>
            </CuiTooltip>
          </CuiFlex>
        </Example>

        <!-- Rich Content -->
        <Example title="Rich Content (#content slot)" :code="`<CuiTooltip>
  <CuiButton>Hover</CuiButton>
  <template #content>
    <strong>Rich HTML</strong>
    <p>With multiple lines</p>
  </template>
</CuiTooltip>`">
          <CuiFlex gap="4" class="flex-wrap">
            <CuiTooltip>
              <CuiButton variant="outline" size="sm">Rich content</CuiButton>
              <template #content>
                <div style="max-width: 200px">
                  <strong style="display: block; margin-bottom: 4px;">Keyboard Shortcuts</strong>
                  <div style="display: flex; justify-content: space-between; gap: 1rem;">
                    <span>Save</span>
                    <span><kbd class="cui-kbd">Ctrl+S</kbd></span>
                  </div>
                  <div style="display: flex; justify-content: space-between; gap: 1rem;">
                    <span>Undo</span>
                    <span><kbd class="cui-kbd">Ctrl+Z</kbd></span>
                  </div>
                </div>
              </template>
            </CuiTooltip>
            <CuiTooltip>
              <CuiButton variant="outline" size="sm">User info</CuiButton>
              <template #content>
                <div>
                  <strong>Kurt Wolf</strong>
                  <div style="opacity: 0.8; font-size: 0.75rem;">Admin &middot; Last active 2m ago</div>
                </div>
              </template>
            </CuiTooltip>
          </CuiFlex>
        </Example>

        <!-- Colors -->
        <Example title="Semantic Colors" :code="`<CuiTooltip text=&quot;Primary tooltip&quot; color=&quot;primary&quot;>
  <CuiButton color=&quot;primary&quot;>Primary</CuiButton>
</CuiTooltip>
<CuiTooltip text=&quot;Success!&quot; color=&quot;success&quot;>
  <CuiButton color=&quot;success&quot;>Success</CuiButton>
</CuiTooltip>`">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiTooltip text="Default (dark)" placement="bottom">
              <CuiButton variant="outline" size="sm">Default</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="Primary tooltip" color="primary" placement="bottom">
              <CuiButton variant="outline" size="sm" color="primary">Primary</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="Success!" color="success" placement="bottom">
              <CuiButton variant="outline" size="sm" color="success">Success</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="Something went wrong" color="error" placement="bottom">
              <CuiButton variant="outline" size="sm" color="error">Error</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="Be careful here" color="warning" placement="bottom">
              <CuiButton variant="outline" size="sm" color="warning">Warning</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="FYI" color="info" placement="bottom">
              <CuiButton variant="outline" size="sm" color="info">Info</CuiButton>
            </CuiTooltip>
          </CuiFlex>
        </Example>

        <!-- Delays -->
        <Example title="Custom Delays" :code="`<CuiTooltip text=&quot;Instant!&quot; :show-delay=&quot;0&quot; :hide-delay=&quot;0&quot;>
  <CuiButton>No delay</CuiButton>
</CuiTooltip>
<CuiTooltip text=&quot;Slow to appear...&quot; :show-delay=&quot;800&quot;>
  <CuiButton>800ms delay</CuiButton>
</CuiTooltip>`">
          <CuiFlex gap="4" class="flex-wrap">
            <CuiTooltip text="Instant!" :show-delay="0" :hide-delay="0">
              <CuiButton variant="outline" size="sm">No delay</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="200ms show (default)">
              <CuiButton variant="outline" size="sm">Default delay</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="Slow to appear..." :show-delay="800">
              <CuiButton variant="outline" size="sm">800ms delay</CuiButton>
            </CuiTooltip>
          </CuiFlex>
        </Example>

        <!-- Manual control -->
        <Example title="Manual Control (v-model:visible)" :code="`<CuiTooltip text=&quot;I am manually controlled&quot; v-model:visible=&quot;visible&quot; placement=&quot;right&quot;>
  <CuiBadge>Target</CuiBadge>
</CuiTooltip>`">
          <CuiStack spacing="3">
            <CuiFlex gap="3">
              <CuiButton size="sm" variant="solid" @click="manualVisible = !manualVisible">
                {{ manualVisible ? 'Hide' : 'Show' }} Tooltip
              </CuiButton>
            </CuiFlex>
            <CuiTooltip text="I am manually controlled" v-model:visible="manualVisible" placement="right">
              <CuiBadge variant="outline" color="primary">Target element</CuiBadge>
            </CuiTooltip>
          </CuiStack>
        </Example>

        <!-- On different elements -->
        <Example title="On Various Elements" :code="`<CuiTooltip text=&quot;This button does something important&quot;>
  <CuiButton variant=&quot;solid&quot; color=&quot;primary&quot;>Action</CuiButton>
</CuiTooltip>
<CuiTooltip text=&quot;3 unread notifications&quot;>
  <CuiBadge variant=&quot;solid&quot; color=&quot;error&quot;>3</CuiBadge>
</CuiTooltip>`">
          <CuiFlex gap="4" class="flex-wrap items-center">
            <CuiTooltip text="This button does something important">
              <CuiButton variant="solid" color="primary">Action</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="3 unread notifications">
              <CuiBadge variant="solid" color="error" animation="pulse">3</CuiBadge>
            </CuiTooltip>
            <CuiTooltip text="Enter your full legal name" placement="bottom">
              <div class="max-w-xs">
                <CuiInput placeholder="Full name..." />
              </div>
            </CuiTooltip>
            <CuiTooltip text="Currently online" color="success">
              <CuiFlex gap="2" class="items-center">
                <CuiBadge dot color="success" animation="ping" />
                <span class="text-sm">Alice</span>
              </CuiFlex>
            </CuiTooltip>
          </CuiFlex>
        </Example>

        <!-- Disabled -->
        <Example title="Disabled" :code="`<CuiTooltip text=&quot;You won't see me&quot; disabled>
  <CuiButton>Disabled tooltip</CuiButton>
</CuiTooltip>`">
          <CuiFlex gap="4">
            <CuiTooltip text="You won't see me" disabled>
              <CuiButton variant="outline" size="sm">Disabled tooltip</CuiButton>
            </CuiTooltip>
            <CuiTooltip text="I still work!">
              <CuiButton variant="outline" size="sm">Enabled tooltip</CuiButton>
            </CuiTooltip>
          </CuiFlex>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
