<script setup lang="ts">
import { ref } from "vue";
import { CuiFlex, CuiInputStepper, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const qty = ref(1);
const price = ref(9.99);
const temp = ref(72);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Input Stepper</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A numeric input with increment/decrement buttons — ideal for quantities,
        counters, and settings that adjust in discrete steps.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'modelValue', type: 'number', default: '0', description: 'Current value (v-model)' },
          { name: 'min', type: 'number', default: '—', description: 'Minimum value' },
          { name: 'max', type: 'number', default: '—', description: 'Maximum value' },
          { name: 'step', type: 'number', default: '1', description: 'Step increment' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Size' },
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Button color role' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'label', type: 'string', default: '—', description: 'Label text above the input' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic" :code="`<CuiInputStepper v-model=&quot;qty&quot; :min=&quot;1&quot; :max=&quot;99&quot; />`">
          <CuiFlex gap="4" class="items-end">
            <CuiInputStepper v-model="qty" :min="1" :max="99" label="Quantity" />
            <span class="text-sm" style="color: var(--cui-text-secondary); padding-bottom: 0.5rem;">Value: {{ qty }}</span>
          </CuiFlex>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes">
          <CuiFlex gap="4" class="items-end">
            <CuiInputStepper :model-value="5" :min="0" :max="10" size="sm" label="Small" />
            <CuiInputStepper :model-value="5" :min="0" :max="10" size="md" label="Medium" />
            <CuiInputStepper :model-value="5" :min="0" :max="10" size="lg" label="Large" />
          </CuiFlex>
        </Example>

        <!-- Decimal step -->
        <Example title="Decimal Step" :code="`<CuiInputStepper v-model=&quot;price&quot; :step=&quot;0.50&quot; :min=&quot;0&quot; />`">
          <CuiFlex gap="4" class="items-end">
            <CuiInputStepper v-model="price" :step="0.50" :min="0" label="Price ($)" />
            <span class="text-sm" style="color: var(--cui-text-secondary); padding-bottom: 0.5rem;">${{ price.toFixed(2) }}</span>
          </CuiFlex>
        </Example>

        <!-- Colors -->
        <Example title="Colors">
          <CuiFlex gap="4" class="items-end flex-wrap">
            <CuiInputStepper :model-value="5" color="primary" label="Primary" size="sm" />
            <CuiInputStepper :model-value="5" color="success" label="Success" size="sm" />
            <CuiInputStepper :model-value="5" color="error" label="Error" size="sm" />
            <CuiInputStepper :model-value="5" color="warning" label="Warning" size="sm" />
          </CuiFlex>
        </Example>

        <!-- With min/max constraints -->
        <Example title="Min/Max Constraints">
          <CuiFlex gap="4" class="items-end">
            <CuiInputStepper v-model="temp" :min="60" :max="85" label="Temperature (°F)" />
            <span class="text-sm" style="color: var(--cui-text-secondary); padding-bottom: 0.5rem;">{{ temp }}°F (range: 60–85)</span>
          </CuiFlex>
        </Example>

        <!-- Disabled -->
        <Example title="Disabled">
          <CuiInputStepper :model-value="3" disabled label="Locked" />
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
