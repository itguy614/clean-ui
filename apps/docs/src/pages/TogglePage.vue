<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiFlex, CuiStack, CuiToggle, CuiToggleGroup } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const darkMode = ref(false);
const notifications = ref(true);
const features = ref<string[]>(["analytics"]);
const errorVal = ref<string[]>([]);
const errorTwo = ref<string[]>([]);

// Dynamic form
const dynamicField = ref({
  name: "settings",
  label: "Notification Preferences",
  value: ["email"] as string[],
  options: [
    { value: "email", label: "Email Notifications", description: "Receive updates via email" },
    { value: "push", label: "Push Notifications", description: "Browser push notifications" },
    { value: "sms", label: "SMS Notifications", description: "Text messages for critical alerts" },
    { value: "slack", label: "Slack Integration", description: "Post to a Slack channel" },
  ],
});
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Toggle / Switch</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Pill-shaped toggle switches for boolean on/off states. Works standalone
        or inside a <code class="cui-code">CuiToggleGroup</code> for multi-select.
      </p>
    </div>

    <!-- Props -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiToggle Props</h2>
      <PropTable
        :props="[
          { name: 'v-model', type: 'boolean', default: '-', description: 'Standalone boolean binding' },
          { name: 'value', type: 'string | number', default: '-', description: 'Value for group mode' },
          { name: 'label', type: 'string', default: '-', description: 'Label text (or default slot)' },
          { name: 'description', type: 'string', default: '-', description: 'Description text (or #description slot)' },
          { name: 'showLabels', type: 'boolean', default: 'false', description: 'Show ON/OFF labels inside track (md and lg only)' },
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Color role' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Toggle size' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'readonly', type: 'boolean', default: 'false', description: 'Readonly state' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiToggleGroup Props</h2>
      <PropTable
        :props="[
          { name: 'v-model', type: 'Array<string | number>', default: '[]', description: 'Array of selected values' },
          { name: 'color', type: 'ButtonColor', default: 'primary', description: 'Color role inherited by children' },
          { name: 'direction', type: 'horizontal | vertical | auto', default: 'auto', description: 'Layout (auto: horizontal ≤2, vertical 3+)' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable all toggles' },
          { name: 'readonly', type: 'boolean', default: 'false', description: 'Make all toggles readonly' },
          { name: 'error', type: 'boolean', default: 'false', description: 'Show error state' },
          { name: 'errorMessage', type: 'string', default: '-', description: 'Error message below group' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Standalone -->
        <Example title="Standalone Toggle" :code="`<CuiToggle v-model=&quot;darkMode&quot; label=&quot;Dark Mode&quot; />`">
          <CuiStack spacing="3">
            <CuiToggle v-model="darkMode" label="Dark Mode" />
            <CuiToggle v-model="notifications" label="Notifications" color="success" />
            <div class="text-sm text-surface-500">Dark: {{ darkMode }}, Notifications: {{ notifications }}</div>
          </CuiStack>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes">
          <CuiFlex gap="6" class="items-center flex-wrap">
            <CuiToggle v-model="darkMode" size="sm" label="Small" />
            <CuiToggle v-model="darkMode" size="md" label="Medium (default)" />
            <CuiToggle v-model="darkMode" size="lg" label="Large (mobile-friendly)" />
          </CuiFlex>
        </Example>

        <!-- On/Off Labels -->
        <Example title="Track Labels" :code="`<CuiToggle v-model=&quot;val&quot; show-labels label=&quot;With labels&quot; />
<CuiToggle v-model=&quot;val&quot; label=&quot;Without labels&quot; />`">
          <CuiStack spacing="4">
            <div class="text-sm font-medium text-surface-600 dark:text-surface-400">Labels shown on md and lg only (hidden on sm):</div>
            <CuiFlex gap="6" class="items-center flex-wrap">
              <CuiToggle v-model="darkMode" show-labels label="Small (hidden)" size="sm" />
              <CuiToggle v-model="darkMode" show-labels label="Medium" size="md" />
              <CuiToggle v-model="darkMode" show-labels label="Large" size="lg" />
            </CuiFlex>
            <div class="text-sm font-medium text-surface-600 dark:text-surface-400">Comparison — with vs without:</div>
            <CuiFlex gap="6" class="items-center flex-wrap">
              <CuiToggle v-model="notifications" show-labels label="Labels on" color="success" size="lg" />
              <CuiToggle v-model="notifications" label="Labels off" color="success" size="lg" />
            </CuiFlex>
          </CuiStack>
        </Example>

        <!-- Colors -->
        <Example title="Color Roles">
          <CuiStack spacing="3">
            <CuiToggle v-model="notifications" color="primary" label="Primary" />
            <CuiToggle v-model="notifications" color="secondary" label="Secondary" />
            <CuiToggle v-model="notifications" color="success" label="Success" />
            <CuiToggle v-model="notifications" color="error" label="Error" />
            <CuiToggle v-model="notifications" color="warning" label="Warning" />
            <CuiToggle v-model="notifications" color="info" label="Info" />
          </CuiStack>
        </Example>

        <!-- With Descriptions -->
        <Example title="With Descriptions">
          <CuiStack spacing="4">
            <CuiToggle
              v-model="darkMode"
              label="Dark Mode"
              description="Switch between light and dark themes across the interface"
              color="primary"
            />
            <CuiToggle
              v-model="notifications"
              label="Email Digest"
              description="Receive a daily summary of activity instead of individual notifications"
              color="info"
            />
          </CuiStack>
        </Example>

        <!-- Group -->
        <Example title="Group (array v-model)" :code="`<CuiToggleGroup v-model=&quot;features&quot;>
  <CuiToggle value=&quot;analytics&quot; label=&quot;Analytics&quot; />
  <CuiToggle value=&quot;export&quot; label=&quot;Export&quot; />
</CuiToggleGroup>`">
          <CuiStack spacing="2">
            <CuiToggleGroup v-model="features" label="Features" color="success">
              <CuiToggle value="analytics" label="Analytics" description="Track user behavior and events" />
              <CuiToggle value="export" label="Data Export" description="Export reports as CSV or PDF" />
              <CuiToggle value="api" label="API Access" description="Enable REST API for integrations" />
            </CuiToggleGroup>
            <div class="text-sm text-surface-500">Enabled: {{ features.join(', ') || 'none' }}</div>
          </CuiStack>
        </Example>

        <!-- Dynamic Form -->
        <Example title="Dynamic Form (JSON-driven)">
          <CuiStack spacing="2">
            <div class="text-sm font-medium">{{ dynamicField.label }}</div>
            <CuiToggleGroup v-model="dynamicField.value" :label="dynamicField.label">
              <CuiToggle
                v-for="opt in dynamicField.options"
                :key="opt.value"
                :value="opt.value"
                :label="opt.label"
                :description="opt.description"
              />
            </CuiToggleGroup>
            <div class="text-sm text-surface-500">Enabled: {{ dynamicField.value.join(', ') || 'none' }}</div>
          </CuiStack>
        </Example>

        <!-- Disabled -->
        <Example title="Disabled State">
          <CuiFlex gap="6" class="flex-wrap">
            <CuiToggle :model-value="true" disabled label="On (disabled)" />
            <CuiToggle :model-value="false" disabled label="Off (disabled)" />
          </CuiFlex>
        </Example>

        <!-- Readonly -->
        <Example title="Readonly State">
          <CuiFlex gap="6" class="flex-wrap">
            <CuiToggle :model-value="true" readonly label="On (readonly)" />
            <CuiToggle :model-value="false" readonly label="Off (readonly)" />
          </CuiFlex>
        </Example>

        <!-- Error (vertical) -->
        <Example title="Error Validation (vertical)">
          <CuiStack spacing="3">
            <CuiToggleGroup
              v-model="errorVal"
              error
              error-message="At least one notification channel must be enabled"
              label="Required settings"
            >
              <CuiToggle value="email" label="Email" />
              <CuiToggle value="push" label="Push" />
              <CuiToggle value="sms" label="SMS" />
            </CuiToggleGroup>
            <CuiButton size="sm" variant="solid" @click="errorVal = ['email']">Fix: Enable Email</CuiButton>
          </CuiStack>
        </Example>

        <!-- Error (horizontal) -->
        <Example title="Error Validation (horizontal)">
          <CuiStack spacing="3">
            <CuiToggleGroup
              v-model="errorTwo"
              error
              error-message="You must enable at least one option"
              label="Required"
            >
              <CuiToggle value="a" label="Option A" />
              <CuiToggle value="b" label="Option B" />
            </CuiToggleGroup>
            <CuiButton size="sm" variant="solid" @click="errorTwo = ['a']">Fix: Enable A</CuiButton>
          </CuiStack>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
