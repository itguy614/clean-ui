<script setup lang="ts">
import { ref } from "vue";
import { CuiDatePicker, CuiFlex, CuiGrid, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const date1 = ref("2025-01-15");
const date2 = ref("2025-03-20");
const date3 = ref("2025-06-01");
const date4 = ref("");
const date5 = ref("2025-04-01");
const date6 = ref("2025-07-31");
const dateObj = ref<Date | null>(new Date());
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Date Picker</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A date input with masked text entry and a calendar popover.
        Supports custom formats, min/max ranges, blackout dates, month-only mode,
        and quick month/year selection.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'modelValue', type: 'string | Date | null', default: '—', description: 'Date value (v-model, ISO string or Date object)' },
          { name: 'format', type: 'string', default: 'MM/DD/YYYY', description: 'Display format pattern (MM, DD, YYYY, MMM, etc.)' },
          { name: 'valueType', type: 'iso | date', default: 'iso', description: 'v-model output type' },
          { name: 'mode', type: 'date | month', default: 'date', description: 'Full date or month-only picker' },
          { name: 'fillDay', type: 'first | last', default: 'first', description: 'In month mode, auto-fill day 1 or last day' },
          { name: 'highlightToday', type: 'boolean', default: 'true', description: 'Highlight today in the calendar' },
          { name: 'minDate', type: 'string', default: '—', description: 'Minimum selectable date (ISO)' },
          { name: 'maxDate', type: 'string', default: '—', description: 'Maximum selectable date (ISO)' },
          { name: 'disabledDate', type: '(date: Date) => boolean', default: '—', description: 'Function to disable specific dates' },
          { name: 'disabledDates', type: '(string | { from, to })[]', default: '—', description: 'Array of disabled dates or ranges' },
          { name: 'placeholder', type: 'string', default: '—', description: 'Placeholder (auto-generated from format if omitted)' },
          { name: 'label', type: 'string', default: '—', description: 'Label text' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Size' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic" :code="`<CuiDatePicker v-model=&quot;date&quot; label=&quot;Start Date&quot; />`">
          <CuiFlex gap="4" class="items-start">
            <CuiDatePicker v-model="date1" label="Start Date" />
            <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
              Value: <code class="cui-code">{{ date1 }}</code>
            </div>
          </CuiFlex>
        </Example>

        <!-- Different formats -->
        <Example title="Custom Formats" :code="`<CuiDatePicker v-model=&quot;date&quot; format=&quot;MM/DD/YYYY&quot; label=&quot;US Format&quot; />
<CuiDatePicker v-model=&quot;date&quot; format=&quot;DD/MM/YYYY&quot; label=&quot;EU Format&quot; />
<CuiDatePicker v-model=&quot;date&quot; format=&quot;YYYY-MM-DD&quot; label=&quot;ISO Format&quot; />`">
          <CuiGrid :cols="{ sm: 1, md: 3 }" gap="4">
            <CuiDatePicker v-model="date2" format="MM/DD/YYYY" label="US Format" />
            <CuiDatePicker v-model="date2" format="DD/MM/YYYY" label="EU Format" />
            <CuiDatePicker v-model="date2" format="YYYY-MM-DD" label="ISO Format" />
          </CuiGrid>
        </Example>

        <!-- Min/max range -->
        <Example title="Min/Max Range" :code="`<CuiDatePicker min-date=&quot;2025-01-01&quot; max-date=&quot;2025-12-31&quot; />`">
          <CuiDatePicker
            v-model="date3"
            label="2025 Only"
            min-date="2025-01-01"
            max-date="2025-12-31"
          />
        </Example>

        <!-- No past dates -->
        <Example title="No Past Dates (Today Onward)" :code="`<CuiDatePicker
  v-model=&quot;date&quot;
  label=&quot;Future Date&quot;
  :min-date=&quot;new Date().toISOString().slice(0, 10)&quot;
/>`">
          <CuiDatePicker
            v-model="date4"
            label="Future Date"
            :min-date="new Date().toISOString().slice(0, 10)"
          />
        </Example>

        <!-- Blackout dates -->
        <Example title="Blackout Dates" :code="`<CuiDatePicker
  :disabled-dates=&quot;['2025-04-15', { from: '2025-04-20', to: '2025-04-25' }]&quot;
  :disabled-date=&quot;(d) => d.getDay() === 0 || d.getDay() === 6&quot;
/>`">
          <CuiDatePicker
            v-model="date5"
            label="No Weekends, No Apr 15, No Apr 20-25"
            :disabled-dates="['2025-04-15', { from: '2025-04-20', to: '2025-04-25' }]"
            :disabled-date="(d: Date) => d.getDay() === 0 || d.getDay() === 6"
          />
        </Example>

        <!-- Month-only mode -->
        <Example title="Month-Only (Fill Last Day)" :code="`<CuiDatePicker mode=&quot;month&quot; fill-day=&quot;last&quot; format=&quot;MM/YYYY&quot; />`">
          <CuiFlex gap="4" class="items-start">
            <CuiDatePicker
              v-model="date6"
              mode="month"
              fill-day="last"
              format="MM/YYYY"
              label="Reporting Period End"
            />
            <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
              Value: <code class="cui-code">{{ date6 }}</code>
            </div>
          </CuiFlex>
        </Example>

        <!-- Month-only first day -->
        <Example title="Month-Only (Fill First Day)" :code="`<CuiDatePicker
  v-model=&quot;date&quot;
  mode=&quot;month&quot;
  fill-day=&quot;first&quot;
  format=&quot;MMM YYYY&quot;
  label=&quot;Billing Start&quot;
/>`">
          <CuiFlex gap="4" class="items-start">
            <CuiDatePicker
              v-model="date5"
              mode="month"
              fill-day="first"
              format="MMM YYYY"
              label="Billing Start"
            />
            <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
              Value: <code class="cui-code">{{ date5 }}</code>
            </div>
          </CuiFlex>
        </Example>

        <!-- Date object value type -->
        <Example title="Date Object Output" :code="`<CuiDatePicker value-type=&quot;date&quot; />`">
          <CuiFlex gap="4" class="items-start">
            <CuiDatePicker
              v-model="dateObj"
              value-type="date"
              label="Date Object"
            />
            <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
              Value: <code class="cui-code">{{ dateObj?.toLocaleDateString() ?? 'null' }}</code>
            </div>
          </CuiFlex>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes" :code="`<CuiDatePicker size=&quot;sm&quot; label=&quot;Small&quot; />
<CuiDatePicker size=&quot;md&quot; label=&quot;Medium&quot; />
<CuiDatePicker size=&quot;lg&quot; label=&quot;Large&quot; />`">
          <CuiFlex gap="4" class="items-end flex-wrap">
            <CuiDatePicker :model-value="'2025-06-15'" size="sm" label="Small" />
            <CuiDatePicker :model-value="'2025-06-15'" size="md" label="Medium" />
            <CuiDatePicker :model-value="'2025-06-15'" size="lg" label="Large" />
          </CuiFlex>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
