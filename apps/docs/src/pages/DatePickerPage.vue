<script setup lang="ts">
import { ref } from "vue";
import { CuiDatePicker, CuiFlex, CuiGrid } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/date-picker";

const date1 = ref("2025-01-15");
const date2 = ref("2025-03-20");
const date3 = ref("2025-06-01");
const date4 = ref("");
const date5 = ref("2025-04-01");
const date6 = ref("2025-07-31");
const dateObj = ref<Date | null>(new Date());
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiDatePicker v-model=&quot;date&quot; label=&quot;Start Date&quot; />`"
      >
        <CuiFlex gap="4" class="items-start">
          <CuiDatePicker v-model="date1" label="Start Date" />
          <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
            Value: <code class="cui-code">{{ date1 }}</code>
          </div>
        </CuiFlex>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The field is a real text input — you can type a date into it without ever opening
        the calendar. The calendar itself is a <code>role="grid"</code> of
        <code>role="gridcell"</code> cells with roving focus: exactly one cell is in the
        tab order at a time, and the arrow keys move it.
      </p>

      <p class="text-surface-700 dark:text-surface-300">
        <strong>Opening and closing.</strong> <code>↓</code> on the field opens the
        calendar. <code>Enter</code> is deliberately <em>not</em> bound: in a form it
        submits, and the field accepts typed input, so taking it would cost more than it
        gives. Opening puts focus on the selected date, or today when there is none, so
        the arrows start somewhere meaningful rather than at the first cell.
        <code>Escape</code> closes and hands focus back to the field — as does selecting a
        date.
      </p>

      <p class="text-surface-700 dark:text-surface-300">
        <strong>Inside the grid.</strong> <code>←</code>/<code>→</code> move a day,
        <code>↑</code>/<code>↓</code> a week, <code>Home</code>/<code>End</code> to the
        ends of the week, <code>PageUp</code>/<code>PageDown</code> a month, and
        <code>Shift</code> with those a year. <code>Enter</code> or <code>Space</code>
        selects the focused cell. The month and year grids use the same keys in their own
        units — a month, three months to a row, a page of twelve years.
      </p>

      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          Moving past the edge of a month pages the calendar, so the focused cell is
          always one you can see.
        </li>
        <li>
          Movement does not skip disabled dates. A calendar is a grid whose shape carries
          meaning, and holes in it make it impossible to navigate predictably — so a
          blacked-out date is reachable and carries <code>aria-disabled</code>. It is
          <em>selection</em> that refuses, not movement.
        </li>
        <li>
          The selected cell carries <code>aria-selected</code>, and every cell an
          <code>aria-label</code> with its full date, so a cell is announced as a date
          rather than as a bare number.
        </li>
        <li>
          Each grid has an <code>aria-label</code> naming what is on screen — the month
          and year, the year, or the year range.
        </li>
        <li>
          Focus is only reclaimed on close when it is the picker's to reclaim: still
          inside its own panel, or already on <code>&lt;body&gt;</code>. With two pickers
          on a page, opening the second no longer yanks the ring back to the first.
        </li>
      </ul>

      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps.</strong> The <code>label</code> prop renders plain text with no
        <code>for</code> attribute, so it forms no association with the field — clicking it
        does nothing and assistive technology does not read it with the input. Wrap the
        picker in a <code>CuiFormField</code> instead, which supplies <code>id</code>,
        <code>aria-labelledby</code> and <code>aria-describedby</code> through its slot
        bindings, or pass those props yourself.
      </p>
    </template>

    <template #examples>
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
    </template>
  </DocPage>
</template>
