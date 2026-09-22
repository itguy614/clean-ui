<script setup lang="ts">
import { ref } from "vue";
import { CuiDateRangePicker, CuiFlex, CuiStack, type DateRangeValue } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import EventTable from "../components/EventTable.vue";
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
          { name: 'startPlaceholder', type: 'string', default: '—', description: 'Placeholder for start input' },
          { name: 'endPlaceholder', type: 'string', default: '—', description: 'Placeholder for end input' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Size' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
          { name: 'id', type: 'string', default: '-', description: 'id of the native control — what a label for attribute must point at. CuiFormField supplies it automatically' },
          { name: 'name', type: 'string', default: '-', description: 'Native control name, for form serialization and browser autofill' },
          { name: 'autocomplete', type: 'string', default: '-', description: 'Native autocomplete hint, e.g. email, street-address, off' },
          { name: 'aria-describedby', type: 'string', default: '-', description: 'id(s) of describing text. CuiFormField points this at its help text or error message' },
          { name: 'aria-labelledby', type: 'string', default: '-', description: 'id(s) of the labelling element. CuiFormField points this at its label' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Events</h2>
      <EventTable
        :events="[
          { name: 'update:modelValue', payload: '{ start, end }', description: 'Fires when the selected range changes (v-model)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Keyboard</h2>
      <p class="mb-4" style="color: var(--cui-text-secondary);">
        The calendar is a grid with roving focus: opening the panel puts focus on the selected date
        (or today), and closing it hands focus back to the field. Disabled dates are reachable and
        announced &mdash; a calendar is a grid whose shape carries meaning, so movement never skips
        cells; it is selection that refuses.
      </p>
      <PropTable
        :props="[
          { name: 'Left / Right', type: 'key', default: '-', description: 'Previous / next day. In the month and year grids, previous / next cell' },
          { name: 'Up / Down', type: 'key', default: '-', description: 'Same weekday, previous / next week. One row in the month and year grids' },
          { name: 'Home / End', type: 'key', default: '-', description: 'First / last day of the week. January / December, or the ends of the year range' },
          { name: 'PageUp / PageDown', type: 'key', default: '-', description: 'Previous / next month. In the year grid, previous / next page of years' },
          { name: 'Shift + PageUp / PageDown', type: 'key', default: '-', description: 'Previous / next year' },
          { name: 'Enter / Space', type: 'key', default: '-', description: 'Select the focused cell' },
          { name: 'Escape', type: 'key', default: '-', description: 'Close the panel and return focus to the field' },
        ]"
      />
      <p class="mb-4 mt-6" style="color: var(--cui-text-secondary);">
        Moving past the edge of a month pages the calendar, so the focused cell is always one you
        can see. The grid carries <code class="cui-code">role="grid"</code> with
        <code class="cui-code">role="gridcell"</code> cells,
        <code class="cui-code">aria-selected</code> and
        <code class="cui-code">aria-disabled</code>.
      </p>
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
        <Example title="Future Dates Only" :code="`<CuiDateRangePicker
  v-model=&quot;range&quot;
  label=&quot;Booking Window&quot;
  :min-date=&quot;new Date().toISOString().slice(0, 10)&quot;
/>`">
          <CuiDateRangePicker
            v-model="range2"
            label="Booking Window"
            :min-date="new Date().toISOString().slice(0, 10)"
          />
        </Example>

        <!-- With range constraint -->
        <Example title="Within 2025 Only" :code="`<CuiDateRangePicker
  v-model=&quot;range&quot;
  label=&quot;Fiscal Year 2025&quot;
  min-date=&quot;2025-01-01&quot;
  max-date=&quot;2025-12-31&quot;
/>`">
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
        <Example title="Holiday Blackouts" :code="`<CuiDateRangePicker
  v-model=&quot;range&quot;
  label=&quot;Vacation Request&quot;
  :disabled-dates=&quot;['2025-07-04', { from: '2025-12-24', to: '2025-12-26' }]&quot;
  block-spanning-blackout
/>`">
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
        <Example title="EU Format (DD/MM/YYYY)" :code="`<CuiDateRangePicker
  v-model=&quot;range&quot;
  format=&quot;DD/MM/YYYY&quot;
  label=&quot;European Format&quot;
/>`">
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
