<script setup lang="ts">
import { ref } from "vue";
import { CuiDateRangePicker, CuiFlex, CuiStack, type DateRangeValue } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const range1 = ref<DateRangeValue>({ start: "2025-04-01", end: "2025-04-15" });
const range2 = ref<DateRangeValue>({ start: null, end: null });
const range3 = ref<DateRangeValue>({ start: null, end: null });
const range4 = ref<DateRangeValue>({ start: null, end: null });
const range5 = ref<DateRangeValue>({ start: null, end: null });
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Date Range Picker</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Select a start and end date with a single calendar. Supports all the same
        constraints as CuiDatePicker — min/max, blackout dates, and blocking ranges
        that span disabled dates.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'modelValue', type: '{ start, end }', default: '—', description: 'Range value (v-model). Each side is ISO string or Date.' },
          { name: 'format', type: 'string', default: 'MM/DD/YYYY', description: 'Display format pattern' },
          { name: 'valueType', type: 'iso | date', default: 'iso', description: 'v-model output type' },
          { name: 'highlightToday', type: 'boolean', default: 'true', description: 'Highlight today' },
          { name: 'minDate', type: 'string', default: '—', description: 'Minimum selectable date (ISO)' },
          { name: 'maxDate', type: 'string', default: '—', description: 'Maximum selectable date (ISO)' },
          { name: 'disabledDate', type: '(date: Date) => boolean', default: '—', description: 'Function to disable dates' },
          { name: 'disabledDates', type: '(string | { from, to })[]', default: '—', description: 'Array of disabled dates or ranges' },
          { name: 'blockSpanningBlackout', type: 'boolean', default: 'true', description: 'Prevent selecting a range that spans a blackout date' },
          { name: 'separator', type: 'string', default: '→', description: 'Separator between start and end display' },
          { name: 'label', type: 'string', default: '—', description: 'Label text' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Size' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic Range" :code="`<CuiDateRangePicker v-model=&quot;range&quot; label=&quot;Travel Dates&quot; />`">
          <CuiFlex gap="4" class="items-start">
            <CuiDateRangePicker v-model="range1" label="Travel Dates" />
            <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
              <div>Start: <code class="cui-code">{{ range1.start ?? 'null' }}</code></div>
              <div>End: <code class="cui-code">{{ range1.end ?? 'null' }}</code></div>
            </div>
          </CuiFlex>
        </Example>

        <!-- Future only -->
        <Example title="Future Dates Only">
          <CuiDateRangePicker
            v-model="range2"
            label="Booking Window"
            :min-date="new Date().toISOString().slice(0, 10)"
          />
        </Example>

        <!-- With range constraint -->
        <Example title="Within 2025 Only">
          <CuiDateRangePicker
            v-model="range3"
            label="Fiscal Year 2025"
            min-date="2025-01-01"
            max-date="2025-12-31"
          />
        </Example>

        <!-- Blackout dates blocking range -->
        <Example title="Blackout Dates (No Weekends, Blocks Spanning)" :code="`<CuiDateRangePicker
  :disabled-date=&quot;(d) => d.getDay() === 0 || d.getDay() === 6&quot;
  block-spanning-blackout
/>`">
          <CuiFlex gap="4" class="items-start">
            <CuiDateRangePicker
              v-model="range4"
              label="Business Days Only"
              :disabled-date="(d: Date) => d.getDay() === 0 || d.getDay() === 6"
              block-spanning-blackout
            />
            <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem; max-width: 14rem;">
              Weekends are disabled. You can't select a range that includes a weekend day.
            </div>
          </CuiFlex>
        </Example>

        <!-- Specific blackout dates -->
        <Example title="Holiday Blackouts">
          <CuiDateRangePicker
            v-model="range5"
            label="Vacation Request"
            :disabled-dates="[
              '2025-07-04',
              { from: '2025-12-24', to: '2025-12-26' },
              '2025-01-01',
            ]"
            block-spanning-blackout
          />
        </Example>

        <!-- EU format -->
        <Example title="EU Format (DD/MM/YYYY)">
          <CuiDateRangePicker
            :model-value="{ start: '2025-06-01', end: '2025-06-14' }"
            format="DD/MM/YYYY"
            label="European Format"
          />
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
