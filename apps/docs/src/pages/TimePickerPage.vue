<script setup lang="ts">
import { ref } from "vue";
import { CuiFlex, CuiStack, CuiTimePicker } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const time1 = ref("09:30 AM");
const time2 = ref("14:45");
const time3 = ref("");
const time4 = ref("02:00 PM");
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Time Picker</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A time input with a popover containing vertical steppers for hours and minutes.
        Supports 12-hour (AM/PM) and 24-hour clock formats.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'modelValue', type: 'string', default: '—', description: 'Time value (HH:mm for 24h, hh:mm AM for 12h)' },
          { name: 'format', type: '12 | 24', default: '12', description: 'Clock format' },
          { name: 'minuteStep', type: 'number', default: '1', description: 'Minute step increment' },
          { name: 'placeholder', type: 'string', default: '—', description: 'Placeholder text' },
          { name: 'label', type: 'string', default: '—', description: 'Label text' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Size' },
          { name: 'minTime', type: 'string', default: '—', description: 'Minimum selectable time (HH:mm)' },
          { name: 'maxTime', type: 'string', default: '—', description: 'Maximum selectable time (HH:mm)' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- 12-hour -->
        <Example title="12-Hour Clock (Default)" :code="`<CuiTimePicker v-model=&quot;time&quot; label=&quot;Start Time&quot; />`">
          <CuiFlex gap="4" class="items-start">
            <CuiTimePicker v-model="time1" label="Start Time" />
            <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
              Value: <code class="cui-code">{{ time1 || 'empty' }}</code>
            </div>
          </CuiFlex>
        </Example>

        <!-- 24-hour -->
        <Example title="24-Hour Clock" :code="`<CuiTimePicker v-model=&quot;time&quot; format=&quot;24&quot; />`">
          <CuiFlex gap="4" class="items-start">
            <CuiTimePicker v-model="time2" format="24" label="Departure" />
            <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
              Value: <code class="cui-code">{{ time2 || 'empty' }}</code>
            </div>
          </CuiFlex>
        </Example>

        <!-- 15-minute steps -->
        <Example title="15-Minute Steps" :code="`<CuiTimePicker :minute-step=&quot;15&quot; />`">
          <CuiTimePicker v-model="time3" :minute-step="15" label="Meeting Slot" />
        </Example>

        <!-- Side by side -->
        <Example title="Side by Side: 12h vs 24h" :code="`<CuiTimePicker v-model=&quot;time&quot; label=&quot;12-Hour&quot; />
<CuiTimePicker v-model=&quot;time&quot; format=&quot;24&quot; label=&quot;24-Hour&quot; />`">
          <CuiFlex gap="4" class="items-end">
            <CuiTimePicker v-model="time4" label="12-Hour" />
            <CuiTimePicker v-model="time2" format="24" label="24-Hour" />
          </CuiFlex>
        </Example>

        <!-- Disabled -->
        <Example title="Disabled" :code="`<CuiTimePicker model-value=&quot;10:00 AM&quot; label=&quot;Locked Time&quot; disabled />`">
          <CuiTimePicker model-value="10:00 AM" label="Locked Time" disabled />
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
