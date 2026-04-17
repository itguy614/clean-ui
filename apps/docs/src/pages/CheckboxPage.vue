<script setup lang="ts">
import { ref, computed } from "vue";
import { CuiButton, CuiCheckbox, CuiCheckboxGroup, CuiFlex, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const agree = ref(false);
const toppings = ref<string[]>(["cheese"]);
const colors = ref<string[]>([]);
const permissions = ref<string[]>(["read"]);
const errorVal = ref<string[]>([]);
const errorTwo = ref<string[]>([]);

// Select-all / indeterminate demo
const allFruits = ["apple", "banana", "cherry", "date"];
const selectedFruits = ref<string[]>(["apple", "cherry"]);
const allChecked = computed(() => selectedFruits.value.length === allFruits.length);
const someChecked = computed(() => selectedFruits.value.length > 0 && !allChecked.value);

function toggleAll() {
  if (allChecked.value) {
    selectedFruits.value = [];
  } else {
    selectedFruits.value = [...allFruits];
  }
}

// Dynamic form
const dynamicField = ref({
  name: "features",
  label: "Desired Features",
  value: ["dark-mode"] as string[],
  options: [
    { value: "dark-mode", label: "Dark Mode", description: "Toggle between light and dark themes" },
    { value: "i18n", label: "Internationalization", description: "Multi-language support" },
    { value: "a11y", label: "Accessibility", description: "WCAG AA compliance" },
    { value: "ssr", label: "SSR Support", description: "Server-side rendering" },
  ],
});
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Checkbox</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Checkboxes for multi-selection, boolean toggles, and indeterminate "select all"
        patterns. Works standalone or inside a <code class="cui-code">CuiCheckboxGroup</code>.
      </p>
    </div>

    <!-- Props -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiCheckboxGroup Props</h2>
      <PropTable
        :props="[
          { name: 'v-model', type: 'Array<string | number>', default: '[]', description: 'Array of selected values' },
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Color role inherited by children' },
          { name: 'direction', type: 'horizontal | vertical | auto', default: 'auto', description: 'Layout direction (auto: horizontal ≤2, vertical 3+)' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable all checkboxes' },
          { name: 'readonly', type: 'boolean', default: 'false', description: 'Make all checkboxes readonly' },
          { name: 'error', type: 'boolean', default: 'false', description: 'Show error state (left accent bar)' },
          { name: 'errorMessage', type: 'string', default: '-', description: 'Error message below group' },
          { name: 'label', type: 'string', default: '-', description: 'Accessible group label' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiCheckbox Props</h2>
      <PropTable
        :props="[
          { name: 'value', type: 'string | number', default: '-', description: 'Value for group mode' },
          { name: 'v-model', type: 'boolean', default: '-', description: 'Standalone boolean binding' },
          { name: 'label', type: 'string', default: '-', description: 'Label text (or default slot)' },
          { name: 'description', type: 'string', default: '-', description: 'Description text (or #description slot)' },
          { name: 'color', type: 'ButtonColor', default: '-', description: 'Overrides group color' },
          { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Shows dash indicator (e.g. select-all partial)' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'readonly', type: 'boolean', default: 'false', description: 'Readonly state' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Standalone Boolean -->
        <Example title="Standalone (boolean v-model)" :code="`<CuiCheckbox v-model=&quot;agree&quot; label=&quot;I agree&quot; />`">
          <CuiStack spacing="2">
            <CuiCheckbox v-model="agree" label="I agree to the terms and conditions" />
            <div class="text-sm text-surface-500">Value: {{ agree }}</div>
          </CuiStack>
        </Example>

        <!-- Group -->
        <Example title="Group (array v-model)" :code="`<CuiCheckboxGroup v-model=&quot;toppings&quot;>
  <CuiCheckbox value=&quot;cheese&quot; label=&quot;Cheese&quot; />
  <CuiCheckbox value=&quot;pepperoni&quot; label=&quot;Pepperoni&quot; />
  <CuiCheckbox value=&quot;mushrooms&quot; label=&quot;Mushrooms&quot; />
</CuiCheckboxGroup>`">
          <CuiStack spacing="2">
            <CuiCheckboxGroup v-model="toppings" label="Pizza toppings">
              <CuiCheckbox value="cheese" label="Cheese" />
              <CuiCheckbox value="pepperoni" label="Pepperoni" />
              <CuiCheckbox value="mushrooms" label="Mushrooms" />
              <CuiCheckbox value="olives" label="Olives" />
            </CuiCheckboxGroup>
            <div class="text-sm text-surface-500">Selected: {{ toppings.join(', ') || 'none' }}</div>
          </CuiStack>
        </Example>

        <!-- Indeterminate / Select All -->
        <Example title="Indeterminate (Select All)" :code="`<CuiCheckbox :indeterminate=&quot;someChecked&quot; :modelValue=&quot;allChecked&quot;
  @update:modelValue=&quot;toggleAll&quot; label=&quot;Select All&quot; />
<CuiCheckboxGroup v-model=&quot;selectedFruits&quot;>
  <CuiCheckbox value=&quot;apple&quot; label=&quot;Apple&quot; />
  ...
</CuiCheckboxGroup>`">
          <CuiStack spacing="2">
            <CuiCheckbox
              :indeterminate="someChecked"
              :model-value="allChecked"
              label="Select All Fruits"
              color="primary"
              @update:model-value="toggleAll"
            />
            <div class="ml-6">
              <CuiCheckboxGroup v-model="selectedFruits" label="Fruits">
                <CuiCheckbox value="apple" label="Apple" />
                <CuiCheckbox value="banana" label="Banana" />
                <CuiCheckbox value="cherry" label="Cherry" />
                <CuiCheckbox value="date" label="Date" />
              </CuiCheckboxGroup>
            </div>
            <div class="text-sm text-surface-500">Selected: {{ selectedFruits.join(', ') || 'none' }}</div>
          </CuiStack>
        </Example>

        <!-- Colors -->
        <Example title="Color Roles">
          <CuiStack spacing="3">
            <CuiCheckbox v-model="agree" color="primary" label="Primary" />
            <CuiCheckbox v-model="agree" color="secondary" label="Secondary" />
            <CuiCheckbox v-model="agree" color="success" label="Success" />
            <CuiCheckbox v-model="agree" color="error" label="Error" />
            <CuiCheckbox v-model="agree" color="warning" label="Warning" />
            <CuiCheckbox v-model="agree" color="info" label="Info" />
          </CuiStack>
        </Example>

        <!-- With Descriptions -->
        <Example title="With Descriptions">
          <CuiCheckboxGroup v-model="permissions" label="Permissions">
            <CuiCheckbox value="read" label="Read" description="View files and folders" />
            <CuiCheckbox value="write" label="Write" description="Create and edit files" />
            <CuiCheckbox value="delete" label="Delete" description="Remove files permanently" color="error" />
            <CuiCheckbox value="admin" label="Admin" description="Full system access" color="warning" />
          </CuiCheckboxGroup>
        </Example>

        <!-- Dynamic Form -->
        <Example title="Dynamic Form (JSON-driven)" :code="`<CuiCheckboxGroup v-model=&quot;field.value&quot;>
  <CuiCheckbox v-for=&quot;opt in field.options&quot;
    :value=&quot;opt.value&quot; :label=&quot;opt.label&quot;
    :description=&quot;opt.description&quot; />
</CuiCheckboxGroup>`">
          <CuiStack spacing="2">
            <div class="text-sm font-medium">{{ dynamicField.label }}</div>
            <CuiCheckboxGroup v-model="dynamicField.value" :label="dynamicField.label">
              <CuiCheckbox
                v-for="opt in dynamicField.options"
                :key="opt.value"
                :value="opt.value"
                :label="opt.label"
                :description="opt.description"
              />
            </CuiCheckboxGroup>
            <div class="text-sm text-surface-500">Selected: {{ dynamicField.value.join(', ') || 'none' }}</div>
          </CuiStack>
        </Example>

        <!-- Disabled -->
        <Example title="Disabled State">
          <CuiCheckboxGroup v-model="toppings" disabled label="Disabled group">
            <CuiCheckbox value="cheese" label="Cheese" />
            <CuiCheckbox value="pepperoni" label="Pepperoni" />
          </CuiCheckboxGroup>
        </Example>

        <!-- Readonly -->
        <Example title="Readonly State">
          <CuiCheckboxGroup v-model="toppings" readonly label="Readonly group">
            <CuiCheckbox value="cheese" label="Cheese (locked)" />
            <CuiCheckbox value="pepperoni" label="Pepperoni (locked)" />
            <CuiCheckbox value="mushrooms" label="Mushrooms (locked)" />
          </CuiCheckboxGroup>
        </Example>

        <!-- Error (3+ vertical) -->
        <Example title="Error Validation (vertical)">
          <CuiStack spacing="3">
            <CuiCheckboxGroup
              v-model="errorVal"
              error
              error-message="Please select at least one option"
              label="Required selection"
            >
              <CuiCheckbox value="a" label="Option A" />
              <CuiCheckbox value="b" label="Option B" />
              <CuiCheckbox value="c" label="Option C" />
            </CuiCheckboxGroup>
            <CuiButton size="sm" variant="solid" @click="errorVal = ['a']">Fix: Select A</CuiButton>
          </CuiStack>
        </Example>

        <!-- Error (2 horizontal) -->
        <Example title="Error Validation (horizontal)">
          <CuiStack spacing="3">
            <CuiCheckboxGroup
              v-model="errorTwo"
              error
              error-message="You must accept both policies"
              label="Policy acceptance"
            >
              <CuiCheckbox value="privacy" label="Privacy Policy" />
              <CuiCheckbox value="terms" label="Terms of Service" />
            </CuiCheckboxGroup>
            <CuiButton size="sm" variant="solid" @click="errorTwo = ['privacy', 'terms']">Fix: Accept Both</CuiButton>
          </CuiStack>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
