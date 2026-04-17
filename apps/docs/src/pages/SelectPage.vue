<script setup lang="ts">
import { ref } from "vue";
import { CuiBadge, CuiButton, CuiFlex, CuiIcon, CuiSelect, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const fruit = ref<string | null>(null);
const multi = ref<string[]>([]);
const grouped = ref<string | null>(null);
const colored = ref<string | null>("blue");
const errorVal = ref<string | null>(null);
const loading = ref(true);
const loadedOptions = ref<string[]>([]);

// Simulate async load
setTimeout(() => {
  loadedOptions.value = ["Loaded Option A", "Loaded Option B", "Loaded Option C"];
  loading.value = false;
}, 3000);

const fruitOptions = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
  { value: "elderberry", label: "Elderberry" },
];

const countryOptions = [
  { value: "us", label: "United States", group: "Americas" },
  { value: "ca", label: "Canada", group: "Americas" },
  { value: "mx", label: "Mexico", group: "Americas" },
  { value: "uk", label: "United Kingdom", group: "Europe" },
  { value: "de", label: "Germany", group: "Europe" },
  { value: "fr", label: "France", group: "Europe" },
  { value: "jp", label: "Japan", group: "Asia" },
  { value: "kr", label: "South Korea", group: "Asia" },
  { value: "au", label: "Australia", group: "Oceania" },
];

const permissionOptions = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "delete", label: "Delete" },
  { value: "admin", label: "Admin" },
  { value: "super", label: "Super Admin", disabled: true },
];

const iconOptions = [
  { value: "home", label: "Home", icon: "house" },
  { value: "settings", label: "Settings", icon: "gear" },
  { value: "profile", label: "Profile", icon: "user" },
  { value: "messages", label: "Messages", icon: "envelope" },
  { value: "notifications", label: "Notifications", icon: "bell" },
];
const iconVal = ref<string | null>(null);

const statusOptions = [
  { value: "active", label: "Active", icon: "check-circle" },
  { value: "pending", label: "Pending", icon: "clock" },
  { value: "inactive", label: "Inactive", icon: "x-circle" },
];
const statusVal = ref<string | null>(null);

