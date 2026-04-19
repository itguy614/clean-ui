<script setup lang="ts">
import { ref } from "vue";
import { CuiFlex, CuiInputStepper, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const qty = ref(1);
const price = ref(9.99);
const temp = ref(72);
const hours = ref(9);
const minutes = ref(30);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Input Stepper</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A numeric input with increment/decrement buttons — ideal for quantities,
        counters, and settings that adjust in discrete steps. Supports horizontal
        and vertical orientations, wrap-around, and zero-padded display.
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
          { name: 'orientation', type: 'horizontal | vertical', default: 'horizontal', description: 'Button layout direction' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Size' },
          { name: 'color', type: 'primary | secondary | ...', default: 'primary', description: 'Button color role' },
          { name: 'pad', type: 'number', default: '—', description: 'Zero-pad display to this width (e.g., 2 shows 05)' },
          { name: 'wrap', type: 'boolean', default: 'false', description: 'Wrap around from max to min and vice versa' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'label', type: 'string', default: '—', description: 'Label text above the input' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component (v-show)' },
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

        <!-- Vertical orientation -->
        <Example title="Vertical Orientation" :code="`<CuiInputStepper orientation=&quot;vertical&quot; />`">
          <CuiFlex gap="4" class="items-end">
            <CuiInputStepper v-model="hours" :min="1" :max="12" orientation="vertical" :pad="2" wrap label="Hours" />
            <span style="font-size: 1.25rem; font-weight: 700; padding-bottom: 1.5rem;">:</span>
            <CuiInputStepper v-model="minutes" :min="0" :max="59" :step="15" orientation="vertical" :pad="2" wrap label="Minutes" />
          </CuiFlex>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes" :code="`<CuiInputStepper :model-value=&quot;5&quot; size=&quot;sm&quot; label=&quot;Small&quot; />
<CuiInputStepper :model-value=&quot;5&quot; size=&quot;md&quot; label=&quot;Medium&quot; />
<CuiInputStepper :model-value=&quot;5&quot; size=&quot;lg&quot; label=&quot;Large&quot; />`">
          <CuiStack spacing="4">
            <div>
              <div class="mb-2 text-sm font-medium" style="color: var(--cui-text-secondary);">Horizontal:</div>
              <CuiFlex gap="4" class="items-end">
                <CuiInputStepper :model-value="5" :min="0" :max="10" size="sm" label="Small" />
                <CuiInputStepper :model-value="5" :min="0" :max="10" size="md" label="Medium" />
                <CuiInputStepper :model-value="5" :min="0" :max="10" size="lg" label="Large" />
              </CuiFlex>
            </div>
            <div>
              <div class="mb-2 text-sm font-medium" style="color: var(--cui-text-secondary);">Vertical:</div>
              <CuiFlex gap="4" class="items-end">
                <CuiInputStepper :model-value="5" :min="0" :max="10" size="sm" orientation="vertical" label="Small" />
                <CuiInputStepper :model-value="5" :min="0" :max="10" size="md" orientation="vertical" label="Medium" />
                <CuiInputStepper :model-value="5" :min="0" :max="10" size="lg" orientation="vertical" label="Large" />
              </CuiFlex>
            </div>
          </CuiStack>
        </Example>

        <!-- Wrap around -->
        <Example title="Wrap Around" :code="`<CuiInputStepper :min=&quot;0&quot; :max=&quot;59&quot; :step=&quot;15&quot; wrap />`">
          <CuiFlex gap="4" class="items-end">
            <CuiInputStepper v-model="minutes" :min="0" :max="59" :step="15" wrap :pad="2" label="Minutes (15-step wrap)" />
            <span class="text-sm" style="color: var(--cui-text-secondary); padding-bottom: 0.5rem;">Value: {{ minutes }}</span>
          </CuiFlex>
        </Example>

        <!-- Decimal step -->
        <Example title="Decimal Step" :code="`<CuiInputStepper v-model=&quot;price&quot; :step=&quot;0.50&quot; :min=&quot;0&quot; label=&quot;Price ($)&quot; />`">
          <CuiFlex gap="4" class="items-end">
            <CuiInputStepper v-model="price" :step="0.50" :min="0" label="Price ($)" />
            <span class="text-sm" style="color: var(--cui-text-secondary); padding-bottom: 0.5rem;">${{ price.toFixed(2) }}</span>
          </CuiFlex>
        </Example>

        <!-- Colors -->
        <Example title="Colors" :code="`<CuiInputStepper :model-value=&quot;5&quot; color=&quot;primary&quot; label=&quot;Primary&quot; />
<CuiInputStepper :model-value=&quot;5&quot; color=&quot;success&quot; label=&quot;Success&quot; />
<CuiInputStepper :model-value=&quot;5&quot; color=&quot;error&quot; label=&quot;Error&quot; />`">
          <CuiFlex gap="4" class="items-end flex-wrap">
            <CuiInputStepper :model-value="5" color="primary" label="Primary" size="sm" />
            <CuiInputStepper :model-value="5" color="success" label="Success" size="sm" />
            <CuiInputStepper :model-value="5" color="error" label="Error" size="sm" />
            <CuiInputStepper :model-value="5" color="warning" label="Warning" size="sm" />
          </CuiFlex>
        </Example>

        <!-- Min/Max constraints -->
        <Example title="Min/Max Constraints" :code="`<CuiInputStepper v-model=&quot;temp&quot; :min=&quot;60&quot; :max=&quot;85&quot; label=&quot;Temperature (°F)&quot; />`">
          <CuiFlex gap="4" class="items-end">
            <CuiInputStepper v-model="temp" :min="60" :max="85" label="Temperature (°F)" />
            <span class="text-sm" style="color: var(--cui-text-secondary); padding-bottom: 0.5rem;">{{ temp }}°F (range: 60–85)</span>
          </CuiFlex>
        </Example>

        <!-- Disabled -->
        <Example title="Disabled" :code="`<CuiInputStepper :model-value=&quot;3&quot; disabled label=&quot;Horizontal&quot; />
<CuiInputStepper :model-value=&quot;7&quot; disabled orientation=&quot;vertical&quot; label=&quot;Vertical&quot; />`">
          <CuiFlex gap="4" class="items-end">
            <CuiInputStepper :model-value="3" disabled label="Horizontal" />
            <CuiInputStepper :model-value="7" disabled orientation="vertical" label="Vertical" />
          </CuiFlex>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
