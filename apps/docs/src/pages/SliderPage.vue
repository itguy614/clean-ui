<script setup lang="ts">
import { ref } from "vue";
import { CuiFlex, CuiIcon, CuiSlider, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import EventTable from "../components/EventTable.vue";
import Example from "../components/Example.vue";
import Playground from "../components/Playground.vue";

const volume = ref(65);
const price = ref(250);
const opacity = ref(0.8);
const temp = ref(72);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Slider</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A range input for selecting a numeric value by dragging a thumb along a track.
        Supports custom colors, sizes, value display, and formatting.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'modelValue', type: 'number', default: '0', description: 'Current value (v-model)' },
          { name: 'min', type: 'number', default: '0', description: 'Minimum value' },
          { name: 'max', type: 'number', default: '100', description: 'Maximum value' },
          { name: 'step', type: 'number', default: '1', description: 'Step increment' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Track and thumb size' },
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Color role' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'label', type: 'string', default: '—', description: 'Label text' },
          { name: 'showValue', type: 'boolean', default: 'false', description: 'Show current value' },
          { name: 'formatValue', type: '(v: number) => string', default: '—', description: 'Custom value formatter' },
          { name: 'showRange', type: 'boolean', default: 'false', description: 'Show min/max labels below track' },
          { name: 'thumbIcon', type: 'string', default: '—', description: 'Phosphor icon name for the thumb' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component (v-show)' },
        ]"
      />
    </div>

    <!-- Events -->
    <div>
      <h2 style="margin-bottom: 1rem; font-size: 1.5rem; font-weight: 600;">Events</h2>
      <EventTable :events="[
        { name: 'update:modelValue', payload: 'number', description: 'Fires when the slider value changes (v-model)' },
      ]" />
    </div>

    <Playground
      :component="CuiSlider"
      component-name="CuiSlider"
      :props="{
        min: { type: 'number', default: 0 },
        max: { type: 'number', default: 100 },
        step: { type: 'number', default: 1 },
        size: { type: 'select', options: ['sm', 'md', 'lg'], default: 'md' },
        color: { type: 'select', options: ['primary', 'secondary', 'success', 'error', 'warning', 'info'], default: 'primary' },
        label: { type: 'string', default: '' },
        showValue: { type: 'boolean', default: false },
        showRange: { type: 'boolean', default: false },
        thumbIcon: { type: 'string', default: '' },
        disabled: { type: 'boolean', default: false },
      }"
    />

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic" :code="`<CuiSlider v-model=&quot;volume&quot; label=&quot;Volume&quot; show-value />`">
          <div class="max-w-md">
            <CuiSlider v-model="volume" label="Volume" show-value />
          </div>
        </Example>

        <!-- With range labels -->
        <Example title="With Range Labels" :code="`<CuiSlider v-model=&quot;temp&quot; :min=&quot;60&quot; :max=&quot;85&quot; label=&quot;Temperature&quot;
  show-value show-range :format-value=&quot;(v) =&gt; v + '°F'&quot; />`">
          <div class="max-w-md">
            <CuiSlider
              v-model="temp"
              :min="60"
              :max="85"
              label="Temperature"
              show-value
              show-range
              :format-value="(v: number) => `${v}°F`"
            />
          </div>
        </Example>

        <!-- Custom formatting -->
        <Example title="Custom Formatting" :code="`<CuiSlider :format-value=&quot;(v) => '$' + v&quot; />`">
          <div class="max-w-md">
            <CuiStack spacing="4">
              <CuiSlider
                v-model="price"
                :min="0"
                :max="1000"
                :step="10"
                label="Budget"
                show-value
                show-range
                :format-value="(v: number) => `$${v}`"
              />
              <CuiSlider
                v-model="opacity"
                :min="0"
                :max="1"
                :step="0.01"
                label="Opacity"
                show-value
                :format-value="(v: number) => `${Math.round(v * 100)}%`"
              />
            </CuiStack>
          </div>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes" :code="`<CuiSlider :model-value=&quot;40&quot; size=&quot;sm&quot; label=&quot;Small&quot; show-value />
<CuiSlider :model-value=&quot;60&quot; size=&quot;md&quot; label=&quot;Medium&quot; show-value />
<CuiSlider :model-value=&quot;80&quot; size=&quot;lg&quot; label=&quot;Large&quot; show-value />`">
          <div class="max-w-md">
            <CuiStack spacing="4">
              <CuiSlider :model-value="40" size="sm" label="Small" show-value />
              <CuiSlider :model-value="60" size="md" label="Medium" show-value />
              <CuiSlider :model-value="80" size="lg" label="Large" show-value />
            </CuiStack>
          </div>
        </Example>

        <!-- Colors -->
        <Example title="Colors" :code="`<CuiSlider :model-value=&quot;70&quot; color=&quot;primary&quot; label=&quot;Primary&quot; show-value />
<CuiSlider :model-value=&quot;70&quot; color=&quot;success&quot; label=&quot;Success&quot; show-value />
<CuiSlider :model-value=&quot;70&quot; color=&quot;error&quot; label=&quot;Error&quot; show-value />`">
          <div class="max-w-md">
            <CuiStack spacing="4">
              <CuiSlider :model-value="70" color="primary" label="Primary" show-value />
              <CuiSlider :model-value="70" color="success" label="Success" show-value />
              <CuiSlider :model-value="70" color="error" label="Error" show-value />
              <CuiSlider :model-value="70" color="warning" label="Warning" show-value />
              <CuiSlider :model-value="70" color="info" label="Info" show-value />
            </CuiStack>
          </div>
        </Example>

        <!-- Thumb icon -->
        <Example title="Thumb Icons" :code="`<CuiSlider thumb-icon=&quot;speaker-high&quot; />`">
          <div class="max-w-md">
            <CuiStack spacing="4">
              <CuiSlider v-model="volume" label="Volume" show-value thumb-icon="speaker-high" />
              <CuiSlider v-model="temp" :min="60" :max="85" label="Temperature" show-value color="error" thumb-icon="thermometer" :format-value="(v: number) => `${v}°F`" />
              <CuiSlider v-model="opacity" :min="0" :max="1" :step="0.01" label="Brightness" show-value color="warning" thumb-icon="sun" size="lg" :format-value="(v: number) => `${Math.round(v * 100)}%`" />
            </CuiStack>
          </div>
        </Example>

        <!-- Custom thumb slot -->
        <Example title="Custom Thumb Slot" :code="`<CuiSlider>
  <template #thumb>🔥</template>
</CuiSlider>`">
          <div class="max-w-md">
            <CuiStack spacing="4">
              <CuiSlider v-model="volume" label="Heat" show-value size="lg" color="error">
                <template #thumb><span style="font-size: 0.75rem;">🔥</span></template>
              </CuiSlider>
              <CuiSlider :model-value="price" :max="1000" :step="10" label="Budget" show-value size="lg" color="success" :format-value="(v: number) => `$${v}`">
                <template #thumb><CuiIcon name="currency-dollar" size="0.75rem" /></template>
              </CuiSlider>
            </CuiStack>
          </div>
        </Example>

        <!-- Disabled -->
        <Example title="Disabled" :code="`<CuiSlider :model-value=&quot;50&quot; disabled label=&quot;Disabled&quot; show-value />`">
          <div class="max-w-md">
            <CuiSlider :model-value="50" disabled label="Disabled" show-value />
          </div>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