// Dynamic form
const dynamicField = ref({
  name: "priority",
  value: null as string | null,
  options: [
    { value: "low", label: "Low Priority" },
    { value: "medium", label: "Medium Priority" },
    { value: "high", label: "High Priority" },
    { value: "critical", label: "Critical" },
  ],
});
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Select</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Dropdown select with single/multi mode, option groups, chips,
        keyboard navigation, loading state, and clearable.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'v-model', type: 'string | number | null | Array', default: '-', description: 'Selected value(s)' },
          { name: 'options', type: 'Array<string | SelectOption>', default: '[]', description: 'Options — strings or { value, label, group?, disabled? }' },
          { name: 'multiple', type: 'boolean', default: 'false', description: 'Allow multiple selections (chips)' },
          { name: 'placeholder', type: 'string', default: 'Select...', description: 'Placeholder text' },
          { name: 'clearable', type: 'boolean', default: 'false', description: 'Show clear button' },
          { name: 'loading', type: 'boolean', default: 'false', description: 'Show loading spinner in dropdown' },
          { name: 'noOptionsText', type: 'string', default: 'No options available', description: 'Text when options list is empty' },
          { name: 'color', type: 'ButtonColor', default: 'primary', description: 'Focus/accent color role' },
          { name: 'size', type: 'xs | sm | md | lg | xl', default: 'md', description: 'Trigger size' },
          { name: 'error', type: 'boolean', default: 'false', description: 'Error state' },
          { name: 'errorMessage', type: 'string', default: '-', description: 'Error message below select' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'readonly', type: 'boolean', default: 'false', description: 'Readonly state' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic (string options) -->
        <Example title="Basic (string options)" :code="`<CuiSelect v-model=&quot;fruit&quot; :options=&quot;['Apple', 'Banana', 'Cherry']&quot; />`">
          <CuiStack spacing="2" class="max-w-sm">
            <CuiSelect
              v-model="fruit"
              :options="['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']"
              placeholder="Pick a fruit..."
              clearable
            />
            <div class="text-sm text-surface-500">Selected: {{ fruit ?? 'none' }}</div>
          </CuiStack>
        </Example>

        <!-- Object options -->
        <Example title="Object Options" :code="`<CuiSelect v-model=&quot;val&quot; :options=&quot;[{ value: 'us', label: 'United States' }]&quot; />`">
          <CuiStack spacing="2" class="max-w-sm">
            <CuiSelect
              v-model="fruit"
              :options="fruitOptions"
              placeholder="Select fruit..."
              clearable
            />
            <div class="text-sm text-surface-500">Selected: {{ fruit ?? 'none' }}</div>
          </CuiStack>
        </Example>

        <!-- Multi-select -->
        <Example title="Multi-Select (chips)" :code="`<CuiSelect v-model=&quot;perms&quot; :options=&quot;options&quot; multiple />`">
          <CuiStack spacing="2" class="max-w-md">
            <CuiSelect
              v-model="multi"
              :options="permissionOptions"
              multiple
              placeholder="Select permissions..."
              clearable
            />
            <div class="text-sm text-surface-500">Selected: {{ multi.join(', ') || 'none' }}</div>
          </CuiStack>
        </Example>

        <!-- Option Groups -->
        <Example title="Option Groups" :code="`<CuiSelect :options=&quot;[{ value: 'us', label: 'USA', group: 'Americas' }]&quot; />`">
          <CuiStack spacing="2" class="max-w-sm">
            <CuiSelect
              v-model="grouped"
              :options="countryOptions"
              placeholder="Select country..."
              clearable
            />
            <div class="text-sm text-surface-500">Selected: {{ grouped ?? 'none' }}</div>
          </CuiStack>
        </Example>

        <!-- Disabled Options -->
        <Example title="Disabled Options">
          <CuiStack spacing="2" class="max-w-sm">
            <CuiSelect
              v-model="multi"
              :options="permissionOptions"
              multiple
              placeholder="Some options are disabled..."
            />
          </CuiStack>
        </Example>

        <!-- Options with Icons -->
        <Example title="Options with Icons (icon field)" :code="`<CuiSelect :options=&quot;[{ value: 'home', label: 'Home', icon: 'house' }]&quot; />`">
          <CuiStack spacing="2" class="max-w-sm">
            <CuiSelect
              v-model="iconVal"
              :options="iconOptions"
              placeholder="Select page..."
              clearable
            />
            <div class="text-sm text-surface-500">Selected: {{ iconVal ?? 'none' }}</div>
          </CuiStack>
        </Example>

        <!-- Custom Option Slot -->
        <Example title="Custom #option Slot (rich content)" :code="`<CuiSelect :options=&quot;options&quot;>
  <template #option=&quot;{ option }&quot;>
    <CuiIcon :name=&quot;option.icon&quot; />
    {{ option.label }}
    <CuiBadge v-if=&quot;option.value === 'active'&quot; color=&quot;success&quot;>Live</CuiBadge>
  </template>
</CuiSelect>`">
          <CuiStack spacing="2" class="max-w-sm">
            <CuiSelect
              v-model="statusVal"
              :options="statusOptions"
              placeholder="Select status..."
              clearable
            >
              <template #option="{ option }">
                <CuiIcon :name="option.icon" size="sm" />
                {{ option.label }}
                <CuiBadge v-if="option.value === 'active'" color="success" size="sm">Live</CuiBadge>
              </template>
              <template #selected="{ option }">
                <CuiIcon v-if="option?.icon" :name="option.icon" size="sm" />
                {{ option?.label }}
              </template>
            </CuiSelect>
            <div class="text-sm text-surface-500">Selected: {{ statusVal ?? 'none' }}</div>
          </CuiStack>
        </Example>

        <!-- Loading -->
        <Example title="Loading State (async data)">
          <CuiStack spacing="2" class="max-w-sm">
            <CuiSelect
              :options="loadedOptions"
              :loading="loading"
              placeholder="Loading options..."
            />
            <CuiButton v-if="!loading" size="sm" variant="ghost" @click="loading = true; loadedOptions = []; setTimeout(() => { loadedOptions = ['A', 'B', 'C']; loading = false; }, 2000)">
              Reload
            </CuiButton>
          </CuiStack>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes">
          <CuiStack spacing="3" class="max-w-sm">
            <CuiSelect :options="['Small']" size="xs" placeholder="Extra small" />
            <CuiSelect :options="['Small']" size="sm" placeholder="Small" />
            <CuiSelect :options="['Medium']" size="md" placeholder="Medium (default)" />
            <CuiSelect :options="['Large']" size="lg" placeholder="Large" />
            <CuiSelect :options="['XL']" size="xl" placeholder="Extra large" />
          </CuiStack>
        </Example>

        <!-- Colors -->
        <Example title="Focus Colors (click to see)">
          <CuiStack spacing="3" class="max-w-sm">
            <CuiSelect v-model="colored" :options="['Red', 'Green', 'Blue']" color="primary" placeholder="Primary" />
            <CuiSelect v-model="colored" :options="['Red', 'Green', 'Blue']" color="success" placeholder="Success" />
            <CuiSelect v-model="colored" :options="['Red', 'Green', 'Blue']" color="error" placeholder="Error" />
          </CuiStack>
        </Example>

        <!-- Error -->
        <Example title="Error Validation">
          <CuiStack spacing="3" class="max-w-sm">
            <CuiSelect
              v-model="errorVal"
              :options="fruitOptions"
              error
              error-message="Please select an option"
              placeholder="Required..."
            />
          </CuiStack>
        </Example>

        <!-- Disabled / Readonly -->
        <Example title="Disabled &amp; Readonly">
          <CuiStack spacing="3" class="max-w-sm">
            <CuiSelect model-value="apple" :options="fruitOptions" disabled placeholder="Disabled" />
            <CuiSelect model-value="banana" :options="fruitOptions" readonly placeholder="Readonly" />
          </CuiStack>
        </Example>

        <!-- Dynamic Form -->
        <Example title="Dynamic Form (JSON-driven)" :code="`<CuiSelect v-model=&quot;field.value&quot; :options=&quot;field.options&quot; />`">
          <CuiStack spacing="2" class="max-w-sm">
            <div class="text-sm font-medium">{{ dynamicField.name }}</div>
            <CuiSelect
              v-model="dynamicField.value"
              :options="dynamicField.options"
              placeholder="Select priority..."
              clearable
            />
            <div class="text-sm text-surface-500">Value: {{ dynamicField.value ?? 'none' }}</div>
          </CuiStack>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
